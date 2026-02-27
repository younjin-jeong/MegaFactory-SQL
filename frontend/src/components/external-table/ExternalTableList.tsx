"use client";

import type { ExternalTableInfo } from "@/types/object-store";

interface ExternalTableListProps {
  tables: ExternalTableInfo[];
  onPreview: (tableName: string) => void;
  onDrop: (tableName: string) => void;
  onViewSchema: (table: ExternalTableInfo) => void;
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

function formatBytes(bytes?: number): string {
  if (bytes == null || bytes === 0) return "--";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx++;
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function formatRowCount(count?: number): string {
  if (count == null) return "--";
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString();
}

function formatBadgeColor(format: ExternalTableInfo["format"]): {
  bg: string;
  text: string;
} {
  switch (format) {
    case "parquet":
      return { bg: "rgba(122, 162, 247, 0.15)", text: "var(--color-accent)" };
    case "csv":
      return {
        bg: "rgba(158, 206, 106, 0.15)",
        text: "var(--color-success)",
      };
    case "json":
      return {
        bg: "rgba(224, 175, 104, 0.15)",
        text: "var(--color-warning)",
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function ExternalTableList({
  tables,
  onPreview,
  onDrop,
  onViewSchema,
}: ExternalTableListProps) {
  if (tables.length === 0) {
    return (
      <div
        className="rounded-lg border p-8 text-center"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg-secondary)",
        }}
      >
        <div
          className="text-3xl mb-3 font-mono"
          style={{ color: "var(--color-text-muted)" }}
        >
          {"{ }"}
        </div>
        <h2
          className="text-sm font-semibold mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          No external tables configured
        </h2>
        <p
          className="text-xs max-w-md mx-auto"
          style={{ color: "var(--color-text-muted)" }}
        >
          Create an external table to query Parquet, CSV, or JSON files stored
          in your connected object stores directly from MegaDB.
        </p>
      </div>
    );
  }

  const handleDrop = (tableName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to drop the external table "${tableName}"? This action cannot be undone.`
    );
    if (confirmed) {
      onDrop(tableName);
    }
  };

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{
                backgroundColor: "var(--color-bg-tertiary)",
                borderColor: "var(--color-border)",
              }}
            >
              <Th>Name</Th>
              <Th>Connection</Th>
              <Th>Location</Th>
              <Th>Format</Th>
              <Th>Schema Mode</Th>
              <Th align="right">Est. Rows</Th>
              <Th align="right">Est. Size</Th>
              <Th align="center">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => {
              const badge = formatBadgeColor(table.format);
              return (
                <tr
                  key={table.name}
                  className="border-t"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <td
                    className="px-3 py-2.5 font-medium font-mono text-xs"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {table.name}
                  </td>
                  <td
                    className="px-3 py-2.5 text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {table.connection_name}
                  </td>
                  <td
                    className="px-3 py-2.5 text-xs font-mono truncate max-w-xs"
                    style={{ color: "var(--color-text-muted)" }}
                    title={table.location}
                  >
                    {table.location}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.text,
                      }}
                    >
                      {table.format}
                    </span>
                  </td>
                  <td
                    className="px-3 py-2.5 text-xs capitalize"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {table.schema_mode}
                  </td>
                  <td
                    className="px-3 py-2.5 text-xs text-right font-mono"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {formatRowCount(table.estimated_row_count)}
                  </td>
                  <td
                    className="px-3 py-2.5 text-xs text-right font-mono"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {formatBytes(table.estimated_size_bytes)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <ActionBtn
                        label="Preview"
                        onClick={() => onPreview(table.name)}
                      />
                      <ActionBtn
                        label="Schema"
                        onClick={() => onViewSchema(table)}
                      />
                      <ActionBtn
                        label="Drop"
                        onClick={() => handleDrop(table.name)}
                        color="var(--color-error)"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper sub-components                                               */
/* ------------------------------------------------------------------ */

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-${align}`}
      style={{ color: "var(--color-text-muted)" }}
    >
      {children}
    </th>
  );
}

function ActionBtn({
  label,
  onClick,
  color,
}: {
  label: string;
  onClick: () => void;
  color?: string;
}) {
  const textColor = color ?? "var(--color-text-secondary)";
  return (
    <button
      onClick={onClick}
      className="text-[10px] px-2 py-1 rounded border transition-colors cursor-pointer"
      style={{
        borderColor: color ?? "var(--color-border)",
        color: textColor,
        backgroundColor: "var(--color-bg-tertiary)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)";
      }}
    >
      {label}
    </button>
  );
}
