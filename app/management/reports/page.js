'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flag, Check, X, ArrowUpRight } from 'lucide-react';
import { useCurrentUser } from '@/components/UserContext';
import ConvertToIssueDialog from '@/components/ConvertToIssueDialog';

export default function ReportsPage() {
  const { user, userId } = useCurrentUser();
  const [reports, setReports] = useState(null);
  const [converting, setConverting] = useState(null);

  async function load() {
    const res = await fetch('/api/report');
    const json = await res.json();
    setReports(json.reports);
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id, status) {
    await fetch(`/api/report/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (user.role !== 'moderator') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-paper/50">Bu ekran sadece moderatörler için.</p>
        <Link href="/management" className="mt-3 inline-block text-mint">← Yönetime dön</Link>
      </div>
    );
  }

  if (!reports) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-paper/50">Yükleniyor…</div>;

  return (
    <div className="mx-auto w-[92vw] max-w-[1800px] py-10">
      <Link href="/management" className="mb-4 inline-block text-sm text-paper/50 hover:text-paper">← Yönetim</Link>
      <p className="font-mono text-xs uppercase tracking-wider text-stamp">Moderasyon</p>
      <h1 className="mb-1 font-display text-3xl font-bold">Kullanıcı Bildirimleri</h1>
      <p className="mb-6 text-sm text-paper/50">
        Bunlar kullanıcıların "Bildir" ile gönderdiği ham raporlar. Ciddi bulduğun bir raporu resmi bir Moderasyon
        Issue'suna dönüştürerek kartı incelemeye alabilirsin.
      </p>

      {reports.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-500 p-8 text-center text-paper/45">
          Bekleyen rapor yok.
        </p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border border-ink-500 bg-ink-700/40 p-3">
              <Flag size={16} className="shrink-0 text-stamp" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-paper">
                  {r.type === 'card' && r.cardCategory ? (
                    <Link href={`/bingo/${r.cardCategory}/${r.cardId}`} className="hover:underline">
                      {r.subjectLabel}
                    </Link>
                  ) : r.type === 'user' ? (
                    <Link href={`/profile/${r.targetUsername}`} className="hover:underline">
                      {r.subjectLabel}
                    </Link>
                  ) : (
                    <span>{r.subjectLabel}</span>
                  )}{' '}
                  <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-paper/40">
                    {r.type === 'user' ? 'profil' : 'kart'}
                  </span>{' '}
                  <span className="text-paper/40">— {r.reason}</span>
                </p>
                <p className="text-[11px] text-paper/40">
                  {r.reporterName} tarafından · {new Date(r.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  r.status === 'pending'
                    ? 'bg-marker/20 text-marker'
                    : r.status === 'resolved'
                    ? 'bg-mint/20 text-mint'
                    : r.status === 'converted'
                    ? 'bg-stamp/20 text-stamp'
                    : 'bg-ink-500/40 text-paper/50'
                }`}
              >
                {r.status === 'pending' ? 'bekliyor' : r.status === 'resolved' ? 'çözüldü' : r.status === 'converted' ? 'issue açıldı' : 'reddedildi'}
              </span>
              {r.status === 'pending' && (
                <div className="flex shrink-0 gap-1">
                  {r.type === 'card' && (
                    <button
                      onClick={() => setConverting(r)}
                      className="flex items-center gap-1 rounded-lg border border-ink-500 px-2 py-1.5 text-[11px] text-paper/70 hover:border-stamp hover:text-stamp"
                    >
                      <ArrowUpRight size={13} /> Issue'ya dönüştür
                    </button>
                  )}
                  <button
                    onClick={() => resolve(r.id, 'resolved')}
                    className="rounded-lg p-1.5 text-mint hover:bg-mint/15"
                    aria-label="Çözüldü olarak işaretle"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => resolve(r.id, 'dismissed')}
                    className="rounded-lg p-1.5 text-paper/40 hover:bg-ink-600"
                    aria-label="Reddet"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {converting && (
        <ConvertToIssueDialog
          report={converting}
          moderatorId={userId}
          onClose={() => setConverting(null)}
          onCreated={() => {
            setConverting(null);
            load();
          }}
        />
      )}
    </div>
  );
}
