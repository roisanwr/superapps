"use client";

import { ReactNode } from "react";
import { Modal } from "./Modal";
import { AlertTriangle, Zap } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "YA",
  cancelText = "BATAL",
  onConfirm,
  onCancel,
  isLoading = false,
  isDestructive = true,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => !isLoading && onCancel()} title={title}>
      <div className="space-y-6 text-center">
        {isDestructive ? (
          <AlertTriangle className="w-16 h-16 mx-auto text-error" />
        ) : (
          <Zap className="w-16 h-16 mx-auto text-secondary" />
        )}
        <div className="font-body text-sm text-on-surface-variant">
          {description}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => onCancel()}
            disabled={isLoading}
            className="flex-1 py-3 text-sm font-headline font-black uppercase text-on-surface-variant border border-on-surface-variant hover:text-white hover:border-white transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 text-sm font-headline font-black uppercase transition-all flex justify-center items-center gap-2 ${
              isDestructive
                ? "bg-error text-white hover:shadow-[0_0_15px_rgba(255,84,73,0.4)]"
                : "bg-secondary text-black hover:shadow-[0_0_15px_rgba(213,117,255,0.4)]"
            }`}
          >
            {isLoading ? "MEMPROSES..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
