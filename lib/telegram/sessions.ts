/**
 * In-memory session store for Telegram users.
 * Fine for hackathon / single-instance demos.
 * For production on Vercel, swap to Redis / Vercel KV.
 */

import type { TelegramSession, TelegramContact, TelegramPaymentIntent } from "./types";
import { generateKeypair } from "@/lib/stellar/client";

const globalStore = globalThis as unknown as {
  __tgSessions?: Map<number, TelegramSession>;
};

if (!globalStore.__tgSessions) {
  globalStore.__tgSessions = new Map();
}

const sessions = globalStore.__tgSessions;

export function getSession(chatId: number): TelegramSession | undefined {
  return sessions.get(chatId);
}

export function getOrCreateSession(meta: {
  chatId: number;
  userId: number;
  username?: string;
  firstName?: string;
}): TelegramSession {
  let s = sessions.get(meta.chatId);
  if (!s) {
    s = {
      chatId: meta.chatId,
      userId: meta.userId,
      username: meta.username,
      firstName: meta.firstName,
      funded: false,
      contacts: [],
      pendingPayments: [],
      history: [],
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    sessions.set(meta.chatId, s);
  } else {
    s.username = meta.username ?? s.username;
    s.firstName = meta.firstName ?? s.firstName;
    s.updatedAt = new Date().toISOString();
  }
  return s;
}

export function saveSession(s: TelegramSession) {
  s.updatedAt = new Date().toISOString();
  sessions.set(s.chatId, s);
}

export function createWalletForSession(s: TelegramSession) {
  const kp = generateKeypair();
  s.publicKey = kp.publicKey;
  s.secretKey = kp.secretKey;
  s.funded = false;
  saveSession(s);
  return kp;
}

export function addContact(
  s: TelegramSession,
  name: string,
  publicKey: string,
  note?: string
): TelegramContact {
  const existing = s.contacts.find((c) => c.publicKey === publicKey);
  if (existing) return existing;
  const c: TelegramContact = {
    id: crypto.randomUUID(),
    name: name.trim(),
    publicKey,
    note,
  };
  s.contacts.push(c);
  saveSession(s);
  return c;
}

export function resolveDestination(
  s: TelegramSession,
  dest: string
): { publicKey: string; label?: string } | null {
  const byName = s.contacts.find(
    (c) => c.name.toLowerCase() === dest.toLowerCase().trim()
  );
  if (byName) return { publicKey: byName.publicKey, label: byName.name };
  if (dest.startsWith("G") && dest.length === 56) {
    return { publicKey: dest };
  }
  return null;
}

export function createPaymentIntent(
  s: TelegramSession,
  destination: string,
  amount: string,
  memo?: string
): TelegramPaymentIntent {
  const resolved = resolveDestination(s, destination);
  if (!resolved) {
    throw new Error(
      `No pude resolver "${destination}". Agregá el contacto o usá una public key G...`
    );
  }
  if (!s.publicKey) throw new Error("No tenés wallet. Creá una primero.");

  const intent: TelegramPaymentIntent = {
    id: crypto.randomUUID(),
    destination: resolved.publicKey,
    destinationLabel: resolved.label,
    amount: String(parseFloat(amount)),
    memo,
    status: "pending_confirmation",
    createdAt: new Date().toISOString(),
  };
  s.pendingPayments.unshift(intent);
  saveSession(s);
  return intent;
}

export function getPendingIntent(s: TelegramSession, id: string) {
  return s.pendingPayments.find((p) => p.id === id);
}
