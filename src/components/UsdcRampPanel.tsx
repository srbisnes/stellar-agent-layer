import { useState, useEffect } from "react";
import { DollarSign, Building2, ArrowUpRight, Sparkles, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { walletEngine } from "@/lib/engines/wallet-engine";
import { paymentEngine } from "@/lib/engines/payment-engine";
import { TESTNET_RAMP_VAULT, TESTNET_USDC_ISSUER, getUsdcArsRate } from "@/lib/stellar/client";
import { getCurrentUser } from "@/lib/storage";
import type { PaymentIntent } from "@/types";

interface Props {
  onUpdate: () => void;
  onRequestConfirmPayment: (intent: PaymentIntent) => void;
}

export function UsdcRampPanel({ onUpdate, onRequestConfirmPayment }: Props) {
  const [tab, setTab] = useState<"offramp" | "transfer" | "faucet">("offramp");
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const rate = getUsdcArsRate();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [usdcAmount, setUsdcAmount] = useState("50");
  const [bank, setBank] = useState("Mercado Pago");
  const [alias, setAlias] = useState("rodrigo.mp");
  const [holder, setHolder] = useState("");

  const [transferDest, setTransferDest] = useState("");
  const [transferAmt, setTransferAmt] = useState("25");

  useEffect(() => {
    const w = walletEngine.getWallet();
    if (w) {
      const u = w.balances.find((b) => b.code === "USDC" || b.asset.startsWith("USDC"));
      setUsdcBalance(u ? parseFloat(u.balance).toFixed(2) : "0.00");
    }
    const user = getCurrentUser();
    setHolder(user?.name || "Titular");
  }, []);

  const parsed = parseFloat(usdcAmount) || 0;
  const ars = (parsed * rate.rate).toLocaleString("es-AR", { minimumFractionDigits: 2 });

  const createOfframp = () => {
    setFeedback(null);
    if (!walletEngine.hasWallet()) {
      setFeedback({ type: "err", text: "Creá o conectá una wallet primero" });
      return;
    }
    if (parsed <= 0 || !alias.trim()) {
      setFeedback({ type: "err", text: "Monto y alias/CBU son obligatorios" });
      return;
    }
    try {
      const intent = paymentEngine.createIntent({
        destination: TESTNET_RAMP_VAULT,
        amount: parsed.toString(),
        asset: "USDC",
        assetIssuer: TESTNET_USDC_ISSUER,
        memo: `ARS-${alias.slice(0, 20)}`,
        offrampDetails: {
          targetCurrency: "ARS",
          arsAmount: parsed * rate.rate,
          exchangeRate: rate.rate,
          aliasOrCbu: alias.trim(),
          accountHolder: holder || "Titular",
          bankOrWallet: bank,
          receiptId: `ARS-${Date.now().toString().slice(-6)}`,
        },
      });
      onUpdate();
      onRequestConfirmPayment(intent);
      setFeedback({ type: "ok", text: `Intención creada por $${ars} ARS. Autorizala.` });
    } catch (e: any) {
      setFeedback({ type: "err", text: e.message });
    }
  };

  const createTransfer = () => {
    setFeedback(null);
    if (!walletEngine.hasWallet()) {
      setFeedback({ type: "err", text: "Creá una wallet primero" });
      return;
    }
    const amt = parseFloat(transferAmt);
    if (!amt || !transferDest.trim()) {
      setFeedback({ type: "err", text: "Destino y monto requeridos" });
      return;
    }
    try {
      const intent = paymentEngine.createIntent({
        destination: transferDest.trim(),
        amount: amt.toString(),
        asset: "USDC",
        assetIssuer: TESTNET_USDC_ISSUER,
      });
      onUpdate();
      onRequestConfirmPayment(intent);
      setFeedback({ type: "ok", text: "Orden de transferencia creada" });
    } catch (e: any) {
      setFeedback({ type: "err", text: e.message });
    }
  };

  const mintUsdc = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if (!walletEngine.hasWallet()) await walletEngine.createWallet("USDC Wallet");
      const res = await walletEngine.mintSimulatedTestnetUsdc(250);
      setUsdcBalance(res.balance || "250.00");
      onUpdate();
      setFeedback({ type: "ok", text: `+250 USDC acreditados (demo)` });
    } catch (e: any) {
      setFeedback({ type: "err", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-[#121215] p-5 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-500/30 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Mover USDC & Transformar a Pesos</h2>
            <p className="text-xs text-zinc-400">Off-ramp ARS · Transferencias USDC · Testnet</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-black/60 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-zinc-500">1 USDC = </span>
            <span className="font-mono font-bold text-emerald-400">${rate.rate.toLocaleString("es-AR")} ARS</span>
          </div>
          <div className="bg-yellow-950/40 border border-yellow-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <span className="font-mono font-bold text-white">{usdcBalance}</span>
            <span className="text-[10px] text-yellow-400 font-semibold">USDC</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-black/50 border border-zinc-800 rounded-xl">
        {(["offramp", "transfer", "faucet"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              tab === t ? "bg-yellow-400 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            {t === "offramp" && "→ Pesos (ARS)"}
            {t === "transfer" && "Transferir USDC"}
            {t === "faucet" && "+ USDC Faucet"}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl text-xs ${
          feedback.type === "ok" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"
        }`}>
          {feedback.text}
        </div>
      )}

      {tab === "offramp" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3 bg-black/40 border border-zinc-800 p-4 rounded-xl">
            <label className="text-xs text-zinc-400 font-semibold">Entregás (USDC)</label>
            <Input type="number" value={usdcAmount} onChange={(e) => setUsdcAmount(e.target.value)} className="font-mono text-lg h-12" />
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
              <p className="text-[10px] text-emerald-400 uppercase font-semibold">Recibís</p>
              <p className="text-xl font-mono font-black text-white">${ars} <span className="text-xs text-emerald-400">ARS</span></p>
            </div>
          </div>
          <div className="space-y-3 bg-black/40 border border-zinc-800 p-4 rounded-xl">
            <label className="text-xs text-zinc-400 font-semibold">Entidad</label>
            <div className="grid grid-cols-3 gap-1.5">
              {["Mercado Pago", "Ualá", "Lemon", "Galicia", "Santander", "Brubank"].map((b) => (
                <button
                  key={b}
                  onClick={() => setBank(b)}
                  className={`py-1.5 text-[11px] rounded-lg border ${
                    bank === b ? "bg-yellow-400/20 border-yellow-500 text-white" : "border-zinc-800 text-zinc-400"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Alias o CBU/CVU" className="font-mono text-xs" />
            <Button onClick={createOfframp} variant="gold" className="w-full">
              <Building2 className="w-4 h-4" /> Liquidar a ${ars} ARS
            </Button>
          </div>
        </div>
      )}

      {tab === "transfer" && (
        <div className="space-y-3 bg-black/40 border border-zinc-800 p-4 rounded-xl">
          <Input value={transferDest} onChange={(e) => setTransferDest(e.target.value)} placeholder="Contacto o G..." className="font-mono text-xs" />
          <Input type="number" value={transferAmt} onChange={(e) => setTransferAmt(e.target.value)} placeholder="Monto USDC" />
          <Button onClick={createTransfer} variant="gold">
            <ArrowUpRight className="w-4 h-4" /> Generar orden USDC
          </Button>
        </div>
      )}

      {tab === "faucet" && (
        <div className="p-4 bg-black/40 border border-zinc-800 rounded-xl flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 text-sm text-zinc-400">
            Acreditá USDC de prueba y emití la trustline de Circle en Testnet.
          </div>
          <Button onClick={mintUsdc} disabled={loading} variant="gold">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            +250 USDC
          </Button>
        </div>
      )}
    </div>
  );
}
