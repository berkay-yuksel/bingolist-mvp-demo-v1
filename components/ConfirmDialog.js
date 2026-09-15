'use client';

import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ title, body, confirmLabel = 'Onayla', busy, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-ink-500 bg-ink-800 p-5 shadow-ticket">
        <div className="mb-3 flex items-center gap-2 text-stamp">
          <AlertTriangle size={18} />
          <h3 className="font-display text-lg font-bold text-paper">{title}</h3>
        </div>
        <p className="mb-5 text-sm text-paper/60">{body}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-ink-500 py-2.5 text-sm font-medium text-paper/70 hover:border-paper/40"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-lg bg-stamp py-2.5 text-sm font-semibold text-ink hover:bg-stamp-light disabled:opacity-60"
          >
            {busy ? 'Siliniyor…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
