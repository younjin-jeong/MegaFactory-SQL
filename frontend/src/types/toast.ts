import { v4 as uuidv4 } from "uuid";

export type ToastLevel = "info" | "success" | "warning" | "error";

export interface ToastMessage {
  id: string;
  message: string;
  level: ToastLevel;
  auto_dismiss_ms: number;
}

export function createToast(
  level: ToastLevel,
  message: string,
  autoDismissMs = 5000
): ToastMessage {
  return {
    id: uuidv4(),
    message,
    level,
    auto_dismiss_ms: autoDismissMs,
  };
}
