export const STORAGE_KEYS = {
  SETTINGS: "megafactory.settings",
  QUERY_HISTORY: "megafactory.queryHistory",
  CONNECTIONS: "megafactory.connections",
  SIDEBAR_COLLAPSED: "megafactory.sidebarCollapsed",
  SIDEBAR_GROUPS: "megafactory.sidebarGroups",
} as const;

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}
