"use client";

export default function WorkbenchPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
        Algorithm Workbench
      </h1>
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Analyze query execution plans and get hardware acceleration recommendations.
      </p>
      <div className="rounded border p-4" style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
        minHeight: "400px",
      }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          EXPLAIN analysis, operator classification, strategy comparison (Phase 6)
        </p>
      </div>
    </div>
  );
}
