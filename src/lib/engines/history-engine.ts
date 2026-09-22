import { getHistory, saveHistory } from "@/lib/storage";
import { uid } from "@/lib/utils";
import type { HistoryEntry } from "@/types";

class HistoryEngine {
  private entries: HistoryEntry[] = [];

  constructor() {
    this.entries = getHistory();
  }

  private persist() {
    saveHistory(this.entries);
  }

  list(): HistoryEntry[] {
    return [...this.entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  add(entry: Omit<HistoryEntry, "id" | "timestamp"> & { timestamp?: string }) {
    const full: HistoryEntry = {
      id: uid("h_"),
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry,
    };
    this.entries.unshift(full);
    this.persist();
    return full;
  }
}

export const historyEngine = new HistoryEngine();
