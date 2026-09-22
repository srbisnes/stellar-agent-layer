import { NextRequest, NextResponse } from "next/server";
import { setWebhook, getMe } from "@/lib/telegram/api";

/**
 * One-shot helper to register the webhook with Telegram.
 * Call once after deploy:
 *   POST /api/telegram/setup
 *   Header: x-setup-secret: <TELEGRAM_SETUP_SECRET>
 *
 * Or with body: { "url": "https://your-domain.com/api/telegram/webhook" }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_SETUP_SECRET;
  const header = req.headers.get("x-setup-secret");

  if (!secret || header !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN missing" }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const base =
      body.url ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : null;

    if (!base && !body.url) {
      return NextResponse.json(
        { error: "Provide body.url or set NEXT_PUBLIC_APP_URL / VERCEL_URL" },
        { status: 400 }
      );
    }

    const webhookUrl = body.url || `${base}/api/telegram/webhook`;
    const me = await getMe();
    const result = await setWebhook(webhookUrl);

    return NextResponse.json({
      ok: true,
      bot: me.username,
      webhook: webhookUrl,
      result,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ configured: false });
  }
  try {
    const me = await getMe();
    return NextResponse.json({ configured: true, bot: me.username, id: me.id });
  } catch (e: any) {
    return NextResponse.json({ configured: false, error: e.message });
  }
}
