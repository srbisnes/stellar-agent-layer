/**
 * Agent Tools — the real tool-calling surface.
 * Payment tools only CREATE intents. Submission requires human confirmation.
 */

import { z } from "zod";
import { tool } from "ai";

// These tools are designed to be called from the server with context injected.
// Client-side engines are used via API routes for mutation safety.

export const createWalletTool = tool({
  description:
    "Create a new ephemeral Stellar testnet wallet (keypair). Use when the user has no wallet yet.",
  parameters: z.object({
    reason: z.string().optional().describe("Why the wallet is being created"),
  }),
});

export const fundWalletTool = tool({
  description:
    "Fund the current wallet with 10,000 test XLM via Friendbot (testnet only).",
  parameters: z.object({
    confirm: z.boolean().describe("Must be true to proceed with funding"),
  }),
});

export const getBalanceTool = tool({
  description: "Get the current XLM (and other asset) balances of the active wallet.",
  parameters: z.object({}),
});

export const addContactTool = tool({
  description: "Add a contact (name + Stellar public key) to the address book.",
  parameters: z.object({
    name: z.string().describe("Friendly name for the contact"),
    publicKey: z.string().describe("Stellar public key starting with G"),
    note: z.string().optional(),
  }),
});

export const listContactsTool = tool({
  description: "List all saved contacts.",
  parameters: z.object({}),
});

export const createPaymentIntentTool = tool({
  description: `Create a payment INTENT (does NOT send money). 
  Always requires subsequent human confirmation in the UI before any funds move.
  Use contact name or full public key as destination.`,
  parameters: z.object({
    destination: z
      .string()
      .describe("Contact name or Stellar public key (G...)"),
    amount: z.string().describe("Amount of XLM to send, e.g. '10.5'"),
    memo: z.string().optional().describe("Optional short memo (max 28 chars)"),
  }),
});

export const getHistoryTool = tool({
  description: "Retrieve recent payment history (on-chain + agent intents).",
  parameters: z.object({
    limit: z.number().optional().default(15),
  }),
});

export const getWalletInfoTool = tool({
  description: "Return the current wallet public key and funding status.",
  parameters: z.object({}),
});

export const agentTools = {
  create_wallet: createWalletTool,
  fund_wallet: fundWalletTool,
  get_balance: getBalanceTool,
  add_contact: addContactTool,
  list_contacts: listContactsTool,
  create_payment_intent: createPaymentIntentTool,
  get_history: getHistoryTool,
  get_wallet_info: getWalletInfoTool,
};

export type AgentToolName = keyof typeof agentTools;