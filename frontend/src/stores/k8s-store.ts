import { create } from "zustand";
import type { ClusterStatus } from "@/types/k8s";
import { defaultClusterStatus } from "@/types/k8s";

interface K8sStore {
  cluster: ClusterStatus;
  isConnected: boolean;
  autoRefresh: boolean;
  refreshIntervalSecs: number;
  error: string | null;
  selectedPod: string | null;
  setCluster: (cluster: ClusterStatus) => void;
  setConnected: (connected: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (secs: number) => void;
  setError: (error: string | null) => void;
  setSelectedPod: (pod: string | null) => void;
}

export const useK8sStore = create<K8sStore>()((set) => ({
  cluster: defaultClusterStatus(),
  isConnected: false,
  autoRefresh: true,
  refreshIntervalSecs: 10,
  error: null,
  selectedPod: null,
  setCluster: (cluster) => set({ cluster }),
  setConnected: (connected) => set({ isConnected: connected }),
  setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
  setRefreshInterval: (secs) => set({ refreshIntervalSecs: secs }),
  setError: (error) => set({ error }),
  setSelectedPod: (pod) => set({ selectedPod: pod }),
}));
