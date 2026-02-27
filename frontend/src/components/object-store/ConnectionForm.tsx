"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  ObjectStoreConnection,
  ObjectStoreProvider,
} from "@/types/object-store";
import { defaultObjectStoreConnection } from "@/types/object-store";
import { ProviderIcon } from "./ProviderIcon";

interface ConnectionFormProps {
  connection?: ObjectStoreConnection;
  onSave: (conn: ObjectStoreConnection) => void;
  onCancel: () => void;
}

const PROVIDERS: {
  value: ObjectStoreProvider;
  label: string;
}[] = [
  { value: "aws", label: "AWS S3" },
  { value: "gcp", label: "GCP" },
  { value: "azure", label: "Azure" },
  { value: "minio", label: "MinIO" },
  { value: "local", label: "Local" },
];

const URL_PLACEHOLDERS: Record<ObjectStoreProvider, string> = {
  aws: "s3://my-bucket/path",
  gcp: "gs://my-bucket/path",
  azure: "az://container/path",
  minio: "s3://my-bucket/path",
  local: "/data/local-store",
};

type AuthMethod = ObjectStoreConnection["auth_method"];

/** Which auth methods are available for each provider */
function availableAuthMethods(
  provider: ObjectStoreProvider
): { value: AuthMethod; label: string }[] {
  switch (provider) {
    case "aws":
      return [
        { value: "credentials", label: "Credentials" },
        { value: "iam", label: "IAM Role" },
      ];
    case "gcp":
      return [
        { value: "credentials", label: "Credentials" },
        { value: "service_account", label: "Service Account" },
      ];
    case "azure":
      return [{ value: "credentials", label: "Credentials" }];
    case "minio":
      return [{ value: "credentials", label: "Credentials" }];
    case "local":
      return [{ value: "credentials", label: "Credentials" }];
  }
}

/** Whether to show the Region field */
function showRegion(provider: ObjectStoreProvider): boolean {
  return provider === "aws" || provider === "gcp";
}

/** Whether to show the Endpoint field */
function showEndpoint(provider: ObjectStoreProvider): boolean {
  return provider === "minio" || provider === "aws" || provider === "gcp";
}

/** Whether Endpoint is required */
function endpointRequired(provider: ObjectStoreProvider): boolean {
  return provider === "minio";
}

/** Whether to show Storage Account (Azure) */
function showStorageAccount(provider: ObjectStoreProvider): boolean {
  return provider === "azure";
}

