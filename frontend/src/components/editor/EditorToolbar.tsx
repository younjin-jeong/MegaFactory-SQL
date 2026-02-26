"use client";

import { useQueryStore } from "@/stores/query-store";

interface EditorToolbarProps {
  onExecute: () => void;
  isRunning: boolean;
}

export function EditorToolbar({ onExecute, isRunning }: EditorToolbarProps) {
  const queryMode = useQueryStore((s) => s.queryMode);
  const setQueryMode = useQueryStore((s) => s.setQueryMode);

  return (
    <div
      className="flex items-center justify-between px-3 h-10 border-b"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onExecute}
          disabled={isRunning}
          className="px-3 py-1 text-xs font-medium rounded disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-bg-primary)",
          }}
        >
          {isRunning ? "Running..." : "Run (Ctrl+Enter)"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Engine:
        </span>
        <div
          className="flex rounded overflow-hidden text-xs"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <button
            className="px-2 py-1"
            style={{
              backgroundColor:
                queryMode === "local" ? "var(--color-accent)" : "var(--color-bg-tertiary)",
              color:
                queryMode === "local" ? "var(--color-bg-primary)" : "var(--color-text-muted)",
            }}
            onClick={() => setQueryMode("local")}
          >
            Local (DuckDB)
          </button>
          <button
            className="px-2 py-1"
            style={{
              backgroundColor:
                queryMode === "remote" ? "var(--color-accent)" : "var(--color-bg-tertiary)",
              color:
                queryMode === "remote" ? "var(--color-bg-primary)" : "var(--color-text-muted)",
            }}
            onClick={() => setQueryMode("remote")}
          >
            Remote (MegaDB)
          </button>
        </div>
      </div>
    </div>
  );
}
