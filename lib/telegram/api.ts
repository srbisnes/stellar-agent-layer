const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : "";

async function tg<T = any>(method: string, body: Record<string, unknown>): Promise<T> {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error("Telegram API error", method, data);
    throw new Error(data.description || "Telegram API error");
  }
  return data.result as T;
}

export async function sendMessage(
  chatId: number,
  text: string,
  extra?: {
    reply_markup?: unknown;
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  }
) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: extra?.parse_mode || "HTML",
    reply_markup: extra?.reply_markup,
    disable_web_page_preview: true,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return tg("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  extra?: { reply_markup?: unknown; parse_mode?: string }
) {
  return tg("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: extra?.parse_mode || "HTML",
    reply_markup: extra?.reply_markup,
  });
}

export function confirmKeyboard(intentId: string) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Confirmar y firmar", callback_data: `confirm:${intentId}` },
        { text: "❌ Cancelar", callback_data: `cancel:${intentId}` },
      ],
    ],
  };
}

export async function setWebhook(url: string) {
  return tg("setWebhook", { url, allowed_updates: ["message", "callback_query"] });
}

export async function getMe() {
  return tg("getMe", {});
}
