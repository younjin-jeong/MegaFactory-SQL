import { create } from "zustand";
import type { ToastMessage, ToastLevel } from "@/types/toast";
import { createToast } from "@/types/toast";

interface ToastStore {
  messages: ToastMessage[];
  addToast: (level: ToastLevel, message: string) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>()((set, get) => ({
  messages: [],

  addToast: (level, message) => {
    const toast = createToast(level, message);
    set({ messages: [...get().messages, toast] });

    if (toast.auto_dismiss_ms > 0) {
      setTimeout(() => {
        set({
          messages: get().messages.filter((m) => m.id !== toast.id),
        });
      }, toast.auto_dismiss_ms);
    }
  },

  removeToast: (id) => {
    set({ messages: get().messages.filter((m) => m.id !== id) });
  },

  clearAll: () => set({ messages: [] }),
}));
