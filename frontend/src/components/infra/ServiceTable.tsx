"use client";

import type { ServiceInfo, ServicePort } from "@/types/k8s";

interface ServiceTableProps {
  services: ServiceInfo[];
}

function formatPorts(ports: ServicePort[]): string {
  if (!ports || ports.length === 0) return "--";
  return ports
    .map((p) => {
      let s = `${p.port}:${p.target_port}`;
      if (p.node_port) s += `/${p.node_port}`;
      if (p.name) s = `${p.name} ${s}`;
      return s;
    })
    .join(", ");
}

export function ServiceTable({ services }: ServiceTableProps) {
  if (!services || services.length === 0) {
    return (
      <div
        className="text-sm p-4"
        style={{ color: "var(--color-text-muted)" }}
      >
        No services found.
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
            <th
              className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Name
            </th>
            <th
              className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Type
            </th>
            <th
              className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Cluster IP
            </th>
            <th
              className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Ports
            </th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc) => (
            <tr
              key={svc.name}
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <td
                className="px-3 py-2 font-mono text-xs"
                style={{ color: "var(--color-accent)" }}
              >
                {svc.name}
              </td>
              <td
                className="px-3 py-2 text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {svc.type}
              </td>
              <td
                className="px-3 py-2 font-mono text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {svc.cluster_ip || "--"}
              </td>
              <td
                className="px-3 py-2 font-mono text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {formatPorts(svc.ports)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
