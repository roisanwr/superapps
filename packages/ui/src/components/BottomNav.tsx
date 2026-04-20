import React from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-[var(--color-surface)] border-t border-[var(--color-border)] md:hidden">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={`inline-flex flex-col items-center justify-center px-5 hover:bg-[var(--color-surface-alt)] group ${
              item.isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <div className={`w-6 h-6 mb-1 ${item.isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] ${item.isActive ? "font-bold" : "font-normal"}`}>
              {item.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
