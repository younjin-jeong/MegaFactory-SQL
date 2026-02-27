export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "infra",
    label: "Infrastructure",
    items: [
      { href: "/infra/k8s", label: "K8s Cluster", icon: "K" },
      { href: "/infra/pods", label: "MegaDB Pods", icon: "P" },
      { href: "/infra/storage", label: "Storage", icon: "S" },
      { href: "/infra/object-stores", label: "Object Stores", icon: "O" },
      { href: "/infra/external-tables", label: "External Tables", icon: "E" },
    ],
  },
  {
    id: "sql",
    label: "SQL & Data",
    items: [
      { href: "/sql", label: "SQL Editor", icon: ">" },
      { href: "/schema", label: "Schema Browser", icon: "#" },
      { href: "/connections", label: "Connections", icon: "@" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics & AI",
    items: [
      { href: "/analytics/monitoring", label: "Monitoring", icon: "M" },
      { href: "/analytics/workbench", label: "Workbench", icon: "W" },
      { href: "/analytics/configurator", label: "Configurator", icon: "C" },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { href: "/settings", label: "Settings", icon: "*" },
    ],
  },
];
