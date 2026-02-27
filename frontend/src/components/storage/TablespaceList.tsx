"use client";

import type { StorageTier } from "@/types/storage-tier";
import type { TablespaceConfig } from "@/types/storage-tier";

interface TablespaceListProps {
  tablespaces: TablespaceConfig[];
}

const tierColors: Record<StorageTier, string> = {
  MEMORY: "var(--color-accent)",
  OLTP: "var(--color-success)",
  OLAP: "var(--color-warning)",
};

const tierOrder: StorageTier[] = ["MEMORY", "OLTP", "OLAP"];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

function UsageBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color =
    pct > 90
      ? "var(--color-error)"
      : pct > 70
        ? "var(--color-warning)"
        : "var(--color-success)";

  return (
    <div className="flex items-center gap-2 w-full max-w-xs">
      <div
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
        {formatBytes(used)} / {formatBytes(total)}
      </span>
    </div>
  );
}

export default function TablespaceList({ tablespaces }: TablespaceListProps) {
  if (tablespaces.length === 0) {
    return (
      <div
        className="rounded border p-6 text-center"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg-secondary)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No tablespace information available
        </p>
      </div>
    );
  }

  const grouped = tierOrder
    .map((tier) => ({
      tier,
      items: tablespaces.filter((ts) => ts.tier === tier),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {grouped.map(({ tier, items }) => (
        <div key={tier}>
          <h3
            className="text-sm font-bold mb-2 flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: tierColors[tier] }}
            />
            {tier} Tablespaces
          </h3>
          <div className="flex flex-col gap-2">
            {items.map((ts) => (
              <div
                key={ts.name}
                className="rounded border p-3"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-bg-secondary)",
                }}
              >
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span
                    className="font-medium text-sm"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {ts.name}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: tierColors[ts.tier],
                      color: "var(--color-bg-primary)",
                    }}
                  >
                    {ts.tier}
                  </span>
                  {ts.location && (
                    <span
                      className="text-xs font-mono"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {ts.location}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Replication: {ts.replication_factor}x
                  </span>
                </div>
                {ts.total_size_bytes != null && ts.total_size_bytes > 0 && (
                  <UsageBar
                    used={ts.used_size_bytes ?? 0}
                    total={ts.total_size_bytes}
                  />
                )}
                {ts.tables.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ts.tables.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--color-bg-tertiary)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
