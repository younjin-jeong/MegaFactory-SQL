import type { ColumnInfo, PartitionInfo } from "./schema";

export type ObjectStoreProvider = "aws" | "gcp" | "azure" | "minio" | "local";

export interface ObjectStoreConnection {
  name: string;
  provider: ObjectStoreProvider;
  url: string;
  region?: string;
  endpoint?: string;
  access_key?: string;
  secret_key?: string;
  auth_method: "credentials" | "iam" | "service_account";
  service_account_json?: string;
  storage_account?: string;
  status: "connected" | "disconnected" | "error";
  last_tested?: string;
  created_at: string;
}

export interface ExternalTableInfo {
  name: string;
  connection_name: string;
  location: string;
  format: "parquet" | "csv" | "json";
  schema_mode: "infer" | "explicit";
  columns: ColumnInfo[];
  partitions: PartitionInfo[];
  estimated_size_bytes?: number;
  estimated_row_count?: number;
}

export function defaultObjectStoreConnection(): ObjectStoreConnection {
  return {
    name: "",
    provider: "aws",
    url: "",
    auth_method: "credentials",
    status: "disconnected",
    created_at: new Date().toISOString(),
  };
}
