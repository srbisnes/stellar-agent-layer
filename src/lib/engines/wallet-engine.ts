import {
  generateKeypair,
  fundWithFriendbot,
  getAccountBalance,
  isValidPublicKey,
  isValidSecretKey,
  addTrustline,
  TESTNET_USDC_ISSUER,
} from "@/lib/stellar/client";
import { getWallets, saveWallets } from "@/lib/storage";
import { uid } from "@/lib/utils";
import type { WalletState, WalletBalance } from "@/types";

class WalletEngine {
  private wallets: WalletState[] = [];

  constructor() {
    this.wallets = getWallets();
  }

  private persist() {
    saveWallets(this.wallets);
  }

  list(): WalletState[] {
    return [...this.wallets];
  }

  getWallet(id?: string): WalletState | null {
    if (id) return this.wallets.find((w) => w.id === id) || null;
    return this.wallets.find((w) => w.isDefault) || this.wallets[0] || null;
  }

  hasWallet(): boolean {
    return this.wallets.length > 0;
  }

  async createWallet(name = "Main Wallet"): Promise<WalletState> {
    const { publicKey, secretKey } = generateKeypair();
    const wallet: WalletState = {
      id: uid("w_"),
      name,
      publicKey,
      secretKey,
      type: "generated",
      funded: false,
      balances: [],
      createdAt: new Date().toISOString(),
      isDefault: this.wallets.length === 0,
    };
    this.wallets.push(wallet);
    this.persist();
    return wallet;
  }

  async fundWallet(walletId?: string) {
    const wallet = this.getWallet(walletId);
    if (!wallet) throw new Error("No wallet found");
    const res = await fundWithFriendbot(wallet.publicKey);
    if (res.success) {
      wallet.funded = true;
      await this.refreshBalances(wallet.id);
      this.persist();
    }
    return res;
  }

  async refreshBalances(walletId?: string) {
    const wallet = this.getWallet(walletId);
    if (!wallet) return null;
    const res = await getAccountBalance(wallet.publicKey);
    if (res.success) {
      wallet.balances = res.balances as WalletBalance[];
      wallet.funded = true;
      this.persist();
    }
    return res;
  }

  async importSecret(secret: string, name = "Imported Wallet"): Promise<WalletState> {
    if (!isValidSecretKey(secret)) throw new Error("Invalid secret key (must start with S)");
    const { Keypair } = await import("@stellar/stellar-sdk");
    const kp = Keypair.fromSecret(secret);
    const publicKey = kp.publicKey();
    if (this.wallets.some((w) => w.publicKey === publicKey)) {
      throw new Error("This wallet is already imported");
    }
    const wallet: WalletState = {
      id: uid("w_"),
      name,
      publicKey,
      secretKey: secret,
      type: "imported_secret",
      funded: false,
      balances: [],
      createdAt: new Date().toISOString(),
      isDefault: this.wallets.length === 0,
    };
    this.wallets.push(wallet);
    this.persist();
    await this.refreshBalances(wallet.id);
    return wallet;
  }

  async importWatchOnly(publicKey: string, name = "Watch-Only"): Promise<WalletState> {
    if (!isValidPublicKey(publicKey)) throw new Error("Invalid public key (must start with G)");
    if (this.wallets.some((w) => w.publicKey === publicKey)) {
      throw new Error("This address is already added");
    }
    const wallet: WalletState = {
      id: uid("w_"),
      name,
      publicKey,
      type: "watch_only",
      funded: false,
      balances: [],
      createdAt: new Date().toISOString(),
      isDefault: this.wallets.length === 0,
    };
    this.wallets.push(wallet);
    this.persist();
    await this.refreshBalances(wallet.id);
    return wallet;
  }

  async connectFreighter(): Promise<WalletState> {
    const freighter = await import("@stellar/freighter-api");
    const isConnected = await freighter.isConnected();
    if (!isConnected) {
      await freighter.requestAccess();
    }
    const address = await freighter.getAddress();
    if (!address || !address.address) throw new Error("Freighter did not return an address");
    const publicKey = address.address;
    const existing = this.wallets.find((w) => w.publicKey === publicKey);
    if (existing) {
      existing.type = "freighter";
      this.persist();
      return existing;
    }
    const wallet: WalletState = {
      id: uid("w_"),
      name: "Freighter",
      publicKey,
      type: "freighter",
      funded: false,
      balances: [],
      createdAt: new Date().toISOString(),
      isDefault: this.wallets.length === 0,
    };
    this.wallets.push(wallet);
    this.persist();
    await this.refreshBalances(wallet.id);
    return wallet;
  }

  setDefault(walletId: string) {
    this.wallets.forEach((w) => (w.isDefault = w.id === walletId));
    this.persist();
  }

  removeWallet(walletId: string) {
    this.wallets = this.wallets.filter((w) => w.id !== walletId);
    if (this.wallets.length && !this.wallets.some((w) => w.isDefault)) {
      this.wallets[0].isDefault = true;
    }
    this.persist();
  }

  async addUsdcTrustline(walletId?: string) {
    const wallet = this.getWallet(walletId);
    if (!wallet || !wallet.secretKey) {
      return { success: false, message: "Need a wallet with secret key to add trustline" };
    }
    try {
      const res = await addTrustline({
        sourceSecret: wallet.secretKey,
        assetCode: "USDC",
        issuerPublicKey: TESTNET_USDC_ISSUER,
      });
      if (res.success) {
        await this.refreshBalances(wallet.id);
        return { success: true, message: "USDC trustline added successfully" };
      }
      return { success: false, message: String(res.error) };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async mintSimulatedTestnetUsdc(amount = 250, walletId?: string) {
    const wallet = this.getWallet(walletId);
    if (!wallet) throw new Error("No wallet");
    // Simulated mint for demo (real testnet USDC requires issuer)
    const existing = wallet.balances.find((b) => b.asset.startsWith("USDC") || b.code === "USDC");
    if (existing) {
      existing.balance = (parseFloat(existing.balance) + amount).toFixed(2);
    } else {
      wallet.balances.push({
        asset: `USDC:${TESTNET_USDC_ISSUER}`,
        balance: amount.toFixed(2),
        code: "USDC",
        issuer: TESTNET_USDC_ISSUER,
        assetType: "credit_alphanum4",
      });
    }
    this.persist();
    return { success: true, balance: wallet.balances.find((b) => b.code === "USDC")?.balance || "0" };
  }
}

export const walletEngine = new WalletEngine();
