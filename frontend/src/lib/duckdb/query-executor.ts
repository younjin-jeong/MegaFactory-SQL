import { getDuckDBConnection } from "./instance";
import { arrowTableToQueryResult } from "./arrow-utils";
import type { QueryResult } from "@/types/query";

export type QueryMode = "local" | "remote";

/**
 * Execute a SQL query either locally (DuckDB-WASM) or remotely (MegaDB via Axum proxy).
 */
export async function executeQuery(
  sql: string,
  mode: QueryMode,
  database?: string
): Promise<QueryResult> {
  const start = performance.now();

  try {
    if (mode === "local") {
      return await executeDuckDBQuery(sql, start);
    } else {
      return await executeRemoteQuery(sql, database ?? "megadb", start);
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
  startTime: number
): Promise<QueryResult> {
  const response = await fetch("/proxy/megadb/query", {
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
