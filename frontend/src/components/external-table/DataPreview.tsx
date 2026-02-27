"use client";

import { useEffect } from "react";
import { useMegaDBQuery } from "@/lib/api/megadb";
import { ResultTable } from "@/components/query/ResultTable";

interface DataPreviewProps {
  tableName: string;
  onClose: () => void;
}

export function DataPreview({ tableName, onClose }: DataPreviewProps) {
  const megadbQuery = useMegaDBQuery();

  // Execute preview query on mount
  useEffect(() => {
    megadbQuery.mutate({
      sql: `SELECT * FROM ${escapeIdentifier(tableName)} LIMIT 100`,
      database: "megadb",
    });
    // Run only when tableName changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName]);

  return (
    <div
      className="flex flex-col border-t"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
        height: "360px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Data Preview
          </span>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-bg-tertiary)",
              color: "var(--color-accent)",
            }}
          >
            {tableName}
          </span>
          <span
            className="text-[10px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            (LIMIT 100)
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 rounded border transition-colors cursor-pointer"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
            backgroundColor: "var(--color-bg-tertiary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)";
          }}
        >
          Close
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {megadbQuery.isPending && (
          <div
            className="flex items-center justify-center h-full text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-lg font-mono animate-pulse">...</span>
              <span className="text-xs">
                Querying {tableName}...
              </span>
            </div>
          </div>
        )}

        {megadbQuery.isError && (
          <div className="p-4">
            <div
              className="text-sm font-bold mb-2"
              style={{ color: "var(--color-error)" }}
            >
              Query Failed
            </div>
            <pre
              className="text-xs p-3 rounded overflow-auto"
              style={{
                backgroundColor: "var(--color-bg-tertiary)",
                color: "var(--color-error)",
              }}
            >
              {megadbQuery.error?.message ?? "Unknown error occurred"}
            </pre>
          </div>
        )}

        {megadbQuery.isSuccess && (
          <ResultTable result={megadbQuery.data} />
        )}

        {megadbQuery.isIdle && (
          <div
            className="flex items-center justify-center h-full text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Preparing preview query...
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function escapeIdentifier(name: string): string {
  if (/^[a-z_][a-z0-9_]*$/i.test(name)) return name;
  return `"${name.replace(/"/g, '""')}"`;
}
