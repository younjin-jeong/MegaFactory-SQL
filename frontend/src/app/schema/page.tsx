"use client";

export default function SchemaBrowserPage() {
  return (
    <div className="flex gap-4 h-full">
      <div className="w-72 rounded border p-3" style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
          Schema Browser
        </h2>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Database/schema/table tree (Phase 3)
        </p>
      </div>
      <div className="flex-1 rounded border p-4" style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Select a table to view details
        </p>
      </div>
    </div>
  );
}
