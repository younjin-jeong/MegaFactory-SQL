import type { QueryMetrics } from "./metrics";

export type WsClientMessage =
  | { type: "Subscribe"; payload: { topics: string[] } }
  | { type: "Unsubscribe"; payload: { topics: string[] } }
  | { type: "Ping" };

export type WsServerMessage =
  | { type: "MetricsUpdate"; payload: QueryMetrics }
  | { type: "K8sEvent"; payload: K8sEvent }
  | { type: "QueryProgress"; payload: QueryProgressEvent }
  | { type: "Pong" }
  | { type: "Error"; payload: { message: string } };

export interface K8sEvent {
  event_type: string;
  pod_name: string;
  message: string;
}

export interface QueryProgressEvent {
  query_id: string;
  progress_pct: number;
  rows_processed: number;
  stage: string;
}
