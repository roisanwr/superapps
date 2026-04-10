"use client";

import { useState, useTransition } from "react";
import { Trash2, Zap, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { removeProgramAction, setActiveProgramAction } from "./actions";

interface Props {
  programId: string;
  programTitle: string;
  isActive: boolean;
}

export function ProgramActionButtons({ programId, programTitle, isActive }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleActivate = () => {
    startTransition(async () => {
      await setActiveProgramAction(programId);
      setShowActivateModal(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await removeProgramAction(programId);
      setShowDeleteModal(false);
    });
  };

  return (
    <>
      {!isActive && (
        <button
          onClick={() => setShowActivateModal(true)}
          disabled={isPending}
          className="text-secondary/70 hover:text-secondary transition-colors p-2 disabled:opacity-50"
          title="Set as Active Program"
        >
          <Zap className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={() => setShowDeleteModal(true)}
        disabled={isPending}
        className="text-error/40 hover:text-error transition-colors p-2 disabled:opacity-50"
        title="Delete Program"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <Modal
        isOpen={showActivateModal}
        onClose={() => !isPending && setShowActivateModal(false)}
        title="AKTIFKAN PROGRAM"
      >
        <div className="space-y-6 text-center">
          <Zap className="w-16 h-16 mx-auto text-secondary" />
          <p className="font-body text-sm text-on-surface-variant">
            Apakah kamu yakin ingin mengaktifkan jadwal <span className="text-white font-bold">{programTitle}</span>?
            <br className="mt-2" />
            Ini akan menonaktifkan program yang sedang berjalan saat ini.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowActivateModal(false)}
              disabled={isPending}
              className="flex-1 py-3 text-sm font-headline font-black uppercase text-on-surface-variant border border-on-surface-variant hover:text-white hover:border-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleActivate}
              disabled={isPending}
              className="flex-1 py-3 text-sm font-headline font-black uppercase bg-secondary text-black hover:shadow-[0_0_15px_rgba(213,117,255,0.4)] transition-all flex justify-center items-center gap-2"
            >
              {isPending ? "MEMPROSES..." : "YA, AKTIFKAN"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => !isPending && setShowDeleteModal(false)}
        title="HAPUS PROGRAM"
      >
        <div className="space-y-6 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-error" />
          <p className="font-body text-sm text-on-surface-variant">
            Apakah kamu yakin ingin menghapus jadwal <span className="text-white font-bold">{programTitle}</span> secara permanen?
            <br className="mt-2" />
            Tindakan ini tidak dapat dikembalikan.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={isPending}
              className="flex-1 py-3 text-sm font-headline font-black uppercase text-on-surface-variant border border-on-surface-variant hover:text-white hover:border-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 py-3 text-sm font-headline font-black uppercase bg-error text-white hover:shadow-[0_0_15px_rgba(255,84,73,0.4)] transition-all flex justify-center items-center gap-2"
            >
              {isPending ? "MENGHAPUS..." : "YA, HAPUS"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
