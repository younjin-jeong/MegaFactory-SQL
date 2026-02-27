export type StorageTier = "MEMORY" | "OLTP" | "OLAP";

export interface TablespaceConfig {
  name: string;
  tier: StorageTier;
  location?: string;
  replication_factor: number;
  total_size_bytes?: number;
  used_size_bytes?: number;
  table_count: number;
  tables: string[];
}

export interface StorageTierSummary {
  tier: StorageTier;
  table_count: number;
  total_size_bytes: number;
  tablespaces: TablespaceConfig[];
}

export function defaultTablespaceConfig(): TablespaceConfig {
  return {
    name: "",
    tier: "OLAP",
    replication_factor: 1,
    table_count: 0,
    tables: [],
  };
}
