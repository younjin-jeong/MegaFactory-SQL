"use client";

import type { ObjectStoreProvider } from "@/types/object-store";

interface ProviderIconProps {
  provider: ObjectStoreProvider;
  size?: "sm" | "md";
}

const providerConfig: Record<
  ObjectStoreProvider,
  { label: string; bg: string; fg: string }
> = {
  aws: { label: "S3", bg: "#d97706", fg: "#fff" },
  gcp: { label: "GCS", bg: "#3b82f6", fg: "#fff" },
  azure: { label: "AZ", bg: "#0891b2", fg: "#fff" },
  minio: { label: "MIO", bg: "#6b7280", fg: "#fff" },
  local: { label: "LOC", bg: "#16a34a", fg: "#fff" },
};

export function ProviderIcon({ provider, size = "sm" }: ProviderIconProps) {
  const config = providerConfig[provider];
  const isMd = size === "md";

  return (
    <span
      className={`inline-flex items-center justify-center font-bold font-mono uppercase rounded-full select-none ${
        isMd ? "text-xs px-2.5 py-1" : "text-[10px] px-2 py-0.5"
      }`}
      style={{
        backgroundColor: config.bg,
        color: config.fg,
        lineHeight: 1,
      }}
    >
      {config.label}
    </span>
  );
}
