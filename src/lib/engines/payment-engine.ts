import { getPaymentIntents, savePaymentIntents } from "@/lib/storage";
import { walletEngine } from "./wallet-engine";
import { contactEngine } from "./contact-engine";
import { isValidPublicKey, buildPaymentTransaction, submitTransaction } from "@/lib/stellar/client";
import { uid } from "@/lib/utils";
import type { PaymentIntent, OfframpDetails } from "@/types";

class PaymentEngine {
  private intents: PaymentIntent[] = [];

  constructor() {
    this.intents = getPaymentIntents();
  }

  private persist() {
    savePaymentIntents(this.intents);
  }

  list(): PaymentIntent[] {
    return [...this.intents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  pending(): PaymentIntent[] {
    return this.intents.filter((i) => i.status === "pending_confirmation");
  }

  createIntent(params: {
    destination: string;
    amount: string;
    asset?: string;
    assetIssuer?: string;
    memo?: string;
    offrampDetails?: OfframpDetails;
  }): PaymentIntent {
    const wallet = walletEngine.getWallet();
    if (!wallet) throw new Error("No active wallet");

    let dest = params.destination.trim();
    let label: string | undefined;

    // Resolve contact name → public key
    const contact = contactEngine.findByName(dest);
    if (contact) {
      dest = contact.publicKey;
      label = contact.name;
    } else if (!isValidPublicKey(dest) && !dest.startsWith("G")) {
      throw new Error(`Unknown contact or invalid address: ${params.destination}`);
    }

    const intent: PaymentIntent = {
      id: uid("pi_"),
      destination: dest,
      destinationLabel: label || params.destination,
      amount: params.amount,
      asset: (params.asset as any) || "XLM",
      assetIssuer: params.assetIssuer,
      memo: params.memo,
      status: "pending_confirmation",
      createdAt: new Date().toISOString(),
      sourcePublicKey: wallet.publicKey,
      offrampDetails: params.offrampDetails,
    };

    this.intents.unshift(intent);
    this.persist();
    return intent;
  }

  async confirmAndSubmit(intentId: string): Promise<{ success: boolean; hash?: string; error?: string }> {
    const intent = this.intents.find((i) => i.id === intentId);
    if (!intent) return { success: false, error: "Intent not found" };
    if (intent.status !== "pending_confirmation") {
      return { success: false, error: "Intent already processed" };
    }

    const wallet = walletEngine.getWallet();
    if (!wallet || !wallet.secretKey) {
      return { success: false, error: "Wallet has no secret key (watch-only or Freighter needs client signing)" };
    }

    try {
      intent.status = "submitted";
      this.persist();

      const tx = await buildPaymentTransaction({
        sourceSecret: wallet.secretKey,
        destination: intent.destination,
        amount: intent.amount,
        assetCode: intent.asset,
        issuerPublicKey: intent.assetIssuer,
        memo: intent.memo,
      });

      const result = await submitTransaction(tx);
      if (result.success) {
        intent.status = "success";
        intent.txHash = result.hash;
        intent.confirmedAt = new Date().toISOString();
        this.persist();
        return { success: true, hash: result.hash };
      } else {
        intent.status = "failed";
        intent.error = String(result.error);
        this.persist();
        return { success: false, error: String(result.error) };
      }
    } catch (err: any) {
      intent.status = "failed";
      intent.error = err.message;
      this.persist();
      return { success: false, error: err.message };
    }
  }

  cancel(intentId: string) {
    const intent = this.intents.find((i) => i.id === intentId);
    if (intent && intent.status === "pending_confirmation") {
      intent.status = "cancelled";
      this.persist();
    }
  }
}

export const paymentEngine = new PaymentEngine();
