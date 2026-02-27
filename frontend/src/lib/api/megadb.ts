/**
 * TanStack React Query hooks for MegaDB HTTP API.
 *
 * All requests are proxied through the Axum backend at `/proxy/megadb/*`
 * so the browser never talks directly to MegaDB.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";
import type { QueryRequest, QueryResult } from "@/types/query";
import type { TableInfo } from "@/types/schema";
import type { QueryMetrics, ResourceUsage } from "@/types/metrics";

// ---------------------------------------------------------------------------
// Query key constants
// ---------------------------------------------------------------------------

export const megadbKeys = {
  health: ["megadb", "health"] as const,
  tables: ["megadb", "tables"] as const,
  tableDetail: (name: string) => ["megadb", "tables", name] as const,
  metrics: ["megadb", "metrics"] as const,
  query: ["megadb", "query"] as const,
};

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface MegaDBHealth {
  status: string;
  version?: string;
  uptime_seconds?: number;
}

export function useMegaDBHealth() {
  return useQuery<MegaDBHealth>({
    queryKey: megadbKeys.health,
    queryFn: () => apiGet<MegaDBHealth>("/proxy/megadb/health"),
    refetchInterval: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export function useMegaDBTables() {
  return useQuery<TableInfo[]>({
    queryKey: megadbKeys.tables,
    queryFn: () => apiGet<TableInfo[]>("/proxy/megadb/tables"),
  });
}

export function useMegaDBTableDetail(name: string) {
  return useQuery<TableInfo>({
    queryKey: megadbKeys.tableDetail(name),
    queryFn: () => apiGet<TableInfo>(`/proxy/megadb/tables/${encodeURIComponent(name)}`),
    enabled: !!name,
  });
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export interface MegaDBMetrics {
  query_metrics: QueryMetrics;
  resource_usage: ResourceUsage[];
}

export function useMegaDBMetrics() {
  return useQuery<MegaDBMetrics>({
    queryKey: megadbKeys.metrics,
    queryFn: () => apiGet<MegaDBMetrics>("/proxy/megadb/metrics"),
    refetchInterval: 10_000,
  });
}

// ---------------------------------------------------------------------------
// Query execution (mutation)
// ---------------------------------------------------------------------------

export function useMegaDBQuery() {
  const queryClient = useQueryClient();

  return useMutation<QueryResult, Error, QueryRequest>({
    mutationKey: megadbKeys.query,
    mutationFn: (req: QueryRequest) =>
      apiPost<QueryResult, QueryRequest>("/proxy/megadb/query", req),
    onSuccess: () => {
      // Refresh tables in case the query was DDL (CREATE/DROP/ALTER)
      queryClient.invalidateQueries({ queryKey: megadbKeys.tables });
    },
  });
}
