"use client";

export default function ConfiguratorPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1
        className="text-xl font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        Hardware Configurator
      </h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        Configure MegaDB K8s cluster hardware deployment. Cloud provider
        selection, GPU/FPGA/NPU accelerator config, and CRD YAML generation.
        Coming soon.
      </p>
    </div>
  );
}
