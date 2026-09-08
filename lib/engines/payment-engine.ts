/**
 * Payment Engine — builds & submits payments ONLY after human confirmation.
 * Never auto-signs or auto-submits value-moving transactions.
 */

import {
  buildPaymentTransaction,
  submitTransaction,
  isValidPublicKey,
} from "@/lib/stellar/client";
import { contactEngine } from "./contact-engine";
import { walletEngine } from "./wallet-engine";

export type PaymentStatus =
  | "pending_confirmation"
  | "confirmed"
  | "submitted"
  | "success"
  | "failed"
  | "cancelled";

export interface PaymentIntent {
  id: string;
  destination: string;
  destinationLabel?: string;
  amount: string;
  asset: "XLM";
  memo?: string;
  status: PaymentStatus;
  createdAt: string;
  confirmedAt?: string;
  txHash?: string;
  error?: string;
  sourcePublicKey: string;
}

const PENDING_KEY = "stellar-agent-pending-payments";

export class PaymentEngine {
  private pending: PaymentIntent[] = [];

  constructor() {
    if (typeof window !== "undefined") this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (raw) this.pending = JSON.parse(raw);
    } catch {
      this.pending = [];
    }
  }

  private persist() {
    if (typeof window !== "undefined") {
      localStorage.setItem(PENDING_KEY, JSON.stringify(this.pending));
    }
  }

  getPending(): PaymentIntent[] {
    return this.pending.filter((p) => p.status === "pending_confirmation");
  }

  getAll(): PaymentIntent[] {
    return [...this.pending].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Create a payment intent. Does NOT sign or submit.
   * Human must call confirmAndSubmit(id).
   */
  createIntent({
    destination,
    amount,
    memo,
  }: {
    destination: string; // name or G...
    amount: string;
    memo?: string;
  }): PaymentIntent {
    if (!walletEngine?.hasWallet()) {
      throw new Error("No wallet available. Create or fund a wallet first.");
    }

    const resolved = contactEngine?.resolve(destination);
    if (!resolved) {
      throw new Error(
        `Could not resolve destination "${destination}". Add as contact or provide a valid public key.`
      );
    }

    if (!isValidPublicKey(resolved.publicKey)) {
      throw new Error("Invalid destination public key");
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      throw new Error("Amount must be a positive number");
    }

    const intent: PaymentIntent = {
      id: crypto.randomUUID(),
      destination: resolved.publicKey,
      destinationLabel: resolved.contact?.name,
      amount: amt.toFixed(7).replace(/\.?0+$/, ""),
      asset: "XLM",
      memo,
      status: "pending_confirmation",
      createdAt: new Date().toISOString(),
      sourcePublicKey: walletEngine.getPublicKey()!,
    };

    this.pending.unshift(intent);
    this.persist();
    return intent;
  }

  cancel(id: string) {
    const p = this.pending.find((x) => x.id === id);
    if (p && p.status === "pending_confirmation") {
      p.status = "cancelled";
      this.persist();
    }
  }

  /**
   * HUMAN CONFIRMATION GATE.
   * Only this method signs and submits.
   */
  async confirmAndSubmit(id: string): Promise<PaymentIntent> {
    const intent = this.pending.find((x) => x.id === id);
    if (!intent) throw new Error("Payment intent not found");
    if (intent.status !== "pending_confirmation") {
      throw new Error(`Cannot confirm payment in status: ${intent.status}`);
    }

    const secret = walletEngine?.getSecretKey();
    if (!secret) throw new Error("Wallet secret not available");

    intent.status = "confirmed";
    intent.confirmedAt = new Date().toISOString();
    this.persist();

    try {
      const tx = await buildPaymentTransaction({
        sourceSecret: secret,
        destination: intent.destination,
        amount: intent.amount,
        memo: intent.memo,
      });

      intent.status = "submitted";
      this.persist();

      const result = await submitTransaction(tx);
      if (result.success) {
        intent.status = "success";
        intent.txHash = result.hash;

        // mark contact used
        const contact = contactEngine?.findByPublicKey(intent.destination);
        if (contact) contactEngine?.markUsed(contact.id);
      } else {
        intent.status = "failed";
        intent.error = JSON.stringify(result.error);
      }
    } catch (err: any) {
      intent.status = "failed";
      intent.error = err.message || "Unknown error";
    }

    this.persist();
    return intent;
  }
}

export const paymentEngine =
  typeof window !== "undefined" ? new PaymentEngine() : null;