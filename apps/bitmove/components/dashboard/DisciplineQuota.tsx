"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function DisciplineQuota({ quota = 0 }: { quota?: number }) {
  const [currentQuota, setCurrentQuota] = useState(0);
  const [timeLeft, setTimeLeft] = useState("00:00:00");

  useEffect(() => {
    // Animate bar on load
    const timer = setTimeout(() => setCurrentQuota(quota), 500);
    return () => clearTimeout(timer);
  }, [quota]);

  useEffect(() => {
    // Calculate time until midnight
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) return "00:00:00";
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isSafe = currentQuota >= 80;

  return (
    <div className="bg-surface-container p-6 md:p-8 border-b-8 border-error-container relative shadow-[0_4px_20px_rgba(185,41,2,0.1)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
        <div>
          <h2 className="font-headline font-black text-2xl uppercase tracking-widest text-error">DISCIPLINE QUOTA</h2>
          <p className="font-headline font-bold text-[10px] text-error-dim uppercase tracking-widest animate-pulse">
            CRITICAL SYSTEM ALERT: PENALTY IMMINENT
          </p>
        </div>
        <div className="text-left md:text-right">
          <span className="font-headline font-black text-4xl text-white">{currentQuota}%</span>
          <span className="font-headline font-bold text-on-surface-variant text-sm block">CURRENT PROGRESS</span>
        </div>
      </div>
      
      <div className="h-10 md:h-12 bg-surface-container-lowest relative overflow-hidden border border-outline-variant/30">
        <div className="absolute inset-0 hazard-stripe opacity-20"></div>
        <div 
          className={cn(
            "h-full transition-all duration-1000 ease-out",
            isSafe ? "bg-primary shadow-[0_0_20px_#8eff71]" : "bg-error shadow-[0_0_20px_#b92902]"
          )}
          style={{ width: `${currentQuota}%` }}
        >
          <div className="w-full h-full hazard-stripe opacity-50"></div>
        </div>
        {/* Quota Threshold Line */}
        <div className="absolute top-0 left-[80%] h-full w-[2px] bg-white shadow-[0_0_10px_#fff] z-10 flex items-center">
          <span className="font-headline font-bold text-[8px] bg-white text-black px-1 -translate-y-6 md:-translate-y-8 whitespace-nowrap">
            80% REQ
          </span>
        </div>
      </div>
      
      {!isSafe && (
        <div className="mt-4 flex items-center gap-4 bg-error-container/20 p-3 border border-error/30">
          <AlertTriangle className="w-5 h-5 text-error animate-pulse" />
          <p className="font-headline font-bold text-[10px] md:text-xs uppercase text-error-dim tracking-widest">
            WARNING: 80% REQUIRED. -200 POINT PENALTY IMMINENT IN <span className="text-error font-black">{timeLeft}</span>
          </p>
        </div>
      )}
    </div>
  );
}
