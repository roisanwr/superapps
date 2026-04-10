"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, ShieldCheck, Flame, Star, Coins, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

function getTimeUntilMidnightJakarta(): { hours: number; minutes: number; seconds: number; totalSeconds: number } {
  const now = new Date();
  const jakartaStr = now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  const jakartaNow = new Date(jakartaStr);
  const midnight = new Date(jakartaNow);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  const diffMs = midnight.getTime() - jakartaNow.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds
  };
}

type TopBarProps = {
  isDesktopOpen: boolean;
  setIsDesktopOpen: (val: boolean) => void;
  streak?: number;
  xp?: number;
  points?: number;
  level?: number;
  username?: string;
};

export function TopBar({
  isDesktopOpen,
  setIsDesktopOpen,
  streak = 0,
  xp = 0,
  points = 0,
  level = 1,
  username = "Operative"
}: TopBarProps) {
  const [time, setTime] = useState("");
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTime(formatTime(new Date()));
    setCountdown(getTimeUntilMidnightJakarta());
    const interval = setInterval(() => {
      setTime(formatTime(new Date()));
      setCountdown(getTimeUntilMidnightJakarta());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const countdownStr = `${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`;
  const isUrgent = countdown.totalSeconds < 3600;
  const isCritical = countdown.totalSeconds < 600;

  return (
    <header className={cn(
      "hidden md:flex fixed top-0 right-0 justify-between items-center px-6 z-40 h-14 bg-[#000000]/90 backdrop-blur-md border-b border-[#1f1f1f] transition-all duration-300",
      isDesktopOpen ? "w-[calc(100%-16rem)]" : "w-full"
    )}>
      {/* LEFT: Menu toggle + brand + countdown */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsDesktopOpen(!isDesktopOpen)}
          className="text-on-surface-variant hover:text-white transition-colors p-1 hover:bg-surface-container-high rounded cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">{isDesktopOpen ? "menu_open" : "menu"}</span>
        </button>

        {/* BitMove wordmark */}
        <span className="font-headline font-bold text-xl tracking-tight leading-none select-none">
          <span className="text-white">Bit</span><span className="text-primary">Move</span>
        </span>

        <span className="h-4 w-px bg-outline-variant" />

        {/* Countdown to daily reset */}
        <div className="flex items-center gap-1.5 font-headline text-xs uppercase tracking-wider">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            isCritical ? "bg-error animate-ping" : isUrgent ? "bg-tertiary animate-pulse" : "bg-primary animate-pulse-fast"
          )} />
          <span className={cn("font-semibold", isCritical ? "text-error" : isUrgent ? "text-tertiary" : "text-on-surface-variant")}>
            Reset
          </span>
          <span className={cn("font-bold tabular-nums min-w-[64px]", isCritical ? "text-error" : isUrgent ? "text-tertiary" : "text-secondary")}>
            {countdownStr}
          </span>
        </div>

        <span className="h-4 w-px bg-outline-variant" />
        <span className="font-headline text-xs text-on-surface-variant tabular-nums">{time}</span>
      </div>

      {/* RIGHT: Stats chips + action icons + profile */}
      <div className="flex items-center gap-2">

        {/* XP Chip */}
        <div
          className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 px-2.5 py-1 hover:bg-primary/15 transition-colors"
          title="Total XP accumulated"
        >
          <Star className="w-3 h-3 text-primary fill-primary" />
          <span className="font-headline font-bold text-xs text-primary tabular-nums">{xp.toLocaleString()} XP</span>
        </div>

        {/* Points Chip */}
        <div
          className="flex items-center gap-1.5 bg-secondary/10 border border-secondary/30 px-2.5 py-1 hover:bg-secondary/15 transition-colors"
          title="Points — dapat dihabiskan di Black Market"
        >
          <Coins className="w-3 h-3 text-secondary" />
          <span className="font-headline font-bold text-xs text-secondary tabular-nums">{points.toLocaleString()} PTS</span>
        </div>

        {/* Win Streak */}
        <div
          className="flex items-center gap-1.5 bg-surface-container-high border border-outline-variant/30 px-2.5 py-1"
          title="Win Streak — Selesaikan 80%+ Daily Quest & Training tiap hari"
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-headline font-bold text-xs text-orange-400 tabular-nums">{streak}</span>
        </div>

        <span className="h-4 w-px bg-outline-variant mx-1" />

        {/* Bell — Achievement & Punishment Notifications */}
        <button
          className="relative p-1.5 text-on-surface-variant hover:text-white transition-colors hover:bg-surface-container-high rounded cursor-pointer"
          title="Notifikasi: Level up, achievement, dan punishment alerts"
          id="topbar-notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-[3px] right-[3px] w-1.5 h-1.5 bg-error rounded-full" />
        </button>

        {/* Shield — Penalty Shield (buy at Black Market) */}
        <button
          className="p-1.5 text-on-surface-variant hover:text-secondary transition-colors hover:bg-surface-container-high rounded cursor-pointer"
          title="Penalty Shield — Aktifkan untuk melindungi streak dari putus. Stok: 0. Beli di Black Market."
          id="topbar-shield"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>

        {/* Profile dropdown */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(p => !p)}
            className="flex items-center gap-1.5 pl-1 pr-2 py-1 bg-surface-container-high hover:bg-surface-bright border border-outline-variant/30 transition-colors cursor-pointer"
            id="topbar-profile"
          >
            <div className="w-6 h-6 bg-primary/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-headline font-bold text-[11px] text-white uppercase">{username.substring(0, 12)}</div>
              <div className="font-body text-[9px] text-on-surface-variant">Lv.{level}</div>
            </div>
            <ChevronDown className={cn("w-3 h-3 text-on-surface-variant transition-transform ml-0.5", profileOpen && "rotate-180")} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-surface-container-high border border-outline-variant/40 shadow-xl z-50">
              <a
                href="/settings"
                className="flex items-center gap-2 px-3 py-2.5 text-[11px] font-headline uppercase tracking-wider text-on-surface-variant hover:text-white hover:bg-surface-bright transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </a>
              <a
                href="/api/auth/signout"
                className="flex items-center gap-2 px-3 py-2.5 text-[11px] font-headline uppercase tracking-wider text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors border-t border-outline-variant/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </a>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
