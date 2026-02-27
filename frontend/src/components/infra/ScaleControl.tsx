"use client";

interface ScaleControlProps {
  currentReplicas: number;
  onScale: (replicas: number) => void;
  isScaling?: boolean;
}

const MIN_REPLICAS = 1;
const MAX_REPLICAS = 32;

export function ScaleControl({
  currentReplicas,
  onScale,
  isScaling = false,
}: ScaleControlProps) {
  const canDecrement = !isScaling && currentReplicas > MIN_REPLICAS;
  const canIncrement = !isScaling && currentReplicas < MAX_REPLICAS;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onScale(currentReplicas - 1)}
        disabled={!canDecrement}
        className="flex items-center justify-center w-7 h-7 rounded border text-sm font-bold transition-colors"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: canDecrement
            ? "var(--color-bg-tertiary)"
            : "var(--color-bg-secondary)",
          color: canDecrement
            ? "var(--color-text-primary)"
            : "var(--color-text-muted)",
          cursor: canDecrement ? "pointer" : "not-allowed",
          opacity: canDecrement ? 1 : 0.5,
        }}
        title="Decrease replicas"
      >
        -
      </button>

      <span
        className="text-sm font-mono tabular-nums min-w-[2ch] text-center"
        style={{ color: "var(--color-text-primary)" }}
      >
        {currentReplicas}
      </span>

      <button
        onClick={() => onScale(currentReplicas + 1)}
        disabled={!canIncrement}
        className="flex items-center justify-center w-7 h-7 rounded border text-sm font-bold transition-colors"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: canIncrement
            ? "var(--color-bg-tertiary)"
            : "var(--color-bg-secondary)",
          color: canIncrement
            ? "var(--color-text-primary)"
            : "var(--color-text-muted)",
          cursor: canIncrement ? "pointer" : "not-allowed",
          opacity: canIncrement ? 1 : 0.5,
        }}
        title="Increase replicas"
      >
        +
      </button>

      {isScaling && (
        <span
          className="text-xs ml-1 animate-pulse"
          style={{ color: "var(--color-warning)" }}
        >
          Scaling...
        </span>
      )}
    </div>
  );
}
