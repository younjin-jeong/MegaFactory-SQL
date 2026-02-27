/**
 * TanStack React Query hooks for Prometheus API.
 *
 * All requests are proxied through the Axum backend at `/proxy/prom/*`.
 */

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./client";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface PromMetric {
  metric: Record<string, string>;
  /** Instant vector value: [unix_timestamp, string_value] */
  value?: [number, string];
  /** Range vector values: Array<[unix_timestamp, string_value]> */
  values?: [number, string][];
}

export interface PromQueryResult {
  status: string;
  data: {
    resultType: string;
    result: PromMetric[];
  };
}

// ---------------------------------------------------------------------------
// Query key constants
// ---------------------------------------------------------------------------

export const promKeys = {
  query: (expr: string) => ["prom", "query", expr] as const,
  rangeQuery: (expr: string, start: string, end: string, step?: string) =>
    ["prom", "query_range", expr, start, end, step] as const,
};

// ---------------------------------------------------------------------------
// Instant query
// ---------------------------------------------------------------------------

export function usePromQuery(query: string, enabled?: boolean) {
  const params = new URLSearchParams({ query });
  const path = `/proxy/prom/query?${params.toString()}`;

  return useQuery<PromQueryResult>({
    queryKey: promKeys.query(query),
    queryFn: () => apiGet<PromQueryResult>(path),
    enabled: enabled ?? !!query,
  });
}

// ---------------------------------------------------------------------------
// Range query
// ---------------------------------------------------------------------------

export function usePromRangeQuery(
  query: string,
  start: string,
  end: string,
  step?: string,
) {
  const params = new URLSearchParams({ query, start, end });
  if (step) {
    params.set("step", step);
  }
  const path = `/proxy/prom/query_range?${params.toString()}`;

  return useQuery<PromQueryResult>({
    queryKey: promKeys.rangeQuery(query, start, end, step),
    queryFn: () => apiGet<PromQueryResult>(path),
    enabled: !!query && !!start && !!end,
  });
}
