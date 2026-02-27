"use client";

import { useState, useEffect, useCallback } from "react";
import { useObjectStoreStore } from "@/stores/object-store-store";
import { useMegaDBQuery } from "@/lib/api/megadb";
import type {
  ObjectStoreConnection,
  ObjectStoreProvider,
} from "@/types/object-store";
import { defaultObjectStoreConnection } from "@/types/object-store";
import { ConnectionCard } from "@/components/object-store/ConnectionCard";
import { ConnectionForm } from "@/components/object-store/ConnectionForm";

/* ------------------------------------------------------------------ */
/*  SQL generators                                                     */
/* ------------------------------------------------------------------ */

/** Map our provider enum to the CONNECT SQL TYPE keyword */
function providerToSqlType(provider: ObjectStoreProvider): string {
  switch (provider) {
    case "aws":
      return "S3";
    case "gcp":
      return "GCS";
    case "azure":
      return "AZURE_BLOB";
    case "minio":
      return "S3";
    case "local":
      return "LOCAL";
  }
}

function escSql(val: string): string {
  return val.replace(/'/g, "''");
}

function buildConnectSQL(conn: ObjectStoreConnection): string {
  const opts: string[] = [];
  opts.push(`bucket='${escSql(conn.url)}'`);
  if (conn.region) opts.push(`region='${escSql(conn.region)}'`);
  if (conn.endpoint) opts.push(`endpoint='${escSql(conn.endpoint)}'`);
  if (conn.access_key) opts.push(`access_key='${escSql(conn.access_key)}'`);
  if (conn.secret_key) opts.push(`secret_key='${escSql(conn.secret_key)}'`);
  if (conn.storage_account)
    opts.push(`storage_account='${escSql(conn.storage_account)}'`);
  if (conn.service_account_json)
    opts.push(
      `service_account_json='${escSql(conn.service_account_json)}'`
    );

  return `CONNECT OBJECT_STORE '${escSql(conn.name)}' TYPE ${providerToSqlType(conn.provider)} OPTIONS(${opts.join(", ")})`;
}

function buildDisconnectSQL(name: string): string {
  return `DISCONNECT OBJECT_STORE '${escSql(name)}'`;
}

function buildTestSQL(name: string): string {
  return `SELECT megadb_test_connection('${escSql(name)}')`;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ObjectStoresPage() {
  const {
    connections,
    addConnection,
    removeConnection,
    updateConnection,
    setConnections,
  } = useObjectStoreStore();

  const megadbQuery = useMegaDBQuery();

  // Modal state: null = closed, undefined = new, ObjectStoreConnection = editing
  const [editingConnection, setEditingConnection] = useState<
    ObjectStoreConnection | undefined | null
  >(null);
  const isModalOpen = editingConnection !== null;

  // Fetch connections from MegaDB on mount
  useEffect(() => {
    megadbQuery.mutate(
      { sql: "SELECT * FROM megadb_connections", database: "megadb" },
      {
        onSuccess: (result) => {
          if (result.error || result.columns.length === 0) return;
          try {
            const parsed = parseConnectionRows(result.columns, result.rows);
            if (parsed.length > 0) {
              setConnections(parsed);
            }
          } catch {
            // MegaDB not available — fall back to Zustand local cache
          }
        },
        onError: () => {
          // MegaDB not available — Zustand cache already has the data
        },
      }
    );
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Handlers ---------- */

  const handleAddClick = () => {
    setEditingConnection(undefined); // undefined = new connection
  };

  const handleEditClick = (conn: ObjectStoreConnection) => {
    setEditingConnection(conn);
  };

  const handleModalClose = () => {
    setEditingConnection(null);
  };

  const handleSave = useCallback(
    (conn: ObjectStoreConnection) => {
      const isNew = !editingConnection; // undefined = new

      // Optimistic local update
      if (isNew) {
        addConnection({ ...conn, status: "disconnected" });
      } else {
        updateConnection(conn);
      }

      // Generate and execute SQL
      const sql = buildConnectSQL(conn);
      megadbQuery.mutate(
        { sql, database: "megadb" },
        {
          onSuccess: (result) => {
            if (result.error) {
              updateConnection({ ...conn, status: "error" });
            } else {
              updateConnection({ ...conn, status: "connected" });
            }
          },
          onError: () => {
            // Keep local cache regardless
          },
        }
      );

      setEditingConnection(null);
    },
    [editingConnection, addConnection, updateConnection, megadbQuery]
  );

  const handleTest = useCallback(
    (conn: ObjectStoreConnection) => {
      const sql = buildTestSQL(conn.name);
      megadbQuery.mutate(
        { sql, database: "megadb" },
        {
          onSuccess: (result) => {
            if (result.error) {
              updateConnection({
                ...conn,
                status: "error",
                last_tested: new Date().toISOString(),
              });
            } else {
              updateConnection({
                ...conn,
                status: "connected",
                last_tested: new Date().toISOString(),
              });
            }
          },
          onError: () => {
            updateConnection({
              ...conn,
              status: "error",
              last_tested: new Date().toISOString(),
            });
          },
        }
      );
    },
    [megadbQuery, updateConnection]
  );

  const handleDelete = useCallback(
    (conn: ObjectStoreConnection) => {
      // Optimistic local removal
      removeConnection(conn.name);

      // Execute DISCONNECT SQL
      const sql = buildDisconnectSQL(conn.name);
      megadbQuery.mutate(
        { sql, database: "megadb" },
        {
          onError: () => {
            // Best effort — connection is already removed from local cache
          },
        }
      );
    },
    [megadbQuery, removeConnection]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Object Store Endpoints
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            Manage connections to S3, GCS, Azure Blob, MinIO, and local object
            stores for OLAP data lake access.
          </p>
        </div>
        <button
          onClick={handleAddClick}
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
          + Add Connection
        </button>
      </div>

      {/* Connection grid or empty state */}
      {connections.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg-secondary)",
          }}
        >
          <div
            className="text-3xl mb-3 font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            []
          </div>
          <h2
            className="text-sm font-semibold mb-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            No object store connections configured
          </h2>
          <p
            className="text-xs max-w-md mx-auto mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            Object stores (S3, GCS, Azure Blob, MinIO) serve as the primary data
            lake tier for MegaDB OLAP tables. Connect an object store to query
            Parquet/Iceberg data, create external tables, or use CONNECT
            OBJECT_STORE SQL.
          </p>
          <button
            onClick={handleAddClick}
            className="text-sm px-4 py-2 rounded border font-medium transition-colors cursor-pointer"
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
            + Add your first connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.name}
              connection={conn}
              onEdit={() => handleEditClick(conn)}
              onTest={() => handleTest(conn)}
              onDelete={() => handleDelete(conn)}
            />
          ))}
        </div>
      )}

      {/* SQL hint */}
      {connections.length > 0 && (
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
            CONNECT OBJECT_STORE &apos;alias&apos; TYPE S3 OPTIONS(bucket=&apos;...&apos;,
            region=&apos;...&apos;) &nbsp;|&nbsp; DISCONNECT OBJECT_STORE
            &apos;alias&apos; &nbsp;|&nbsp; SELECT * FROM megadb_connections
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ConnectionForm
          connection={editingConnection ?? undefined}
          onSave={handleSave}
          onCancel={handleModalClose}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Row parser: turns MegaDB query result rows into typed connections   */
/* ------------------------------------------------------------------ */

interface QueryColumn {
  name: string;
  data_type: string;
  nullable: boolean;
}

function parseConnectionRows(
  columns: QueryColumn[],
  rows: unknown[][]
): ObjectStoreConnection[] {
  const colIndex = (name: string) =>
    columns.findIndex((c) => c.name.toLowerCase() === name.toLowerCase());

  const nameIdx = colIndex("name");
  const providerIdx = colIndex("provider");
  const urlIdx = colIndex("url");
  const regionIdx = colIndex("region");
  const endpointIdx = colIndex("endpoint");
  const authMethodIdx = colIndex("auth_method");
  const statusIdx = colIndex("status");
  const lastTestedIdx = colIndex("last_tested");
  const createdAtIdx = colIndex("created_at");
  const storageAccountIdx = colIndex("storage_account");

  return rows.map((row) => {
    const get = (idx: number): string | undefined =>
      idx >= 0 && row[idx] != null ? String(row[idx]) : undefined;

    return {
      name: get(nameIdx) ?? "",
      provider: (get(providerIdx) ?? "aws") as ObjectStoreProvider,
      url: get(urlIdx) ?? "",
      region: get(regionIdx),
      endpoint: get(endpointIdx),
      auth_method: (get(authMethodIdx) ?? "credentials") as ObjectStoreConnection["auth_method"],
      status: (get(statusIdx) ?? "disconnected") as ObjectStoreConnection["status"],
      last_tested: get(lastTestedIdx),
      created_at: get(createdAtIdx) ?? new Date().toISOString(),
      storage_account: get(storageAccountIdx),
    };
  });
}
