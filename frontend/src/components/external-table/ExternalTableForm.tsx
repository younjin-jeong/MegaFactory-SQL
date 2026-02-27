"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { ObjectStoreConnection } from "@/types/object-store";
import type { ExternalTableInfo } from "@/types/object-store";
import type { ColumnInfo, PartitionInfo } from "@/types/schema";

interface ExternalTableFormProps {
  connections: ObjectStoreConnection[];
  onSave: (table: ExternalTableInfo) => void;
  onCancel: () => void;
}

type Format = ExternalTableInfo["format"];
type SchemaMode = ExternalTableInfo["schema_mode"];

const TRANSFORMS = ["identity", "year", "month", "day", "hour"] as const;

/* ------------------------------------------------------------------ */
/*  SQL generation helpers                                              */
/* ------------------------------------------------------------------ */

function escapeIdentifier(name: string): string {
  // Double-quote identifiers that contain special chars or are keywords
  if (/^[a-z_][a-z0-9_]*$/i.test(name)) return name;
  return `"${name.replace(/"/g, '""')}"`;
}

function escapeSqlString(val: string): string {
  return val.replace(/'/g, "''");
}

function generateSQL(
  tableName: string,
  connectionName: string,
  location: string,
  format: Format,
  schemaMode: SchemaMode,
  columns: ColumnInfo[],
  partitions: PartitionInfo[]
): string {
  const parts: string[] = [];

  parts.push(`CREATE EXTERNAL TABLE ${escapeIdentifier(tableName)}`);

  // Column definitions (only when schema is explicit and columns are defined)
  if (schemaMode === "explicit" && columns.length > 0) {
    const colDefs = columns.map((col) => {
      const nullable = col.nullable ? "" : " NOT NULL";
      return `  ${escapeIdentifier(col.name)} ${col.data_type.toUpperCase()}${nullable}`;
    });
    parts.push(`(\n${colDefs.join(",\n")}\n)`);
  }

  parts.push(
    `LOCATION '${escapeSqlString(connectionName)}://${escapeSqlString(location)}'`
  );
  parts.push(`FORMAT ${format.toUpperCase()}`);

  if (partitions.length > 0) {
    const specs = partitions.map((p) => {
      if (p.transform === "identity") return escapeIdentifier(p.column);
      return `${p.transform}(${escapeIdentifier(p.column)})`;
    });
    parts.push(`PARTITION BY (${specs.join(", ")})`);
  }

  return parts.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function ExternalTableForm({
  connections,
  onSave,
  onCancel,
}: ExternalTableFormProps) {
  const [tableName, setTableName] = useState("");
  const [connectionName, setConnectionName] = useState(
    connections.length > 0 ? connections[0].name : ""
  );
  const [location, setLocation] = useState("");
  const [format, setFormat] = useState<Format>("parquet");
  const [schemaMode, setSchemaMode] = useState<SchemaMode>("infer");
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [partitions, setPartitions] = useState<PartitionInfo[]>([]);

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  // Selected connection object for URL preview
  const selectedConnection = connections.find(
    (c) => c.name === connectionName
  );

  // Generated SQL preview
  const sqlPreview = useMemo(
    () =>
      generateSQL(
        tableName || "table_name",
        connectionName || "connection",
        location || "path/*.parquet",
        format,
        schemaMode,
        columns,
        partitions
      ),
    [tableName, connectionName, location, format, schemaMode, columns, partitions]
  );

  /* ---------- Column management ---------- */

  const addColumn = useCallback(() => {
    setColumns((prev) => [
      ...prev,
      { name: "", data_type: "VARCHAR", nullable: true },
    ]);
  }, []);

  const removeColumn = useCallback((index: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateColumn = useCallback(
    (index: number, field: keyof ColumnInfo, value: string | boolean) => {
      setColumns((prev) =>
        prev.map((col, i) => (i === index ? { ...col, [field]: value } : col))
      );
    },
    []
  );

  /* ---------- Partition management ---------- */

  const addPartition = useCallback(() => {
    setPartitions((prev) => [...prev, { column: "", transform: "identity" }]);
  }, []);

  const removePartition = useCallback((index: number) => {
    setPartitions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePartition = useCallback(
    (index: number, field: keyof PartitionInfo, value: string) => {
      setPartitions((prev) =>
        prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
      );
    },
    []
  );

  /* ---------- Form submit ---------- */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: tableName,
      connection_name: connectionName,
      location,
      format,
      schema_mode: schemaMode,
      columns: schemaMode === "explicit" ? columns : [],
      partitions,
    });
  };

  const noConnections = connections.length === 0;

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
        className="w-full max-w-2xl rounded-lg border overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: "var(--color-bg-primary)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2
            className="text-sm font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Create External Table
          </h2>
          <button
            onClick={onCancel}
            className="text-xs px-2 py-1 rounded cursor-pointer"
            style={{ color: "var(--color-text-muted)" }}
          >
            ESC
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1">
          <form
            id="external-table-form"
            onSubmit={handleSubmit}
            className="px-5 py-4 flex flex-col gap-4"
          >
            {/* No connections warning */}
            {noConnections && (
              <div
                className="rounded border px-4 py-3"
                style={{
                  borderColor: "var(--color-warning)",
                  backgroundColor: "rgba(224, 175, 104, 0.1)",
                }}
              >
                <p
                  className="text-xs font-medium"
                  style={{ color: "var(--color-warning)" }}
                >
                  No object store connections available
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Configure an object store connection first in the Object
                  Stores page before creating an external table.
                </p>
              </div>
            )}

            {/* Connection selector */}
            <FormField label="Connection" required>
              <select
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                disabled={noConnections}
                required
                className="w-full text-sm px-3 py-2 rounded border outline-none"
                style={{
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              >
                {noConnections && (
                  <option value="">No connections available</option>
                )}
                {connections.map((conn) => (
                  <option key={conn.name} value={conn.name}>
                    {conn.name} ({conn.provider})
                  </option>
                ))}
              </select>
            </FormField>

            {/* Table name */}
            <FormField label="Table Name" required>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="external_sales_data"
                required
                className="w-full text-sm px-3 py-2 rounded border outline-none font-mono"
                style={{
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </FormField>

            {/* Location path */}
            <FormField label="Location Path" required>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="data/*.parquet"
                required
                className="w-full text-sm px-3 py-2 rounded border outline-none font-mono"
                style={{
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
              {selectedConnection && location && (
                <p
                  className="text-[10px] mt-1 font-mono truncate"
                  style={{ color: "var(--color-text-muted)" }}
                  title={`${selectedConnection.url}/${location}`}
                >
                  Full URL: {selectedConnection.url}/{location}
                </p>
              )}
            </FormField>

            {/* Format */}
            <fieldset>
              <legend
                className="text-xs font-medium mb-2 block"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Format <span style={{ color: "var(--color-error)" }}>*</span>
              </legend>
              <div className="flex gap-2">
                {(["parquet", "csv", "json"] as Format[]).map((f) => (
                  <RadioButton
                    key={f}
                    label={f.toUpperCase()}
                    selected={format === f}
                    onClick={() => setFormat(f)}
                  />
                ))}
              </div>
            </fieldset>

            {/* Schema Mode */}
            <fieldset>
              <legend
                className="text-xs font-medium mb-2 block"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Schema Mode{" "}
                <span style={{ color: "var(--color-error)" }}>*</span>
              </legend>
              <div className="flex gap-2">
                <RadioButton
                  label="Infer from data"
                  selected={schemaMode === "infer"}
                  onClick={() => setSchemaMode("infer")}
                />
                <RadioButton
                  label="Define manually"
                  selected={schemaMode === "explicit"}
                  onClick={() => setSchemaMode("explicit")}
                />
              </div>
            </fieldset>

            {/* Manual column definitions */}
            {schemaMode === "explicit" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Column Definitions
                  </span>
                  <button
                    type="button"
                    onClick={addColumn}
                    className="text-[10px] px-2 py-1 rounded border transition-colors cursor-pointer"
                    style={{
                      borderColor: "var(--color-accent)",
                      color: "var(--color-accent)",
                      backgroundColor: "var(--color-bg-tertiary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-bg-tertiary)";
                    }}
                  >
                    + Add Column
                  </button>
                </div>
                {columns.length === 0 && (
                  <p
                    className="text-xs py-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    No columns defined. Click &quot;Add Column&quot; to start.
                  </p>
                )}
                {columns.map((col, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded border px-2 py-1.5"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-bg-tertiary)",
                    }}
                  >
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) =>
                        updateColumn(idx, "name", e.target.value)
                      }
                      placeholder="column_name"
                      className="flex-1 min-w-0 text-xs px-2 py-1 rounded border outline-none font-mono"
                      style={{
                        backgroundColor: "var(--color-bg-secondary)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                    <input
                      type="text"
                      value={col.data_type}
                      onChange={(e) =>
                        updateColumn(idx, "data_type", e.target.value)
                      }
                      placeholder="VARCHAR"
                      className="w-28 text-xs px-2 py-1 rounded border outline-none font-mono"
                      style={{
                        backgroundColor: "var(--color-bg-secondary)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                    <label
                      className="flex items-center gap-1 text-[10px] flex-shrink-0"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <input
                        type="checkbox"
                        checked={col.nullable}
                        onChange={(e) =>
                          updateColumn(idx, "nullable", e.target.checked)
                        }
                      />
                      Nullable
                    </label>
                    <button
                      type="button"
                      onClick={() => removeColumn(idx)}
                      className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer flex-shrink-0"
                      style={{ color: "var(--color-error)" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Partition spec */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Partition Spec{" "}
                  <span
                    className="font-normal"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    (optional)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={addPartition}
                  className="text-[10px] px-2 py-1 rounded border transition-colors cursor-pointer"
                  style={{
                    borderColor: "var(--color-accent)",
                    color: "var(--color-accent)",
                    backgroundColor: "var(--color-bg-tertiary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-bg-tertiary)";
                  }}
                >
                  + Add Partition
                </button>
              </div>
              {partitions.map((part, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded border px-2 py-1.5"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-bg-tertiary)",
                  }}
                >
                  <input
                    type="text"
                    value={part.column}
                    onChange={(e) =>
                      updatePartition(idx, "column", e.target.value)
                    }
                    placeholder="column_name"
                    className="flex-1 min-w-0 text-xs px-2 py-1 rounded border outline-none font-mono"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                  <select
                    value={part.transform}
                    onChange={(e) =>
                      updatePartition(idx, "transform", e.target.value)
                    }
                    className="text-xs px-2 py-1 rounded border outline-none"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {TRANSFORMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removePartition(idx)}
                    className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer flex-shrink-0"
                    style={{ color: "var(--color-error)" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* SQL Preview */}
            <div className="flex flex-col gap-1">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                SQL Preview
              </span>
              <textarea
                readOnly
                value={sqlPreview}
                rows={Math.min(sqlPreview.split("\n").length + 1, 10)}
                className="w-full text-xs px-3 py-2 rounded border outline-none font-mono resize-none"
                style={{
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              />
            </div>
          </form>
        </div>

        {/* Action buttons — fixed at bottom */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3 border-t flex-shrink-0"
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
              e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
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
            form="external-table-form"
            disabled={noConnections || !tableName || !location}
            className="text-sm px-4 py-2 rounded border transition-colors cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              borderColor: "var(--color-accent)",
              color: "var(--color-bg-primary)",
              backgroundColor: "var(--color-accent)",
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor =
                  "var(--color-accent-hover)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-accent)";
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper sub-components                                               */
/* ------------------------------------------------------------------ */

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

function RadioButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded border text-xs transition-colors cursor-pointer"
      style={{
        borderColor: selected
          ? "var(--color-accent)"
          : "var(--color-border)",
        backgroundColor: selected
          ? "var(--color-bg-tertiary)"
          : "var(--color-bg-secondary)",
        color: selected
          ? "var(--color-accent)"
          : "var(--color-text-secondary)",
      }}
    >
      {label}
    </button>
  );
}
