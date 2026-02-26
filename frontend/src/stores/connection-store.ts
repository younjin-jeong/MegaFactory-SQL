import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConnectionConfig, ConnectionStatus } from "@/types/connection";

interface ConnectionStore {
  activeConnection: ConnectionConfig | null;
  status: ConnectionStatus;
  savedConnections: ConnectionConfig[];
  setActive: (conn: ConnectionConfig | null) => void;
  setStatus: (status: ConnectionStatus) => void;
  addConnection: (conn: ConnectionConfig) => void;
  removeConnection: (id: string) => void;
  updateConnection: (conn: ConnectionConfig) => void;
}

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set, get) => ({
      activeConnection: null,
      status: { type: "Disconnected" },
      savedConnections: [],

      setActive: (conn) => set({ activeConnection: conn }),
      setStatus: (status) => set({ status }),

      addConnection: (conn) => {
        const { savedConnections } = get();
        set({ savedConnections: [...savedConnections, conn] });
      },

      removeConnection: (id) => {
        const { savedConnections, activeConnection } = get();
        set({
          savedConnections: savedConnections.filter((c) => c.id !== id),
          activeConnection:
            activeConnection?.id === id ? null : activeConnection,
        });
      },

      updateConnection: (conn) => {
        const { savedConnections } = get();
        set({
          savedConnections: savedConnections.map((c) =>
            c.id === conn.id ? conn : c
          ),
        });
      },
    }),
    {
      name: "megafactory.connections",
      partialize: (state) => ({
        savedConnections: state.savedConnections,
      }),
    }
  )
);
