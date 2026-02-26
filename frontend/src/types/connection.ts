import { v4 as uuidv4 } from "uuid";

export interface ConnectionConfig {
  id: string;
  name: string;
  host: string;
  http_port: number;
  pg_port: number;
  database: string;
  username?: string;
  k8s_namespace?: string;
  created_at: string;
}

export type ConnectionStatus =
  | { type: "Disconnected" }
  | { type: "Connecting" }
  | { type: "Connected" }
  | { type: "Error"; message: string };

export function defaultConnectionConfig(): ConnectionConfig {
  return {
    id: uuidv4(),
    name: "Local MegaDB",
    host: "localhost",
    http_port: 8080,
    pg_port: 5432,
    database: "megadb",
    k8s_namespace: "default",
    created_at: new Date().toISOString(),
  };
}
