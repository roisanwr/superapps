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

// ─── BottomNav ────────────────────────────────────────────────────────────────

export interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number | string;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  activeHref?: string;
  onNavigate?: (href: string) => void;
  className?: string;
}

export function BottomNav({ items, activeHref, onNavigate, className }: BottomNavProps) {
  return (
    <nav
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-30 flex md:hidden",
        "h-16 border-t border-border bg-surface/95 backdrop-blur-md",
        className
      )}
      aria-label="Bottom navigation"
    >
      {items.map((item) => {
        const isActive = activeHref === item.href || activeHref?.startsWith(item.href + "/");
        return (
          <button
            key={item.href}
            onClick={() => onNavigate?.(item.href)}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-text-muted hover:text-text"
            )}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="relative">
              {isActive && item.activeIcon ? item.activeIcon : item.icon}
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-danger text-white text-[9px] font-bold px-0.5">
                  {item.badge}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
