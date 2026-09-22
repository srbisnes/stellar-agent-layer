import type { UserProfile, WalletState, Contact, PaymentIntent, HistoryEntry } from "@/types";

const PREFIX = "sal_v2_";

function key(k: string) {
  return `${PREFIX}${k}`;
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(key("user"));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile | null) {
  if (!user) {
    localStorage.removeItem(key("user"));
    return;
  }
  localStorage.setItem(key("user"), JSON.stringify(user));
}

export function getWallets(): WalletState[] {
  try {
    const raw = localStorage.getItem(key("wallets"));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWallets(wallets: WalletState[]) {
  localStorage.setItem(key("wallets"), JSON.stringify(wallets));
}

export function getContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(key("contacts"));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveContacts(contacts: Contact[]) {
  localStorage.setItem(key("contacts"), JSON.stringify(contacts));
}

export function getPaymentIntents(): PaymentIntent[] {
  try {
    const raw = localStorage.getItem(key("intents"));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePaymentIntents(intents: PaymentIntent[]) {
  localStorage.setItem(key("intents"), JSON.stringify(intents));
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(key("history"));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(key("history"), JSON.stringify(entries));
}

export function clearAllUserData() {
  ["user", "wallets", "contacts", "intents", "history"].forEach((k) =>
    localStorage.removeItem(key(k))
  );
}
