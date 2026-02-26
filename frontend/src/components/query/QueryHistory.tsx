"use client";

import { useQueryStore } from "@/stores/query-store";

interface QueryHistoryProps {
  onSelectQuery: (sql: string) => void;
}

export function QueryHistory({ onSelectQuery }: QueryHistoryProps) {
  const history = useQueryStore((s) => s.history);
  const clearHistory = useQueryStore((s) => s.clearHistory);

  if (history.length === 0) {
    return (
      <div className="p-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
        No query history yet
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--color-border)" }}>
        <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>
          History ({history.length})
        </span>
        <button
          className="text-[10px] opacity-60 hover:opacity-100"
          style={{ color: "var(--color-text-muted)" }}
          onClick={clearHistory}
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {history.map((entry) => (
          <button
            key={entry.id}
            className="w-full text-left px-3 py-2 border-b hover:opacity-80 transition-opacity"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "transparent",
            }}
            onClick={() => onSelectQuery(entry.sql)}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{
                  backgroundColor: entry.success
                    ? "var(--color-success)"
                    : "var(--color-error)",
                }}
              />
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                {entry.execution_time_ms}ms &middot; {entry.row_count} rows
              </span>
            </div>
            <div
              className="text-xs truncate"
              style={{
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {entry.sql}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
