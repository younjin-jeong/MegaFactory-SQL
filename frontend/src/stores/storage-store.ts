import { create } from "zustand";
import type { StorageTier, StorageTierSummary, TablespaceConfig } from "@/types/storage-tier";

interface StorageStore {
  tiers: StorageTierSummary[];
  tablespaces: TablespaceConfig[];
  selectedTier: StorageTier | null;
  isLoading: boolean;
  setTiers: (tiers: StorageTierSummary[]) => void;
  setTablespaces: (ts: TablespaceConfig[]) => void;
  setSelectedTier: (tier: StorageTier | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useStorageStore = create<StorageStore>()((set) => ({
  tiers: [],
  tablespaces: [],
  selectedTier: null,
  isLoading: false,
  setTiers: (tiers) => set({ tiers }),
  setTablespaces: (tablespaces) => set({ tablespaces }),
  setSelectedTier: (tier) => set({ selectedTier: tier }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
