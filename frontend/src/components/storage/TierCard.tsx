"use client";

import type { StorageTier } from "@/types/storage-tier";

interface TierCardProps {
  tier: StorageTier;
  tableCount: number;
  totalSizeBytes: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const tierColors: Record<StorageTier, string> = {
  MEMORY: "var(--color-accent)",
  OLTP: "var(--color-success)",
  OLAP: "var(--color-warning)",
};

const tierDescriptions: Record<StorageTier, string> = {
  MEMORY: "Arrow ring buffer (RAM)",
  OLTP: "Aurora-style WAL on NVMe",
  OLAP: "Iceberg + Parquet on object store",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

export default function TierCard({
  tier,
  tableCount,
  totalSizeBytes,
  isSelected = false,
  onClick,
}: TierCardProps) {
  const color = tierColors[tier];

  return (
    <div
      className="rounded border p-4 cursor-pointer transition-all"
      onClick={onClick}
      style={{
        borderColor: isSelected ? color : "var(--color-border)",
        borderLeftWidth: "4px",
        borderLeftColor: color,
        backgroundColor: isSelected
          ? "var(--color-bg-tertiary)"
          : "var(--color-bg-secondary)",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "var(--color-bg-secondary)";
        }
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-lg font-bold"
          style={{ color }}
        >
          {tier}
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
        {tierDescriptions[tier]}
      </p>
      <div className="flex items-center gap-4">
        <div>
          <div className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {tableCount}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Tables
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {formatBytes(totalSizeBytes)}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Total Size
          </div>
        </div>
      </div>
    </div>
  );
}
