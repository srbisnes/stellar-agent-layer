export type WalletType =
  | "generated"
  | "imported_secret"
  | "watch_only"
  | "freighter";

export interface WalletBalance {
  asset: string;
  balance: string;
  code?: string;
  issuer?: string;
  assetType?: string;
}

export interface WalletState {
  id: string;
  name: string;
  publicKey: string;
  secretKey?: string;
  type: WalletType;
  funded: boolean;
  balances: WalletBalance[];
  createdAt: string;
  isDefault?: boolean;
}

export interface NetworkStats {
  ledgerSequence: number;
  protocolVersion: number;
  baseFee: number;
  closedAt: string;
  networkPassphrase: string;
  horizonUrl: string;
  healthy: boolean;
}

export interface Contact {
  id: string;
  name: string;
  publicKey: string;
  note?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export type PaymentStatus =
  | "pending_confirmation"
  | "confirmed"
  | "submitted"
  | "success"
  | "failed"
  | "cancelled";

export interface OfframpDetails {
  targetCurrency: "ARS";
  arsAmount: number;
  exchangeRate: number;
  aliasOrCbu: string;
  accountHolder: string;
  bankOrWallet: string;
  cuit?: string;
  receiptId: string;
}

export interface PaymentIntent {
  id: string;
  destination: string;
  destinationLabel?: string;
  amount: string;
  asset: "XLM" | "USDC" | "ARST" | string;
  assetIssuer?: string;
  memo?: string;
  status: PaymentStatus;
  createdAt: string;
  confirmedAt?: string;
  txHash?: string;
  error?: string;
  sourcePublicKey: string;
  offrampDetails?: OfframpDetails;
}

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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  toolInvocations?: Array<{
    toolName: string;
    toolCallId: string;
    args?: any;
    result?: any;
  }>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarText: string;
  avatarUrl?: string;
  role: string;
  provider?: "google" | "demo" | "custom";
  googleSub?: string;
}
