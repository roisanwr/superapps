"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { saveTaskLibrary, deleteTaskLibrary } from "../actions";
import { ShieldAlert, Target } from "lucide-react";

export default function TaskLibraryClient({ initialData }: { initialData: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    defaultPriority: "Medium",
    defaultFrequency: "Daily",
    defaultTargetValue: 1,
    defaultUnit: "Checklist",
    iconEmoji: "📋",
    polarity: "POSITIVE",
  });

  const openAdd = () => {
    setFormData({ 
      title: "", category: "General", defaultPriority: "Medium", 
      defaultFrequency: "Daily", defaultTargetValue: 1, 
      defaultUnit: "Checklist", iconEmoji: "📋", polarity: "POSITIVE"
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setFormData({
      title: item.title,
      category: item.category,
      defaultPriority: item.defaultPriority,
      defaultFrequency: item.defaultFrequency,
      defaultTargetValue: item.defaultTargetValue,
      defaultUnit: item.defaultUnit,
      iconEmoji: item.iconEmoji || "📋",
      polarity: item.polarity ?? "POSITIVE",
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    try {
      await deleteTaskLibrary(deleteTarget.id);
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
      await saveTaskLibrary(formData, editingItem?.id);
      setIsModalOpen(false);
    } catch (error) {
      alert("Failed to save changes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-white">
            TASK LIBRARY
          </h1>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-2 border-l-2 border-primary pl-3">
            MASTER DATA: DEFAULT TASKS AND QUEST TEMPLATES.
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
            NO TASKS FOUND IN THE LIBRARY.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-headline">
              <thead className="bg-surface-container-high border-b-2 border-outline-variant/50">
                <tr className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                  <th className="p-4 py-6 font-black w-14 text-center">Icon</th>
                  <th className="p-4 py-6 font-black">Title</th>
                  <th className="p-4 py-6 font-black">Category</th>
                  <th className="p-4 py-6 font-black text-center">Type</th>
                  <th className="p-4 py-6 font-black text-center">Priority</th>
                  <th className="p-4 py-6 font-black text-center">Freq.</th>
                  <th className="p-4 py-6 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold divide-y divide-outline-variant/20">
                  {initialData.map((t) => (
                   <tr key={t.id} className="hover:bg-surface-bright transition-colors text-white">
                     <td className="p-4 text-center text-xl">{t.iconEmoji || "📋"}</td>
                     <td className="p-4 uppercase text-primary">{t.title}</td>
                     <td className="p-4 text-[#ababab] uppercase">{t.category}</td>
                     <td className="p-4 text-center">
                       {(t.polarity ?? "POSITIVE") === "NEGATIVE" ? (
                         <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase bg-error/20 text-error flex items-center justify-center gap-1 w-fit mx-auto">
                           <ShieldAlert className="w-3 h-3" /> FORBIDDEN
                         </span>
                       ) : (
                         <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase bg-primary/20 text-primary flex items-center justify-center gap-1 w-fit mx-auto">
                           <Target className="w-3 h-3" /> OBJECTIVE
                         </span>
                       )}
                     </td>
                     <td className="p-4 text-center">
                       <span className={`px-2 py-0.5 text-[9px] tracking-widest uppercase ${
                         t.defaultPriority === 'High' ? 'bg-error/20 text-error' : 
                         t.defaultPriority === 'Medium' ? 'bg-secondary/20 text-secondary' : 
                         'bg-surface-container-higher text-on-surface'
                       }`}>
                         {t.defaultPriority}
                       </span>
                     </td>
                     <td className="p-4 text-center text-xs uppercase text-on-surface-variant">
                       {t.defaultFrequency}
                     </td>
                     <td className="p-4 text-right min-w-[120px]">
                       <button onClick={() => openEdit(t)} className="text-[10px] text-on-surface-variant hover:text-white uppercase tracking-widest mr-3 transition-colors">Edit</button>
                       <button onClick={() => setDeleteTarget(t)} className="text-[10px] text-on-surface-variant hover:text-error uppercase tracking-widest transition-colors">Del</button>
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
        title={editingItem ? "EDIT TASK TEMPLATE" : "ADD NEW TASK TEMPLATE"}
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Task Title</label>
              <input 
                type="text" required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Category</label>
              <input 
                type="text" required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Icon Emoji</label>
              <input 
                type="text" required
                maxLength={2}
                value={formData.iconEmoji}
                onChange={(e) => setFormData({...formData, iconEmoji: e.target.value})}
                className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
                placeholder="e.g. 🏋️‍♂️"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-2">Task Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, polarity: "POSITIVE"})}
                  className={`flex items-center justify-center gap-2 py-2.5 border font-headline font-black text-xs uppercase tracking-widest transition-all ${
                    formData.polarity === "POSITIVE"
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-surface-container-higher border-outline-variant text-on-surface-variant hover:text-white"
                  }`}
                >
                  <Target className="w-4 h-4" /> 🎯 Objective
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, polarity: "NEGATIVE"})}
                  className={`flex items-center justify-center gap-2 py-2.5 border font-headline font-black text-xs uppercase tracking-widest transition-all ${
                    formData.polarity === "NEGATIVE"
                      ? "bg-error/20 border-error text-error"
                      : "bg-surface-container-higher border-outline-variant text-on-surface-variant hover:text-white"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" /> 🚫 Forbidden
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Priority</label>
              <select 
                value={formData.defaultPriority}
                onChange={(e) => setFormData({...formData, defaultPriority: e.target.value})}
                className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Frequency</label>
              <select 
                value={formData.defaultFrequency}
                onChange={(e) => setFormData({...formData, defaultFrequency: e.target.value})}
                className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="OneTime">One Time</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Default Target</label>
              <input 
                type="number" required min={1}
                value={formData.defaultTargetValue}
                onChange={(e) => setFormData({...formData, defaultTargetValue: e.target.valueAsNumber})}
                className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Unit</label>
              <input 
                type="text" required
                value={formData.defaultUnit}
                onChange={(e) => setFormData({...formData, defaultUnit: e.target.value})}
                className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
                placeholder="e.g. Checklist, Reps, Mins"
              />
            </div>
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
        title="HAPUS TASK TEMPLATE"
        description={<>Apakah kamu yakin ingin menghapus task <span className="text-white font-bold">&quot;{deleteTarget?.title}&quot;</span> secara permanen?</>}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isLoading}
      />
    </div>
  );
}
