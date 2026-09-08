"use client";

import { useEffect, useState } from "react";
import { History, ArrowUpRight, ArrowDownLeft, Bot } from "lucide-react";
import { Card, CardHeader } from "./ui/card";
import { historyEngine, HistoryEntry } from "@/lib/engines/history-engine";
import { formatXLM, shortenAddress } from "@/lib/utils";

export function HistoryPanel({ refreshKey }: { refreshKey?: number }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await historyEngine?.getCombinedHistory(20);
      setEntries(data || []);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const icon = (type: HistoryEntry["type"]) => {
    if (type === "payment_out") return <ArrowUpRight className="w-4 h-4 text-red-400" />;
    if (type === "payment_in") return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
    return <Bot className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <Card>
      <CardHeader title="History Engine" subtitle="On-chain + agent intents" />

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <History className="w-4 h-4" /> No activity yet
        </p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-white/5"
            >
              <div className="mt-0.5">{icon(e.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{e.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(e.timestamp).toLocaleString()} · {e.status}
                </p>
              </div>
              {e.amount && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-200">
                    {formatXLM(e.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{e.asset}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}