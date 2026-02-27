import type { QueryResult, QueryColumn } from "@/types/query";

// Use a generic interface to avoid Arrow version mismatch between DuckDB-WASM (v17) and our dep (v21)
interface ArrowLikeTable {
  schema: { fields: { name: string; type: { toString(): string }; nullable: boolean }[] };
  numRows: number;
  numCols: number;
  getChildAt(index: number): { get(index: number): unknown } | null;
}

/**
 * Convert an Apache Arrow Table (from DuckDB-WASM) to our QueryResult format.
 */
export function arrowTableToQueryResult(
  table: ArrowLikeTable,
  executionTimeMs: number
): QueryResult {
  const columns: QueryColumn[] = table.schema.fields.map((field) => ({
    name: field.name,
    data_type: field.type.toString(),
    nullable: field.nullable,
  }));

  const rows: unknown[][] = [];
  for (let i = 0; i < table.numRows; i++) {
    const row: unknown[] = [];
    for (let j = 0; j < table.numCols; j++) {
      const col = table.getChildAt(j);
      row.push(col ? col.get(i) : null);
    }
    rows.push(row);
  }

  return {
    columns,
    rows,
    row_count: table.numRows,
    execution_time_ms: executionTimeMs,
  };
}

/**
 * Export query result rows as CSV string.
 */
export function resultToCSV(result: QueryResult): string {
  const header = result.columns.map((c) => c.name).join(",");
  const rows = result.rows.map((row) =>
    row
      .map((cell) => {
        if (cell === null || cell === undefined) return "";
        const str = String(cell);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );
  return [header, ...rows].join("\n");
}

/**
 * Export query result rows as JSON string.
 */
export function resultToJSON(result: QueryResult): string {
  const objects = result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    result.columns.forEach((col, i) => {
      obj[col.name] = row[i];
    });
    return obj;
  });
  return JSON.stringify(objects, null, 2);
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
