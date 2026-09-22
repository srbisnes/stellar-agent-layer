/**
 * In-memory session store for WhatsApp users (keyed by wa_id).
 * Hackathon-friendly. For production on Vercel use Redis / Vercel KV.
 */

import type { WaSession, WaContact, WaPaymentIntent } from "./types";
import { generateKeypair } from "@/lib/stellar/client";

const globalStore = globalThis as unknown as {
  __waSessions?: Map<string, WaSession>;
};

if (!globalStore.__waSessions) {
  globalStore.__waSessions = new Map();
}

const sessions = globalStore.__waSessions;

export function getSession(waId: string): WaSession | undefined {
  return sessions.get(waId);
}

export function getOrCreateSession(meta: {
  waId: string;
  profileName?: string;
}): WaSession {
  let s = sessions.get(meta.waId);
  if (!s) {
    s = {
      waId: meta.waId,
      profileName: meta.profileName,
      funded: false,
      contacts: [],
      pendingPayments: [],
      history: [],
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    sessions.set(meta.waId, s);
  } else {
    s.profileName = meta.profileName ?? s.profileName;
    s.updatedAt = new Date().toISOString();
  }
  return s;
}

export function saveSession(s: WaSession) {
  s.updatedAt = new Date().toISOString();
  sessions.set(s.waId, s);
}

export function createWalletForSession(s: WaSession) {
  const kp = generateKeypair();
  s.publicKey = kp.publicKey;
  s.secretKey = kp.secretKey;
  s.funded = false;
  saveSession(s);
  return kp;
}

export function addContact(
  s: WaSession,
  name: string,
  publicKey: string,
  note?: string
): WaContact {
  const existing = s.contacts.find((c) => c.publicKey === publicKey);
  if (existing) return existing;
  const c: WaContact = {
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
  s: WaSession,
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
  s: WaSession,
  destination: string,
  amount: string,
  memo?: string
): WaPaymentIntent {
  const resolved = resolveDestination(s, destination);
  if (!resolved) {
    throw new Error(
      `No pude resolver "${destination}". Agregá el contacto o usá una public key G...`
    );
  }
  if (!s.publicKey) throw new Error("No tenés wallet. Creá una primero.");

  const intent: WaPaymentIntent = {
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

export function getPendingIntent(s: WaSession, id: string) {
  return s.pendingPayments.find((p) => p.id === id);
}
