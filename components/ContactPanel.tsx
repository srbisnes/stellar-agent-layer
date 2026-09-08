"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { contactEngine, Contact } from "@/lib/engines/contact-engine";
import { shortenAddress } from "@/lib/utils";

export function ContactPanel({ onUpdate }: { onUpdate?: () => void }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [pk, setPk] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    setContacts(contactEngine?.list() || []);
    onUpdate?.();
  };

  useEffect(() => {
    refresh();
  }, []);

  const add = () => {
    setError(null);
    try {
      if (!name.trim() || !pk.trim()) {
        setError("Name and public key required");
        return;
      }
      contactEngine?.add(name, pk);
      setName("");
      setPk("");
      setShowForm(false);
      refresh();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const remove = (id: string) => {
    contactEngine?.remove(id);
    refresh();
  };

  return (
    <Card>
      <CardHeader
        title="Contact Engine"
        subtitle="Address book"
        action={
          <Button size="sm" variant="ghost" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
          </Button>
        }
      />

      {showForm && (
        <div className="mb-4 space-y-2 p-3 bg-black/30 rounded-xl border border-gray-800">
          <input
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500"
            placeholder="Name (e.g. Alice)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-cyan-500"
            placeholder="G... public key"
            value={pk}
            onChange={(e) => setPk(e.target.value)}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={add}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Users className="w-4 h-4" /> No contacts yet
        </p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg hover:bg-white/5 group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-200">{c.name}</p>
                <p className="text-xs font-mono text-gray-500 truncate">
                  {shortenAddress(c.publicKey, 5)}
                </p>
              </div>
              <button
                onClick={() => remove(c.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}