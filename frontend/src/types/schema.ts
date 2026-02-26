export interface DatabaseInfo {
  name: string;
  default_engine: string;
  schemas: SchemaInfo[];
}

export interface SchemaInfo {
  name: string;
  tables: TableInfo[];
}

export interface TableInfo {
  schema_name: string;
  name: string;
  engine: string;
  row_count?: number;
  size_bytes?: number;
  columns: ColumnInfo[];
  partitions: PartitionInfo[];
  compression?: string;
  sort_columns?: string[];
}

export interface ColumnInfo {
  name: string;
  data_type: string;
  nullable: boolean;
  comment?: string;
}

export interface PartitionInfo {
  column: string;
  transform: string;
}
