export interface WaContact {
  id: string;
  name: string;
  publicKey: string;
  note?: string;
}

export interface WaPaymentIntent {
  id: string;
  destination: string;
  destinationLabel?: string;
  amount: string;
  memo?: string;
  status: "pending_confirmation" | "success" | "failed" | "cancelled";
  createdAt: string;
  txHash?: string;
  error?: string;
}

export interface WaSession {
  /** WhatsApp user id (phone number without +) */
  waId: string;
  profileName?: string;
  publicKey?: string;
  secretKey?: string;
  funded: boolean;
  contacts: WaContact[];
  pendingPayments: WaPaymentIntent[];
  history: WaPaymentIntent[];
  messages: { role: "user" | "assistant"; content: string }[];
  updatedAt: string;
}
