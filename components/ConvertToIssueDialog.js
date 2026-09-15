'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function ConvertToIssueDialog({ report, moderatorId, onClose, onCreated }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/moderation/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: report.cardId,
          moderatorId,
          reason: report.reason,
          message,
          reportId: report.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Issue oluşturulamadı.');
      onCreated();
      router.push(`/management/moderation/${json.issue.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-ink-500 bg-ink-800 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display font-bold">Issue'ya dönüştür</h3>
          <button onClick={onClose} className="rounded-full p-1 text-paper/60 hover:bg-ink-600">
            <X size={18} />
          </button>
        </div>
        <p className="mb-3 text-sm text-paper/60">
          <strong className="text-paper">{report.subjectLabel}</strong> kartı için bir Moderasyon Issue'su açılacak ve
          kart otomatik olarak incelemeye alınacak (yayından kalkmaz, ama "İncelemede" işaretlenir).
        </p>
        <div className="mb-3 rounded-md border border-ink-500 bg-ink-700 p-2 text-xs text-paper/60">
          Rapor sebebi: <span className="text-paper">{report.reason}</span>
        </div>
        <label className="mb-1 block text-xs font-medium text-paper/60">Not (opsiyonel, sadece moderatörler görür)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-ink-500 bg-ink-700 px-3 py-2 text-sm focus:border-mint"
          placeholder="İncelerken dikkat edilecek noktalar…"
        />
        {error && <p className="mt-2 text-xs text-stamp">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting}
          className="mt-4 w-full rounded-lg bg-stamp py-2.5 text-sm font-semibold text-ink hover:bg-stamp-light disabled:opacity-60"
        >
          {submitting ? 'Oluşturuluyor…' : 'Issue Oluştur ve İncelemeyi Başlat'}
        </button>
      </div>
    </div>
  );
}
