"use client";

export default function WorkbenchPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1
        className="text-xl font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        Algorithm Workbench
      </h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        Analyze query execution plans and get hardware acceleration
        recommendations. Coming soon.
      </p>
    </div>
  );
}
