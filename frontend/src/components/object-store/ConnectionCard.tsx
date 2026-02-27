"use client";

import type { ObjectStoreConnection } from "@/types/object-store";
import { ProviderIcon } from "./ProviderIcon";

interface ConnectionCardProps {
  connection: ObjectStoreConnection;
  onEdit: () => void;
  onTest: () => void;
  onDelete: () => void;
}

function statusDotColor(status: ObjectStoreConnection["status"]): string {
  switch (status) {
    case "connected":
      return "var(--color-success)";
    case "error":
      return "var(--color-error)";
    case "disconnected":
    default:
      return "var(--color-text-muted)";
  }
}

function authMethodLabel(method: ObjectStoreConnection["auth_method"]): string {
  switch (method) {
    case "credentials":
      return "Credentials";
    case "iam":
      return "IAM Role";
    case "service_account":
      return "Service Account";
    default:
      return method;
  }
}

export function ConnectionCard({
  connection,
  onEdit,
  onTest,
  onDelete,
}: ConnectionCardProps) {
  const handleDelete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to remove the connection "${connection.name}"?`
    );
    if (confirmed) {
      onDelete();
    }
  };

  return (
    <div
      className="rounded-lg border p-4 flex flex-col gap-3"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}
    >
      {/* Header: Provider badge, name, status dot */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ProviderIcon provider={connection.provider} size="sm" />
          <h3
            className="text-sm font-semibold truncate"
            style={{ color: "var(--color-text-primary)" }}
            title={connection.name}
          >
            {connection.name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusDotColor(connection.status) }}
            title={connection.status}
          />
          <span
            className="text-[10px] capitalize"
            style={{ color: statusDotColor(connection.status) }}
          >
            {connection.status}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1">
        <DetailRow label="URL" value={connection.url} />
        {connection.region && (
          <DetailRow label="Region" value={connection.region} />
        )}
        {connection.endpoint && (
          <DetailRow label="Endpoint" value={connection.endpoint} />
        )}
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Auth:
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-bg-tertiary)",
              color: "var(--color-text-secondary)",
            }}
          >
            {authMethodLabel(connection.auth_method)}
          </span>
        </div>
      </div>

      {/* Last tested */}
      {connection.last_tested && (
        <div
          className="text-[10px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          Last tested: {new Date(connection.last_tested).toLocaleString()}
        </div>
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-2 pt-2 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <ActionButton label="Test" onClick={onTest} />
        <ActionButton label="Edit" onClick={onEdit} />
        <ActionButton
          label="Delete"
          onClick={handleDelete}
          color="var(--color-error)"
        />
      </div>
    </div>
  );
}

/* ---- Helper sub-components ---- */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="text-[10px] w-14 flex-shrink-0 text-right"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}:
      </span>
      <span
        className="text-xs font-mono truncate"
        style={{ color: "var(--color-text-secondary)" }}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  color,
}: {
  label: string;
  onClick: () => void;
  color?: string;
}) {
  const textColor = color ?? "var(--color-text-secondary)";
  return (
    <button
      onClick={onClick}
      className="flex-1 text-xs py-1.5 rounded border transition-colors cursor-pointer"
      style={{
        borderColor: color ?? "var(--color-border)",
        color: textColor,
        backgroundColor: "var(--color-bg-tertiary)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)";
      }}
    >
      {label}
    </button>
  );
}
