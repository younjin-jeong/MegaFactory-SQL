"use client";

import type { PodInfo } from "@/types/k8s";
import { podAgeDisplay } from "@/types/k8s";
import { PodGauge } from "./PodGauge";

interface PodCardProps {
  pod: PodInfo;
  onRestart?: (name: string) => void;
  onViewLogs?: (name: string) => void;
}

function roleBadgeColor(role: string): string {
  switch (role.toLowerCase()) {
    case "coordinator":
      return "var(--color-accent)";
    case "worker":
      return "var(--color-success)";
    default:
      return "var(--color-text-muted)";
  }
}

function statusBadgeColor(status: string): string {
  switch (status.toLowerCase()) {
    case "running":
      return "var(--color-success)";
    case "pending":
      return "var(--color-warning)";
    case "failed":
    case "crashloopbackoff":
      return "var(--color-error)";
    default:
      return "var(--color-text-muted)";
  }
}

function memoryPercent(pod: PodInfo): number {
  if (pod.memory_limit_bytes <= 0) return 0;
  return (pod.memory_bytes / pod.memory_limit_bytes) * 100;
}

export function PodCard({ pod, onRestart, onViewLogs }: PodCardProps) {
  const handleRestart = () => {
    if (!onRestart) return;
    const confirmed = window.confirm(
      `Are you sure you want to restart pod "${pod.name}"?`
    );
    if (confirmed) {
      onRestart(pod.name);
    }
  };

  return (
    <div
      className="rounded-lg border p-4 flex flex-col gap-3"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}
    >
      {/* Header: Pod name + badges */}
      <div className="flex items-start justify-between gap-2">
        <h3
          className="text-sm font-semibold truncate flex-1"
          style={{ color: "var(--color-text-primary)" }}
          title={pod.name}
        >
          {pod.name}
        </h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Role badge */}
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              color: roleBadgeColor(pod.role),
              backgroundColor: "var(--color-bg-tertiary)",
              border: `1px solid ${roleBadgeColor(pod.role)}`,
            }}
          >
            {pod.role}
          </span>
          {/* Status badge */}
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              color: statusBadgeColor(pod.status),
              backgroundColor: "var(--color-bg-tertiary)",
              border: `1px solid ${statusBadgeColor(pod.status)}`,
            }}
          >
            {pod.status}
          </span>
        </div>
      </div>

      {/* Gauges row */}
      <div className="grid grid-cols-3 gap-3">
        <PodGauge label="CPU" value={pod.cpu_usage_percent} />
        <PodGauge label="Memory" value={memoryPercent(pod)} />
        <PodGauge label="Disk" value={pod.disk_usage_percent} />
      </div>

      {/* Info row */}
      <div
        className="flex items-center justify-between text-[11px]"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span>
          Restarts:{" "}
          <span
            className="font-mono"
            style={{
              color:
                pod.restart_count > 0
                  ? "var(--color-warning)"
                  : "var(--color-text-secondary)",
            }}
          >
            {pod.restart_count}
          </span>
        </span>
        <span>
          Age:{" "}
          <span
            className="font-mono"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {podAgeDisplay(pod)}
          </span>
        </span>
      </div>

      {/* Actions row */}
      <div
        className="flex items-center gap-2 pt-2 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          onClick={() => onViewLogs?.(pod.name)}
          className="flex-1 text-xs py-1.5 rounded border transition-colors"
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
          Logs
        </button>
        <button
          onClick={handleRestart}
          className="flex-1 text-xs py-1.5 rounded border transition-colors"
          style={{
            borderColor: "var(--color-error)",
            color: "var(--color-error)",
            backgroundColor: "var(--color-bg-tertiary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)";
          }}
        >
          Restart
        </button>
      </div>
    </div>
  );
}
