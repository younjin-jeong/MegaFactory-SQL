"use client";

export default function K8sDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
        Kubernetes Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {["Coordinator", "Worker-0", "Worker-1"].map((name) => (
          <div key={name} className="rounded border p-4" style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg-secondary)",
          }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
              {name}
            </h3>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Pod card placeholder (Phase 4)
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
