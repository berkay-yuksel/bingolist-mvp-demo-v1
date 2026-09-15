'use client';

import { useEffect, useMemo, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BarChart3, Pencil, ShieldAlert, Check } from 'lucide-react';
import { useCurrentUser } from '@/components/UserContext';
import BingoGrid from '@/components/BingoGrid';
import ActionBar from '@/components/ActionBar';
import ShareModal from '@/components/ShareModal';
import ReportDialog from '@/components/ReportDialog';
import CreateIssueDialog from '@/components/CreateIssueDialog';
import MetricsRow from '@/components/MetricsRow';
import CardRow from '@/components/CardRow';
import { CATEGORIES } from '@/lib/mockData';
import { markCardPlayed, isCardPlayed } from '@/lib/localFlags';

export default function PlayPage({ params }) {
  const { id, category: categorySlug } = use(params);
  const { userId, user } = useCurrentUser();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [cellStats, setCellStats] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [moreCards, setMoreCards] = useState(null);
  const [categoryCards, setCategoryCards] = useState(null);
  const [idCopied, setIdCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/cards/${id}?userId=${userId}&track=view`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const json = await res.json();
    setData(json);
    setSelected(new Set(json.viewerState.selectedCellIds));
    setCellStats(json.card.cellStats);
    setMetrics(json.card.metrics);
    setLiked(json.viewerState.liked);
    setBookmarked(json.viewerState.bookmarked);
    setSaved(json.viewerState.saved);
    setShowStats(json.viewerState.saved);
    setDirty(false);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch(`/api/cards?sort=trending&category=${categorySlug}&limit=16`)
      .then((r) => r.json())
      .then((json) => {
        const filtered = json.cards.filter((c) => c.id !== id && !isCardPlayed(userId, c.id)).slice(0, 8);
        setCategoryCards(filtered);
      })
      .catch(() => setCategoryCards([]));
  }, [id, categorySlug, userId]);

  useEffect(() => {
    fetch('/api/cards?sort=trending&limit=16')
      .then((r) => r.json())
      .then((json) => {
        const filtered = json.cards.filter((c) => c.id !== id && !isCardPlayed(userId, c.id)).slice(0, 8);
        setMoreCards(filtered);
      })
      .catch(() => setMoreCards([]));
  }, [id, userId]);

  async function toggleCell(cellId) {
    const next = new Set(selected);
    next.has(cellId) ? next.delete(cellId) : next.add(cellId);
    setSelected(next);
    setDirty(true);

    const res = await fetch(`/api/cards/${id}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, selectedCellIds: Array.from(next) }),
    });
    const json = await res.json();
    setCellStats(json.cellStats);
    setMetrics(json.metrics);
    if (next.size > 0) markCardPlayed(userId, id);
  }

  async function handleSave() {
    const res = await fetch(`/api/cards/${id}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, selectedCellIds: Array.from(selected), save: true }),
    });
    const json = await res.json();
    setCellStats(json.cellStats);
    setMetrics(json.metrics);
    setSaved(true);
    setShowStats(true);
    setDirty(false);
  }

  async function handleInteract(action, setter) {
    const res = await fetch(`/api/cards/${id}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    });
    const json = await res.json();
    setMetrics(json.metrics);
    if (json.active !== null) setter(json.active);
  }

  async function handleShared() {
    const res = await fetch(`/api/cards/${id}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'share' }),
    });
    const json = await res.json();
    setMetrics(json.metrics);
  }

  async function handleReport(reason) {
    await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: id, userId, reason }),
    });
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const completed = data && selected.size === data.card.cells.length;

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-paper/50">Kart yükleniyor…</div>;
  }
  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-2xl font-bold">Kart bulunamadı</p>
        <p className="mt-2 text-paper/50">Bu kart kaldırılmış ya da hiç var olmamış olabilir.</p>
        <Link href="/" className="mt-4 inline-block text-mint">← Keşfete dön</Link>
      </div>
    );
  }

  const { card, creator, original, originalCreator } = data;
  const isOwner = data.viewerState.isOwner;
  const isModerator = user.role === 'moderator';

  const PUB_STATE_LABEL = {
    UNDER_REVIEW: { label: 'İnceleniyor', tone: 'border-marker/40 bg-marker/10 text-marker' },
    UNPUBLISHED: { label: 'Yayından kaldırıldı', tone: 'border-stamp/40 bg-stamp/10 text-stamp' },
    PENDING_REVIEW: { label: 'İncelemeyi bekliyor', tone: 'border-mint/40 bg-mint/10 text-mint' },
  };
  const pubState = PUB_STATE_LABEL[card.publicationState];

  return (
    <>
    <div className="mx-auto max-w-4xl px-4 pb-12 pt-6 sm:px-6">
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-sm text-paper/50 hover:text-paper">
        <ChevronLeft size={16} /> Geri
      </button>

      {original && (
        <p className="mb-2 text-xs text-paper/45">
          <span className="text-paper/60">{originalCreator?.displayName}</span> tarafından paylaşılan{' '}
          <Link href={`/bingo/${original.category}/${original.id}`} className="text-mint hover:underline">
            "{original.title}"
          </Link>{' '}
          kartının remix'i
        </p>
      )}

      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{card.title}</h1>
        <div className="flex shrink-0 gap-2">
          {isOwner && (
            <Link
              href={`/bingo/${card.category}/${card.id}/edit`}
              className="flex items-center gap-1.5 rounded-full border border-ink-500 px-3 py-1.5 text-xs font-medium text-paper/70 hover:border-mint hover:text-mint"
            >
              <Pencil size={13} /> Düzenle
            </Link>
          )}
          {isModerator && (
            <button
              onClick={() => setIssueDialogOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-stamp/40 px-3 py-1.5 text-xs font-medium text-stamp hover:bg-stamp/10"
            >
              <ShieldAlert size={13} /> Issue Oluştur
            </button>
          )}
        </div>
      </div>
      {card.description && <p className="mb-3 text-base text-paper/60">{card.description}</p>}

      {isOwner && pubState && (
        <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${pubState.tone}`}>
          Bu kart şu anda <strong>{pubState.label}</strong> durumunda ve keşfette görünmüyor.
          {card.publicationState === 'UNPUBLISHED' && data.viewerState.hasModerationEditGrant && (
            <>
              {' '}
              Moderatör senden değişiklik istedi —{' '}
              <Link href={`/bingo/${card.category}/${card.id}/edit`} className="underline">
                düzenlemek için tıkla
              </Link>
              .
            </>
          )}
        </div>
      )}

      {creator && (
        <Link href={`/profile/${creator.username}`} className="mb-4 flex w-fit items-center gap-2 text-sm text-paper/60 hover:text-paper">
          <span className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-ink" style={{ backgroundColor: creator.avatarColor }}>
            {creator.displayName[0]}
          </span>
          @{creator.username}
        </Link>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <MetricsRow metrics={metrics} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {[card.category, ...card.tags.filter((t) => t !== card.category)].map((tag) => {
            const isCategory = tag === card.category;
            const catInfo = isCategory ? CATEGORIES.find((c) => c.slug === card.category) : null;
            const catAccent = catInfo?.accent;
            const label = isCategory && catInfo ? catInfo.label.toLowerCase() : tag;
            return (
              <Link
                key={tag}
                href={isCategory ? `/category/${tag}` : `/tag/${tag}`}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition hover:opacity-80 ${
                  isCategory && catAccent ? '' : 'border-ink-500 text-paper/55 hover:border-mint hover:text-mint'
                }`}
                style={isCategory && catAccent ? { borderColor: `${catAccent}66`, backgroundColor: `${catAccent}1A`, color: catAccent } : undefined}
              >
                #{label}
              </Link>
            );
          })}
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(card.id);
            setIdCopied(true);
            setTimeout(() => setIdCopied(false), 1500);
          }}
          title="ID'yi kopyala"
          className="shrink-0 rounded-md border border-ink-500 bg-ink-800 px-2 py-1 font-mono text-[11px] text-paper/40 hover:border-mint hover:text-mint"
        >
          {idCopied ? 'Kopyalandı ✓' : card.id}
        </button>
      </div>

      {completed && (
        <div className="mb-4 rounded-lg border border-mint/40 bg-mint/10 px-4 py-2.5 text-sm text-mint">
          🎉 Kartı tamamladın — {card.cells.length}/{card.cells.length} hücre işaretli.
        </div>
      )}

      <div className="rounded-xl border border-ink-500 bg-ink-700/50 p-3 sm:p-6">
        <BingoGrid
          cells={card.cells}
          columns={card.columns}
          selectedIds={selected}
          cellStats={cellStats}
          showStats={showStats}
          checkStyle={card.checkStyle}
          shape={card.cellShape}
          accent={card.theme?.accent}
          onToggle={toggleCell}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-paper/45">
        <span>{selected.size}/{card.cells.length} işaretlendi · otomatik kaydediliyor</span>
        <button
          onClick={() => setShowStats((s) => !s)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
            showStats ? 'border-marker text-marker' : 'border-ink-500 text-paper/50 hover:text-paper'
          }`}
        >
          <BarChart3 size={13} /> Topluluk %{showStats ? ' açık' : ''}
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={!dirty && saved}
        className="mt-4 w-full rounded-lg bg-marker py-3 text-sm font-bold text-ink transition hover:bg-marker-dark disabled:cursor-default disabled:bg-ink-600 disabled:text-paper/40 disabled:hover:bg-ink-600"
      >
        Kaydet
      </button>

      <div className="mt-4">
        <ActionBar
          liked={liked}
          bookmarked={bookmarked}
          metrics={metrics}
          onLike={() => handleInteract('like', setLiked)}
          onBookmark={() => handleInteract('bookmark', setBookmarked)}
          onShare={() => setShareOpen(true)}
          onRemix={() => router.push(`/create?remixOf=${card.id}`)}
          onReport={() => setReportOpen(true)}
        />
      </div>

      {shareOpen && (
        <ShareModal
          card={card}
          selectedIds={selected}
          cellStats={cellStats}
          shareUrl={shareUrl}
          onClose={() => setShareOpen(false)}
          onShared={handleShared}
        />
      )}
      {reportOpen && <ReportDialog onClose={() => setReportOpen(false)} onSubmit={handleReport} />}
      {issueDialogOpen && (
        <CreateIssueDialog
          moderatorId={userId}
          card={{ id: card.id, title: card.title }}
          onClose={() => setIssueDialogOpen(false)}
          onCreated={() => setIssueDialogOpen(false)}
        />
      )}
    </div>

    {categoryCards?.length > 0 && (
      <div className="pt-4">
        <CardRow eyebrow="Bu kategoride henüz oynamadın" title={`${CATEGORIES.find((c) => c.slug === categorySlug)?.label || categorySlug} kategorisinde keşfet`} cards={categoryCards} />
      </div>
    )}
    {moreCards?.length > 0 && (
      <div className="pb-16">
        <CardRow eyebrow="Henüz oynamadın" title="Daha fazla kart keşfet" cards={moreCards} />
      </div>
    )}
    </>
  );
}