"use client";

import { useEffect, useState } from "react";
import { Wallet, RefreshCw, Plus, Droplets, Copy, Check } from "lucide-react";
import { Card, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { walletEngine, WalletState } from "@/lib/engines/wallet-engine";
import { formatXLM, shortenAddress } from "@/lib/utils";

export function WalletPanel({ onUpdate }: { onUpdate?: () => void }) {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = async () => {
    if (!walletEngine) return;
    const w = walletEngine.getWallet();
    setWallet(w);
    if (w) {
      setLoading(true);
      await walletEngine.refreshBalance();
      setWallet(walletEngine.getWallet());
      setLoading(false);
    }
    onUpdate?.();
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    if (!walletEngine) return;
    setLoading(true);
    setMsg(null);
    await walletEngine.createWallet();
    setWallet(walletEngine.getWallet());
    setLoading(false);
    setMsg("Wallet creada. Ahora fúndala con Friendbot.");
    onUpdate?.();
  };

  const fund = async () => {
    if (!walletEngine || !wallet) return;
    setLoading(true);
    setMsg(null);
    const res = await walletEngine.fundWallet();
    setWallet(walletEngine.getWallet());
    setLoading(false);
    setMsg(res.success ? res.message : `Error: ${res.message}`);
    onUpdate?.();
  };

  const copy = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const xlm =
    wallet?.balances?.find((b) => b.asset === "XLM")?.balance || "0";

  return (
    <Card className="agent-glow">
      <CardHeader
        title="Wallet Engine"
        subtitle="Stellar Testnet · Ephemeral"
        action={
          wallet && (
            <Button
              size="sm"
              variant="ghost"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )
        }
      />

      {!wallet ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            No hay wallet activa. Crea una para empezar la demo.
          </p>
          <Button onClick={create} disabled={loading} className="w-full">
            <Plus className="w-4 h-4" />
            Crear Wallet
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Public Key</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-cyan-300 truncate">
                  {shortenAddress(wallet.publicKey, 6)}
                </code>
                <button onClick={copy} className="text-gray-500 hover:text-white">
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-black/40 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Balance</p>
            <p className="text-2xl font-semibold text-white tracking-tight">
              {formatXLM(xlm)}{" "}
              <span className="text-sm text-gray-400 font-normal">XLM</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {wallet.funded ? "Funded via Friendbot" : "Not funded yet"}
            </p>
          </div>

          {!wallet.funded && (
            <Button onClick={fund} disabled={loading} className="w-full" variant="success">
              <Droplets className="w-4 h-4" />
              Fund with Friendbot (10,000 XLM)
            </Button>
          )}
        </div>
      )}

      {msg && (
        <p className="mt-3 text-xs text-cyan-400/90 bg-cyan-500/5 border border-cyan-500/20 rounded-lg px-3 py-2">
          {msg}
        </p>
      )}
    </Card>
  );
}