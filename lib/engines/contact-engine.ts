/**
 * Contact Engine — address book for frequent recipients.
 * Data is scoped per Clerk userId.
 */

import { storageGet, storageSet, getCurrentUserId } from "@/lib/storage";

export interface Contact {
  id: string;
  name: string;
  publicKey: string;
  note?: string;
  createdAt: string;
  lastUsedAt?: string;
}

const STORAGE_BASE = "stellar-agent-contacts";

export class ContactEngine {
  private contacts: Contact[] = [];
  private boundUserId: string | null = null;

  private ensureUserScope() {
    const uid = getCurrentUserId();
    if (uid !== this.boundUserId) {
      this.boundUserId = uid;
      this.load();
    }
  }

  private load() {
    this.contacts = storageGet<Contact[]>(STORAGE_BASE, []);
  }

  private persist() {
    storageSet(STORAGE_BASE, this.contacts);
  }

  list(): Contact[] {
    this.ensureUserScope();
    return [...this.contacts].sort(
      (a, b) =>
        new Date(b.lastUsedAt || b.createdAt).getTime() -
        new Date(a.lastUsedAt || a.createdAt).getTime()
    );
  }

  getById(id: string): Contact | undefined {
    this.ensureUserScope();
    return this.contacts.find((c) => c.id === id);
  }

  findByName(name: string): Contact | undefined {
    this.ensureUserScope();
    const n = name.toLowerCase().trim();
    return this.contacts.find((c) => c.name.toLowerCase() === n);
  }

  findByPublicKey(pk: string): Contact | undefined {
    this.ensureUserScope();
    return this.contacts.find((c) => c.publicKey === pk);
  }

  add(name: string, publicKey: string, note?: string): Contact {
    this.ensureUserScope();
    if (this.findByPublicKey(publicKey)) {
      throw new Error("Contact with this public key already exists");
    }
    const contact: Contact = {
      id: crypto.randomUUID(),
      name: name.trim(),
      publicKey,
      note,
      createdAt: new Date().toISOString(),
    };
    this.contacts.push(contact);
    this.persist();
    return contact;
  }

  update(id: string, data: Partial<Pick<Contact, "name" | "note" | "publicKey">>) {
    this.ensureUserScope();
    const idx = this.contacts.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Contact not found");
    this.contacts[idx] = { ...this.contacts[idx], ...data };
    this.persist();
    return this.contacts[idx];
  }

  remove(id: string) {
    this.ensureUserScope();
    this.contacts = this.contacts.filter((c) => c.id !== id);
    this.persist();
  }

  markUsed(id: string) {
    this.ensureUserScope();
    const c = this.getById(id);
    if (c) {
      c.lastUsedAt = new Date().toISOString();
      this.persist();
    }
  }

  resolve(nameOrAddress: string): { publicKey: string; contact?: Contact } | null {
    this.ensureUserScope();
    const byName = this.findByName(nameOrAddress);
    if (byName) return { publicKey: byName.publicKey, contact: byName };

    if (nameOrAddress.startsWith("G") && nameOrAddress.length === 56) {
      return { publicKey: nameOrAddress };
    }
    return null;
  }
}

export const contactEngine =
  typeof window !== "undefined" ? new ContactEngine() : null;
