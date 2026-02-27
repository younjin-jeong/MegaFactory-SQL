import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ObjectStoreConnection, ExternalTableInfo } from "@/types/object-store";

interface ObjectStoreStore {
  connections: ObjectStoreConnection[];
  selectedConnection: ObjectStoreConnection | null;
  externalTables: ExternalTableInfo[];
  isLoading: boolean;
  setConnections: (conns: ObjectStoreConnection[]) => void;
  setSelectedConnection: (conn: ObjectStoreConnection | null) => void;
  addConnection: (conn: ObjectStoreConnection) => void;
  removeConnection: (name: string) => void;
  updateConnection: (conn: ObjectStoreConnection) => void;
  setExternalTables: (tables: ExternalTableInfo[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useObjectStoreStore = create<ObjectStoreStore>()(
  persist(
    (set, get) => ({
      connections: [],
      selectedConnection: null,
      externalTables: [],
      isLoading: false,
      setConnections: (connections) => set({ connections }),
      setSelectedConnection: (conn) => set({ selectedConnection: conn }),
      addConnection: (conn) => {
        const { connections } = get();
        set({ connections: [...connections, conn] });
      },
      removeConnection: (name) => {
        const { connections, selectedConnection } = get();
        set({
          connections: connections.filter((c) => c.name !== name),
          selectedConnection:
            selectedConnection?.name === name ? null : selectedConnection,
        });
      },
      updateConnection: (conn) => {
        const { connections } = get();
        set({
          connections: connections.map((c) =>
            c.name === conn.name ? conn : c
          ),
        });
      },
      setExternalTables: (tables) => set({ externalTables: tables }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "megafactory.objectStores",
      partialize: (state) => ({
        connections: state.connections.map((c) => ({
          ...c,
          secret_key: c.secret_key ? "***" : undefined,
          service_account_json: c.service_account_json ? "***" : undefined,
        })),
      }),
    }
  )
);
