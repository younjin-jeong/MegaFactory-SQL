"use client";

export default function MonitoringPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1
        className="text-xl font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        Monitoring
      </h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        Real-time cluster metrics and query performance monitoring. Coming soon.
      </p>
    </div>
  );
}
