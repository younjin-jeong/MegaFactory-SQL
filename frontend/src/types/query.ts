export interface QueryRequest {
  sql: string;
  database: string;
  limit?: number;
}

export interface QueryResult {
  columns: QueryColumn[];
  rows: unknown[][];
  row_count: number;
  execution_time_ms: number;
  error?: string;
}

export interface QueryColumn {
  name: string;
  data_type: string;
  nullable: boolean;
}

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  database: string;
  created_at: string;
  updated_at: string;
}

export interface QueryHistoryEntry {
  id: string;
  sql: string;
  database: string;
  execution_time_ms: number;
  row_count: number;
  executed_at: string;
  success: boolean;
}

export function emptyQueryResult(): QueryResult {
  return {
    columns: [],
    rows: [],
    row_count: 0,
    execution_time_ms: 0,
  };
}
