export interface ClusterStatus {
  phase: string;
  ready_replicas: number;
  total_replicas: number;
  coordinator_endpoint: string;
  message: string;
  pods: PodInfo[];
  volumes: VolumeInfo[];
  nodes: NodeInfo[];
  services: ServiceInfo[];
}

export interface PodInfo {
  name: string;
  role: string;
  status: string;
  cpu_usage_percent: number;
  memory_bytes: number;
  memory_limit_bytes: number;
  disk_usage_percent: number;
  restart_count: number;
  age_seconds: number;
}

export interface VolumeInfo {
  name: string;
  access_mode: string;
  capacity_bytes: number;
  used_bytes: number;
  bound_pod: string;
}

export interface ScaleRequest {
  replicas: number;
}

export interface KedaConfig {
  enabled: boolean;
  min_replicas: number;
  max_replicas: number;
}

export interface NodeInfo {
  name: string;
  status: string;
  roles: string[];
  cpu_capacity: number;
  memory_capacity_bytes: number;
  cpu_allocatable: number;
  memory_allocatable_bytes: number;
  pod_count: number;
  kubelet_version: string;
}

export interface ServiceInfo {
  name: string;
  type: string;
  cluster_ip: string;
  ports: ServicePort[];
}

export interface ServicePort {
  name: string;
  port: number;
  target_port: number;
  node_port?: number;
}

export interface K8sClusterEvent {
  type: string;
  reason: string;
  message: string;
  involved_object: string;
  timestamp: string;
}

export function podIsReady(pod: PodInfo): boolean {
  return pod.status === "Running";
}

export function podAgeDisplay(pod: PodInfo): string {
  const secs = pod.age_seconds;
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

export function podMemoryDisplay(pod: PodInfo): string {
  const mb = Math.floor(pod.memory_bytes / (1024 * 1024));
  if (mb < 1024) return `${mb} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export function defaultClusterStatus(): ClusterStatus {
  return {
    phase: "",
    ready_replicas: 0,
    total_replicas: 0,
    coordinator_endpoint: "",
    message: "",
    pods: [],
    volumes: [],
    nodes: [],
    services: [],
  };
}
