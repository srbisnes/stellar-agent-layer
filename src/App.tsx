import { useState, useEffect, useCallback } from "react";
import { AuthHeader } from "./components/AuthHeader";
import { WalletPanel } from "./components/WalletPanel";
import { ContactPanel } from "./components/ContactPanel";
import { PendingPayments } from "./components/PendingPayments";
import { HistoryPanel } from "./components/HistoryPanel";
import { AgentChat } from "./components/AgentChat";
import { UsdcRampPanel } from "./components/UsdcRampPanel";
import { InvestorMetricsBar } from "./components/InvestorMetricsBar";
import { PaymentConfirmModal } from "./components/PaymentConfirmModal";
import { getCurrentUser, setCurrentUser } from "./lib/storage";
import type { UserProfile, PaymentIntent } from "./types";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tick, setTick] = useState(0);
  const [confirmIntent, setConfirmIntent] = useState<PaymentIntent | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const handleLogin = (profile: UserProfile) => {
    setCurrentUser(profile);
    setUser(profile);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <InvestorMetricsBar />
      <AuthHeader user={user} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Safety banner */}
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 flex items-start gap-3">
          <span className="text-yellow-400 text-lg">🛡</span>
          <div className="text-sm text-zinc-300">
            <strong className="text-yellow-400">Human-in-the-Loop Gate</strong> — El agente de IA puede preparar órdenes, pero <strong>nunca firma ni envía fondos</strong> sin tu autorización explícita.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-1">
            <WalletPanel key={`w-${tick}`} onUpdate={refresh} />
            <ContactPanel key={`c-${tick}`} onUpdate={refresh} />
            <PendingPayments
              key={`p-${tick}`}
              onUpdate={refresh}
              onRequestConfirm={(intent) => setConfirmIntent(intent)}
            />
          </div>

          {/* Center + Right */}
          <div className="space-y-6 lg:col-span-2">
            <UsdcRampPanel
              key={`u-${tick}`}
              onUpdate={refresh}
              onRequestConfirmPayment={(intent) => setConfirmIntent(intent)}
            />
            <AgentChat key={`a-${tick}`} onUpdate={refresh} />
            <HistoryPanel key={`h-${tick}`} />
          </div>
        </div>
      </main>

      {confirmIntent && (
        <PaymentConfirmModal
          intent={confirmIntent}
          onClose={() => setConfirmIntent(null)}
          onConfirmed={() => {
            setConfirmIntent(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
