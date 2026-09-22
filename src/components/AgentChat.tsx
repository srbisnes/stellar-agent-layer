import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { walletEngine } from "@/lib/engines/wallet-engine";
import { contactEngine } from "@/lib/engines/contact-engine";
import { paymentEngine } from "@/lib/engines/payment-engine";
import { uid } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface Props {
  onUpdate: () => void;
}

const SUGGESTIONS = [
  "Crea una wallet y fóndala",
  "Agrega un contacto llamado Alice",
  "Envía 5 XLM a Alice",
  "Cuál es mi balance?",
  "Transformar 50 USDC a pesos",
];

export function AgentChat({ onUpdate }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys1",
      role: "assistant",
      content: "Hola. Soy el Stellar Agent. Puedo crear wallets, agregar contactos, preparar pagos (siempre con tu confirmación) y liquidar USDC a pesos. ¿Qué necesitás?",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const localAgent = async (text: string): Promise<string> => {
    const lower = text.toLowerCase();

    if (lower.includes("crea") && lower.includes("wallet")) {
      const w = await walletEngine.createWallet();
      await walletEngine.fundWallet(w.id);
      onUpdate();
      return `✅ Wallet creada y fondeada con 10.000 XLM.\nPublic key: ${w.publicKey}`;
    }

    if (lower.includes("balance") || lower.includes("saldo")) {
      const w = walletEngine.getWallet();
      if (!w) return "No tenés wallet activa. Decime ‘crea una wallet’.";
      await walletEngine.refreshBalances(w.id);
      const bals = walletEngine.getWallet()?.balances || [];
      if (!bals.length) return "Wallet sin balance o aún no fondeada.";
      return bals.map((b) => `${b.code || b.asset}: ${b.balance}`).join("\n");
    }

    if (lower.includes("agrega") && lower.includes("contacto")) {
      const match = text.match(/llamad[oa]\s+(\w+)/i) || text.match(/contacto\s+(\w+)/i);
      const name = match?.[1] || "Alice";
      // Demo key – user should replace
      try {
        contactEngine.add(name, "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF");
        onUpdate();
        return `✅ Contacto “${name}” agregado (clave demo). Reemplazala por una real de testnet.`;
      } catch (e: any) {
        return e.message;
      }
    }

    if (lower.includes("envía") || lower.includes("enviar") || lower.includes("pago")) {
      const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(xlm|usdc)?/i);
      const amount = amountMatch?.[1] || "5";
      const asset = (amountMatch?.[2] || "XLM").toUpperCase();
      const nameMatch = text.match(/a\s+(\w+)/i);
      const dest = nameMatch?.[1] || "Alice";
      try {
        const intent = paymentEngine.createIntent({
          destination: dest,
          amount,
          asset: asset as any,
        });
        onUpdate();
        return `✅ Intención de pago creada: ${amount} ${asset} → ${dest}.\n\nRevisá el panel de “Pendientes de Confirmación” y autorizá la transacción. El agente NUNCA firma solo.`;
      } catch (e: any) {
        return `Error: ${e.message}`;
      }
    }

    if (lower.includes("usdc") && (lower.includes("peso") || lower.includes("ars") || lower.includes("transform"))) {
      return "Usá el panel “Mover USDC & Transformar a Pesos” de arriba. Ingresá el monto, elegí Mercado Pago / Ualá / etc. y generá la intención. Después autorizala en el modal.";
    }

    return "Entendí. Puedo crear wallets, agregar contactos, preparar pagos en XLM/USDC y ayudarte con el off-ramp a pesos. Probá una de las sugerencias o escribí en lenguaje natural.";
  };

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content) return;
    setInput("");
    const userMsg: ChatMessage = { id: uid("m_"), role: "user", content, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      // Try server agent first
      let reply = "";
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history: messages.slice(-6) }),
        });
        if (res.ok) {
          const data = await res.json();
          reply = data.reply || data.message || "";
        }
      } catch {}

      if (!reply) {
        reply = await localAgent(content);
      }

      setMessages((m) => [
        ...m,
        { id: uid("m_"), role: "assistant", content: reply, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#121215] flex flex-col h-[420px] shadow-xl">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Bot className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-bold">Stellar Agent</span>
        <span className="text-[10px] text-zinc-500 ml-auto">Intent Engine · Local + Gemini fallback</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${
            m.role === "user" ? "justify-end" : "justify-start"
          }`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-yellow-400" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-yellow-400 text-black"
                : "bg-zinc-900 border border-zinc-800 text-zinc-200"
            }`}>
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <span className="animate-pulse">●</span> Pensando…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-zinc-800 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-[11px] px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-400 hover:border-yellow-500/50 hover:text-yellow-400 transition"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí tu pedido…"
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" variant="gold" size="sm" disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
