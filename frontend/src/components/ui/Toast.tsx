"use client";

import { useToastStore } from "@/stores/toast-store";
import type { ToastMessage } from "@/types/toast";

const levelStyles: Record<string, { bg: string; border: string }> = {
  info: { bg: "var(--color-bg-tertiary)", border: "var(--color-accent)" },
  success: { bg: "var(--color-bg-tertiary)", border: "var(--color-success)" },
  warning: { bg: "var(--color-bg-tertiary)", border: "var(--color-warning)" },
  error: { bg: "var(--color-bg-tertiary)", border: "var(--color-error)" },
};

function ToastItem({ toast }: { toast: ToastMessage }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const style = levelStyles[toast.level] ?? levelStyles.info;

  return (
    <div
      className="flex items-start gap-2 px-4 py-3 rounded shadow-lg border-l-4 min-w-[300px] max-w-[480px]"
      style={{
        backgroundColor: style.bg,
        borderLeftColor: style.border,
        color: "var(--color-text-primary)",
      }}
    >
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-xs opacity-60 hover:opacity-100"
        style={{ color: "var(--color-text-muted)" }}
      >
        x
      </button>
    </div>
  );
}

export function ToastContainer() {
  const messages = useToastStore((s) => s.messages);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {messages.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
