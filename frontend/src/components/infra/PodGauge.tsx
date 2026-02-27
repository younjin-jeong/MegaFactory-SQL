"use client";

interface PodGaugeProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

function getAutoColor(percent: number): string {
  if (percent < 60) return "var(--color-success)";
  if (percent < 80) return "var(--color-warning)";
  return "var(--color-error)";
}

export function PodGauge({ label, value, max = 100, color }: PodGaugeProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = color ?? getAutoColor(percent);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-medium"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </span>
        <span
          className="text-[11px] font-mono tabular-nums"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {percent.toFixed(1)}%
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-tertiary)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percent}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}
