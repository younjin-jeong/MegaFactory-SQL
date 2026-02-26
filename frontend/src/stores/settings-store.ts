import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  theme: "dark" | "light";
  fontSize: number;
  rowLimit: number;
  autoComplete: boolean;
  setTheme: (theme: "dark" | "light") => void;
  setFontSize: (size: number) => void;
  setRowLimit: (limit: number) => void;
  setAutoComplete: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "dark",
      fontSize: 14,
      rowLimit: 1000,
      autoComplete: true,
      setTheme: (theme) => set({ theme }),
      setFontSize: (size) => set({ fontSize: size }),
      setRowLimit: (limit) => set({ rowLimit: limit }),
      setAutoComplete: (enabled) => set({ autoComplete: enabled }),
    }),
    { name: "megafactory.settings" }
  )
);
