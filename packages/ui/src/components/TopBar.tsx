"use client";

import * as React from "react";
import { clsx } from "clsx";

// ─── TopBar ───────────────────────────────────────────────────────────────────

export interface TopBarProps {
  /** Left side: typically logo or back button */
  leading?: React.ReactNode;
  /** Center: title or nav links */
  title?: React.ReactNode;
  /** Right side: actions, avatars, etc */
  trailing?: React.ReactNode;
  className?: string;
  /** Adds a slight blur effect — useful for glass morphism layouts */
  glassy?: boolean;
  /** Makes TopBar sticky at the top */
  sticky?: boolean;
}

export function TopBar({
  leading,
  title,
  trailing,
  className,
  glassy = false,
  sticky = true,
}: TopBarProps) {
  return (
    <header
      className={clsx(
        "z-30 w-full h-14 flex items-center justify-between gap-4 px-4 md:px-6",
        "border-b border-border bg-surface",
        sticky && "sticky top-0",
        glassy && "bg-surface/80 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {leading}
      </div>
      {title && (
        <div className="flex-1 flex items-center justify-center text-sm font-semibold text-text truncate">
          {title}
        </div>
      )}
      <div className="flex items-center gap-2">
        {trailing}
      </div>
    </header>
  );
}


