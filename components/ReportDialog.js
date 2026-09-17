'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const REASONS = ['Uygunsuz içerik', 'Spam', 'Yanıltıcı bilgi', 'Telif hakkı ihlali', 'Diğer'];

export default function ReportDialog({ onClose, onSubmit }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [sent, setSent] = useState(false);

  function submit() {
    onSubmit(reason);
    setSent(true);
    setTimeout(onClose, 1100);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border border-ink-500 bg-ink-800 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display font-bold">Bu kartı bildir</h3>
          <button onClick={onClose} className="rounded-full p-1 text-paper/60 hover:bg-ink-600">
            <X size={18} />
          </button>
        </div>
        {sent ? (
          <p className="py-4 text-sm text-mint">Bildirimin alındı. Moderasyon ekibi inceleyecek.</p>
        ) : (
          <>
            <div className="space-y-1.5">
              {REASONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-600">
                  <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-stamp" />
                  {r}
                </label>
              ))}
            </div>
            <button onClick={submit} className="mt-4 w-full rounded-xl bg-stamp py-2.5 text-sm font-semibold text-ink hover:bg-stamp-light">
              Bildir
            </button>
          </>
        )}
      </div>
    </div>
  );
}
