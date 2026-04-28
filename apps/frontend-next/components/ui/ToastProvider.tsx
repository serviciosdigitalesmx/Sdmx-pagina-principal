"use client";

import { createContext, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo<ToastContextValue>(() => ({
    showToast(message, type = "info") {
      const id = Date.now();
      setToasts((current) => [...current, { id, type, message }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 3500);
    }
  }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed bottom-4 right-4 z-[9999] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              "min-w-[280px] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl text-sm font-bold",
              toast.type === "success" ? "border-green-500/30 bg-green-500/15 text-green-200" : "",
              toast.type === "error" ? "border-red-500/30 bg-red-500/15 text-red-200" : "",
              toast.type === "info" ? "border-[#1F7EDC]/40 bg-[#1F7EDC]/15 text-blue-200" : ""
            ].join(" ")}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de ToastProvider");
  return context;
}
