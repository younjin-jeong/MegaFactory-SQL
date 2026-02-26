"use client";

export default function MonitoringPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
        Monitoring
      </h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {["QPS", "Avg Latency", "P95 Latency", "Active Sessions"].map((metric) => (
          <div key={metric} className="rounded border p-4 text-center" style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg-secondary)",
          }}>
            <div className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>--</div>
            <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              {metric}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded border p-4" style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
        minHeight: "300px",
      }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Charts will render here (Phase 5)
        </p>
      </div>
    </div>
  );
}
