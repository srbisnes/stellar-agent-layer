import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, walletContext } = await req.json();

  // Wallet context is injected from the client so the model knows current state
  const contextNote = walletContext
    ? `\n\n[Current wallet context]\nPublic key: ${walletContext.publicKey || "none"}\nFunded: ${walletContext.funded}\nBalances: ${JSON.stringify(walletContext.balances || [])}`
    : "\n\n[No wallet yet]";

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT + contextNote,
    messages,
    tools: {
      create_wallet: tool({
        description:
          "Create a new ephemeral Stellar testnet wallet. Returns public key. Client will persist the keypair.",
        parameters: z.object({
          reason: z.string().optional(),
        }),
        execute: async () => {
          // Actual key generation happens client-side for security of secret.
          // We signal the client to perform the action.
          return {
            action: "CREATE_WALLET",
            message: "Client must generate and store the keypair locally.",
          };
        },
      }),
      fund_wallet: tool({
        description: "Fund the active wallet via Friendbot (10,000 test XLM).",
        parameters: z.object({
          publicKey: z.string().describe("The public key to fund"),
        }),
        execute: async ({ publicKey }) => {
          const url = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
          try {
            const res = await fetch(url);
            const data = await res.json();
            if (!res.ok) {
              return {
                success: false,
                error: data.detail || data.title || "Friendbot error",
              };
            }
            return {
              success: true,
              message: "Funded with 10,000 test XLM",
              txHash: data.hash,
              publicKey,
            };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        },
      }),
      get_balance: tool({
        description: "Fetch live balances from Horizon for a public key.",
        parameters: z.object({
          publicKey: z.string(),
        }),
        execute: async ({ publicKey }) => {
          try {
            const res = await fetch(
              `https://horizon-testnet.stellar.org/accounts/${publicKey}`
            );
            if (res.status === 404) {
              return { success: false, error: "Account not found / not funded" };
            }
            const account = await res.json();
            const balances = account.balances.map((b: any) => ({
              asset:
                b.asset_type === "native"
                  ? "XLM"
                  : `${b.asset_code}:${b.asset_issuer}`,
              balance: b.balance,
            }));
            return { success: true, balances, sequence: account.sequence };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        },
      }),
      add_contact: tool({
        description: "Signal client to add a contact to the local address book.",
        parameters: z.object({
          name: z.string(),
          publicKey: z.string(),
          note: z.string().optional(),
        }),
        execute: async (args) => {
          return {
            action: "ADD_CONTACT",
            ...args,
            message: "Client should persist this contact.",
          };
        },
      }),
      list_contacts: tool({
        description: "Request the current contact list from the client.",
        parameters: z.object({}),
        execute: async () => {
          return {
            action: "LIST_CONTACTS",
            message: "Client will provide the contact list in the next turn if needed.",
          };
        },
      }),
      create_payment_intent: tool({
        description:
          "Create a payment INTENT. Does NOT move funds. Human must confirm in the UI.",
        parameters: z.object({
          destination: z.string().describe("Contact name or G... public key"),
          amount: z.string(),
          memo: z.string().optional(),
        }),
        execute: async (args) => {
          return {
            action: "CREATE_PAYMENT_INTENT",
            ...args,
            message:
              "Payment intent created. Waiting for human confirmation in the dashboard before any XLM is sent.",
            requiresHumanConfirmation: true,
          };
        },
      }),
      get_history: tool({
        description: "Request recent history. Client will enrich with local + Horizon data.",
        parameters: z.object({
          limit: z.number().optional().default(10),
        }),
        execute: async ({ limit }) => {
          return {
            action: "GET_HISTORY",
            limit,
            message: "Client should fetch and display history.",
          };
        },
      }),
      get_wallet_info: tool({
        description: "Return wallet context that was injected.",
        parameters: z.object({}),
        execute: async () => {
          return {
            action: "GET_WALLET_INFO",
            context: walletContext || null,
          };
        },
      }),
    },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}