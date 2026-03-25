export type ToastType = "success" | "error" | "info";

export interface ToastPayload {
  id: string;
  message: string;
  type: ToastType;
}

export function toast(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>("app:toast", {
      detail: { id: crypto.randomUUID(), message, type },
    })
  );
}
