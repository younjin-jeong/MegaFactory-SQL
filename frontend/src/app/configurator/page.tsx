"use client";

export default function ConfiguratorPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
        Hardware Configurator
      </h1>
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Configure MegaDB K8s cluster hardware deployment.
      </p>
      <div className="rounded border p-4" style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
        minHeight: "400px",
      }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Cloud provider selection, GPU/FPGA/NPU accelerator config, CRD YAML generation (Phase 6)
        </p>
      </div>
    </div>
  );
}
