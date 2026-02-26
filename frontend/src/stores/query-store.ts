import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { QueryResult, QueryHistoryEntry } from "@/types/query";

export interface QueryTab {
  id: string;
  title: string;
  sql: string;
  result: QueryResult | null;
  isRunning: boolean;
}

interface QueryStore {
  tabs: QueryTab[];
  activeTabIndex: number;
  history: QueryHistoryEntry[];
  queryMode: "local" | "remote";
  // Actions
  addTab: () => void;
  closeTab: (index: number) => void;
  setActiveTab: (index: number) => void;
  updateSQL: (sql: string) => void;
  setTabResult: (tabId: string, result: QueryResult) => void;
  setTabRunning: (tabId: string, running: boolean) => void;
  pushHistory: (entry: QueryHistoryEntry) => void;
  clearHistory: () => void;
  setQueryMode: (mode: "local" | "remote") => void;
}

export const useQueryStore = create<QueryStore>()(
  persist(
    (set, get) => ({
      tabs: [
        {
          id: uuidv4(),
          title: "Query 1",
          sql: "",
          result: null,
          isRunning: false,
        },
      ],
      activeTabIndex: 0,
      history: [],
      queryMode: "local",

      addTab: () => {
        const { tabs } = get();
        const newTab: QueryTab = {
          id: uuidv4(),
          title: `Query ${tabs.length + 1}`,
          sql: "",
          result: null,
          isRunning: false,
        };
        set({ tabs: [...tabs, newTab], activeTabIndex: tabs.length });
      },

      closeTab: (index: number) => {
        const { tabs, activeTabIndex } = get();
        if (tabs.length <= 1) return;
        const newTabs = tabs.filter((_, i) => i !== index);
        const newActive = activeTabIndex >= newTabs.length
          ? newTabs.length - 1
          : activeTabIndex > index
            ? activeTabIndex - 1
            : activeTabIndex;
        set({ tabs: newTabs, activeTabIndex: newActive });
      },

      setActiveTab: (index: number) => set({ activeTabIndex: index }),

      updateSQL: (sql: string) => {
        const { tabs, activeTabIndex } = get();
        const updated = tabs.map((tab, i) =>
          i === activeTabIndex ? { ...tab, sql } : tab
        );
        set({ tabs: updated });
      },

      setTabResult: (tabId: string, result: QueryResult) => {
        const { tabs } = get();
        const updated = tabs.map((tab) =>
          tab.id === tabId ? { ...tab, result, isRunning: false } : tab
        );
        set({ tabs: updated });
      },

      setTabRunning: (tabId: string, running: boolean) => {
        const { tabs } = get();
        const updated = tabs.map((tab) =>
          tab.id === tabId ? { ...tab, isRunning: running } : tab
        );
        set({ tabs: updated });
      },

      pushHistory: (entry: QueryHistoryEntry) => {
        const { history } = get();
        set({ history: [entry, ...history].slice(0, 100) });
      },

      clearHistory: () => set({ history: [] }),

      setQueryMode: (mode) => set({ queryMode: mode }),
    }),
    {
      name: "megafactory.query",
      partialize: (state) => ({
        history: state.history,
        queryMode: state.queryMode,
      }),
    }
  )
);
