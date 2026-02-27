"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { v4 as uuidv4 } from "uuid";
import { TabBar } from "@/components/editor/TabBar";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ResultTable } from "@/components/query/ResultTable";
import { QueryHistory } from "@/components/query/QueryHistory";
import { QueryPlanViewer } from "@/components/query/QueryPlanViewer";
import { useQueryStore } from "@/stores/query-store";
import { useConnectionStore } from "@/stores/connection-store";
import { useToastStore } from "@/stores/toast-store";
import { executeQuery, getRemoteEndpoint } from "@/lib/duckdb/query-executor";
import { parseExplainText } from "@/types/explain";
import type { QueryResult, QueryHistoryEntry } from "@/types/query";
import type { PlanNode } from "@/types/explain";

// Dynamic import Monaco to avoid SSR issues with WASM
const MonacoEditor = dynamic(
  () =>
    import("@/components/editor/MonacoEditor").then((mod) => mod.MonacoEditor),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center h-full text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        Loading editor...
      </div>
    ),
  }
);

type BottomTab = "results" | "history" | "plan";

export default function SqlEditorPage() {
  const tabs = useQueryStore((s) => s.tabs);
  const activeTabIndex = useQueryStore((s) => s.activeTabIndex);
  const queryMode = useQueryStore((s) => s.queryMode);
  const updateSQL = useQueryStore((s) => s.updateSQL);
  const setTabResult = useQueryStore((s) => s.setTabResult);
  const setTabRunning = useQueryStore((s) => s.setTabRunning);
  const pushHistory = useQueryStore((s) => s.pushHistory);
  const activeConnection = useConnectionStore((s) => s.activeConnection);
  const addToast = useToastStore((s) => s.addToast);

  const [bottomTab, setBottomTab] = useState<BottomTab>("results");
  const [planNode, setPlanNode] = useState<PlanNode | null>(null);

  const activeTab = tabs[activeTabIndex];

  const handleExecute = useCallback(async () => {
    if (!activeTab || !activeTab.sql.trim()) {
      addToast("warning", "No SQL to execute");
      return;
    }

    const sql = activeTab.sql.trim();
    const isExplain = sql.toUpperCase().startsWith("EXPLAIN");

    setTabRunning(activeTab.id, true);

    const result: QueryResult = await executeQuery(
      sql,
      queryMode,
      activeConnection?.database,
      getRemoteEndpoint(activeConnection)
    );

    setTabResult(activeTab.id, result);

    // Push to history
    const entry: QueryHistoryEntry = {
      id: uuidv4(),
      sql,
      database: activeConnection?.database ?? "megadb",
      execution_time_ms: result.execution_time_ms,
      row_count: result.row_count,
      executed_at: new Date().toISOString(),
      success: !result.error,
    };
    pushHistory(entry);

    // Parse EXPLAIN result
    if (isExplain && !result.error && result.rows.length > 0) {
      const explainText = result.rows.map((row) => row[0]).join("\n");
      const parsed = parseExplainText(explainText);
      setPlanNode(parsed);
      setBottomTab("plan");
    } else {
      setBottomTab("results");
    }

    if (result.error) {
      addToast("error", `Query failed: ${result.error}`);
    } else {
      addToast(
        "success",
        `${result.row_count} rows in ${result.execution_time_ms}ms`
      );
    }
  }, [
    activeTab,
    queryMode,
    activeConnection,
    setTabRunning,
    setTabResult,
    pushHistory,
    addToast,
  ]);

  const handleSelectHistory = useCallback(
    (sql: string) => {
      updateSQL(sql);
    },
    [updateSQL]
  );

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Editor Section */}
      <div
        className="flex flex-col rounded-t border"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg-secondary)",
          flex: "1 1 50%",
          minHeight: "200px",
        }}
      >
        <TabBar />
        <EditorToolbar
          onExecute={handleExecute}
          isRunning={activeTab?.isRunning ?? false}
        />
        <div className="flex-1">
          <MonacoEditor
            value={activeTab?.sql ?? ""}
            onChange={updateSQL}
            onExecute={handleExecute}
          />
        </div>
      </div>

      {/* Bottom Panel */}
      <div
        className="flex flex-col rounded-b border border-t-0"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg-secondary)",
          flex: "1 1 50%",
          minHeight: "200px",
        }}
      >
        {/* Bottom tab bar */}
        <div
          className="flex items-center gap-0.5 px-1 h-8 border-b"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg-tertiary)",
          }}
        >
          {(
            [
              { key: "results", label: "Results" },
              { key: "history", label: "History" },
              { key: "plan", label: "Query Plan" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              className="px-3 py-1 text-xs rounded-t"
              style={{
                backgroundColor:
                  bottomTab === key
                    ? "var(--color-bg-secondary)"
                    : "transparent",
                color:
                  bottomTab === key
                    ? "var(--color-text-primary)"
                    : "var(--color-text-muted)",
              }}
              onClick={() => setBottomTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Bottom content */}
        <div className="flex-1 overflow-hidden">
          {bottomTab === "results" && (
            <ResultTable result={activeTab?.result ?? null} />
          )}
          {bottomTab === "history" && (
            <QueryHistory onSelectQuery={handleSelectHistory} />
          )}
          {bottomTab === "plan" && <QueryPlanViewer node={planNode} />}
        </div>
      </div>
    </div>
  );
}