export function ConnectionForm({
  connection,
  onSave,
  onCancel,
}: ConnectionFormProps) {
  const [form, setForm] = useState<ObjectStoreConnection>(
    () => connection ?? defaultObjectStoreConnection()
  );

  // When provider changes, reset auth_method to first available option
  const handleProviderChange = useCallback(
    (provider: ObjectStoreProvider) => {
      const methods = availableAuthMethods(provider);
      const currentMethodAvailable = methods.some(
        (m) => m.value === form.auth_method
      );
      setForm((prev) => ({
        ...prev,
        provider,
        auth_method: currentMethodAvailable ? prev.auth_method : methods[0].value,
        // Clear fields not relevant to the new provider
        region: showRegion(provider) ? prev.region : undefined,
        endpoint: showEndpoint(provider) ? prev.endpoint : undefined,
        storage_account: showStorageAccount(provider)
          ? prev.storage_account
          : undefined,
        service_account_json:
          provider === "gcp" ? prev.service_account_json : undefined,
      }));
    },
    [form.auth_method]
  );

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      created_at: form.created_at || new Date().toISOString(),
    });
  };

  const updateField = <K extends keyof ObjectStoreConnection>(
    key: K,
    value: ObjectStoreConnection[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isEditing = !!connection;
  const authMethods = availableAuthMethods(form.provider);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Modal */}
      <div
        className="w-full max-w-lg rounded-lg border overflow-hidden"
        style={{
          backgroundColor: "var(--color-bg-primary)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2
            className="text-sm font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {isEditing ? "Edit Connection" : "New Object Store Connection"}
          </h2>
          <button
            onClick={onCancel}
            className="text-xs px-2 py-1 rounded cursor-pointer"
            style={{ color: "var(--color-text-muted)" }}
          >
            ESC
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Provider selector */}
          <fieldset>
            <legend
              className="text-xs font-medium mb-2 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Provider
            </legend>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleProviderChange(p.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs transition-colors cursor-pointer"
                  style={{
                    borderColor:
                      form.provider === p.value
                        ? "var(--color-accent)"
                        : "var(--color-border)",
                    backgroundColor:
                      form.provider === p.value
                        ? "var(--color-bg-tertiary)"
                        : "var(--color-bg-secondary)",
                    color:
                      form.provider === p.value
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                  }}
                >
                  <ProviderIcon provider={p.value} size="sm" />
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Name */}
          <FormField label="Connection Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="my-data-lake"
              required
              disabled={isEditing}
              className="w-full text-sm px-3 py-2 rounded border outline-none"
              style={{
                backgroundColor: "var(--color-bg-tertiary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
          </FormField>

          {/* URL / Bucket */}
          <FormField label="URL / Bucket" required>
            <input
              type="text"
              value={form.url}
              onChange={(e) => updateField("url", e.target.value)}
              placeholder={URL_PLACEHOLDERS[form.provider]}
              required
              className="w-full text-sm px-3 py-2 rounded border outline-none"
              style={{
                backgroundColor: "var(--color-bg-tertiary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
          </FormField>

          {/* Region (AWS, GCP) */}
          {showRegion(form.provider) && (
            <FormField label="Region">
              <input
                type="text"
                value={form.region ?? ""}
                onChange={(e) =>
                  updateField("region", e.target.value || undefined)
                }
                placeholder="us-east-1"
                className="w-full text-sm px-3 py-2 rounded border outline-none"
                style={{
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </FormField>
          )}

          {/* Endpoint (MinIO required, optional for AWS/GCP) */}
          {showEndpoint(form.provider) && (
            <FormField
              label="Endpoint"
              required={endpointRequired(form.provider)}
            >
              <input
                type="text"
                value={form.endpoint ?? ""}
                onChange={(e) =>
                  updateField("endpoint", e.target.value || undefined)
                }
                placeholder={
                  form.provider === "minio"
                    ? "http://minio.local:9000"
                    : "https://s3.amazonaws.com (optional)"
                }
                required={endpointRequired(form.provider)}
                className="w-full text-sm px-3 py-2 rounded border outline-none"
                style={{
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </FormField>
          )}

          {/* Storage Account (Azure) */}
          {showStorageAccount(form.provider) && (
            <FormField label="Storage Account" required>
              <input
                type="text"
                value={form.storage_account ?? ""}
                onChange={(e) =>
                  updateField("storage_account", e.target.value || undefined)
                }
                placeholder="mystorageaccount"
                required
                className="w-full text-sm px-3 py-2 rounded border outline-none"
                style={{
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </FormField>
          )}

          {/* Auth Method */}
          <fieldset>
            <legend
              className="text-xs font-medium mb-2 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Authentication Method
            </legend>
            <div className="flex gap-2">
              {authMethods.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => updateField("auth_method", m.value)}
                  className="px-3 py-1.5 rounded border text-xs transition-colors cursor-pointer"
                  style={{
                    borderColor:
                      form.auth_method === m.value
                        ? "var(--color-accent)"
                        : "var(--color-border)",
                    backgroundColor:
                      form.auth_method === m.value
                        ? "var(--color-bg-tertiary)"
                        : "var(--color-bg-secondary)",
                    color:
                      form.auth_method === m.value
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Auth-specific fields */}
          {form.auth_method === "credentials" && (
            <>
              <FormField label="Access Key">
                <input
                  type="text"
                  value={form.access_key ?? ""}
                  onChange={(e) =>
                    updateField("access_key", e.target.value || undefined)
                  }
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  className="w-full text-sm px-3 py-2 rounded border outline-none font-mono"
                  style={{
                    backgroundColor: "var(--color-bg-tertiary)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </FormField>
              <FormField label="Secret Key">
                <input
                  type="password"
                  value={form.secret_key ?? ""}
                  onChange={(e) =>
                    updateField("secret_key", e.target.value || undefined)
                  }
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  className="w-full text-sm px-3 py-2 rounded border outline-none font-mono"
                  style={{
                    backgroundColor: "var(--color-bg-tertiary)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </FormField>
            </>
          )}

          {form.auth_method === "iam" && (
            <div
              className="rounded border px-3 py-2 text-xs"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-bg-tertiary)",
                color: "var(--color-text-muted)",
              }}
            >
              The pod IAM role will be used for authentication. Ensure the
              appropriate role is attached to the MegaDB service account.
            </div>
          )}

          {form.auth_method === "service_account" && (
            <FormField label="Service Account JSON">
              <textarea
                value={form.service_account_json ?? ""}
                onChange={(e) =>
                  updateField(
                    "service_account_json",
                    e.target.value || undefined
                  )
                }
                placeholder='{"type":"service_account","project_id":"...","private_key_id":"..."}'
                rows={4}
                className="w-full text-sm px-3 py-2 rounded border outline-none font-mono resize-y"
                style={{
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </FormField>
          )}

          {/* Action buttons */}
          <div
            className="flex items-center justify-end gap-2 pt-3 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            <button
              type="button"
              onClick={onCancel}
              className="text-sm px-4 py-2 rounded border transition-colors cursor-pointer"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
                backgroundColor: "var(--color-bg-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-bg-secondary)";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm px-4 py-2 rounded border transition-colors cursor-pointer font-medium"
              style={{
                borderColor: "var(--color-accent)",
                color: "var(--color-bg-primary)",
                backgroundColor: "var(--color-accent)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-accent-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-accent)";
              }}
            >
              {isEditing ? "Save Changes" : "Add Connection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---- Helper sub-component ---- */

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-xs font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--color-error)" }}> *</span>
        )}
      </span>
      {children}
    </label>
  );
}
