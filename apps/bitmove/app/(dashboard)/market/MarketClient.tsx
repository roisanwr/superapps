"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, Plus, Skull } from "lucide-react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { createReward, redeemReward, deleteReward } from "./actions";

export function MarketClient({ rewards, currentPoints }: { rewards: any[], currentPoints: number }) {
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [redeemTarget, setRedeemTarget] = useState<any>(null);

  const handleRedeemInitiate = (r: any) => {
    if (currentPoints < r.price) {
        alert("INSUFFICIENT FUNDS. ACQUIRE MORE POINTS.");
        return;
    }
    setRedeemTarget(r);
  };

  const handleRedeemConfirm = () => {
    if (!redeemTarget) return;
    startTransition(async () => {
      await redeemReward(redeemTarget.id, redeemTarget.price);
      setRedeemTarget(null);
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
        await deleteReward(deleteTarget.id);
        setDeleteTarget(null);
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        
      {showAdd && (
        <form 
          action={async (fd) => {
            startTransition(async () => {
              await createReward(fd);
              setShowAdd(false);
            });
          }}
          className="bg-surface-container border-l-4 border-error p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in zoom-in-95 duration-200"
        >
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-error tracking-widest mb-1">Asset Name</label>
            <input name="title" required placeholder="E.g. Cheat Meal / 1 Hour Gaming" className="w-full bg-surface-container-high border border-outline-variant px-4 py-3 text-sm focus:border-error focus:outline-none text-white font-headline" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-error tracking-widest mb-1">Price (Pts)</label>
            <input type="number" name="price" required placeholder="e.g. 100" className="w-full bg-surface-container-high border border-outline-variant px-4 py-3 text-sm focus:border-error focus:outline-none text-primary font-headline font-black" />
          </div>
          <div className="md:col-span-3 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2 border border-outline-variant text-white font-bold text-xs uppercase hover:bg-surface-container-high">Cancel</button>
            <button type="submit" disabled={isPending} className="px-8 py-2 bg-error text-black font-black uppercase text-xs hover:shadow-[0_0_15px_#ff7351] transition-shadow disabled:opacity-50">Upload Listing</button>
          </div>
        </form>
      )}

      {rewards.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-error/30 text-center flex flex-col items-center justify-center">
            <Skull className="w-12 h-12 text-error/50 mb-4" />
            <p className="font-headline font-black text-xl text-error uppercase tracking-widest mb-2">MARKET IS EMPTY</p>
            <p className="font-body text-sm text-on-surface-variant mb-6">No assets available for trade. Establish your own rewards.</p>
            <button onClick={() => setShowAdd(true)} className="bg-error/10 text-error border border-error px-6 py-3 font-headline font-bold uppercase text-xs hover:bg-error hover:text-black transition-colors">
                + Establish Market Listing
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {rewards.map((r: any) => {
            const canAfford = currentPoints >= r.price;
            
            return (
              <div key={r.id} className="bg-surface-container group border border-outline-variant/30 flex flex-col overflow-hidden">
                <div className="p-6 flex-1 relative">
                  <div className="absolute top-0 right-0 p-3">
                    <button onClick={() => setDeleteTarget(r)} className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <h3 className="font-headline font-bold text-lg text-white mb-2 pr-4">{r.title}</h3>
                  <div className="font-headline font-black text-2xl text-primary">{r.price} <span className="text-sm text-primary/70">PTS</span></div>
                </div>
                <button 
                  onClick={() => handleRedeemInitiate(r)}
                  disabled={isPending || (!canAfford && !isPending)}
                  className={`w-full flex items-center justify-center gap-2 py-4 font-headline font-black uppercase tracking-widest text-sm transition-all ${
                    canAfford 
                      ? "bg-error text-black hover:bg-[#ff8a6f]" 
                      : "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {canAfford ? "TRADE" : "INSUFFICIENT"}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {rewards.length > 0 && !showAdd && (
         <div className="flex justify-end pt-4">
             <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 font-headline font-black text-error text-sm uppercase tracking-widest hover:text-[#ff8a6f] transition-colors">
                 <Plus className="w-5 h-5" /> CREATE NEW LISTING
             </button>
         </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="HAPUS LISTING"
        description={<>Hapus target <span className="text-white font-bold">&quot;{deleteTarget?.title}&quot;</span> dari Market secara permanen?</>}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isPending}
      />

      <ConfirmModal
        isOpen={!!redeemTarget}
        title="TRADE CONFIRMATION"
        description={<>Setuju untuk menukar <span className="text-primary font-bold">{redeemTarget?.price} PTS</span> untuk <span className="text-white font-bold">{redeemTarget?.title}</span>?</>}
        onConfirm={handleRedeemConfirm}
        onCancel={() => setRedeemTarget(null)}
        isLoading={isPending}
        isDestructive={false}
      />
    </div>
  );
}
