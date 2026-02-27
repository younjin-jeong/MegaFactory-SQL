"use client";

import type { K8sClusterEvent } from "@/types/k8s";

interface K8sEventFeedProps {
  events: K8sClusterEvent[];
}

function getEventBadgeColor(type: string): string {
  const t = type.toLowerCase();
  if (t === "normal") return "var(--color-success)";
  if (t === "warning") return "var(--color-warning)";
  return "var(--color-error)";
}

function getEventBadgeBg(type: string): string {
  const t = type.toLowerCase();
  if (t === "normal") return "rgba(158, 206, 106, 0.15)";
  if (t === "warning") return "rgba(224, 175, 104, 0.15)";
  return "rgba(247, 118, 142, 0.15)";
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (isNaN(then)) return timestamp;

  const diffMs = now - then;
  if (diffMs < 0) return "just now";

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function K8sEventFeed({ events }: K8sEventFeedProps) {
  if (!events || events.length === 0) {
    return (
      <div
        className="text-sm p-4"
        style={{ color: "var(--color-text-muted)" }}
      >
        No recent events.
      </div>
    );
  }

  return (
    <div
      className="overflow-y-auto"
      style={{ maxHeight: "300px" }}
    >
      <div className="flex flex-col gap-1 p-2">
        {events.map((event, idx) => (
          <div
            key={`${event.timestamp}-${event.reason}-${idx}`}
            className="flex items-start gap-3 rounded px-3 py-2"
            style={{
              backgroundColor: "var(--color-bg-tertiary)",
            }}
          >
            {/* Type badge */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 mt-0.5"
              style={{
                color: getEventBadgeColor(event.type),
                backgroundColor: getEventBadgeBg(event.type),
              }}
            >
              {event.type}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {event.reason}
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {event.involved_object}
                </span>
              </div>
              <p
                className="text-xs mt-0.5 break-words"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {event.message}
              </p>
            </div>

            {/* Timestamp */}
            <span
              className="text-[10px] flex-shrink-0 mt-0.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              {formatRelativeTime(event.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
