"use client";

import type { PlanNode } from "@/types/explain";

interface QueryPlanViewerProps {
  node: PlanNode | null;
}

function PlanNodeView({ node, depth }: { node: PlanNode; depth: number }) {
  return (
    <div style={{ paddingLeft: `${depth * 20}px` }}>
      <div className="flex items-center gap-2 py-1">
        {depth > 0 && (
          <span style={{ color: "var(--color-text-muted)" }}>-&gt;</span>
        )}
        <span className="font-bold text-xs" style={{ color: "var(--color-accent)" }}>
          {node.operator}
        </span>
        {node.relation && (
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            on {node.relation}
          </span>
        )}
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          (cost={node.cost_startup.toFixed(2)}..{node.cost_total.toFixed(2)} rows={node.estimated_rows} width={node.width})
        </span>
        {node.actual_time_ms !== undefined && (
          <span className="text-[10px]" style={{ color: "var(--color-warning)" }}>
            actual={node.actual_time_ms.toFixed(2)}ms rows={node.actual_rows ?? "?"}
          </span>
        )}
      </div>
      {node.children.map((child, i) => (
        <PlanNodeView key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function QueryPlanViewer({ node }: QueryPlanViewerProps) {
  if (!node) {
    return (
      <div className="p-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
        No query plan available
      </div>
    );
  }

  return (
    <div className="p-3 overflow-auto" style={{ fontFamily: "var(--font-mono)" }}>
      <PlanNodeView node={node} depth={0} />
    </div>
  );
}
