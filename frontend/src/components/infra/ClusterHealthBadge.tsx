"use client";

interface ClusterHealthBadgeProps {
  phase: string;
  isConnected: boolean;
  readyReplicas: number;
  totalReplicas: number;
}

function getBadgeColor(
  isConnected: boolean,
  readyReplicas: number,
  totalReplicas: number,
): string {
  if (!isConnected) return "var(--color-error)";
  if (totalReplicas > 0 && readyReplicas === totalReplicas) return "var(--color-success)";
  if (readyReplicas > 0) return "var(--color-warning)";
  return "var(--color-error)";
}

function getStatusText(
  isConnected: boolean,
  phase: string,
): string {
  if (!isConnected) return "Disconnected";
  return phase || "Connected";
}

export function ClusterHealthBadge({
  phase,
  isConnected,
  readyReplicas,
  totalReplicas,
}: ClusterHealthBadgeProps) {
  const dotColor = getBadgeColor(isConnected, readyReplicas, totalReplicas);
  const statusText = getStatusText(isConnected, phase);

  return (
    <div className="flex items-center gap-2">
      {/* Colored dot */}
      <span
        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      {/* Status text */}
      <span
        className="text-sm font-medium"
        style={{ color: "var(--color-text-primary)" }}
      >
        {statusText}
      </span>
      {/* Replica count */}
      {totalReplicas > 0 && (
        <span
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {readyReplicas}/{totalReplicas} replicas
        </span>
      )}
    </div>
  );
}
