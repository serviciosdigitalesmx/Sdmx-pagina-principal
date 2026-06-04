import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-srf-primary text-white border-transparent hover:bg-srf-primary/90",
  secondary: "bg-srf-surface text-srf-text border-srf-primary/30 hover:bg-srf-surface/80",
  danger: "bg-red-600/10 text-red-400 border-red-500/30 hover:bg-red-600/20",
  ghost: "bg-transparent text-srf-text border-transparent hover:bg-srf-surface/40",
  outline: "bg-transparent text-srf-text border-srf-primary/40 hover:bg-srf-surface/40",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  type,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg border font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-srf-primary disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

