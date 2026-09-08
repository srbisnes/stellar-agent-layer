"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { PaymentIntent } from "@/lib/engines/payment-engine";
import { formatXLM, shortenAddress } from "@/lib/utils";
import { walletEngine } from "@/lib/engines/wallet-engine";

interface Props {
  intent: PaymentIntent;
  onClose: () => void;
  onConfirmed: (updated: PaymentIntent) => void;
}

export function PaymentConfirmModal({ intent, onClose, onConfirmed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ hash: string; explorer: string } | null>(null);

  const confirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const secret = walletEngine?.getSecretKey();
      if (!secret) throw new Error("No wallet secret");

      const res = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretKey: secret,
          destination: intent.destination,
          amount: intent.amount,
          memo: intent.memo,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
      }

      const updated: PaymentIntent = {
        ...intent,
        status: "success",
        txHash: data.hash,
        confirmedAt: new Date().toISOString(),
      };
      setSuccess({ hash: data.hash, explorer: data.explorer });
      onConfirmed(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-agent-card border border-agent-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold text-white">Human Confirmation Required</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!success ? (
            <>
              <p className="text-sm text-gray-400">
                The agent created a payment intent. Review and confirm to sign & submit on Testnet.
              </p>

              <div className="bg-black/40 rounded-xl p-4 space-y-3 border border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold text-white">
                    {formatXLM(intent.amount)} XLM
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">To</span>
                  <span className="font-mono text-cyan-300">
                    {intent.destinationLabel || shortenAddress(intent.destination, 6)}
                  </span>
                </div>
                {intent.memo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Memo</span>
                    <span className="text-gray-300">{intent.memo}</span>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={confirm}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing…
                    </>
                  ) : (
                    "Confirm & Sign"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div>
                <p className="font-semibold text-white">Payment submitted</p>
                <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                  {success.hash}
                </p>
              </div>
              <a
                href={success.explorer}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm text-cyan-400 hover:underline"
              >
                View on Stellar Expert →
              </a>
              <Button className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}