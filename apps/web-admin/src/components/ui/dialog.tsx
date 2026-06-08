"use client";

import React from "react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ open, children }: DialogProps) {
  if (!open) return null;
  return <>{children}</>;
}

export function DialogContent({ className = "", children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm ${className}`}>
      <div className="shell-panel max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[1.5rem]">
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className = "", children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function DialogTitle({ className = "", children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>;
}
