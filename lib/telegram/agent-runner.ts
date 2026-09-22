/**
 * Server-side agent runner for Telegram.
 * Tools execute for real (wallet lives in session store).
 */

import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import {
  createWalletForSession,
  addContact,
  createPaymentIntent,
  saveSession,
} from "./sessions";
import type { TelegramSession } from "./types";
import { fundWithFriendbot, getAccountBalance, getPaymentHistory } from "@/lib/stellar/client";

const TG_SYSTEM = `You are the Stellar Agent Layer on Telegram — a real autonomous agent on Stellar Testnet.

You are NOT a chatbot. You use tools. You never pretend to have done something you have not.

## Capabilities
- Create ephemeral testnet wallets
- Fund via Friendbot (10,000 test XLM)
- Manage contacts (name ↔ public key)
- Create payment INTENTS only — real transfer requires the user to press Confirm on Telegram
- Show balances and history

## Safety
1. NEVER say a payment was sent unless the user confirmed and the tool returned success.
2. When user wants to send money → always create_payment_intent. Then tell them to press the Confirm button.
3. Testnet only. Fake XLM.
4. If no wallet, offer to create and fund one first.
5. Prefer contact names over raw keys.

## Style
- Concise. Same language as the user (Spanish or English).
- Short messages work best on Telegram.
- When a payment intent is created, clearly say amount + destination + that it needs confirmation.

Tools: create_wallet, fund_wallet, get_balance, add_contact, list_contacts, create_payment_intent, get_history, get_wallet_info.
`;

export async function runTelegramAgent(
  session: TelegramSession,
  userText: string
): Promise<{
  reply: string;
  paymentIntentId?: string;
}> {
  session.messages.push({ role: "user", content: userText });
  // keep last 12 turns
  if (session.messages.length > 24) {
    session.messages = session.messages.slice(-24);
  }

  const contextNote = session.publicKey
    ? `\n\n[Wallet]\nPublic key: ${session.publicKey}\nFunded: ${session.funded}\nContacts: ${session.contacts.map((c) => c.name).join(", ") || "none"}`
    : "\n\n[No wallet yet]";

  let paymentIntentId: string | undefined;

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: TG_SYSTEM + contextNote,
    messages: session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    tools: {
      create_wallet: tool({
        description: "Create a new ephemeral Stellar testnet wallet for this user.",
        parameters: z.object({
          reason: z.string().optional(),
        }),
        execute: async () => {
          if (session.publicKey) {
            return {
              success: true,
              alreadyExists: true,
              publicKey: session.publicKey,
              message: "Ya tenés una wallet.",
            };
          }
          const kp = createWalletForSession(session);
          return {
            success: true,
            publicKey: kp.publicKey,
            message: "Wallet creada. Podés fondearla con Friendbot.",
          };
        },
      }),
      fund_wallet: tool({
        description: "Fund the wallet with 10,000 test XLM via Friendbot.",
        parameters: z.object({}),
        execute: async () => {
          if (!session.publicKey) {
            return { success: false, error: "No hay wallet. Creá una primero." };
          }
          const result = await fundWithFriendbot(session.publicKey);
          if (result.success) {
            session.funded = true;
            saveSession(session);
          }
          return result;
        },
      }),
      get_balance: tool({
        description: "Get current XLM balance from Horizon.",
        parameters: z.object({}),
        execute: async () => {
          if (!session.publicKey) {
            return { success: false, error: "No hay wallet." };
          }
          return getAccountBalance(session.publicKey);
        },
      }),
      add_contact: tool({
        description: "Add a contact (name + Stellar public key).",
        parameters: z.object({
          name: z.string(),
          publicKey: z.string(),
          note: z.string().optional(),
        }),
        execute: async ({ name, publicKey, note }) => {
          if (!publicKey.startsWith("G") || publicKey.length !== 56) {
            return { success: false, error: "Public key inválida (debe empezar con G y tener 56 chars)." };
          }
          const c = addContact(session, name, publicKey, note);
          return { success: true, contact: c };
        },
      }),
      list_contacts: tool({
        description: "List saved contacts.",
        parameters: z.object({}),
        execute: async () => {
          return {
            success: true,
            contacts: session.contacts.map((c) => ({
              name: c.name,
              publicKey: c.publicKey,
            })),
          };
        },
      }),
      create_payment_intent: tool({
        description:
          "Create a payment INTENT only. Does NOT send funds. User must confirm with the Telegram button.",
        parameters: z.object({
          destination: z.string().describe("Contact name or G... public key"),
          amount: z.string(),
          memo: z.string().optional(),
        }),
        execute: async ({ destination, amount, memo }) => {
          try {
            const intent = createPaymentIntent(session, destination, amount, memo);
            paymentIntentId = intent.id;
            return {
              success: true,
              intentId: intent.id,
              amount: intent.amount,
              destination: intent.destinationLabel || intent.destination,
              requiresHumanConfirmation: true,
              message:
                "Intent creado. El usuario debe presionar Confirmar en Telegram para firmar y enviar.",
            };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        },
      }),
      get_history: tool({
        description: "Recent payment history (local + on-chain).",
        parameters: z.object({
          limit: z.number().optional().default(8),
        }),
        execute: async ({ limit }) => {
          const local = [...session.history, ...session.pendingPayments].slice(0, limit);
          let onchain: any[] = [];
          if (session.publicKey) {
            try {
              onchain = await getPaymentHistory(session.publicKey, limit);
            } catch {
              // ignore
            }
          }
          return { success: true, local, onchain };
        },
      }),
      get_wallet_info: tool({
        description: "Current wallet public key and funding status.",
        parameters: z.object({}),
        execute: async () => {
          return {
            publicKey: session.publicKey || null,
            funded: session.funded,
            contactsCount: session.contacts.length,
          };
        },
      }),
    },
    maxSteps: 5,
  });

  const reply = text || "Listo.";
  session.messages.push({ role: "assistant", content: reply });
  saveSession(session);

  return { reply, paymentIntentId };
}
