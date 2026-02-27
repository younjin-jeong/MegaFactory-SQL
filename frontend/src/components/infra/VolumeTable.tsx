"use client";

import type { VolumeInfo } from "@/types/k8s";

interface VolumeTableProps {
  volumes: VolumeInfo[];
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const idx = Math.min(i, units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function usagePercent(volume: VolumeInfo): number {
  if (volume.capacity_bytes <= 0) return 0;
  return (volume.used_bytes / volume.capacity_bytes) * 100;
}

function usageColor(percent: number): string {
  if (percent < 60) return "var(--color-success)";
  if (percent < 80) return "var(--color-warning)";
  return "var(--color-error)";
}

export function VolumeTable({ volumes }: VolumeTableProps) {
  if (volumes.length === 0) {
    return (
      <div
        className="text-sm py-8 text-center"
        style={{ color: "var(--color-text-muted)" }}
      >
        No volumes found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b text-left"
            style={{ borderColor: "var(--color-border)" }}
          >
            {["Name", "Access Mode", "Capacity", "Used", "Bound Pod"].map(
              (header) => (
                <th
                  key={header}
                  className="py-2 px-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {header}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {volumes.map((vol) => {
            const pct = usagePercent(vol);
            const barColor = usageColor(pct);
            return (
              <tr
                key={vol.name}
                className="border-b transition-colors"
                style={{ borderColor: "var(--color-border)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <td
                  className="py-2.5 px-3 font-mono text-xs"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {vol.name}
                </td>
                <td
                  className="py-2.5 px-3 text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {vol.access_mode}
                </td>
                <td
                  className="py-2.5 px-3 font-mono text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {formatBytes(vol.capacity_bytes)}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[80px]"
                      style={{ backgroundColor: "var(--color-bg-tertiary)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                    <span
                      className="font-mono text-xs whitespace-nowrap"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {formatBytes(vol.used_bytes)}
                    </span>
                  </div>
                </td>
                <td
                  className="py-2.5 px-3 font-mono text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {vol.bound_pod || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
