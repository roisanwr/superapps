"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { saveExerciseLibrary, deleteExerciseLibrary } from "../actions";

export default function ExerciseLibraryClient({ initialData, userId }: { initialData: any[], userId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    target_muscle: "",
    scale_type: "strength",
    measurement_unit: "reps",
    image_url: "",
    is_archived: false,
  });

  const openAdd = () => {
    setFormData({
      name: "", target_muscle: "", scale_type: "strength",
      measurement_unit: "reps", image_url: "", is_archived: false
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setFormData({
      name: item.name,
      target_muscle: item.target_muscle || "",
      scale_type: item.scale_type,
      measurement_unit: item.measurement_unit || "",
      image_url: item.image_url || "",
      is_archived: item.is_archived || false,
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    try {
      await deleteExerciseLibrary(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      alert("Failed to delete. It might be in use by workout schedules.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const dataToSave = { ...formData, created_by: userId };
      await saveExerciseLibrary(dataToSave, editingItem?.id);
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
            EXERCISE LIBRARY
          </h1>
          <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-2 border-l-2 border-primary pl-3">
            MASTER DATA: PHYSICAL TRAINING MOVEMENT DATABASE.
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
            NO EXERCISES FOUND IN THE LIBRARY.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-headline">
              <thead className="bg-surface-container-high border-b-2 border-outline-variant/50">
                <tr className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                  <th className="p-4 py-6 font-black w-24">Image</th>
                  <th className="p-4 py-6 font-black">Movement Name</th>
                  <th className="p-4 py-6 font-black">Target Muscle</th>
                  <th className="p-4 py-6 font-black">Scale Type</th>
                  <th className="p-4 py-6 font-black">Unit</th>
                  <th className="p-4 py-6 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold divide-y divide-outline-variant/20">
                {initialData.map((ex) => (
                  <tr key={ex.id} className="hover:bg-surface-bright transition-colors text-white">
                    <td className="p-4">
                      {ex.image_url ? (
                        <div className="w-12 h-12 bg-surface-container-highest border border-outline-variant overflow-hidden">
                          <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover grayscale opacity-80" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-surface-container-highest border border-outline-variant flex items-center justify-center text-on-surface-variant/50">
                          <span className="material-symbols-outlined text-xl">image</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 uppercase text-primary">
                      {ex.name}
                      {ex.is_archived && <span className="ml-2 text-[8px] bg-error/20 text-error px-1 py-0.5 uppercase tracking-tighter">Archived</span>}
                    </td>
                    <td className="p-4 text-[#ababab] uppercase">{ex.target_muscle || "-"}</td>
                    <td className="p-4 text-xs font-mono lowercase text-secondary">{ex.scale_type}</td>
                    <td className="p-4 text-xs lowercase text-on-surface-variant">{ex.measurement_unit}</td>
                    <td className="p-4 text-right min-w-[120px]">
                      <button onClick={() => openEdit(ex)} className="text-[10px] text-on-surface-variant hover:text-white uppercase tracking-widest mr-3 transition-colors">Edit</button>
                      <button onClick={() => setDeleteTarget(ex)} className="text-[10px] text-on-surface-variant hover:text-error uppercase tracking-widest transition-colors">Del</button>
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
        title={editingItem ? "EDIT EXERCISE" : "ADD NEW EXERCISE"}
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Movement Name</label>
              <input
                type="text" required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
                placeholder="e.g. Barbell Bench Press, Plank"
              />
            </div>
            <div>
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Target Muscle</label>
              <input
                type="text"
                value={formData.target_muscle}
                onChange={(e) => setFormData({ ...formData, target_muscle: e.target.value })}
                className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
                placeholder="e.g. Chest, Core"
              />
            </div>
            <div>
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Scale Type</label>
              <select
                value={formData.scale_type}
                onChange={(e) => setFormData({ ...formData, scale_type: e.target.value })}
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
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Measurement Unit</label>
              <input
                type="text"
                value={formData.measurement_unit}
                onChange={(e) => setFormData({ ...formData, measurement_unit: e.target.value })}
                className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
                placeholder="e.g. reps, secs, km"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-1">Image URL (Optional)</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full bg-surface-container-higher border border-outline-variant p-2 text-white font-body focus:border-primary outline-none transition-colors"
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="archived"
                checked={formData.is_archived}
                onChange={(e) => setFormData({ ...formData, is_archived: e.target.checked })}
                className="w-4 h-4 bg-transparent border border-outline-variant checked:bg-primary accent-primary"
              />
              <label htmlFor="archived" className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant select-none">Mark as Archived</label>
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
        title="HAPUS EXERCISE"
        description={<>Apakah kamu yakin ingin menghapus <span className="text-white font-bold">&quot;{deleteTarget?.name}&quot;</span> secara permanen?</>}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isLoading}
      />
    </div>
  );
}
