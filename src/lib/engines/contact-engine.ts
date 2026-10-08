import { getContacts, saveContacts } from "@/lib/storage";
import { isValidPublicKey } from "@/lib/stellar/client";
import { uid } from "@/lib/utils";
import type { Contact } from "@/types";

class ContactEngine {
  private contacts: Contact[] = [];

  constructor() {
    this.contacts = getContacts();
    // Seed demo contacts with VALID Stellar public keys (checksum-correct)
    // so createIntent + buildPaymentTransaction succeed on Testnet.
    if (this.contacts.length === 0) {
      this.contacts = [
        {
          id: uid("c_"),
          name: "Alice",
          publicKey: "GAI663ZTGAFE6CIH6PSCC5XCFFMOLGCPUIHO25LVWMEDB3MD2J2Y7VFP",
          note: "Demo peer · cuenta de prueba del proyecto (Testnet)",
          createdAt: new Date().toISOString(),
        },
        {
          id: uid("c_"),
          name: "Bob",
          publicKey: "GDKXE2OZMJIPOSLNA6N6F2BVCI3O777I2OOC4BV7VOYUEHYX7RTRYA7Y",
          note: "Demo peer · clave pública válida (Testnet)",
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
    const pk = publicKey.trim();
    if (!isValidPublicKey(pk)) {
      throw new Error(
        `Clave pública inválida: ${pk}. Debe ser una dirección Stellar ed25519 válida (empieza con G y pasa el checksum).`
      );
    }
    if (this.contacts.some((c) => c.publicKey === pk)) {
      throw new Error("Contact already exists");
    }
    const contact: Contact = {
      id: uid("c_"),
      name: name.trim(),
      publicKey: pk,
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
