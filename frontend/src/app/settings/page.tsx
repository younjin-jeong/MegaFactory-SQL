"use client";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
        Settings
      </h1>
      <div className="flex flex-col gap-3">
        {[
          { label: "Theme", value: "Dark" },
          { label: "Font Size", value: "14px" },
          { label: "Row Limit", value: "1000" },
          { label: "Auto-complete", value: "Enabled" },
        ].map((setting) => (
          <div
            key={setting.label}
            className="flex items-center justify-between rounded border px-4 py-3"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg-secondary)",
            }}
          >
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
              {setting.label}
            </span>
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {setting.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
