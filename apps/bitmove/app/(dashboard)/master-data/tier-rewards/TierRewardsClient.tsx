"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { saveTierReward, deleteTierReward } from "../actions";

export default function TierRewardsClient({ initialData }: { initialData: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    tier: "C",
    xp_reward: 0,
    points_reward: 0,
  });

  const openAdd = () => {
    setFormData({ tier: "C", xp_reward: 0, points_reward: 0 });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setFormData({
      tier: item.tier,
      xp_reward: item.xp_reward,
      points_reward: item.points_reward,
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    try {
      await deleteTierReward(deleteTarget.tier);
      setDeleteTarget(null);
    } catch (e) {
      alert("Failed to delete.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await saveTierReward(formData, !!editingItem);
      setIsModalOpen(false);
    } catch (error) {
      alert("Failed to save changes. Make sure ID/Tier doesn't conflict.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-white">
            TIER REWARDS
          </h1>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-2 border-l-2 border-primary pl-3">
            MASTER DATA: BASE XP AND POINTS ALLOCATED PER TIER DEFEATED.
          </p>
        </div>
        <button 
          onClick={openAdd}
          className="bg-primary hover:bg-white text-black font-headline font-black px-4 py-2 uppercase tracking-widest transition-colors text-xs shadow-[0_0_10px_rgba(142,255,113,0.3)] hover:shadow-none"
        >
          + ADD NEW
        </button>
      </div>

      <div className="bg-surface-container border border-outline-variant/30 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {initialData.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant font-headline uppercase tracking-widest text-sm border-b-2 border-primary border-dashed">
            NO TIER REWARDS RECORDED.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-headline">
              <thead className="bg-surface-container-high border-b-2 border-outline-variant/50">
                <tr className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                  <th className="p-4 py-6 font-black w-24">Tier</th>
                  <th className="p-4 py-6 font-black">XP Reward</th>
                  <th className="p-4 py-6 font-black">Points Reward</th>
                  <th className="p-4 py-6 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold divide-y divide-outline-variant/20">
                {initialData.map((reward) => (
                  <tr key={reward.tier} className="hover:bg-surface-bright transition-colors text-white">
                    <td className="p-4 font-black">
                      <span className={`px-2 py-1 rounded-sm ${
                        reward.tier === 'SS' ? 'bg-[#ffcc00]/20 text-[#ffcc00]' :
                        reward.tier === 'S'  ? 'bg-error/20 text-error' :
                        reward.tier === 'A'  ? 'bg-[#ff8800]/20 text-[#ff8800]' :
                        reward.tier === 'B'  ? 'bg-primary/20 text-primary' :
                        reward.tier === 'C'  ? 'bg-secondary/20 text-secondary' :
                        'bg-surface-container-higher text-on-surface'
                      }`}>
                        {reward.tier}
                      </span>
                    </td>
                    <td className="p-4 text-primary">+{reward.xp_reward.toLocaleString('id-ID')} XP</td>
                    <td className="p-4 text-secondary">+{reward.points_reward.toLocaleString('id-ID')} PTS</td>
                    <td className="p-4 text-right min-w-[120px]">
                      <button onClick={() => openEdit(reward)} className="text-[10px] text-on-surface-variant hover:text-white uppercase tracking-widest mr-3 transition-colors">Edit</button>
                      <button onClick={() => setDeleteTarget(reward)} className="text-[10px] text-on-surface-variant hover:text-error uppercase tracking-widest transition-colors">Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `EDIT TIER ${editingItem.tier}` : "ADD NEW TIER REWARD"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Tier Code</label>
            <select 
              value={formData.tier}
              onChange={(e) => setFormData({...formData, tier: e.target.value})}
              disabled={!!editingItem} // Avoid editing primary key
              className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors disabled:opacity-50"
            >
              <option value="D">D</option>
              <option value="C">C</option>
              <option value="B">B</option>
              <option value="A">A</option>
              <option value="S">S</option>
              <option value="SS">SS</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">XP Reward</label>
            <input 
              type="number" 
              required
              min={0}
              value={formData.xp_reward}
              onChange={(e) => setFormData({...formData, xp_reward: e.target.valueAsNumber})}
              className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Points Reward</label>
            <input 
              type="number" 
              required
              min={0}
              value={formData.points_reward}
              onChange={(e) => setFormData({...formData, points_reward: e.target.valueAsNumber})}
              className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/30 mt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 mt-2 font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary hover:bg-white mt-2 text-black font-headline text-xs font-black px-6 py-2 uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="HAPUS TIER REWARD"
        description={<>Apakah kamu yakin ingin menghapus konfigurasi reward untuk <span className="text-white font-bold">Tier {deleteTarget?.tier}</span>?</>}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isLoading}
      />
    </div>
  );
}
