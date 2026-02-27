import { getDuckDBConnection } from "./instance";
import { arrowTableToQueryResult } from "./arrow-utils";
import type { QueryResult } from "@/types/query";
import type { ConnectionConfig } from "@/types/connection";

export type QueryMode = "local" | "remote";

/**
 * Derive the proxy endpoint URL from the active connection config.
 * For now the Axum proxy always lives at /proxy/megadb/query;
 * this helper exists so callers have a single place to change if
 * the routing strategy evolves (e.g. per-host proxy paths).
 */
export function getRemoteEndpoint(connection: ConnectionConfig | null): string {
  if (!connection) return "/proxy/megadb/query";
  // Future: could encode connection.host / connection.http_port into the path
  return "/proxy/megadb/query";
}

/**
 * Execute a SQL query either locally (DuckDB-WASM) or remotely (MegaDB via Axum proxy).
 */
export async function executeQuery(
  sql: string,
  mode: QueryMode,
  database?: string,
  endpoint?: string
): Promise<QueryResult> {
  const start = performance.now();

  try {
    if (mode === "local") {
      return await executeDuckDBQuery(sql, start);
    } else {
      return await executeRemoteQuery(
        sql,
        database ?? "megadb",
        start,
        endpoint ?? "/proxy/megadb/query"
      );
    }
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    return {
      columns: [],
      rows: [],
      row_count: 0,
      execution_time_ms: elapsed,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function executeDuckDBQuery(
  sql: string,
  startTime: number
): Promise<QueryResult> {
  const conn = await getDuckDBConnection();
  try {
    const arrowResult = await conn.query(sql);
    const elapsed = Math.round(performance.now() - startTime);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return arrowTableToQueryResult(arrowResult as any, elapsed);
  } finally {
    await conn.close();
  }
}

async function executeRemoteQuery(
  sql: string,
  database: string,
  startTime: number,
  endpoint: string = "/proxy/megadb/query"
): Promise<QueryResult> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql, database }),
  });

  const elapsed = Math.round(performance.now() - startTime);

  if (!response.ok) {
    const text = await response.text();
    return {
      columns: [],
      rows: [],
      row_count: 0,
      execution_time_ms: elapsed,
      error: `HTTP ${response.status}: ${text}`,
    };
  }

  const result: QueryResult = await response.json();
  result.execution_time_ms = elapsed;
  return result;
}
