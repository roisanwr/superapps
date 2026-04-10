"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, Settings, Grid, Award, Dumbbell, ReceiptText, Store, Database } from "lucide-react";
import { useState, useEffect } from "react";

export function Sidebar({ isDesktopOpen, setIsDesktopOpen }: { isDesktopOpen: boolean; setIsDesktopOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/master-data")) {
      setIsMasterDataOpen(true);
    }
  }, [pathname]);

  const navItems = [
    { label: "Dashboard", href: "/", icon: Grid },
    { label: "Daily Quests", href: "/quests", icon: Award },
    { label: "Training Ground", href: "/training", icon: Dumbbell },
    { label: "Mission Log", href: "/mission-log", icon: ReceiptText },
    { label: "Black Market", href: "/market", icon: Store },
    { 
      label: "Master Data", 
      icon: Database,
      subItems: [
        { label: "Level Rules", href: "/master-data/level-rules" },
        { label: "Task Library", href: "/master-data/task-library" },
        { label: "Exercise Lib.", href: "/master-data/exercise-library" },
        { label: "Diff. Scales", href: "/master-data/difficulty-scales" },
        { label: "Tier Rewards", href: "/master-data/tier-rewards" },
      ]
    }
  ];

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-[#000000]/90 backdrop-blur-md border-b-2 border-primary z-50 flex items-center justify-between px-4">
        <span className="font-headline font-bold text-lg tracking-widest text-primary">BitMove</span>
        <button onClick={() => setIsOpen(!isOpen)} className="text-primary p-2">
          <span className="material-symbols-outlined">{isOpen ? "close" : "menu"}</span>
        </button>
      </div>

      <aside
        id="sidebar"
        className={cn(
          "fixed left-0 top-0 h-full flex flex-col z-50 bg-[#0e0e0e] w-64 border-r-0 shadow-[4px_0_0_0_#1f1f1f] transition-transform duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isDesktopOpen ? "md:translate-x-0" : "md:-translate-x-full"
        )}
      >
        <div className="p-6 pt-20 md:pt-6">
          {/* BitMove Logo */}
          <div className="mb-8">
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="font-headline font-bold text-3xl tracking-tight text-white leading-none">Bit</span>
              <span className="font-headline font-bold text-3xl tracking-tight text-primary leading-none">Move</span>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-primary via-secondary to-transparent mt-1 mb-2" />
            <div className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Gamified Self-Mastery</div>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              if (item.subItems) {
                const isSubActive = pathname.startsWith("/master-data");
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => setIsMasterDataOpen(!isMasterDataOpen)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 transition-colors font-headline uppercase text-xs tracking-tighter",
                        isSubActive 
                          ? "bg-primary/10 text-primary font-bold" 
                          : "text-[#484848] hover:bg-surface-container-high hover:text-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px]">
                        {isMasterDataOpen ? "expand_less" : "expand_more"}
                      </span>
                    </button>
                    {isMasterDataOpen && (
                      <div className="pl-11 pr-3 py-1 space-y-1 bg-black/20 border-l-2 border-primary/20 ml-2">
                        {item.subItems.map((sub) => {
                          const isActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={cn(
                                "block p-2 text-[10px] font-headline uppercase tracking-widest transition-all",
                                isActive 
                                  ? "text-primary font-bold border-l-2 border-primary pl-2 -ml-[2px]" 
                                  : "text-[#484848] hover:text-white border-l-2 border-transparent pl-2 -ml-[2px] hover:border-outline-variant"
                              )}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && !item.subItems);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 p-3 transition-colors font-headline uppercase text-xs tracking-tighter",
                    isActive 
                      ? "bg-primary text-[#0d6100] font-bold rounded-none scale-105" 
                      : "text-[#484848] hover:bg-surface-container-high hover:text-primary"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto p-6 space-y-4">
          <button className="w-full bg-primary text-black font-headline font-black py-4 uppercase tracking-widest glitch-effect hover:shadow-[0_0_15px_#8eff71]">
            INITIATE MISSION
          </button>
          <div className="pt-4 border-t border-outline-variant/20 space-y-2">
            <Link href="/settings" className="flex items-center gap-3 p-2 text-[#484848] hover:text-primary font-headline uppercase text-[10px] tracking-tighter">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
            <Link href="/api/auth/signout" className="flex items-center gap-3 p-2 text-[#484848] hover:text-error font-headline uppercase text-[10px] tracking-tighter">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
