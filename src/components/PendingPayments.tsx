import { useState, useEffect } from "react";
import { Clock, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { paymentEngine } from "@/lib/engines/payment-engine";
import type { PaymentIntent } from "@/types";

interface Props {
  onUpdate: () => void;
  onRequestConfirm: (intent: PaymentIntent) => void;
}

export function PendingPayments({ onUpdate, onRequestConfirm }: Props) {
  const [pending, setPending] = useState<PaymentIntent[]>([]);

  useEffect(() => {
    setPending(paymentEngine.pending());
  }, []);

  const cancel = (id: string) => {
    paymentEngine.cancel(id);
    setPending(paymentEngine.pending());
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400" />
          <CardTitle>Pendientes de Confirmación</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No hay pagos esperando autorización</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{p.destinationLabel || p.destination.slice(0, 12)}</span>
                  <span className="font-mono text-yellow-400">
                    {p.amount} {p.asset}
                  </span>
                </div>
                {p.offrampDetails && (
                  <p className="text-[11px] text-emerald-400">
                    → ${p.offrampDetails.arsAmount.toLocaleString("es-AR")} ARS · {p.offrampDetails.bankOrWallet}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="gold" onClick={() => onRequestConfirm(p)} className="flex-1">
                    <Check className="w-3.5 h-3.5" /> Autorizar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => cancel(p.id)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
