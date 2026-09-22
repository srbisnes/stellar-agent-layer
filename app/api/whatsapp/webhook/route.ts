import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateSession,
  getPendingIntent,
  saveSession,
} from "@/lib/whatsapp/sessions";
import { runWhatsAppAgent } from "@/lib/whatsapp/agent-runner";
import {
  sendText,
  sendConfirmButtons,
  isWhatsAppConfigured,
} from "@/lib/whatsapp/api";
import {
  buildPaymentTransaction,
  submitTransaction,
} from "@/lib/stellar/client";

export const maxDuration = 60;

/**
 * Meta webhook verification (GET)
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
    return new NextResponse(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** Incoming messages + button replies (POST) */
export async function POST(req: NextRequest) {
  try {
    if (!isWhatsAppConfigured()) {
      return NextResponse.json({ ok: false, error: "WhatsApp not configured" }, { status: 503 });
    }

    const body = await req.json();

    // Always acknowledge quickly — Meta retries on non-200
    // Process in same request for demo simplicity

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return NextResponse.json({ ok: true });
    }

    // Status updates (delivered, read) — ignore
    if (value.statuses) {
      return NextResponse.json({ ok: true });
    }

    const messages = value.messages as any[] | undefined;
    if (!messages?.length) {
      return NextResponse.json({ ok: true });
    }

    const msg = messages[0];
    const from: string = msg.from; // wa_id / phone
    const profileName: string | undefined = value.contacts?.[0]?.profile?.name;

    const session = getOrCreateSession({ waId: from, profileName });

    // ── Interactive button reply (Confirm / Cancel) ─────────────
    if (msg.type === "interactive" && msg.interactive?.type === "button_reply") {
      const btnId: string = msg.interactive.button_reply?.id || "";

      if (btnId.startsWith("confirm:")) {
        const intentId = btnId.slice("confirm:".length);
        const intent = getPendingIntent(session, intentId);

        if (!intent || intent.status !== "pending_confirmation") {
          await sendText(from, "Este pago ya no está pendiente.");
          return NextResponse.json({ ok: true });
        }

        if (!session.secretKey) {
          await sendText(from, "No hay wallet asociada.");
          return NextResponse.json({ ok: true });
        }

        await sendText(from, "Firmando y enviando en Testnet…");

        try {
          const tx = await buildPaymentTransaction({
            sourceSecret: session.secretKey,
            destination: intent.destination,
            amount: intent.amount,
            memo: intent.memo,
          });
          const result = await submitTransaction(tx);

          if (result.success) {
            intent.status = "success";
            intent.txHash = result.hash;
            session.history.unshift(intent);
            session.pendingPayments = session.pendingPayments.filter((p) => p.id !== intentId);
            saveSession(session);

            const explorer = `https://stellar.expert/explorer/testnet/tx/${result.hash}`;
            await sendText(
              from,
              `✅ Pago enviado\n\nMonto: ${intent.amount} XLM\nA: ${intent.destinationLabel || intent.destination.slice(0, 12) + "…"}\nTx: ${result.hash}\n\n${explorer}`
            );
          } else {
            intent.status = "failed";
            intent.error = JSON.stringify(result.error);
            saveSession(session);
            await sendText(from, `❌ Error al enviar: ${intent.error}`);
          }
        } catch (e: any) {
          intent.status = "failed";
          intent.error = e.message;
          saveSession(session);
          await sendText(from, `❌ Error: ${e.message}`);
        }

        return NextResponse.json({ ok: true });
      }

      if (btnId.startsWith("cancel:")) {
        const intentId = btnId.slice("cancel:".length);
        const intent = getPendingIntent(session, intentId);
        if (intent && intent.status === "pending_confirmation") {
          intent.status = "cancelled";
          saveSession(session);
        }
        await sendText(from, "❌ Pago cancelado.");
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    // ── Text message ─────────────────────────────────────────────
    if (msg.type !== "text" || !msg.text?.body) {
      await sendText(from, "Por ahora solo entiendo mensajes de texto.");
      return NextResponse.json({ ok: true });
    }

    const text = String(msg.text.body).trim();

    if (text === "/start" || text.toLowerCase() === "hola" || text.toLowerCase() === "hi") {
      await sendText(
        from,
        `🚀 Stellar Agent Layer\n\nSoy un agente real en Stellar Testnet.\n\nPodés decirme:\n• "Creá una wallet y fóndala"\n• "Agregá contacto Alice G..."\n• "Envía 5 XLM a Alice"\n• "¿Cuál es mi balance?"\n• "Mostrá el historial"\n\nLos pagos requieren que pulses Confirmar pago antes de firmar.\nSolo Testnet · sin fondos reales.`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === "/wallet") {
      if (!session.publicKey) {
        await sendText(from, "Todavía no tenés wallet. Decime: creá una wallet");
      } else {
        await sendText(
          from,
          `💳 Tu wallet\n${session.publicKey}\nFunded: ${session.funded ? "sí" : "no"}`
        );
      }
      return NextResponse.json({ ok: true });
    }

    const { reply, paymentIntentId } = await runWhatsAppAgent(session, text);

    if (paymentIntentId) {
      const intent = getPendingIntent(session, paymentIntentId);
      const bodyText =
        `${reply}\n\n⚠️ Confirmación humana requerida\nMonto: ${intent?.amount} XLM\nA: ${intent?.destinationLabel || intent?.destination?.slice(0, 12) + "…"}`;
      await sendConfirmButtons(from, bodyText, paymentIntentId);
    } else {
      await sendText(from, reply);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("WhatsApp webhook error", err);
    // Always 200 so Meta does not retry aggressively
    return NextResponse.json({ ok: true });
  }
}
