/**
 * Wallet Engine — manages keypairs, balances, funding via Friendbot.
 * Never stores secrets in plain localStorage in production; this is demo-safe (testnet only).
 */

import {
  generateKeypair,
  fundWithFriendbot,
  getAccountBalance,
  isValidPublicKey,
} from "@/lib/stellar/client";

export interface WalletState {
  publicKey: string;
  secretKey: string; // demo only — never expose in real prod UI
  funded: boolean;
  balances: { asset: string; balance: string }[];
  createdAt: string;
}

const STORAGE_KEY = "stellar-agent-wallet";

export class WalletEngine {
  private state: WalletState | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.load();
    }
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.state = JSON.parse(raw);
    } catch {
      this.state = null;
    }
  }

  private persist() {
    if (typeof window !== "undefined" && this.state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
  }

  getWallet(): WalletState | null {
    return this.state;
  }

  hasWallet(): boolean {
    return !!this.state?.publicKey;
  }

  async createWallet(): Promise<WalletState> {
    const kp = generateKeypair();
    this.state = {
      publicKey: kp.publicKey,
      secretKey: kp.secretKey,
      funded: false,
      balances: [],
      createdAt: new Date().toISOString(),
    };
    this.persist();
    return this.state;
  }

  async fundWallet(): Promise<{ success: boolean; message: string; txHash?: string }> {
    if (!this.state) throw new Error("No wallet");
    const result = await fundWithFriendbot(this.state.publicKey);
    if (result.success) {
      this.state.funded = true;
      await this.refreshBalance();
      this.persist();
    }
    return result;
  }

  async refreshBalance() {
    if (!this.state) return null;
    const res = await getAccountBalance(this.state.publicKey);
    if (res.success) {
      this.state.balances = res.balances;
      this.state.funded = true;
      this.persist();
    }
    return res;
  }

  importWallet(secretKey: string): WalletState {
    // Basic validation via public key derivation would be better; for demo we accept
    const { Keypair } = require("@stellar/stellar-sdk");
    const kp = Keypair.fromSecret(secretKey);
    this.state = {
      publicKey: kp.publicKey(),
      secretKey,
      funded: false,
      balances: [],
      createdAt: new Date().toISOString(),
    };
    this.persist();
    return this.state;
  }

  clearWallet() {
    this.state = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  getPublicKey(): string | null {
    return this.state?.publicKey ?? null;
  }

  /** Only for signed operations inside the agent layer */
  getSecretKey(): string | null {
    return this.state?.secretKey ?? null;
  }
}

export const walletEngine = typeof window !== "undefined" ? new WalletEngine() : null;