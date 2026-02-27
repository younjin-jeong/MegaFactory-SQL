/**
 * TanStack React Query hooks for Kubernetes API.
 *
 * All requests are proxied through the Axum backend at `/proxy/k8s/*`.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";
import type {
  ClusterStatus,
  PodInfo,
  VolumeInfo,
  ScaleRequest,
  NodeInfo,
  ServiceInfo,
  K8sClusterEvent,
} from "@/types/k8s";

// Re-export the types so consumers can import from this module
export type { NodeInfo, ServiceInfo, K8sClusterEvent };

// ---------------------------------------------------------------------------
// Additional types
// ---------------------------------------------------------------------------

export interface PodLogResponse {
  pod_name: string;
  lines: string[];
}

// ---------------------------------------------------------------------------
// Query key constants
// ---------------------------------------------------------------------------

export const k8sKeys = {
  status: ["k8s", "status"] as const,
  pods: ["k8s", "pods"] as const,
  nodes: ["k8s", "nodes"] as const,
  services: ["k8s", "services"] as const,
  volumes: ["k8s", "volumes"] as const,
  podLogs: (podName: string) => ["k8s", "pods", podName, "logs"] as const,
  events: ["k8s", "events"] as const,
};

// ---------------------------------------------------------------------------
// Cluster status
// ---------------------------------------------------------------------------

export function useK8sClusterStatus(refetchInterval?: number) {
  return useQuery<ClusterStatus>({
    queryKey: k8sKeys.status,
    queryFn: () => apiGet<ClusterStatus>("/proxy/k8s/status"),
    refetchInterval: refetchInterval ?? 10_000,
  });
}

// ---------------------------------------------------------------------------
// Pods
// ---------------------------------------------------------------------------

export function useK8sPods(refetchInterval?: number) {
  return useQuery<PodInfo[]>({
    queryKey: k8sKeys.pods,
    queryFn: () => apiGet<PodInfo[]>("/proxy/k8s/pods"),
    refetchInterval: refetchInterval ?? 10_000,
  });
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

export function useK8sNodes() {
  return useQuery<NodeInfo[]>({
    queryKey: k8sKeys.nodes,
    queryFn: () => apiGet<NodeInfo[]>("/proxy/k8s/nodes"),
  });
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export function useK8sServices() {
  return useQuery<ServiceInfo[]>({
    queryKey: k8sKeys.services,
    queryFn: () => apiGet<ServiceInfo[]>("/proxy/k8s/services"),
  });
}

// ---------------------------------------------------------------------------
// Volumes
// ---------------------------------------------------------------------------

export function useK8sVolumes() {
  return useQuery<VolumeInfo[]>({
    queryKey: k8sKeys.volumes,
    queryFn: () => apiGet<VolumeInfo[]>("/proxy/k8s/volumes"),
  });
}

// ---------------------------------------------------------------------------
// Scale (mutation)
// ---------------------------------------------------------------------------

export function useK8sScale() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ScaleRequest>({
    mutationFn: (req: ScaleRequest) =>
      apiPost<void, ScaleRequest>("/proxy/k8s/scale", req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: k8sKeys.pods });
      queryClient.invalidateQueries({ queryKey: k8sKeys.status });
    },
  });
}

// ---------------------------------------------------------------------------
// Pod logs
// ---------------------------------------------------------------------------

export function useK8sPodLogs(podName: string, lines?: number) {
  const params = new URLSearchParams();
  if (lines !== undefined) {
    params.set("lines", String(lines));
  }
  const qs = params.toString();
  const path = `/proxy/k8s/pods/${encodeURIComponent(podName)}/logs${qs ? `?${qs}` : ""}`;

  return useQuery<PodLogResponse>({
    queryKey: [...k8sKeys.podLogs(podName), lines],
    queryFn: () => apiGet<PodLogResponse>(path),
    enabled: !!podName,
  });
}

// ---------------------------------------------------------------------------
// Pod restart (mutation)
// ---------------------------------------------------------------------------

export function useK8sPodRestart() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { name: string }>({
    mutationFn: ({ name }: { name: string }) =>
      apiPost<void, Record<string, never>>(
        `/proxy/k8s/pods/${encodeURIComponent(name)}/restart`,
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: k8sKeys.pods });
      queryClient.invalidateQueries({ queryKey: k8sKeys.status });
    },
  });
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export function useK8sEvents(refetchInterval?: number) {
  return useQuery<K8sClusterEvent[]>({
    queryKey: k8sKeys.events,
    queryFn: () => apiGet<K8sClusterEvent[]>("/proxy/k8s/events"),
    refetchInterval: refetchInterval ?? 10_000,
  });
}
