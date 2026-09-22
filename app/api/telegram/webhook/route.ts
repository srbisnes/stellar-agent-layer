import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSession, getPendingIntent, saveSession } from "@/lib/telegram/sessions";
import { runTelegramAgent } from "@/lib/telegram/agent-runner";
import {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
  confirmKeyboard,
} from "@/lib/telegram/api";
import {
  buildPaymentTransaction,
  submitTransaction,
} from "@/lib/stellar/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: "Bot not configured" }, { status: 503 });
    }

    const update = await req.json();

    // ── Callback: Confirm / Cancel payment ──────────────────────
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message?.chat?.id as number;
      const messageId = cq.message?.message_id as number;
      const data: string = cq.data || "";
      const from = cq.from;

      const session = getOrCreateSession({
        chatId,
        userId: from.id,
        username: from.username,
        firstName: from.first_name,
      });

      if (data.startsWith("confirm:")) {
        const intentId = data.slice("confirm:".length);
        const intent = getPendingIntent(session, intentId);

        if (!intent || intent.status !== "pending_confirmation") {
          await answerCallbackQuery(cq.id, "Este pago ya no está pendiente");
          return NextResponse.json({ ok: true });
        }

        if (!session.secretKey) {
          await answerCallbackQuery(cq.id, "No hay wallet");
          return NextResponse.json({ ok: true });
        }

        await answerCallbackQuery(cq.id, "Firmando…");

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
            await editMessageText(
              chatId,
              messageId,
              `✅ <b>Pago enviado</b>\n\n` +
                `<b>Monto:</b> ${intent.amount} XLM\n` +
                `<b>A:</b> ${intent.destinationLabel || intent.destination.slice(0, 12) + "…"}\n` +
                `<b>Tx:</b> <code>${result.hash}</code>\n\n` +
                `<a href="${explorer}">Ver en Stellar Expert</a>`
            );
          } else {
            intent.status = "failed";
            intent.error = JSON.stringify(result.error);
            saveSession(session);
            await editMessageText(
              chatId,
              messageId,
              `❌ <b>Error al enviar</b>\n\n${intent.error}`
            );
          }
        } catch (e: any) {
          intent.status = "failed";
          intent.error = e.message;
          saveSession(session);
          await editMessageText(chatId, messageId, `❌ Error: ${e.message}`);
        }

        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("cancel:")) {
        const intentId = data.slice("cancel:".length);
        const intent = getPendingIntent(session, intentId);
        if (intent && intent.status === "pending_confirmation") {
          intent.status = "cancelled";
          saveSession(session);
        }
        await answerCallbackQuery(cq.id, "Cancelado");
        await editMessageText(chatId, messageId, "❌ Pago cancelado.");
        return NextResponse.json({ ok: true });
      }

      await answerCallbackQuery(cq.id);
      return NextResponse.json({ ok: true });
    }

    // ── Regular message ─────────────────────────────────────────
    const message = update.message;
    if (!message?.text || !message.chat) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id as number;
    const from = message.from;
    const text = String(message.text).trim();

    const session = getOrCreateSession({
      chatId,
      userId: from?.id,
      username: from?.username,
      firstName: from?.first_name,
    });

    // Commands
    if (text === "/start") {
      await sendMessage(
        chatId,
        `🚀 <b>Stellar Agent Layer</b>\n\n` +
          `Soy un agente real en Stellar Testnet.\n\n` +
          `<b>Podés decirme:</b>\n` +
          `• "Creá una wallet y fóndala"\n` +
          `• "Agregá contacto Alice G..."\n` +
          `• "Envía 5 XLM a Alice"\n` +
          `• "¿Cuál es mi balance?"\n` +
          `• "Mostrá el historial"\n\n` +
          `Los pagos requieren que pulses <b>Confirmar</b> antes de firmar.\n` +
          `Solo Testnet · sin fondos reales.`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === "/wallet") {
      if (!session.publicKey) {
        await sendMessage(chatId, "Todavía no tenés wallet. Decime: <i>creá una wallet</i>");
      } else {
        await sendMessage(
          chatId,
          `💳 <b>Tu wallet</b>\n<code>${session.publicKey}</code>\n` +
            `Funded: ${session.funded ? "sí" : "no"}`
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (text === "/help") {
      await sendMessage(
        chatId,
        `Comandos:\n/start — intro\n/wallet — ver public key\n/help — ayuda\n\nO hablame en lenguaje natural.`
      );
      return NextResponse.json({ ok: true });
    }

    // Agent
    const { reply, paymentIntentId } = await runTelegramAgent(session, text);

    if (paymentIntentId) {
      const intent = getPendingIntent(session, paymentIntentId);
      await sendMessage(
        chatId,
        `${reply}\n\n` +
          `⚠️ <b>Confirmación humana requerida</b>\n` +
          `Monto: <b>${intent?.amount} XLM</b>\n` +
          `A: <b>${intent?.destinationLabel || intent?.destination?.slice(0, 12) + "…"}</b>`,
        { reply_markup: confirmKeyboard(paymentIntentId) }
      );
    } else {
      await sendMessage(chatId, reply);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Telegram webhook error", err);
    return NextResponse.json({ ok: true }); // always 200 to Telegram
  }
}

// Telegram sometimes sends a GET health check
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "stellar-agent-telegram",
    configured: !!process.env.TELEGRAM_BOT_TOKEN,
  });
}
