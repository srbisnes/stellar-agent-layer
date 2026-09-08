"use client";

import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { walletEngine } from "@/lib/engines/wallet-engine";
import { contactEngine } from "@/lib/engines/contact-engine";
import { paymentEngine } from "@/lib/engines/payment-engine";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Crea una wallet y fúndala con Friendbot",
  "Agrega un contacto llamado Alice",
  "Envía 5 XLM a Alice",
  "¿Cuál es mi balance?",
  "Muéstrame el historial",
];

export function AgentChat({
  onAction,
}: {
  onAction?: () => void;
}) {
  const [walletCtx, setWalletCtx] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, handleSubmit, isLoading, append } = useChat({
    api: "/api/agent",
    body: { walletContext: walletCtx },
    onFinish: async (message) => {
      // Process tool results that require client-side execution
      await processToolSideEffects(message);
      refreshCtx();
      onAction?.();
    },
  });

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

  async function processToolSideEffects(message: any) {
    // Look for tool invocations in the message parts / toolInvocations
    const invocations =
      message.toolInvocations ||
      message.parts?.filter((p: any) => p.type === "tool-invocation") ||
      [];

    for (const inv of invocations) {
      const result = inv.result || inv.output;
      if (!result) continue;

      if (result.action === "CREATE_WALLET") {
        if (!walletEngine?.hasWallet()) {
          await walletEngine?.createWallet();
        }
      }

      if (result.action === "ADD_CONTACT" && result.name && result.publicKey) {
        try {
          if (!contactEngine?.findByPublicKey(result.publicKey)) {
            contactEngine?.add(result.name, result.publicKey, result.note);
          }
        } catch {}
      }

      if (result.action === "CREATE_PAYMENT_INTENT") {
        try {
          paymentEngine?.createIntent({
            destination: result.destination,
            amount: result.amount,
            memo: result.memo,
          });
        } catch (e) {
          console.error("Failed to create payment intent", e);
        }
      }

      if (result.success && result.publicKey && result.txHash) {
        // Friendbot success — refresh balance
        await walletEngine?.refreshBalance();
      }
    }
  }

  const sendSuggestion = (text: string) => {
    append({ role: "user", content: text });
  };

  return (
    <div className="flex flex-col h-full bg-agent-card border border-agent-border rounded-2xl overflow-hidden agent-glow">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-white text-sm">Stellar Agent</h2>
          <p className="text-xs text-gray-500">Intent Engine · Tool Calling · Testnet</p>
        </div>
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400 ml-auto" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px] max-h-[480px]">
        {messages.length === 0 && (
          <div className="space-y-4 py-6">
            <p className="text-sm text-gray-400 text-center">
              Soy un agente real, no un chatbot. Habla conmigo en lenguaje natural.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendSuggestion(s)}
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
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-cyan-600 text-white rounded-br-md"
                  : "bg-gray-800/80 text-gray-200 rounded-bl-md border border-gray-700/50"
              )}
            >
              {m.content || (
                <span className="text-gray-500 italic">Thinking / calling tools…</span>
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

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-800 flex gap-2"
      >
        <input
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500 placeholder:text-gray-600"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Envía 10 XLM a Alice…"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}