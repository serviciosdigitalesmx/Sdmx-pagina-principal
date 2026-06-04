import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full rounded-lg border border-srf-primary/30 bg-srf-bg px-3 py-2 text-srf-text placeholder:text-srf-muted outline-none transition focus:border-srf-accent focus:ring-1 focus:ring-srf-accent ${className}`}
      {...props}
    />
  );
}

