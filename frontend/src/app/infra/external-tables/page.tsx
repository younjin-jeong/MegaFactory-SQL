"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useObjectStoreStore } from "@/stores/object-store-store";
import { useMegaDBQuery } from "@/lib/api/megadb";
import type { ExternalTableInfo } from "@/types/object-store";
import type { ColumnInfo, PartitionInfo } from "@/types/schema";
import { ExternalTableList } from "@/components/external-table/ExternalTableList";
import { ExternalTableForm } from "@/components/external-table/ExternalTableForm";
import { DataPreview } from "@/components/external-table/DataPreview";

/* ------------------------------------------------------------------ */
/*  SQL helpers                                                         */
/* ------------------------------------------------------------------ */

function escapeSqlString(val: string): string {
  return val.replace(/'/g, "''");
}

function escapeIdentifier(name: string): string {
  if (/^[a-z_][a-z0-9_]*$/i.test(name)) return name;
  return `"${name.replace(/"/g, '""')}"`;
}

function buildCreateSQL(table: ExternalTableInfo): string {
  const parts: string[] = [];
  parts.push(`CREATE EXTERNAL TABLE ${escapeIdentifier(table.name)}`);

  if (table.schema_mode === "explicit" && table.columns.length > 0) {
    const colDefs = table.columns.map((col) => {
      const nullable = col.nullable ? "" : " NOT NULL";
      return `  ${escapeIdentifier(col.name)} ${col.data_type.toUpperCase()}${nullable}`;
    });
    parts.push(`(\n${colDefs.join(",\n")}\n)`);
  }

  parts.push(
    `LOCATION '${escapeSqlString(table.connection_name)}://${escapeSqlString(table.location)}'`
  );
  parts.push(`FORMAT ${table.format.toUpperCase()}`);

  if (table.partitions.length > 0) {
    const specs = table.partitions.map((p) => {
      if (p.transform === "identity") return escapeIdentifier(p.column);
      return `${p.transform}(${escapeIdentifier(p.column)})`;
    });
    parts.push(`PARTITION BY (${specs.join(", ")})`);
  }

  return parts.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Row parser                                                          */
/* ------------------------------------------------------------------ */

interface QueryColumn {
  name: string;
  data_type: string;
  nullable: boolean;
}

function parseExternalTableRows(
  columns: QueryColumn[],
  rows: unknown[][]
): ExternalTableInfo[] {
  const colIndex = (name: string) =>
    columns.findIndex((c) => c.name.toLowerCase() === name.toLowerCase());

  const nameIdx = colIndex("name");
  const connectionNameIdx = colIndex("connection_name");
  const locationIdx = colIndex("location");
  const formatIdx = colIndex("format");
  const schemaModeIdx = colIndex("schema_mode");
  const columnsIdx = colIndex("columns");
  const partitionsIdx = colIndex("partitions");
  const estSizeIdx = colIndex("estimated_size_bytes");
  const estRowsIdx = colIndex("estimated_row_count");

  return rows.map((row) => {
    const get = (idx: number): string | undefined =>
      idx >= 0 && row[idx] != null ? String(row[idx]) : undefined;
    const getNum = (idx: number): number | undefined => {
      if (idx < 0 || row[idx] == null) return undefined;
      const n = Number(row[idx]);
      return isNaN(n) ? undefined : n;
    };

    let parsedColumns: ColumnInfo[] = [];
    const colsRaw = get(columnsIdx);
    if (colsRaw) {
      try {
        parsedColumns = JSON.parse(colsRaw);
      } catch {
        // ignore parse errors
      }
    }

    let parsedPartitions: PartitionInfo[] = [];
    const partsRaw = get(partitionsIdx);
    if (partsRaw) {
      try {
        parsedPartitions = JSON.parse(partsRaw);
      } catch {
        // ignore parse errors
      }
    }

    return {
      name: get(nameIdx) ?? "",
      connection_name: get(connectionNameIdx) ?? "",
      location: get(locationIdx) ?? "",
      format: (get(formatIdx) ?? "parquet") as ExternalTableInfo["format"],
      schema_mode: (get(schemaModeIdx) ?? "infer") as ExternalTableInfo["schema_mode"],
      columns: parsedColumns,
      partitions: parsedPartitions,
      estimated_size_bytes: getNum(estSizeIdx),
      estimated_row_count: getNum(estRowsIdx),
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function ExternalTablesPage() {
  const {
    connections,
    externalTables,
    setExternalTables,
    isLoading,
    setLoading,
  } = useObjectStoreStore();

  const megadbQuery = useMegaDBQuery();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewTableName, setPreviewTableName] = useState<string | null>(null);
  const [schemaTable, setSchemaTable] = useState<ExternalTableInfo | null>(null);
  const [filterConnection, setFilterConnection] = useState<string>("all");
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch external tables on mount
  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    megadbQuery.mutate(
      {
        sql: "SELECT * FROM megadb_table_info WHERE engine = 'EXTERNAL'",
        database: "megadb",
      },
      {
        onSuccess: (result) => {
          setLoading(false);
          if (result.error) {
            setFetchError(result.error);
            return;
          }
          if (result.columns.length === 0) return;
          try {
            const parsed = parseExternalTableRows(result.columns, result.rows);
            if (parsed.length > 0) {
              setExternalTables(parsed);
            }
          } catch {
            // MegaDB not available -- fall back to Zustand local cache
          }
        },
        onError: () => {
          setLoading(false);
          // MegaDB not available -- Zustand cache already has the data
        },
      }
    );
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Unique connection names for filter ---------- */

  const connectionNames = useMemo(() => {
    const names = new Set(externalTables.map((t) => t.connection_name));
    return Array.from(names).sort();
  }, [externalTables]);

  /* ---------- Filtered tables ---------- */

  const filteredTables = useMemo(() => {
    if (filterConnection === "all") return externalTables;
    return externalTables.filter(
      (t) => t.connection_name === filterConnection
    );
  }, [externalTables, filterConnection]);

  /* ---------- Handlers ---------- */

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const handleCreateCancel = () => {
    setShowCreateModal(false);
  };

  const handleCreateSave = useCallback(
    (table: ExternalTableInfo) => {
      // Optimistic local update
      setExternalTables([...externalTables, table]);
      setShowCreateModal(false);

      // Execute CREATE SQL
      const sql = buildCreateSQL(table);
      megadbQuery.mutate(
        { sql, database: "megadb" },
        {
          onSuccess: (result) => {
            if (result.error) {
              // Revert on error
              setExternalTables(
                externalTables.filter((t) => t.name !== table.name)
              );
            }
          },
          onError: () => {
            // Keep local cache regardless for offline use
          },
        }
      );
    },
    [externalTables, megadbQuery, setExternalTables]
  );

  const handleDrop = useCallback(
    (tableName: string) => {
      // Optimistic local removal
      const updated = externalTables.filter((t) => t.name !== tableName);
      setExternalTables(updated);

      // Execute DROP SQL
      const sql = `DROP TABLE ${escapeIdentifier(tableName)}`;
      megadbQuery.mutate(
        { sql, database: "megadb" },
        {
          onError: () => {
            // Best effort -- table is already removed locally
          },
        }
      );

      // Close preview if this table was being previewed
      if (previewTableName === tableName) {
        setPreviewTableName(null);
      }
    },
    [externalTables, megadbQuery, previewTableName, setExternalTables]
  );

  const handlePreview = useCallback((tableName: string) => {
    setPreviewTableName(tableName);
    setSchemaTable(null);
  }, []);

  const handleViewSchema = useCallback((table: ExternalTableInfo) => {
    setSchemaTable(table);
    setPreviewTableName(null);
  }, []);

  const handleClosePreview = () => {
    setPreviewTableName(null);
  };

  const handleCloseSchema = () => {
    setSchemaTable(null);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            External Tables
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            Query Parquet, CSV, and JSON files from connected object stores as
            external tables in MegaDB.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Connection filter */}
          {connectionNames.length > 0 && (
            <select
              value={filterConnection}
              onChange={(e) => setFilterConnection(e.target.value)}
              className="text-xs px-3 py-2 rounded border outline-none"
              style={{
                backgroundColor: "var(--color-bg-tertiary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              <option value="all">All Connections</option>
              {connectionNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleCreateClick}
            className="text-sm px-4 py-2 rounded border font-medium transition-colors cursor-pointer flex-shrink-0"
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
            + Create External Table
          </button>
        </div>
      </div>

      {/* Filter indicator */}
      {filterConnection !== "all" && (
        <div className="flex items-center gap-2">
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Filtering by connection:
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-bg-primary)",
            }}
          >
            {filterConnection}
          </span>
          <button
            className="text-xs underline cursor-pointer"
            style={{ color: "var(--color-text-muted)" }}
            onClick={() => setFilterConnection("all")}
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          className="rounded border p-6 text-center"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg-secondary)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Loading external tables...
          </p>
        </div>
      )}

      {/* Error state */}
      {fetchError && !isLoading && (
        <div
          className="rounded border p-6"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg-secondary)",
          }}
        >
          <p
            className="text-sm font-medium mb-1"
            style={{ color: "var(--color-error)" }}
          >
            Unable to fetch external tables
          </p>
          <p
            className="text-xs mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            {fetchError}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Showing locally cached data if available. Check that MegaDB is
            running and the proxy is configured in Settings.
          </p>
        </div>
      )}

      {/* Table list */}
      {!isLoading && (
        <ExternalTableList
          tables={filteredTables}
          onPreview={handlePreview}
          onDrop={handleDrop}
          onViewSchema={handleViewSchema}
        />
      )}

      {/* SQL reference hint */}
      {!isLoading && externalTables.length > 0 && (
        <div
          className="rounded border px-4 py-3"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg-secondary)",
          }}
        >
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            SQL Reference
          </p>
          <p
            className="text-xs font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            CREATE EXTERNAL TABLE name LOCATION
            &apos;conn://path&apos; FORMAT PARQUET &nbsp;|&nbsp; DROP TABLE
            name &nbsp;|&nbsp; SELECT * FROM name LIMIT 100
          </p>
        </div>
      )}

      {/* Schema detail panel */}
      {schemaTable && (
        <SchemaPanel table={schemaTable} onClose={handleCloseSchema} />
      )}

      {/* Data preview panel */}
      {previewTableName && (
        <DataPreview
          tableName={previewTableName}
          onClose={handleClosePreview}
        />
      )}

      {/* Create modal */}
      {showCreateModal && (
        <ExternalTableForm
          connections={connections}
          onSave={handleCreateSave}
          onCancel={handleCreateCancel}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Schema Panel sub-component                                          */
/* ------------------------------------------------------------------ */

function SchemaPanel({
  table,
  onClose,
}: {
  table: ExternalTableInfo;
  onClose: () => void;
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Schema
          </span>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-bg-tertiary)",
              color: "var(--color-accent)",
            }}
          >
            {table.name}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 rounded border transition-colors cursor-pointer"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
            backgroundColor: "var(--color-bg-tertiary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)";
          }}
        >
          Close
        </button>
      </div>

      {/* Schema details */}
      <div className="p-4">
        {/* Table metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <MetaItem label="Connection" value={table.connection_name} />
          <MetaItem label="Location" value={table.location} mono />
          <MetaItem label="Format" value={table.format.toUpperCase()} />
          <MetaItem
            label="Schema Mode"
            value={table.schema_mode === "infer" ? "Inferred" : "Explicit"}
          />
        </div>

        {/* Columns */}
        {table.columns.length > 0 ? (
          <div>
            <h4
              className="text-xs font-semibold mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Columns ({table.columns.length})
            </h4>
            <div
              className="rounded border overflow-hidden"
              style={{ borderColor: "var(--color-border)" }}
            >
              <table className="w-full text-xs">
                <thead>
                  <tr
                    style={{ backgroundColor: "var(--color-bg-tertiary)" }}
                  >
                    <th
                      className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Name
                    </th>
                    <th
                      className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Type
                    </th>
                    <th
                      className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Nullable
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col) => (
                    <tr
                      key={col.name}
                      className="border-t"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <td
                        className="px-3 py-1.5 font-mono"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {col.name}
                      </td>
                      <td
                        className="px-3 py-1.5 font-mono"
                        style={{ color: "var(--color-accent)" }}
                      >
                        {col.data_type}
                      </td>
                      <td
                        className="px-3 py-1.5"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {col.nullable ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {table.schema_mode === "infer"
              ? "Schema will be inferred from data at query time."
              : "No columns defined."}
          </p>
        )}

        {/* Partitions */}
        {table.partitions.length > 0 && (
          <div className="mt-3">
            <h4
              className="text-xs font-semibold mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Partitions ({table.partitions.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {table.partitions.map((p, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-2 py-1 rounded border"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-bg-tertiary)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {p.transform === "identity"
                    ? p.column
                    : `${p.transform}(${p.column})`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div
        className="text-[10px] uppercase font-semibold mb-0.5"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </div>
      <div
        className={`text-xs truncate ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--color-text-primary)" }}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
