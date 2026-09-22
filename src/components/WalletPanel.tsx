import { useState, useEffect } from "react";
import { Wallet, Plus, RefreshCw, Copy, ExternalLink, Key } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { walletEngine } from "@/lib/engines/wallet-engine";
import { shortAddress, formatXlm } from "@/lib/utils";
import type { WalletState } from "@/types";

interface Props {
  onUpdate: () => void;
}

export function WalletPanel({ onUpdate }: Props) {
  const [wallets, setWallets] = useState<WalletState[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => {
    setWallets(walletEngine.list());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await walletEngine.createWallet("Billetera Principal");
      refresh();
      onUpdate();
      setMsg("Wallet creada. Ahora fondeala con Friendbot.");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async (id: string) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await walletEngine.fundWallet(id);
      refresh();
      onUpdate();
      setMsg(res.message);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalances = async () => {
    setLoading(true);
    await walletEngine.refreshBalances();
    refresh();
    onUpdate();
    setLoading(false);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setMsg("Copiado");
    setTimeout(() => setMsg(null), 1500);
  };

  const active = wallets.find((w) => w.isDefault) || wallets[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-yellow-400" />
          <CardTitle>Wallet Engine</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefreshBalances} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!active ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-zinc-400">No hay wallet activa.</p>
            <Button onClick={handleCreate} disabled={loading} variant="gold" size="sm">
              <Plus className="w-4 h-4" /> Crear Wallet
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">{active.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {active.type}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
                <span>{shortAddress(active.publicKey, 6)}</span>
                <button onClick={() => copy(active.publicKey)} className="text-zinc-500 hover:text-yellow-400">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${active.publicKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-500 hover:text-yellow-400"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {active.balances.length === 0 ? (
                <div className="col-span-2 text-center text-xs text-zinc-500 py-2">
                  Sin balance · {active.funded ? "Refrescá" : "Fondeá con Friendbot"}
                </div>
              ) : (
                active.balances.map((b) => (
                  <div key={b.asset} className="rounded-lg bg-black/40 border border-zinc-800 px-3 py-2">
                    <p className="text-[10px] text-zinc-500 uppercase">{b.code || b.asset}</p>
                    <p className="font-mono text-sm font-bold text-white">{formatXlm(b.balance)}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {!active.funded && (
                <Button size="sm" variant="gold" onClick={() => handleFund(active.id)} disabled={loading}>
                  Fondear +10k XLM
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleCreate} disabled={loading}>
                <Plus className="w-3.5 h-3.5" /> Nueva
              </Button>
            </div>
          </>
        )}

        {msg && <p className="text-xs text-yellow-400/90">{msg}</p>}
      </CardContent>
    </Card>
  );
}
