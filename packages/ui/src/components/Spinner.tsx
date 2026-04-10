import * as React from "react";
import { clsx } from "clsx";

// ─── Spinner ─────────────────────────────────────────────────────────────────

type SpinnerSize = "xs" | "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  "aria-label"?: string;
}

const spinnerSizes: Record<SpinnerSize, string> = {
  xs: "w-3 h-3 border",
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]",
};

export function Spinner({
  size = "md",
  className,
  "aria-label": ariaLabel = "Loading...",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={clsx(
        "inline-block rounded-full border-current border-t-transparent animate-spin text-primary",
        spinnerSizes[size],
        className
      )}
    />
  );
}

// ─── LoadingState ─────────────────────────────────────────────────────────────

export interface LoadingStateProps {
  message?: string;
  size?: SpinnerSize;
  className?: string;
  /** Full page centered overlay */
  fullPage?: boolean;
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  className,
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3 text-text-muted",
        fullPage ? "fixed inset-0 z-40 bg-surface/80 backdrop-blur-sm" : "py-12",
        className
      )}
    >
      <Spinner size={size} />
      {message && <p className="text-sm animate-pulse">{message}</p>}
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3 py-16 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center text-text-muted mb-2">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && <p className="text-sm text-text-muted max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
