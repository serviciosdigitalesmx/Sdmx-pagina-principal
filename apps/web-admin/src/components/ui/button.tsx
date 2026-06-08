import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "btn-primary border-transparent hover:brightness-110",
  secondary: "btn-secondary border-transparent hover:brightness-110",
  danger: "bg-red-600/10 text-red-300 border-red-500/30 hover:bg-red-600/20",
  ghost: "btn-ghost border-transparent hover:bg-srf-surface/40",
  outline: "btn-outline hover:bg-srf-surface/40",
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
      className={`inline-flex items-center justify-center border font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-srf-primary disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
