"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import type { ToastPayload, ToastType } from "@/lib/toast";

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 flex-shrink-0" />,
  error:   <XCircle    className="w-4 h-4 flex-shrink-0" />,
  info:    <Info       className="w-4 h-4 flex-shrink-0" />,
};

const COLORS: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: {
    bg:     "hsl(158 60% 36% / 0.12)",
    border: "hsl(158 60% 36% / 0.35)",
    color:  "hsl(158 60% 46%)",
  },
  error: {
    bg:     "hsl(var(--red) / 0.10)",
    border: "hsl(var(--red) / 0.35)",
    color:  "hsl(var(--red))",
  },
  info: {
    bg:     "hsl(var(--surface-2))",
    border: "hsl(var(--border))",
    color:  "hsl(var(--text-muted))",
  },
};

interface ToastItem extends ToastPayload {
  leaving?: boolean;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      setToasts((prev) => [...prev, detail]);

      // Démarre la sortie à 2s, supprime à 2.3s
      setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === detail.id ? { ...t, leaving: true } : t)));
      }, 2000);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 2300);
    };

    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const style = COLORS[t.type];
        return (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg"
            style={{
              backgroundColor: style.bg,
              borderColor: style.border,
              color: style.color,
              backdropFilter: "blur(12px)",
              opacity: t.leaving ? 0 : 1,
              transform: t.leaving ? "translateY(8px)" : "translateY(0)",
              transition: "opacity 0.25s ease, transform 0.25s ease",
              animation: t.leaving ? "none" : "fade-up 0.2s ease both",
            }}
          >
            {ICONS[t.type]}
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
