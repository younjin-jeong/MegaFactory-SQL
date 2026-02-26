import { create } from "zustand";
import type { DatabaseInfo, TableInfo } from "@/types/schema";

interface SchemaStore {
  databases: DatabaseInfo[];
  selectedTable: TableInfo | null;
  isLoading: boolean;
  filterText: string;
  setDatabases: (databases: DatabaseInfo[]) => void;
  setSelectedTable: (table: TableInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setFilterText: (text: string) => void;
}

export const useSchemaStore = create<SchemaStore>()((set) => ({
  databases: [],
  selectedTable: null,
  isLoading: false,
  filterText: "",
  setDatabases: (databases) => set({ databases }),
  setSelectedTable: (table) => set({ selectedTable: table }),
  setLoading: (loading) => set({ isLoading: loading }),
  setFilterText: (text) => set({ filterText: text }),
}));
