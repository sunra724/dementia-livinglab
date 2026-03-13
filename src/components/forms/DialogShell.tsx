'use client';

import { X } from 'lucide-react';

interface DialogShellProps {
  isOpen: boolean;
  title: string;
  description: string;
  submitLabel: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  children: React.ReactNode;
}

export default function DialogShell({
  isOpen,
  title,
  description,
  submitLabel,
  submitting = false,
  onClose,
  onSubmit,
  children,
}: DialogShellProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={submitting}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? '저장 중...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
