/**
 * Contact Engine — address book for frequent recipients.
 * Stores name + public key pairs.
 */

export interface Contact {
  id: string;
  name: string;
  publicKey: string;
  note?: string;
  createdAt: string;
  lastUsedAt?: string;
}

const STORAGE_KEY = "stellar-agent-contacts";

export class ContactEngine {
  private contacts: Contact[] = [];

  constructor() {
    if (typeof window !== "undefined") this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.contacts = JSON.parse(raw);
    } catch {
      this.contacts = [];
    }
  }

  private persist() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.contacts));
    }
  }

  list(): Contact[] {
    return [...this.contacts].sort(
      (a, b) =>
        new Date(b.lastUsedAt || b.createdAt).getTime() -
        new Date(a.lastUsedAt || a.createdAt).getTime()
    );
  }

  getById(id: string): Contact | undefined {
    return this.contacts.find((c) => c.id === id);
  }

  findByName(name: string): Contact | undefined {
    const n = name.toLowerCase().trim();
    return this.contacts.find((c) => c.name.toLowerCase() === n);
  }

  findByPublicKey(pk: string): Contact | undefined {
    return this.contacts.find((c) => c.publicKey === pk);
  }

  add(name: string, publicKey: string, note?: string): Contact {
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
    const idx = this.contacts.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Contact not found");
    this.contacts[idx] = { ...this.contacts[idx], ...data };
    this.persist();
    return this.contacts[idx];
  }

  remove(id: string) {
    this.contacts = this.contacts.filter((c) => c.id !== id);
    this.persist();
  }

  markUsed(id: string) {
    const c = this.getById(id);
    if (c) {
      c.lastUsedAt = new Date().toISOString();
      this.persist();
    }
  }

  resolve(nameOrAddress: string): { publicKey: string; contact?: Contact } | null {
    const byName = this.findByName(nameOrAddress);
    if (byName) return { publicKey: byName.publicKey, contact: byName };

    // crude public key check
    if (nameOrAddress.startsWith("G") && nameOrAddress.length === 56) {
      return { publicKey: nameOrAddress };
    }
    return null;
  }
}

export const contactEngine =
  typeof window !== "undefined" ? new ContactEngine() : null;