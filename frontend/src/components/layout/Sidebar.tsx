"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { NAV_GROUPS } from "@/lib/nav-config";

type GroupExpandState = Record<string, boolean>;

function buildDefaultExpandState(): GroupExpandState {
  const state: GroupExpandState = {};
  for (const group of NAV_GROUPS) {
    state[group.id] = true;
  }
  return state;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [groupState, setGroupState] = useState<GroupExpandState>(
    buildDefaultExpandState
  );

  useEffect(() => {
    setCollapsed(loadFromStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, false));
    setGroupState(
      loadFromStorage(STORAGE_KEYS.SIDEBAR_GROUPS, buildDefaultExpandState())
    );
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    saveToStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, next);
  };

  const toggleGroup = useCallback(
    (groupId: string) => {
      setGroupState((prev) => {
        const next = { ...prev, [groupId]: !prev[groupId] };
        saveToStorage(STORAGE_KEYS.SIDEBAR_GROUPS, next);
        return next;
      });
    },
    []
  );

  /** Check whether a nav item is active based on the current pathname */
  const isItemActive = (href: string): boolean => {
    return pathname === href || (pathname?.startsWith(href + "/") ?? false);
  };

  /** Check whether any item within a group is active */
  const isGroupActive = (groupId: string): boolean => {
    const group = NAV_GROUPS.find((g) => g.id === groupId);
    if (!group) return false;
    return group.items.some((item) => isItemActive(item.href));
  };

  return (
    <aside
      className={`flex flex-col h-screen transition-all duration-200 ${
        collapsed ? "w-14" : "w-56"
      }`}
      style={{ backgroundColor: "var(--color-bg-secondary)" }}
    >
      {/* Logo / Brand */}
      <div
        className="flex items-center justify-between px-3 h-14 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        {!collapsed && (
          <span
            className="font-bold text-sm tracking-wide"
            style={{ color: "var(--color-accent)" }}
          >
            MegaFactory SQL
          </span>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 rounded hover:opacity-80 text-xs"
          style={{ color: "var(--color-text-muted)" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? ">>" : "<<"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const expanded = groupState[group.id] ?? true;
          const groupActive = isGroupActive(group.id);

          return (
            <div key={group.id} className="mb-1">
              {/* Group header — only visible when sidebar is expanded */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-left"
                  style={{
                    color: groupActive
                      ? "var(--color-accent)"
                      : "var(--color-text-muted)",
                  }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {group.label}
                  </span>
                  <span className="text-[10px]">
                    {expanded ? "\u25BE" : "\u25B8"}
                  </span>
                </button>
              )}

              {/* Group items */}
              {(collapsed || expanded) &&
                group.items.map((item) => {
                  const active = isItemActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 mx-1 rounded text-sm transition-colors ${
                        collapsed ? "justify-center" : ""
                      }`}
                      style={{
                        backgroundColor: active
                          ? "var(--color-bg-hover)"
                          : "transparent",
                        color: active
                          ? "var(--color-accent)"
                          : "var(--color-text-secondary)",
                      }}
                      title={collapsed ? item.label : undefined}
                    >
                      <span
                        className="font-mono text-xs w-5 text-center flex-shrink-0"
                        style={{
                          color: active
                            ? "var(--color-accent)"
                            : "var(--color-text-muted)",
                        }}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-2 border-t text-xs"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        {!collapsed && <span>MegaDB Console</span>}
      </div>
    </aside>
  );
}
