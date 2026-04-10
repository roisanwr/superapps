import * as React from "react";
import { clsx } from "clsx";

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  /** Adds hover shadow and slight lift on hover */
  hoverable?: boolean;
  /** Removes all padding */
  noPadding?: boolean;
}

export function Card({
  children,
  className,
  as: Component = "div",
  hoverable = false,
  noPadding = false,
}: CardProps) {
  return (
    <Component
      className={clsx(
        "rounded-xl border border-border bg-surface",
        !noPadding && "p-5",
        hoverable &&
          "cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30",
        className
      )}
    >
      {children}
    </Component>
  );
}

// ─── Card sub-components ──────────────────────────────────────────────────────

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("flex items-center justify-between mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx("text-base font-semibold text-text", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("text-sm text-text-muted", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("mt-4 pt-4 border-t border-border flex items-center gap-2", className)}>
      {children}
    </div>
  );
}
