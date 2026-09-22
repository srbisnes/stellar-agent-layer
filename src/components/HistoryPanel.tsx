import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { historyEngine } from "@/lib/engines/history-engine";
import { paymentEngine } from "@/lib/engines/payment-engine";
import type { HistoryEntry, PaymentIntent } from "@/types";

export function HistoryPanel() {
  const [entries, setEntries] = useState<(HistoryEntry | PaymentIntent)[]>([]);

  useEffect(() => {
    const hist = historyEngine.list();
    const intents = paymentEngine.list().filter((i) => i.status === "success" || i.status === "failed");
    setEntries([...hist, ...intents].slice(0, 20));
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-yellow-400" />
          <CardTitle>Historial</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">Sin actividad aún</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {entries.map((e: any) => (
              <li key={e.id} className="flex items-center justify-between text-xs border-b border-zinc-800/60 pb-2">
                <div>
                  <p className="text-zinc-200 font-medium">
                    {e.title || `${e.amount} ${e.asset} → ${e.destinationLabel || e.destination?.slice(0, 10)}`}
                  </p>
                  <p className="text-zinc-500">{new Date(e.timestamp || e.createdAt).toLocaleString()}</p>
                </div>
                {e.txHash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${e.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-400 hover:underline font-mono"
                  >
                    tx
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
