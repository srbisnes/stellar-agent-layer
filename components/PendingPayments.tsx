"use client";

import { useEffect, useState } from "react";
import { Clock, ShieldAlert } from "lucide-react";
import { Card, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { paymentEngine, PaymentIntent } from "@/lib/engines/payment-engine";
import { formatXLM, shortenAddress } from "@/lib/utils";
import { PaymentConfirmModal } from "./PaymentConfirmModal";

export function PendingPayments({ refreshKey }: { refreshKey?: number }) {
  const [pending, setPending] = useState<PaymentIntent[]>([]);
  const [selected, setSelected] = useState<PaymentIntent | null>(null);

  const load = () => {
    setPending(paymentEngine?.getPending() || []);
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const onConfirmed = (updated: PaymentIntent) => {
    // Update local storage status via engine
    const all = paymentEngine?.getAll() || [];
    const idx = all.findIndex((p) => p.id === updated.id);
    if (idx >= 0 && paymentEngine) {
      // re-persist by recreating the list state through cancel/success path
      // simplest: mutate and persist is internal; we just reload
    }
    // Force status update by writing back
    try {
      const raw = localStorage.getItem("stellar-agent-pending-payments");
      if (raw) {
        const list: PaymentIntent[] = JSON.parse(raw);
        const i = list.findIndex((p) => p.id === updated.id);
        if (i >= 0) {
          list[i] = updated;
          localStorage.setItem("stellar-agent-pending-payments", JSON.stringify(list));
        }
      }
    } catch {}
    setSelected(null);
    load();
  };

  const cancel = (id: string) => {
    paymentEngine?.cancel(id);
    load();
  };

  return (
    <>
      <Card className={pending.length > 0 ? "border-amber-500/40" : ""}>
        <CardHeader
          title="Pending Confirmations"
          subtitle="Human-in-the-loop gate"
          action={
            pending.length > 0 ? (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                {pending.length}
              </span>
            ) : null
          }
        />

        {pending.length === 0 ? (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Clock className="w-4 h-4" /> No payments waiting for confirmation
          </p>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li
                key={p.id}
                className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {formatXLM(p.amount)} XLM →{" "}
                    {p.destinationLabel || shortenAddress(p.destination, 4)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => setSelected(p)}>
                    Review & Confirm
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => cancel(p.id)}>
                    Cancel
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected && (
        <PaymentConfirmModal
          intent={selected}
          onClose={() => setSelected(null)}
          onConfirmed={onConfirmed}
        />
      )}
    </>
  );
}