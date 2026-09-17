'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search } from 'lucide-react';

const REASONS = ['Uygunsuz içerik', 'Yanıltıcı bilgi', 'Spam', 'Telif hakkı ihlali', 'Diğer'];

export default function CreateIssueDialog({ moderatorId, card, onClose, onCreated }) {
  const [selectedCard, setSelectedCard] = useState(card || null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [reason, setReason] = useState(REASONS[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function runSearch(q) {
    setQuery(q);
    if (!q.trim()) return setResults([]);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
    const json = await res.json();
    setResults(json.cards.slice(0, 6));
  }

  async function submit() {
    if (!selectedCard) return setError('Önce bir kart seç.');
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/moderation/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: selectedCard.id, moderatorId, reason, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Issue oluşturulamadı.');
      onCreated?.(json.issue);
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
          <h3 className="font-display font-bold">Yeni Moderasyon Issue'su</h3>
          <button onClick={onClose} className="rounded-full p-1 text-paper/60 hover:bg-ink-600">
            <X size={18} />
          </button>
        </div>

        {selectedCard ? (
          <div className="mb-3 flex items-center justify-between rounded-md border border-ink-500 bg-ink-700 px-3 py-2 text-sm">
            <span className="truncate">{selectedCard.title}</span>
            {!card && (
              <button onClick={() => setSelectedCard(null)} className="ml-2 shrink-0 text-xs text-paper/50 hover:text-stamp">
                değiştir
              </button>
            )}
          </div>
        ) : (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-paper/60">Kart ara</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/40" />
              <input
                value={query}
                onChange={(e) => runSearch(e.target.value)}
                placeholder="Kart adı yaz…"
                className="w-full rounded-md border border-ink-500 bg-ink-700 py-2 pl-9 pr-3 text-sm focus:border-mint"
                autoFocus
              />
            </div>
            {results.length > 0 && (
              <div className="mt-1.5 space-y-1 rounded-md border border-ink-500 bg-ink-700 p-1.5">
                {results.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCard(c);
                      setResults([]);
                    }}
                    className="block w-full truncate rounded px-2 py-1.5 text-left text-sm hover:bg-ink-600"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <label className="mb-1 block text-xs font-medium text-paper/60">Sebep</label>
        <div className="mb-3 space-y-1">
          {REASONS.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-ink-600">
              <input type="radio" name="issue-reason" checked={reason === r} onChange={() => setReason(r)} className="accent-stamp" />
              {r}
            </label>
          ))}
        </div>

        <label className="mb-1 block text-xs font-medium text-paper/60">Not (opsiyonel, sadece moderatörler görür)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-ink-500 bg-ink-700 px-3 py-2 text-sm focus:border-mint"
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
