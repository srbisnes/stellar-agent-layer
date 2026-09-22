import { NextRequest, NextResponse } from "next/server";
import { setWebhook, getMe } from "@/lib/telegram/api";

/**
 * Register the Telegram webhook (run once after each domain change).
 *
 *   POST /api/telegram/setup
 *   Header: x-setup-secret: <TELEGRAM_SETUP_SECRET>
 *   Body:   { "url": "https://your-domain.com/api/telegram/webhook" }
 *
 * Check bot status:
 *   GET /api/telegram/setup
 */
export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_SETUP_SECRET;
  const header = req.headers.get("x-setup-secret");

  if (!secret || header !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN missing in environment" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({} as { url?: string }));

    let webhookUrl = body.url as string | undefined;

    if (!webhookUrl) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl) {
        webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;
      } else if (process.env.VERCEL_URL) {
        webhookUrl = `https://${process.env.VERCEL_URL}/api/telegram/webhook`;
      }
    }

    if (!webhookUrl) {
      return NextResponse.json(
        {
          error:
            'Provide body.url, e.g. { "url": "https://your-app.vercel.app/api/telegram/webhook" }',
        },
        { status: 400 }
      );
    }

    // Must be HTTPS public URL
    if (!webhookUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "Webhook URL must use https://" },
        { status: 400 }
      );
    }

    const me = await getMe();
    const result = await setWebhook(webhookUrl);

    return NextResponse.json({
      ok: true,
      bot: me.username,
      botId: me.id,
      webhook: webhookUrl,
      telegram: result,
      next: "Open Telegram, search your bot, send /start",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({
      configured: false,
      hint: "Set TELEGRAM_BOT_TOKEN in Vercel env",
    });
  }
  try {
    const me = await getMe();
    // Also query webhook info from Telegram
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const infoRes = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );
    const info = await infoRes.json();

    return NextResponse.json({
      configured: true,
      bot: me.username,
      id: me.id,
      webhook: info.result || null,
    });
  } catch (e: any) {
    return NextResponse.json({ configured: false, error: e.message });
  }
}
