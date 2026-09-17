'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/components/UserContext';

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

export default function IssueDetailPage({ params }) {
  const { id } = use(params);
  const { user, userId } = useCurrentUser();
  const [data, setData] = useState(null);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    const res = await fetch(`/api/moderation/issues/${id}`);
    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(action, extra = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/moderation/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderatorId: userId, action, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'İşlem başarısız.');
      setShowRevisionForm(false);
      setRequestText('');
      setMessageText('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendReply() {
    if (!replyText.trim()) return;
    setReplySending(true);
    setError(null);
    try {
      const res = await fetch(`/api/moderation/issues/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: replyText }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gönderilemedi.');
      setReplyText('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setReplySending(false);
    }
  }

  if (!data) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-paper/50">Yükleniyor…</div>;
  if (data.error) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-stamp">{data.error}</div>;

  const { issue, card } = data;
  const isModerator = user.role === 'moderator';
  const isCreator = userId === issue.creatorId;

  if (!isModerator && !isCreator) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-paper/50">Bu issue'yu görüntüleme yetkin yok.</p>
        <Link href="/" className="mt-3 inline-block text-mint">← Keşfete dön</Link>
      </div>
    );
  }

  const isAssignedToMe = isModerator && issue.assignedModeratorId === userId;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={isModerator ? '/management/moderation' : `/profile/${user.username}/settings`}
        className="mb-4 inline-block text-sm text-paper/50 hover:text-paper"
      >
        ← {isModerator ? "Issue'lar" : 'Seçenekler'}
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-paper/40">#{issue.id.replace('issue_', '')}</p>
          <h1 className="font-display text-2xl font-bold">{issue.cardTitle}</h1>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[issue.status]}`}>
          {STATUS_LABEL[issue.status]}
        </span>
      </div>

      {card && (
        <Link href={`/bingo/${card.category}/${card.id}`} className="mb-4 inline-block text-sm text-mint hover:underline">
          Kartı görüntüle →
        </Link>
      )}

      <div className="space-y-3 rounded-lg border border-ink-500 bg-ink-700/40 p-4 text-sm">
        <div>
          <p className="text-xs text-paper/45">Moderatör</p>
          <p className="text-paper">{issue.moderatorName ? `@${issue.moderatorUsername}` : 'Atanmamış'}</p>
        </div>
        <div>
          <p className="text-xs text-paper/45">Creator</p>
          <p className="text-paper">{issue.creatorName ? `@${issue.creatorUsername}` : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-paper/45">Sebep</p>
          <p className="text-paper">{issue.reason}</p>
        </div>
        {issue.message && isModerator && (
          <div>
            <p className="text-xs text-paper/45">Not (moderatörlere özel)</p>
            <p className="text-paper">{issue.message}</p>
          </div>
        )}
        {issue.request && (
          <div>
            <p className="text-xs text-paper/45">Creator'a iletilen talep</p>
            <p className="text-paper">{issue.request}</p>
          </div>
        )}
      </div>

      {error && <p className="mt-3 rounded-md border border-stamp/40 bg-stamp/10 px-3 py-2 text-sm text-stamp">{error}</p>}

      {isCreator && !isModerator && issue.status !== 'RESOLVED' && (
        <div className="mt-4 space-y-3">
          {issue.status === 'REVISION_REQUESTED' && (
            <div className="rounded-md border border-marker/40 bg-marker/10 px-3 py-2 text-sm text-marker">
              Değişiklik yapman gerekiyor.{' '}
              <Link href={`/bingo/${card?.category}/${card?.id}/edit`} className="underline">
                Kartı düzenle →
              </Link>
            </div>
          )}

          <div className="rounded-lg border border-ink-500 bg-ink-700/40 p-4">
            <p className="mb-2 text-sm font-medium text-paper/70">Moderatöre cevap ver</p>
            <p className="mb-3 text-xs text-paper/45">
              {issue.status === 'REVISION_REQUESTED'
                ? 'Düzenleme yapmadan önce itirazını belirtebilir, ek bilgi verebilir veya bir soru sorabilirsin — bu kartın durumunu değiştirmez.'
                : 'Kartın incelemede — moderatöre bir açıklama veya soru gönderebilirsin.'}
            </p>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              placeholder="Örn. Bu bilgi aslında doğru, kaynak: …"
              className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
            />
            <button
              onClick={sendReply}
              disabled={replySending || !replyText.trim()}
              className="mt-2 rounded-lg border border-ink-500 px-4 py-2 text-sm font-medium text-paper/80 hover:border-mint hover:text-mint disabled:opacity-50"
            >
              {replySending ? 'Gönderiliyor…' : 'Cevap Ver'}
            </button>
          </div>
        </div>
      )}

      {isAssignedToMe && issue.status !== 'RESOLVED' && (
        <div className="mt-4 rounded-lg border border-ink-500 bg-ink-700/40 p-4">
          <p className="mb-2 text-sm font-medium text-paper/70">Creator'a yanıt yaz</p>
          <p className="mb-3 text-xs text-paper/45">
            Bir soru sorabilir, ek açıklama isteyebilir veya itirazına cevap verebilirsin — bu, aksiyon almadan sadece
            mesajlaşmanı sağlar.
          </p>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            placeholder="Örn. Kaynağı paylaşabilir misin?"
            className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
          />
          <button
            onClick={sendReply}
            disabled={replySending || !replyText.trim()}
            className="mt-2 rounded-lg border border-ink-500 px-4 py-2 text-sm font-medium text-paper/80 hover:border-mint hover:text-mint disabled:opacity-50"
          >
            {replySending ? 'Gönderiliyor…' : 'Cevap Ver'}
          </button>
        </div>
      )}

      {isModerator && !isAssignedToMe && issue.status !== 'RESOLVED' && (
        <p className="mt-4 rounded-md border border-ink-500 bg-ink-700/40 px-3 py-2 text-sm text-paper/60">
          Bu issue @{issue.moderatorUsername} tarafından üstlenilmiş.
        </p>
      )}

      {isAssignedToMe && issue.status === 'UNDER_REVIEW' && !showRevisionForm && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => act('resolve')}
            disabled={busy}
            className="flex-1 rounded-lg bg-mint py-2.5 text-sm font-semibold text-ink hover:bg-mint-dark disabled:opacity-60"
          >
            Sorun Yok — Çöz
          </button>
          <button
            onClick={() => setShowRevisionForm(true)}
            className="flex-1 rounded-lg bg-stamp py-2.5 text-sm font-semibold text-ink hover:bg-stamp-light"
          >
            Revizyon İste
          </button>
        </div>
      )}

      {isAssignedToMe && issue.status === 'PENDING_REVIEW' && !showRevisionForm && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => act('approve')}
            disabled={busy}
            className="flex-1 rounded-lg bg-mint py-2.5 text-sm font-semibold text-ink hover:bg-mint-dark disabled:opacity-60"
          >
            Revizyonu Onayla
          </button>
          <button
            onClick={() => setShowRevisionForm(true)}
            className="flex-1 rounded-lg bg-stamp py-2.5 text-sm font-semibold text-ink hover:bg-stamp-light"
          >
            Tekrar Revizyon İste
          </button>
        </div>
      )}

      {isAssignedToMe && showRevisionForm && (
        <div className="mt-4 space-y-2 rounded-lg border border-ink-500 bg-ink-700/40 p-4">
          <label className="block text-xs font-medium text-paper/60">Creator'a talep (zorunlu)</label>
          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            rows={2}
            placeholder="Örn. 4, 8 ve 12 numaralı hücreleri gözden geçirip bilgiyi güncelle."
            className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
          />
          <label className="block text-xs font-medium text-paper/60">Moderatör notu (opsiyonel)</label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => act('request_revision', { request: requestText, message: messageText })}
              disabled={busy || !requestText.trim()}
              className="flex-1 rounded-lg bg-stamp py-2.5 text-sm font-semibold text-ink hover:bg-stamp-light disabled:opacity-50"
            >
              Revizyonu Gönder
            </button>
            <button
              onClick={() => setShowRevisionForm(false)}
              className="rounded-lg border border-ink-500 px-4 py-2.5 text-sm text-paper/60 hover:text-paper"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {issue.status === 'REVISION_REQUESTED' && (
        <div className="mt-4 rounded-md border border-marker/40 bg-marker/10 px-3 py-2 text-sm text-marker">
          Creator'ın değişiklik yapıp incelemeye göndermesi bekleniyor.
          {isAssignedToMe && (
            <>
              {' '}
              Creator'la konuşup gerek kalmadığına mı karar verdin?{' '}
              <button
                onClick={() => act('resolve')}
                disabled={busy}
                className="font-semibold underline hover:text-marker/80 disabled:opacity-60"
              >
                Revizyon talebini iptal et ve çöz
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-paper/45">Geçmiş</p>
        <div className="space-y-3 border-l border-ink-500 pl-4">
          {issue.history.map((h, i) => (
            <div key={i}>
              <p className="text-xs text-paper/40">{new Date(h.at).toLocaleString('tr-TR')} · {h.actor}</p>
              <p className="text-sm text-paper/80">{h.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
