import { useState } from "react";
import { ShieldCheck, Loader2, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { paymentEngine } from "@/lib/engines/payment-engine";
import type { PaymentIntent } from "@/types";

interface Props {
  intent: PaymentIntent;
  onClose: () => void;
  onConfirmed: () => void;
}

export function PaymentConfirmModal({ intent, onClose, onConfirmed }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; hash?: string; error?: string } | null>(null);

  const confirm = async () => {
    setLoading(true);
    const res = await paymentEngine.confirmAndSubmit(intent.id);
    setResult(res);
    setLoading(false);
    if (res.success) {
      setTimeout(onConfirmed, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-yellow-500/30 bg-[#121215] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-yellow-400" />
          <div>
            <h2 className="font-bold text-white">Confirmar Transacción</h2>
            <p className="text-xs text-zinc-400">Human-in-the-Loop · Revisión obligatoria</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-black/50 border border-zinc-800 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Destino</span>
              <span className="font-medium text-white">{intent.destinationLabel || intent.destination.slice(0, 16)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Monto</span>
              <span className="font-mono font-bold text-yellow-400">
                {intent.amount} {intent.asset}
              </span>
            </div>
            {intent.offrampDetails && (
              <>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Recibís</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ${intent.offrampDetails.arsAmount.toLocaleString("es-AR")} ARS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Banco / Billetera</span>
                  <span>{intent.offrampDetails.bankOrWallet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Alias / CBU</span>
                  <span className="font-mono text-xs">{intent.offrampDetails.aliasOrCbu}</span>
                </div>
              </>
            )}
            {intent.memo && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Memo</span>
                <span className="font-mono text-xs">{intent.memo}</span>
              </div>
            )}
          </div>

          {result?.success && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-300 flex items-center gap-2">
              ✅ Enviado ·{" "}
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
                target="_blank"
                rel="noreferrer"
                className="underline flex items-center gap-1"
              >
                Ver en Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          {result && !result.success && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
              Error: {result.error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="gold" className="flex-1" onClick={confirm} disabled={loading || !!result?.success}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Firmar & Enviar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
