import * as React from "react";
import { clsx } from "clsx";

// ─── Badge ───────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "outline";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-surface-alt text-text-muted",
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  outline: "bg-transparent border border-border text-text-muted",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
  dot,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        badgeVariants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "danger" && "bg-danger",
            variant === "primary" && "bg-primary",
            (variant === "default" || variant === "outline") && "bg-text-muted"
          )}
        />
      )}
      {children}
    </span>
  );
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function Tag({ children, onRemove, className }: TagProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full",
        "text-xs font-medium bg-surface-alt text-text border border-border",
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          type="button"
          className="text-text-muted hover:text-text transition-colors focus:outline-none"
          aria-label="Remove tag"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
