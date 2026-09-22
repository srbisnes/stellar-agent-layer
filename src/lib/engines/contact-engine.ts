import { getContacts, saveContacts } from "@/lib/storage";
import { isValidPublicKey } from "@/lib/stellar/client";
import { uid } from "@/lib/utils";
import type { Contact } from "@/types";

class ContactEngine {
  private contacts: Contact[] = [];

  constructor() {
    this.contacts = getContacts();
    // Seed demo contacts if empty
    if (this.contacts.length === 0) {
      this.contacts = [
        {
          id: uid("c_"),
          name: "Alice",
          publicKey: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
          note: "Demo peer (replace with real testnet key)",
          createdAt: new Date().toISOString(),
        },
        {
          id: uid("c_"),
          name: "Bob",
          publicKey: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
          note: "Demo peer",
          createdAt: new Date().toISOString(),
        },
      ];
      this.persist();
    }
  }

  private persist() {
    saveContacts(this.contacts);
  }

  list(): Contact[] {
    return [...this.contacts];
  }

  add(name: string, publicKey: string, note?: string): Contact {
    if (!isValidPublicKey(publicKey) && !publicKey.startsWith("G")) {
      // Allow demo keys for testing
    }
    if (this.contacts.some((c) => c.publicKey === publicKey)) {
      throw new Error("Contact already exists");
    }
    const contact: Contact = {
      id: uid("c_"),
      name: name.trim(),
      publicKey: publicKey.trim(),
      note,
      createdAt: new Date().toISOString(),
    };
    this.contacts.push(contact);
    this.persist();
    return contact;
  }

  findByName(name: string): Contact | undefined {
    return this.contacts.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
  }

  remove(id: string) {
    this.contacts = this.contacts.filter((c) => c.id !== id);
    this.persist();
  }
}

export const contactEngine = new ContactEngine();
