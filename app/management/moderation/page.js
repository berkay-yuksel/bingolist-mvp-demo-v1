'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useCurrentUser } from '@/components/UserContext';
import CreateIssueDialog from '@/components/CreateIssueDialog';

const FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'UNDER_REVIEW', label: 'İnceleniyor' },
  { id: 'REVISION_REQUESTED', label: 'Revizyon İstendi' },
  { id: 'PENDING_REVIEW', label: 'İncelemeyi Bekliyor' },
  { id: 'RESOLVED', label: 'Çözüldü' },
];

const STATUS_STYLE = {
  OPEN: 'bg-ink-500/40 text-paper/60',
  UNDER_REVIEW: 'bg-marker/20 text-marker',
  REVISION_REQUESTED: 'bg-stamp/20 text-stamp',
  PENDING_REVIEW: 'bg-mint/20 text-mint',
  RESOLVED: 'bg-ink-500/30 text-paper/50',
};

const STATUS_LABEL = {
  OPEN: 'Açık',
  UNDER_REVIEW: 'İnceleniyor',
  REVISION_REQUESTED: 'Revizyon İstendi',
  PENDING_REVIEW: 'İncelemeyi Bekliyor',
  RESOLVED: 'Çözüldü',
};

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}dk önce`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}sa önce`;
  return `${Math.round(hours / 24)}g önce`;
}

export default function ModerationIssuesPage() {
  const { user, userId } = useCurrentUser();
  const [filter, setFilter] = useState('all');
  const [issues, setIssues] = useState(null);
  const [creating, setCreating] = useState(false);

  async function load(status) {
    const qs = status && status !== 'all' ? `?status=${status}` : '';
    const res = await fetch(`/api/moderation/issues${qs}`);
    const json = await res.json();
    setIssues(json.issues);
  }

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  if (user.role !== 'moderator') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-paper/50">Bu ekran sadece moderatörler için.</p>
        <Link href="/management" className="mt-3 inline-block text-mint">← Yönetime dön</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[92vw] max-w-[1800px] py-10">
      <Link href="/management" className="mb-4 inline-block text-sm text-paper/50 hover:text-paper">← Yönetim</Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-stamp">Moderasyon</p>
          <h1 className="font-display text-3xl font-bold">Issue'lar</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-full bg-stamp px-4 py-2 text-sm font-semibold text-ink hover:bg-stamp-light"
        >
          <Plus size={15} /> Yeni Issue
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              filter === f.id ? 'border-mint text-mint' : 'border-ink-500 text-paper/55 hover:border-mint hover:text-mint'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!issues ? (
        <p className="text-paper/45">Yükleniyor…</p>
      ) : issues.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-500 p-8 text-center text-paper/45">Bu filtrede issue yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-ink-500">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-ink-700/60 text-xs uppercase tracking-wide text-paper/45">
              <tr>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium">Bingo</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Moderatör</th>
                <th className="px-4 py-3 font-medium">Güncellendi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-500/40">
              {issues.map((i) => (
                <tr key={i.id} className="hover:bg-ink-700/30">
                  <td className="px-4 py-3">
                    <Link href={`/management/moderation/${i.id}`} className="font-mono text-xs text-mint hover:underline">
                      #{i.id.replace('issue_', '')}
                    </Link>
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-paper">{i.cardTitle}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[i.status]}`}>
                      {STATUS_LABEL[i.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-paper/60">{i.moderatorUsername ? `@${i.moderatorUsername}` : '—'}</td>
                  <td className="px-4 py-3 text-paper/45">{timeAgo(i.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CreateIssueDialog
          moderatorId={userId}
          onClose={() => setCreating(false)}
          onCreated={() => setCreating(false)}
        />
      )}
    </div>
  );
}
