/**
 * Wallet Engine — manages keypairs, balances, funding via Friendbot.
 * Never stores secrets in plain localStorage in production; this is demo-safe (testnet only).
 * Data is scoped per Clerk userId.
 */

import {
  generateKeypair,
  fundWithFriendbot,
  getAccountBalance,
} from "@/lib/stellar/client";
import { storageGet, storageSet, storageRemove, getCurrentUserId } from "@/lib/storage";

export interface WalletState {
  publicKey: string;
  secretKey: string; // demo only — never expose in real prod UI
  funded: boolean;
  balances: { asset: string; balance: string }[];
  createdAt: string;
}

const STORAGE_BASE = "stellar-agent-wallet";

export class WalletEngine {
  private state: WalletState | null = null;
  private boundUserId: string | null = null;

  private ensureUserScope() {
    const uid = getCurrentUserId();
    if (uid !== this.boundUserId) {
      this.boundUserId = uid;
      this.load();
    }
  }

  private load() {
    this.state = storageGet<WalletState | null>(STORAGE_BASE, null);
  }

  private persist() {
    if (this.state) {
      storageSet(STORAGE_BASE, this.state);
    }
  }

  getWallet(): WalletState | null {
    this.ensureUserScope();
    return this.state;
  }

  hasWallet(): boolean {
    this.ensureUserScope();
    return !!this.state?.publicKey;
  }

  async createWallet(): Promise<WalletState> {
    this.ensureUserScope();
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
    this.ensureUserScope();
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
    this.ensureUserScope();
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
    this.ensureUserScope();
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
    this.ensureUserScope();
    this.state = null;
    storageRemove(STORAGE_BASE);
  }

  getPublicKey(): string | null {
    this.ensureUserScope();
    return this.state?.publicKey ?? null;
  }

  /** Only for signed operations inside the agent layer */
  getSecretKey(): string | null {
    this.ensureUserScope();
    return this.state?.secretKey ?? null;
  }
}

export const walletEngine =
  typeof window !== "undefined" ? new WalletEngine() : null;
