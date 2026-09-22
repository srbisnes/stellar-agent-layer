export interface TelegramContact {
  id: string;
  name: string;
  publicKey: string;
  note?: string;
}

export interface TelegramPaymentIntent {
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

export interface TelegramSession {
  chatId: number;
  userId: number;
  username?: string;
  firstName?: string;
  publicKey?: string;
  secretKey?: string;
  funded: boolean;
  contacts: TelegramContact[];
  pendingPayments: TelegramPaymentIntent[];
  history: TelegramPaymentIntent[];
  messages: { role: "user" | "assistant"; content: string }[];
  updatedAt: string;
}
