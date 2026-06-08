"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return <TabsContext.Provider value={{ value, setValue: onValueChange }}>{children}</TabsContext.Provider>;
}

export function TabsList({ className = "", children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 ${className}`}>{children}</div>;
}

export function TabsTrigger({
  value,
  className = "",
  children,
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = useContext(TabsContext);
  const active = context?.value === value;
  return (
    <button
      type="button"
      onClick={() => context?.setValue(value)}
      className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${active ? "bg-srf-primary text-white shadow-sm" : "bg-transparent text-srf-muted hover:bg-white/5"} ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = "",
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = useContext(TabsContext);
  if (!context || context.value !== value) return null;
  return <div className={className}>{children}</div>;
}
