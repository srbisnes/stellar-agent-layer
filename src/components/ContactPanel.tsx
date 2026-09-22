import { useState, useEffect } from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { contactEngine } from "@/lib/engines/contact-engine";
import { shortAddress } from "@/lib/utils";
import type { Contact } from "@/types";

interface Props {
  onUpdate: () => void;
}

export function ContactPanel({ onUpdate }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [pk, setPk] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setContacts(contactEngine.list());
  }, []);

  const handleAdd = () => {
    setErr(null);
    try {
      contactEngine.add(name, pk);
      setContacts(contactEngine.list());
      setName("");
      setPk("");
      setShowForm(false);
      onUpdate();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-yellow-400" />
          <CardTitle>Contactos</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="space-y-2 p-3 rounded-xl bg-black/40 border border-zinc-800">
            <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="G... public key" value={pk} onChange={(e) => setPk(e.target.value)} className="font-mono text-xs" />
            <Button size="sm" variant="gold" onClick={handleAdd} className="w-full">
              Agregar
            </Button>
            {err && <p className="text-xs text-red-400">{err}</p>}
          </div>
        )}

        {contacts.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">Sin contactos</p>
        ) : (
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-white">{c.name}</span>
                <span className="font-mono text-xs text-zinc-500">{shortAddress(c.publicKey)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
