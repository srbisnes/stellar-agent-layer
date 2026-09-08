"use client";

import { useState } from "react";
import { WalletPanel } from "@/components/WalletPanel";
import { ContactPanel } from "@/components/ContactPanel";
import { PendingPayments } from "@/components/PendingPayments";
import { HistoryPanel } from "@/components/HistoryPanel";
import { AgentChat } from "@/components/AgentChat";

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="border-b border-gray-800/80 bg-black/40 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-black text-sm">
              SA
            </div>
            <div>
              <h1 className="font-semibold text-white tracking-tight">
                Stellar Agent Layer
              </h1>
              <p className="text-xs text-gray-500">
                Real Agent · Intent Engine · Tool Calling · Testnet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
              Testnet Live
            </span>
            <a
              href="https://github.com/srbisnes/stellar-agent-layer"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-500 hover:text-gray-300 transition"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left column — engines */}
          <div className="lg:col-span-4 space-y-5">
            <WalletPanel onUpdate={bump} />
            <ContactPanel onUpdate={bump} />
            <PendingPayments refreshKey={refreshKey} />
          </div>

          {/* Center — Agent */}
          <div className="lg:col-span-5">
            <AgentChat onAction={bump} />
          </div>

          {/* Right — History */}
          <div className="lg:col-span-3 space-y-5">
            <HistoryPanel refreshKey={refreshKey} />

            <div className="bg-agent-card border border-agent-border rounded-2xl p-5 text-xs text-gray-500 space-y-2">
              <p className="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">
                Hackathon Demo Flow
              </p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Create wallet → Fund with Friendbot</li>
                <li>Add contacts (or ask the agent)</li>
                <li>Ask agent: “Envía 5 XLM a Alice”</li>
                <li>Confirm payment in the pending panel</li>
                <li>Check History + Stellar Expert</li>
              </ol>
              <p className="pt-2 text-gray-600">
                All value transfers require explicit human confirmation. The agent never auto-sends funds.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800/50 mt-12 py-6 text-center text-xs text-gray-600">
        Stellar Agent Layer · Built for hackathon demo · Testnet only · No real funds
      </footer>
    </div>
  );
}