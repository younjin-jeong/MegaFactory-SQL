"use client";

import { useState, useMemo } from "react";
import type { TableInfo } from "@/types/schema";
import type { StorageTier } from "@/types/storage-tier";

interface TableEngineTableProps {
  tables: TableInfo[];
  filterTier?: StorageTier | null;
}

type SortKey = "name" | "schema_name" | "engine" | "row_count" | "size_bytes";
type SortDir = "asc" | "desc";

const tierColors: Record<string, string> = {
  MEMORY: "var(--color-accent)",
  OLTP: "var(--color-success)",
  OLAP: "var(--color-warning)",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

function formatRowCount(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B rows`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M rows`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K rows`;
  return `${count} rows`;
}

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <span className="ml-1 opacity-30" style={{ color: "var(--color-text-muted)" }}>
        &#x25B4;&#x25BE;
      </span>
    );
  }
  return (
    <span className="ml-1" style={{ color: "var(--color-accent)" }}>
      {dir === "asc" ? "\u25B4" : "\u25BE"}
    </span>
  );
}

export default function TableEngineTable({
  tables,
  filterTier,
}: TableEngineTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = tables;
    if (filterTier) {
      result = result.filter(
        (t) => t.engine.toUpperCase() === filterTier
      );
    }
    return result;
  }, [tables, filterTier]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return dir * a.name.localeCompare(b.name);
        case "schema_name":
          return dir * a.schema_name.localeCompare(b.schema_name);
        case "engine":
          return dir * a.engine.localeCompare(b.engine);
        case "row_count":
          return dir * ((a.row_count ?? 0) - (b.row_count ?? 0));
        case "size_bytes":
          return dir * ((a.size_bytes ?? 0) - (b.size_bytes ?? 0));
        default:
          return 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "schema_name", label: "Schema" },
    { key: "engine", label: "Engine" },
    { key: "row_count", label: "Row Count" },
    { key: "size_bytes", label: "Size" },
  ];

  if (sorted.length === 0) {
    return (
      <div
        className="rounded border p-6 text-center"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg-secondary)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {filterTier
            ? `No tables found with engine ${filterTier}`
            : "No tables available"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded border overflow-x-auto"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            style={{
              borderBottomWidth: "1px",
              borderColor: "var(--color-border)",
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-2 cursor-pointer select-none whitespace-nowrap"
                style={{ color: "var(--color-text-secondary)" }}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                <SortArrow active={sortKey === col.key} dir={sortDir} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((table, idx) => {
            const engineUpper = table.engine.toUpperCase();
            const badgeColor = tierColors[engineUpper] ?? "var(--color-text-muted)";

            return (
              <tr
                key={`${table.schema_name}.${table.name}-${idx}`}
                className="transition-colors"
                style={{
                  borderBottomWidth: "1px",
                  borderColor: "var(--color-border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <td
                  className="px-4 py-2 font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {table.name}
                </td>
                <td
                  className="px-4 py-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {table.schema_name}
                </td>
                <td className="px-4 py-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{
                      backgroundColor: badgeColor,
                      color: "var(--color-bg-primary)",
                    }}
                  >
                    {engineUpper}
                  </span>
                </td>
                <td
                  className="px-4 py-2 text-right tabular-nums"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {table.row_count != null ? formatRowCount(table.row_count) : "--"}
                </td>
                <td
                  className="px-4 py-2 text-right tabular-nums"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {table.size_bytes != null ? formatBytes(table.size_bytes) : "--"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
