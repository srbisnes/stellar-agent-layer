"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { WalletPanel } from "@/components/WalletPanel";
import { ContactPanel } from "@/components/ContactPanel";
import { PendingPayments } from "@/components/PendingPayments";
import { HistoryPanel } from "@/components/HistoryPanel";
import { AgentChat } from "@/components/AgentChat";
import { AuthHeader } from "@/components/AuthHeader";
import { UserScope } from "@/components/UserScope";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Dashboard() {
  const { isSignedIn, isLoaded } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);

  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <UserScope>
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
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                Testnet Live
              </span>
              <AuthHeader />
            </div>
          </div>
        </header>

        {!isLoaded ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !isSignedIn ? (
          <main className="max-w-2xl mx-auto px-4 py-20 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-6">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
              Real AI Agent on Stellar Testnet
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Sign in with Google to create your own ephemeral wallet, manage
              contacts, create payment intents and confirm them with a human gate.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <SignUpButton mode="modal">
                <Button size="lg">Sign up with Google</Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button variant="secondary" size="lg">
                  Already have an account? Sign in
                </Button>
              </SignInButton>
            </div>
            <p className="mt-10 text-xs text-gray-600">
              Testnet only · No real funds · Human confirmation required for every payment
            </p>
          </main>
        ) : (
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
                    All value transfers require explicit human confirmation. The
                    agent never auto-sends funds.
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}

        <footer className="border-t border-gray-800/50 mt-12 py-6 text-center text-xs text-gray-600">
          Stellar Agent Layer · Built for hackathon demo · Testnet only · No real
          funds
        </footer>
      </div>
    </UserScope>
  );
}
