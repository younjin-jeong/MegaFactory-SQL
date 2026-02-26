"use client";

export default function ConnectionsPage() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
        Connections
      </h1>
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Manage MegaDB instance connections.
      </p>
      <div className="rounded border p-4" style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Connection manager with add/edit/delete (Phase 7)
        </p>
      </div>
    </div>
  );
}
