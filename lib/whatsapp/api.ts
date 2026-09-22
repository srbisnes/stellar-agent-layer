/**
 * WhatsApp Business Cloud API (Meta) helpers.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const GRAPH = "https://graph.facebook.com/v21.0";

function creds() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing");
  }
  return { token, phoneNumberId };
}

async function graphPost(path: string, body: Record<string, unknown>) {
  const { token } = creds();
  const res = await fetch(`${GRAPH}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("WhatsApp API error", path, data);
    throw new Error(data?.error?.message || "WhatsApp API error");
  }
  return data;
}

/** Plain text message */
export async function sendText(to: string, text: string) {
  const { phoneNumberId } = creds();
  return graphPost(`/${phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: text.slice(0, 4096) },
  });
}

/**
 * Interactive reply buttons (max 3 buttons, title max 20 chars).
 * Used for human confirmation of payments.
 */
export async function sendConfirmButtons(
  to: string,
  bodyText: string,
  intentId: string
) {
  const { phoneNumberId } = creds();
  // WhatsApp button id max 256 chars; title max 20
  return graphPost(`/${phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText.slice(0, 1024) },
      action: {
        buttons: [
          {
            type: "reply",
            reply: { id: `confirm:${intentId}`, title: "Confirmar pago" },
          },
          {
            type: "reply",
            reply: { id: `cancel:${intentId}`, title: "Cancelar" },
          },
        ],
      },
    },
  });
}

export function isWhatsAppConfigured() {
  return !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}
