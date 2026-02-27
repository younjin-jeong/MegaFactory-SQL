"use client";

import { useEffect, useMemo } from "react";
import { useK8sClusterStatus, useK8sNodes, useK8sServices, useK8sEvents } from "@/lib/api/k8s";
import { useK8sStore } from "@/stores/k8s-store";
import { ClusterHealthBadge } from "@/components/infra/ClusterHealthBadge";
import { ServiceTable } from "@/components/infra/ServiceTable";
import { K8sEventFeed } from "@/components/infra/K8sEventFeed";
import type { NodeInfo } from "@/types/k8s";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} Gi`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} Mi`;
}

function computeCpuPercent(nodes: NodeInfo[]): number {
  if (!nodes || nodes.length === 0) return 0;
  const totalCapacity = nodes.reduce((acc, n) => acc + n.cpu_capacity, 0);
  const totalAllocatable = nodes.reduce((acc, n) => acc + n.cpu_allocatable, 0);
  if (totalCapacity === 0) return 0;
  // Used = capacity - allocatable (rough approximation)
  const used = totalCapacity - totalAllocatable;
  return Math.round((used / totalCapacity) * 100);
}

function computeMemoryPercent(nodes: NodeInfo[]): number {
  if (!nodes || nodes.length === 0) return 0;
  const totalCapacity = nodes.reduce((acc, n) => acc + n.memory_capacity_bytes, 0);
  const totalAllocatable = nodes.reduce((acc, n) => acc + n.memory_allocatable_bytes, 0);
  if (totalCapacity === 0) return 0;
  const used = totalCapacity - totalAllocatable;
  return Math.round((used / totalCapacity) * 100);
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div
      className="rounded border p-4 text-center"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}
    >
      <div
        className="text-2xl font-bold"
        style={{ color: "var(--color-accent)" }}
      >
        {value}
      </div>
      <div
        className="text-xs mt-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </div>
      {subtext && (
        <div
          className="text-[10px] mt-0.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded border"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}
    >
      <div
        className="px-4 py-2 border-b"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg-tertiary)",
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Node Table (inline -- small enough to live here)
// ---------------------------------------------------------------------------

function NodeTable({ nodes }: { nodes: NodeInfo[] }) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="text-sm p-4" style={{ color: "var(--color-text-muted)" }}>
        No nodes found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--color-border)",
              backgroundColor: "var(--color-bg-tertiary)",
            }}
          >
            {["Name", "Status", "Roles", "CPU (alloc/cap)", "Memory (alloc/cap)", "Pod Count", "Kubelet"].map(
              (header) => (
                <th
                  key={header}
                  className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr
              key={node.name}
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <td
                className="px-3 py-2 font-mono text-xs"
                style={{ color: "var(--color-accent)" }}
              >
                {node.name}
              </td>
              <td className="px-3 py-2 text-xs">
                <span
                  style={{
                    color:
                      node.status === "Ready"
                        ? "var(--color-success)"
                        : "var(--color-warning)",
                  }}
                >
                  {node.status}
                </span>
              </td>
              <td
                className="px-3 py-2 text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {node.roles.join(", ") || "--"}
              </td>
              <td
                className="px-3 py-2 font-mono text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {node.cpu_allocatable}/{node.cpu_capacity}
              </td>
              <td
                className="px-3 py-2 font-mono text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {formatBytes(node.memory_allocatable_bytes)}/{formatBytes(node.memory_capacity_bytes)}
              </td>
              <td
                className="px-3 py-2 text-xs text-center"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {node.pod_count}
              </td>
              <td
                className="px-3 py-2 font-mono text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {node.kubelet_version}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function K8sClusterOverviewPage() {
  const { autoRefresh, refreshIntervalSecs, setCluster, setConnected, setError, setAutoRefresh } =
    useK8sStore();

  const refetchMs = autoRefresh ? refreshIntervalSecs * 1000 : undefined;

  const statusQuery = useK8sClusterStatus(refetchMs);
  const nodesQuery = useK8sNodes();
  const servicesQuery = useK8sServices();
  const eventsQuery = useK8sEvents(refetchMs);

  // Sync TanStack Query state -> Zustand store
  useEffect(() => {
    if (statusQuery.data) {
      setCluster(statusQuery.data);
      setConnected(true);
      setError(null);
    }
  }, [statusQuery.data, setCluster, setConnected, setError]);

  useEffect(() => {
    if (statusQuery.error) {
      setConnected(false);
      setError(statusQuery.error.message);
    }
  }, [statusQuery.error, setConnected, setError]);

  // Compute stats from available data
  const cluster = statusQuery.data;
  const nodes = nodesQuery.data ?? cluster?.nodes ?? [];
  const services = servicesQuery.data ?? cluster?.services ?? [];
  const events = eventsQuery.data ?? [];

  const cpuPercent = useMemo(() => computeCpuPercent(nodes), [nodes]);
  const memPercent = useMemo(() => computeMemoryPercent(nodes), [nodes]);

  const isConnected = !statusQuery.error && !!statusQuery.data;
  const isLoading = statusQuery.isLoading && !statusQuery.error;

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (statusQuery.error && !statusQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <h1
          className="text-lg font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          K8s Cluster Overview
        </h1>
        <div
          className="rounded border p-6"
          style={{
            borderColor: "var(--color-error)",
            backgroundColor: "var(--color-bg-secondary)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: "var(--color-error)" }}
            />
            <span
              className="text-sm font-bold"
              style={{ color: "var(--color-error)" }}
            >
              Unable to connect to K8s proxy
            </span>
          </div>
          <p
            className="text-xs mb-3"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {statusQuery.error.message}
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Make sure the backend API proxy is running and the Kubernetes cluster is
            accessible. The proxy endpoint should be available at /proxy/k8s/status.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1
          className="text-lg font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          K8s Cluster Overview
        </h1>
        <div
          className="rounded border p-6 text-center"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg-secondary)",
          }}
        >
          <p
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Loading cluster status...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Data state
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <h1
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            K8s Cluster Overview
          </h1>
          <ClusterHealthBadge
            phase={cluster?.phase ?? ""}
            isConnected={isConnected}
            readyReplicas={cluster?.ready_replicas ?? 0}
            totalReplicas={cluster?.total_replicas ?? 0}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Namespace indicator */}
          {cluster?.coordinator_endpoint && (
            <span
              className="text-xs font-mono px-2 py-1 rounded"
              style={{
                color: "var(--color-text-muted)",
                backgroundColor: "var(--color-bg-tertiary)",
              }}
            >
              {cluster.coordinator_endpoint}
            </span>
          )}

          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-current"
              style={{ accentColor: "var(--color-accent)" }}
            />
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Auto-refresh
            </span>
          </label>
        </div>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Nodes"
          value={nodes.length}
        />
        <StatCard
          label="Ready Pods"
          value={`${cluster?.ready_replicas ?? 0}/${cluster?.total_replicas ?? 0}`}
          subtext="ready / total"
        />
        <StatCard
          label="CPU Usage %"
          value={`${cpuPercent}%`}
          subtext="capacity - allocatable"
        />
        <StatCard
          label="Memory Usage %"
          value={`${memPercent}%`}
          subtext="capacity - allocatable"
        />
      </div>

      {/* Row 2: Node Table */}
      <Section title="Nodes">
        <NodeTable nodes={nodes} />
      </Section>

      {/* Row 3: Services Table */}
      <Section title="Services">
        <ServiceTable services={services} />
      </Section>

      {/* Bottom: Events Feed */}
      <Section title="Recent Events">
        <K8sEventFeed events={events} />
      </Section>
    </div>
  );
}
