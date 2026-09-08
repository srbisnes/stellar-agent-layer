/**
 * History Engine — aggregates on-chain payments + local agent actions.
 */

import { getPaymentHistory } from "@/lib/stellar/client";
import { walletEngine } from "./wallet-engine";
import { paymentEngine, PaymentIntent } from "./payment-engine";

export interface HistoryEntry {
  id: string;
  type: "payment_in" | "payment_out" | "agent_intent" | "fund" | "other";
  title: string;
  amount?: string;
  asset?: string;
  counterparty?: string;
  txHash?: string;
  status?: string;
  timestamp: string;
  raw?: any;
}

export class HistoryEngine {
  async getCombinedHistory(limit = 30): Promise<HistoryEntry[]> {
    const entries: HistoryEntry[] = [];
    const pk = walletEngine?.getPublicKey();

    // Local payment intents
    const local = paymentEngine?.getAll() || [];
    for (const p of local) {
      entries.push({
        id: `local-${p.id}`,
        type: "agent_intent",
        title: p.destinationLabel
          ? `Payment to ${p.destinationLabel}`
          : `Payment to ${p.destination.slice(0, 8)}…`,
        amount: p.amount,
        asset: p.asset,
        counterparty: p.destination,
        txHash: p.txHash,
        status: p.status,
        timestamp: p.createdAt,
        raw: p,
      });
    }

    // On-chain history
    if (pk) {
      try {
        const onchain = await getPaymentHistory(pk, limit);
        for (const p of onchain) {
          const isOut = p.from === pk;
          entries.push({
            id: `chain-${p.id}`,
            type: isOut ? "payment_out" : "payment_in",
            title: isOut
              ? `Sent to ${p.to?.slice(0, 8)}…`
              : `Received from ${p.from?.slice(0, 8)}…`,
            amount: p.amount,
            asset: p.asset,
            counterparty: isOut ? p.to : p.from,
            txHash: p.transactionHash,
            status: p.successful ? "success" : "failed",
            timestamp: p.createdAt,
            raw: p,
          });
        }
      } catch {
        // silent for demo
      }
    }

    // Sort newest first and dedupe by txHash if present
    const seen = new Set<string>();
    return entries
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .filter((e) => {
        if (e.txHash && seen.has(e.txHash)) return false;
        if (e.txHash) seen.add(e.txHash);
        return true;
      })
      .slice(0, limit);
  }
}

export const historyEngine =
  typeof window !== "undefined" ? new HistoryEngine() : null;