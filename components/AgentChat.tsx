"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { walletEngine } from "@/lib/engines/wallet-engine";
import { contactEngine } from "@/lib/engines/contact-engine";
import { paymentEngine } from "@/lib/engines/payment-engine";
import { generateKeypair, fundWithFriendbot } from "@/lib/stellar/client";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Crea una wallet y fóndala",
  "Agrega un contacto llamado Alice",
  "Envía 5 XLM a Alice",
  "¿Cuál es mi balance?",
  "Mostrame el historial",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function AgentChat({ onAction }: { onAction?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [walletCtx, setWalletCtx] = useState<any>(null);
  const [demoMode, setDemoMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshCtx = () => {
    const w = walletEngine?.getWallet();
    setWalletCtx(
      w
        ? {
            publicKey: w.publicKey,
            funded: w.funded,
            balances: w.balances,
          }
        : null
    );
  };

  useEffect(() => {
    refreshCtx();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function processToolResults(tools: any[]) {
    for (const item of tools || []) {
      const result = item.result || item;
      if (!result) continue;

      if (result.action === "CREATE_WALLET") {
        if (!walletEngine?.hasWallet()) {
          await walletEngine?.createWallet();
        }
        if (result.autoFund) {
          await walletEngine?.fundWallet();
        }
      }

      if (result.action === "FUND_WALLET") {
        await walletEngine?.fundWallet();
      }

      if (result.action === "ADD_CONTACT" && result.name) {
        try {
          let pk = result.publicKey as string | null;
          if (!pk || result.generateIfMissing) {
            const kp = generateKeypair();
            pk = kp.publicKey;
            if (result.fundIfGenerated) {
              await fundWithFriendbot(pk);
            }
          }
          if (pk && !contactEngine?.findByPublicKey(pk)) {
            contactEngine?.add(result.name, pk, result.note);
          }
        } catch (e) {
          console.error("add contact", e);
        }
      }

      if (result.action === "CREATE_PAYMENT_INTENT") {
        try {
          // If destination is a name without contact yet, create one on the fly
          const dest = result.destination as string;
          if (dest && !dest.startsWith("G") && !contactEngine?.resolve(dest)) {
            const kp = generateKeypair();
            await fundWithFriendbot(kp.publicKey);
            contactEngine?.add(dest, kp.publicKey, "Auto-created for payment demo");
          }
          paymentEngine?.createIntent({
            destination: result.destination,
            amount: result.amount,
            memo: result.memo,
          });
        } catch (e) {
          console.error("Failed to create payment intent", e);
        }
      }

      if (result.action === "GET_BALANCE") {
        await walletEngine?.refreshBalance();
      }

      if (result.success && result.publicKey && result.txHash) {
        await walletEngine?.refreshBalance();
      }
    }
    refreshCtx();
    onAction?.();
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const w = walletEngine?.getWallet();
      const currentCtx = w
        ? {
            publicKey: w.publicKey,
            funded: w.funded,
            balances: w.balances,
          }
        : null;

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          walletContext: currentCtx,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.mode === "demo" || data.content) {
          setDemoMode(true);
          if (data.tools?.length) {
            await processToolResults(data.tools);
          }
          // Extra refresh after fund
          if (/fond|fund|crea.*wallet/i.test(trimmed)) {
            await new Promise((r) => setTimeout(r, 1200));
            await walletEngine?.refreshBalance();
            refreshCtx();
            onAction?.();
          }
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              content: data.content || data.error || "Listo.",
            },
          ]);
          return;
        }
        if (data.error) {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              content: data.error,
            },
          ]);
          return;
        }
      }

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        const assistantId = `a-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.startsWith("0:")) {
              try {
                full += JSON.parse(line.slice(2));
              } catch {
                full += line.slice(2);
              }
            }
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: full || "…" } : m
            )
          );
        }
        refreshCtx();
        onAction?.();
      } else {
        const errText = await res.text();
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: `Error del agente (${res.status}): ${errText.slice(0, 200)}`,
          },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `Error de red: ${e.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      refreshCtx();
    }
  }

  return (
    <div className="flex flex-col h-full bg-agent-card border border-agent-border rounded-2xl overflow-hidden agent-glow">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-white text-sm">Stellar Agent</h2>
          <p className="text-xs text-gray-500">
            Intent Engine · Tool Calling · Testnet
            {demoMode && (
              <span className="ml-2 text-amber-400">· Demo offline</span>
            )}
          </p>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px] max-h-[480px]">
        {messages.length === 0 && (
          <div className="space-y-4 py-6">
            <p className="text-sm text-gray-400 text-center">
              Flujo listo para inversores — tocá una sugerencia:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex gap-3",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-cyan-600 text-white rounded-br-md"
                  : "bg-gray-800/80 text-gray-200 rounded-bl-md border border-gray-700/50"
              )}
            >
              {m.content || (
                <span className="text-gray-500 italic">Pensando…</span>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="p-4 border-t border-gray-800 flex gap-2"
      >
        <input
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500 placeholder:text-gray-600"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Envía 5 XLM a Alice…"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
