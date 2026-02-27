"use client";

import { useState } from "react";
import {
  useK8sClusterStatus,
  useK8sPods,
  useK8sVolumes,
  useK8sScale,
  useK8sPodRestart,
  useK8sPodLogs,
} from "@/lib/api/k8s";
import { podIsReady } from "@/types/k8s";
import { PodCard } from "@/components/infra/PodCard";
import { ScaleControl } from "@/components/infra/ScaleControl";
import { VolumeTable } from "@/components/infra/VolumeTable";

export default function MegaDBPodsPage() {
  const [logPodName, setLogPodName] = useState<string | null>(null);

  const clusterStatus = useK8sClusterStatus(5_000);
  const pods = useK8sPods(5_000);
  const volumes = useK8sVolumes();
  const scaleMutation = useK8sScale();
  const restartMutation = useK8sPodRestart();
  const podLogs = useK8sPodLogs(logPodName ?? "", 200);

  const podList = pods.data ?? [];
  const volumeList = volumes.data ?? [];
  const readyCount = podList.filter(podIsReady).length;
  const totalCount = clusterStatus.data?.total_replicas ?? podList.length;

  const handleScale = (replicas: number) => {
    scaleMutation.mutate({ replicas });
  };

  const handleRestart = (name: string) => {
    restartMutation.mutate({ name });
  };

  const handleViewLogs = (name: string) => {
    setLogPodName((prev) => (prev === name ? null : name));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ================================================================ */}
      {/* StatefulSet Header                                               */}
      {/* ================================================================ */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg-secondary)",
        }}
      >
        <div className="flex flex-col gap-1">
          <h1
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            MegaDB StatefulSet
          </h1>
          <span
            className="text-xs font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            Replicas:{" "}
            <span style={{ color: "var(--color-success)" }}>{readyCount}</span>
            <span style={{ color: "var(--color-text-muted)" }}> / </span>
            <span style={{ color: "var(--color-text-secondary)" }}>
              {totalCount}
            </span>{" "}
            ready
          </span>
        </div>
        <ScaleControl
          currentReplicas={totalCount}
          onScale={handleScale}
          isScaling={scaleMutation.isPending}
        />
      </div>

      {/* ================================================================ */}
      {/* Pod Grid                                                         */}
      {/* ================================================================ */}
      {pods.isLoading && (
        <div
          className="text-sm py-8 text-center animate-pulse"
          style={{ color: "var(--color-text-muted)" }}
        >
          Loading pods...
        </div>
      )}

      {pods.isError && (
        <div
          className="text-sm py-8 text-center rounded-lg border p-4"
          style={{
            color: "var(--color-error)",
            borderColor: "var(--color-error)",
            backgroundColor: "var(--color-bg-secondary)",
          }}
        >
          Failed to load pods:{" "}
          {pods.error instanceof Error ? pods.error.message : "Unknown error"}
        </div>
      )}

      {!pods.isLoading && !pods.isError && podList.length === 0 && (
        <div
          className="text-sm py-8 text-center"
          style={{ color: "var(--color-text-muted)" }}
        >
          No pods found
        </div>
      )}

      {podList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {podList.map((pod) => (
            <PodCard
              key={pod.name}
              pod={pod}
              onRestart={handleRestart}
              onViewLogs={handleViewLogs}
            />
          ))}
        </div>
      )}

      {/* ================================================================ */}
      {/* Pod Logs Viewer (shown when a pod is selected)                    */}
      {/* ================================================================ */}
      {logPodName && (
        <div
          className="rounded-lg border p-4 flex flex-col gap-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg-secondary)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-sm font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Logs:{" "}
              <span
                className="font-mono"
                style={{ color: "var(--color-accent)" }}
              >
                {logPodName}
              </span>
            </h2>
            <button
              onClick={() => setLogPodName(null)}
              className="text-xs px-2 py-1 rounded border transition-colors"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
                backgroundColor: "var(--color-bg-tertiary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-bg-tertiary)";
              }}
            >
              Close
            </button>
          </div>
          <div
            className="rounded p-3 font-mono text-xs overflow-auto max-h-64"
            style={{
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-text-secondary)",
            }}
          >
            {podLogs.isLoading && (
              <span
                className="animate-pulse"
                style={{ color: "var(--color-text-muted)" }}
              >
                Loading logs...
              </span>
            )}
            {podLogs.isError && (
              <span style={{ color: "var(--color-error)" }}>
                Failed to load logs.
              </span>
            )}
            {podLogs.data &&
              podLogs.data.lines.length === 0 && (
                <span style={{ color: "var(--color-text-muted)" }}>
                  No log lines available.
                </span>
              )}
            {podLogs.data &&
              podLogs.data.lines.length > 0 &&
              podLogs.data.lines.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap leading-relaxed">
                  {line}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Persistent Volumes                                               */}
      {/* ================================================================ */}
      <div
        className="rounded-lg border p-4 flex flex-col gap-3"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg-secondary)",
        }}
      >
        <h2
          className="text-sm font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Persistent Volumes
        </h2>

        {volumes.isLoading && (
          <div
            className="text-sm py-4 text-center animate-pulse"
            style={{ color: "var(--color-text-muted)" }}
          >
            Loading volumes...
          </div>
        )}

        {volumes.isError && (
          <div
            className="text-sm py-4 text-center"
            style={{ color: "var(--color-error)" }}
          >
            Failed to load volumes.
          </div>
        )}

        {!volumes.isLoading && !volumes.isError && (
          <VolumeTable volumes={volumeList} />
        )}
      </div>
    </div>
  );
}
