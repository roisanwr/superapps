"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { saveLevelRule, deleteLevelRule } from "../actions";

export default function LevelRulesClient({ initialData }: { initialData: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    level: 1,
    minXp: 0,
    title: "",
  });

  const openAdd = () => {
    setFormData({ level: 1, minXp: 0, title: "" });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setFormData({ level: item.level, minXp: item.minXp, title: item.title || "" });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    try {
      await deleteLevelRule(deleteTarget.level);
      setDeleteTarget(null);
    } catch (e) {
      alert("Failed to delete. It might be in use.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await saveLevelRule({ level: Number(formData.level), minXp: Number(formData.minXp) }, !!editingItem);
      setIsModalOpen(false);
    } catch (error) {
      alert("Failed to save changes. Make sure ID/Level doesn't conflict.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-white">
            LEVEL RULES
          </h1>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-2 border-l-2 border-primary pl-3">
            MASTER DATA: XP REQUIREMENTS AND LEVEL TITLES.
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
            NO LEVEL RULES RECORDED.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-headline">
              <thead className="bg-surface-container-high border-b-2 border-outline-variant/50">
                <tr className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                  <th className="p-4 py-6 font-black w-24">Level</th>
                  <th className="p-4 py-6 font-black">Min XP Required</th>
                  <th className="p-4 py-6 font-black">Rank Title</th>
                  <th className="p-4 py-6 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold divide-y divide-outline-variant/20">
                {initialData.map((rule) => (
                  <tr key={rule.level} className="hover:bg-surface-bright transition-colors text-white">
                    <td className="p-4 text-primary">{rule.level}</td>
                    <td className="p-4">{rule.minXp.toLocaleString('id-ID')} XP</td>
                    <td className="p-4 text-[#ababab] uppercase">{rule.title || "-"}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEdit(rule)} className="text-xs text-on-surface-variant hover:text-white uppercase tracking-widest mr-3">Edit</button>
                      <button onClick={() => setDeleteTarget(rule)} className="text-xs text-on-surface-variant hover:text-error uppercase tracking-widest">Del</button>
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
        title={editingItem ? `EDIT LEVEL ${editingItem.level}` : "ADD NEW LEVEL RULE"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Level Number</label>
            <input 
              type="number" 
              required
              disabled={!!editingItem} // Usually shouldn't edit primary key directly unless we handle it in backend
              min={1}
              value={formData.level}
              onChange={(e) => setFormData({...formData, level: e.target.valueAsNumber})}
              className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Minimum XP</label>
            <input 
              type="number" 
              required
              min={0}
              value={formData.minXp}
              onChange={(e) => setFormData({...formData, minXp: e.target.valueAsNumber})}
              className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Rank Title (Optional)</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
              placeholder="e.g. Novice, Elite, etc."
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary hover:bg-white text-black font-headline text-xs font-black px-6 py-2 uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="HAPUS LEVEL RULE"
        description={<>Apakah kamu yakin ingin menghapus <span className="text-white font-bold">Level {deleteTarget?.level}</span>?</>}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isLoading}
      />
    </div>
  );
}
