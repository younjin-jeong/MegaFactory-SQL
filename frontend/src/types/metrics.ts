export interface MetricPoint {
  timestamp: number;
  value: number;
}

export interface ResourceUsage {
  pod_name: string;
  cpu_percent: number;
  memory_bytes: number;
  disk_read_bytes_sec: number;
  disk_write_bytes_sec: number;
  network_rx_bytes_sec: number;
  network_tx_bytes_sec: number;
}

export interface QueryMetrics {
  queries_per_second: number;
  avg_latency_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  active_sessions: number;
  open_connections: number;
}

export interface ActiveQuery {
  session_id: string;
  duration_ms: number;
  state: string;
  sql_preview: string;
  database: string;
}

export interface TimeSeries {
  label: string;
  points: MetricPoint[];
}
