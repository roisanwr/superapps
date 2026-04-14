"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { saveDifficultyScale, deleteDifficultyScale } from "../actions";

export default function DifficultyScalesClient({ initialData }: { initialData: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    scaleType: "strength",
    tier: "C",
    targetValue: 0,
  });

  const openAdd = () => {
    setFormData({ scaleType: "strength", tier: "C", targetValue: 0 });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setFormData({
      scaleType: item.scaleType,
      tier: item.tier,
      targetValue: item.targetValue,
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    try {
      await deleteDifficultyScale(deleteTarget.scaleType, deleteTarget.tier);
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
      await saveDifficultyScale(formData, editingItem ? { scaleType: editingItem.scaleType, tier: editingItem.tier } : undefined);
      setIsModalOpen(false);
    } catch (error) {
      alert("Failed to save changes. Make sure this Scale + Tier combination isn't already used.");
    } finally {
      setIsLoading(false);
    }
  };

  // Group by scaleType
  const groupedScales = initialData.reduce((acc: any, scale) => {
    if (!acc[scale.scaleType]) {
      acc[scale.scaleType] = [];
    }
    acc[scale.scaleType].push(scale);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-white">
            DIFFICULTY SCALES
          </h1>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-2 border-l-2 border-primary pl-3">
            MASTER DATA: BASE TARGET VALUES PER MEASUREMENT TYPE AND TIER.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary hover:bg-white text-black font-headline font-black px-4 py-2 uppercase tracking-widest transition-colors text-xs shadow-[0_0_10px_rgba(142,255,113,0.3)] hover:shadow-none"
        >
          + ADD NEW
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm mt-0 -mx-4 -my-4 rounded-xl">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {Object.keys(groupedScales).length === 0 ? (
          <div className="col-span-full p-12 text-center text-on-surface-variant font-headline uppercase tracking-widest text-sm border-b-2 border-primary border-dashed bg-surface-container">
            NO DIFFICULTY SCALES RECORDED.
          </div>
        ) : (
          Object.entries(groupedScales).map(([scaleType, items]: [string, any]) => (
            <div key={scaleType} className="bg-surface-container border border-outline-variant/30 overflow-hidden h-fit">
              <div className="bg-surface-container-high border-b-2 border-outline-variant/50 p-4">
                <h2 className="font-headline font-black text-xl text-primary uppercase tracking-widest">
                  {scaleType.replace("_", " ")}
                </h2>
              </div>
              <table className="w-full text-left font-headline">
                <thead className="bg-surface-container-high/50 border-b border-outline-variant/30">
                  <tr className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                    <th className="p-4 py-3 font-black">Tier Rank</th>
                    <th className="p-4 py-3 font-black">Target Base Value</th>
                    <th className="p-4 py-3 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold divide-y divide-outline-variant/20">
                  {items.map((item: any) => (
                    <tr key={`${item.scaleType}-${item.tier}`} className="hover:bg-surface-bright transition-colors text-white">
                      <td className="p-4 text-xs font-black w-24">
                        <span className={`px-2 py-1 rounded-sm ${item.tier === 'SS' ? 'bg-[#ffcc00]/20 text-[#ffcc00]' :
                            item.tier === 'S' ? 'bg-error/20 text-error' :
                              item.tier === 'A' ? 'bg-[#ff8800]/20 text-[#ff8800]' :
                                item.tier === 'B' ? 'bg-primary/20 text-primary' :
                                  item.tier === 'C' ? 'bg-secondary/20 text-secondary' :
                                    'bg-surface-container-higher text-on-surface'
                          }`}>
                          {item.tier}
                        </span>
                      </td>
                      <td className="p-4 text-[#ababab]">{item.targetValue}</td>
                      <td className="p-4 text-right min-w-[120px]">
                        <button onClick={() => openEdit(item)} className="text-[10px] text-on-surface-variant hover:text-white uppercase tracking-widest mr-3 transition-colors">Edit</button>
                        <button onClick={() => setDeleteTarget(item)} className="text-[10px] text-on-surface-variant hover:text-error uppercase tracking-widest transition-colors">Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `EDIT: ${editingItem.scaleType.toUpperCase()} / TIER ${editingItem.tier}` : "ADD NEW SCALE / TIER"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Scale Type</label>
            <select
              value={formData.scaleType}
              onChange={(e) => setFormData({ ...formData, scaleType: e.target.value })}
              className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
            >
              <option value="endurance">Endurance</option>
              <option value="strength">Strength</option>
              <option value="power">Power</option>
              <option value="static_hold">Static Hold</option>
              <option value="cardio_run">Cardio Run</option>
              <option value="mobility">Mobility</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Tier</label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
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
            <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Target Base Value</label>
            <input
              type="number"
              required
              min={0}
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: e.target.valueAsNumber })}
              className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
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
        title="HAPUS DIFFICULTY SCALE"
        description={<>Apakah kamu yakin ingin menghapus <span className="text-white font-bold">{deleteTarget?.scaleType} - {deleteTarget?.tier}</span>?</>}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isLoading}
      />
    </div>
  );
}
