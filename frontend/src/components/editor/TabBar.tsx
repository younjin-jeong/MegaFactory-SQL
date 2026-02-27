"use client";

import { useQueryStore, type QueryTab } from "@/stores/query-store";

export function TabBar() {
  const tabs = useQueryStore((s) => s.tabs);
  const activeTabIndex = useQueryStore((s) => s.activeTabIndex);
  const addTab = useQueryStore((s) => s.addTab);
  const closeTab = useQueryStore((s) => s.closeTab);
  const setActiveTab = useQueryStore((s) => s.setActiveTab);

  return (
    <div
      className="flex items-center gap-0.5 px-1 h-9 overflow-x-auto"
      style={{ backgroundColor: "var(--color-bg-tertiary)" }}
    >
      {tabs.map((tab: QueryTab, index: number) => (
        <button
          key={tab.id}
          className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-t whitespace-nowrap"
          style={{
            backgroundColor:
              index === activeTabIndex
                ? "var(--color-bg-secondary)"
                : "transparent",
            color:
              index === activeTabIndex
                ? "var(--color-text-primary)"
                : "var(--color-text-muted)",
          }}
          onClick={() => setActiveTab(index)}
        >
          <span>{tab.title}</span>
          {tabs.length > 1 && (
            <span
              className="ml-1 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(index);
              }}
            >
              x
            </span>
          )}
          {tab.isRunning && (
            <span className="ml-1 animate-pulse" style={{ color: "var(--color-accent)" }}>
              ...
            </span>
          )}
        </button>
      ))}
      <button
        className="px-2 py-1 text-xs opacity-60 hover:opacity-100"
        style={{ color: "var(--color-text-muted)" }}
        onClick={addTab}
        title="New tab"
      >
        +
      </button>
    </div>
  );
}
