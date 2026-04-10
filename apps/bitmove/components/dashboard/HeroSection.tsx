import { Shield, Flame } from "lucide-react";

export function HeroSection({ 
  xp = 0, 
  streak = 0,
  level = 1,
  rankTitle = "OPERATIVE"
}: { 
  xp?: number; 
  streak?: number;
  level?: number;
  rankTitle?: string;
}) {
  return (
    <div className="bg-surface-container p-6 md:p-8 relative overflow-hidden flex flex-col justify-between border-l-8 border-tertiary-fixed shadow-lg h-full">
      <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
        <Shield className="w-[200px] h-[200px]" />
      </div>
      <div className="z-10">
        <h1 className="font-headline font-extrabold text-4xl md:text-5xl tracking-tighter mb-2 text-white">OPERATIVE STATUS</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-tertiary-fixed px-4 py-1 text-[#7a0100] font-headline font-black text-xl italic skew-x-[-12deg] shadow-[4px_4px_0px_0px_#7a0100]">
            {rankTitle.toUpperCase()}
          </div>
          <span className="font-headline font-bold text-on-surface-variant uppercase tracking-widest text-sm">Level {level} Active</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 md:gap-8 mt-10 md:mt-12 z-10">
        <div>
          <div className="font-headline font-bold uppercase text-[10px] text-on-surface-variant tracking-widest mb-1">TOTAL XP BALANCE</div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline font-black text-3xl md:text-5xl text-primary drop-shadow-[0_0_8px_rgba(142,255,113,0.3)] xp-transition">
              {xp.toLocaleString()}
            </span>
            <span className="font-headline font-bold text-xs text-primary-dim">XP</span>
          </div>
        </div>
        <div>
          <div className="font-headline font-bold uppercase text-[10px] text-on-surface-variant tracking-widest mb-1">CURRENT STREAK</div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="font-headline font-black text-3xl md:text-5xl text-tertiary">{streak}</span>
            <Flame className="text-tertiary w-8 h-8 md:w-10 md:h-10 animate-pulse" />
            <span className="font-headline font-bold text-xs text-on-surface-variant uppercase">DAYS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
