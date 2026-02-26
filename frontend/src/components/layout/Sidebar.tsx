"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";

const NAV_ITEMS = [
  { href: "/sql", label: "SQL Editor", icon: ">" },
  { href: "/schema", label: "Schema Browser", icon: "#" },
  { href: "/k8s", label: "K8s Dashboard", icon: "K" },
  { href: "/monitoring", label: "Monitoring", icon: "M" },
  { href: "/workbench", label: "Workbench", icon: "W" },
  { href: "/configurator", label: "Configurator", icon: "C" },
  { href: "/connections", label: "Connections", icon: "@" },
  { href: "/settings", label: "Settings", icon: "*" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(loadFromStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, false));
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    saveToStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, next);
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
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 mx-1 rounded text-sm transition-colors ${
                collapsed ? "justify-center" : ""
              }`}
              style={{
                backgroundColor: isActive ? "var(--color-bg-hover)" : "transparent",
                color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
              title={collapsed ? item.label : undefined}
            >
              <span
                className="font-mono text-xs w-5 text-center flex-shrink-0"
                style={{ color: isActive ? "var(--color-accent)" : "var(--color-text-muted)" }}
              >
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
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
