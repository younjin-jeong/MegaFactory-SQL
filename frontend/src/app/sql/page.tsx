"use client";

export default function SqlEditorPage() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
          SQL Editor
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded" style={{
            backgroundColor: "var(--color-bg-tertiary)",
            color: "var(--color-accent)",
          }}>
            Local (DuckDB)
          </span>
        </div>
      </div>
      <div className="flex-1 rounded border" style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
        minHeight: "200px",
      }}>
        <div className="p-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Monaco Editor will be integrated here (Phase 2)
        </div>
      </div>
      <div className="rounded border" style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
        minHeight: "200px",
      }}>
        <div className="p-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Query results will appear here (Phase 2)
        </div>
      </div>
    </div>
  );
}
