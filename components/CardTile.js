'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreVertical, Play, Bookmark, BookmarkCheck, Share2, EyeOff, Check, Pin, PinOff } from 'lucide-react';
import CardCover from './CardCover';
import { formatCount } from '@/lib/format';
import { useCurrentUser } from './UserContext';
import { isCardHidden, setCardHidden, isCardPlayed } from '@/lib/localFlags';

// No fixed width here on purpose — this component is used both inside CSS
// grids (category/search/profile pages, where it should fill its grid
// cell) and inside horizontal-scroll rows (CardRow, which wraps it in a
// fixed-width shrink-0 container).
//
// `pinned`/`onTogglePin`: optional — shows a dedicated pin quick-action
// next to the menu button (used on profile rows for "pin to top").
// `extraMenuItems`: optional array of { label, icon, onClick, active } —
// appended to the dropdown below a divider, for context-specific actions
// like "hide from profile" that only make sense on your own profile.
// `dimmed`/`topLeftBadge`: optional visual treatment for profile context
// (e.g. a card you've hidden from your own profile).
// `savedContext`: this tile is shown because it's already bookmarked (the
// "Kaydedilenler" row) — starts the bookmark toggle in its active state
// and relabels it "Kaydedilenlerden kaldır" instead of the generic
// "Kaydet"/"Kaydedildi" pair.
export default function CardTile({ card, pinned, onTogglePin, extraMenuItems, dimmed, topLeftBadge, savedContext, onRemoved }) {
  const { userId } = useCurrentUser();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(!!savedContext);
  const [hidden, setHidden] = useState(false);
  const [played, setPlayed] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const menuRef = useRef(null);
  const href = `/bingo/${card.category}/${card.id}`;

  useEffect(() => {
    setHidden(isCardHidden(userId, card.id));
    setPlayed(isCardPlayed(userId, card.id));
  }, [userId, card.id]);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function toggleBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(`/api/cards/${card.id}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'bookmark' }),
    });
    const json = await res.json();
    if (json.active !== null) setBookmarked(json.active);
    setMenuOpen(false);
    // In the "Kaydedilenler" list, un-saving should actually take the tile
    // out of the list right away instead of leaving a stale, now-incorrect
    // tile sitting there until the next full page reload.
    if (savedContext && json.active === false) {
      onRemoved?.();
    }
  }

  function handlePlay(e) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    router.push(href);
  }

  async function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? `${window.location.origin}${href}` : href;
    try {
      if (navigator.share) {
        await navigator.share({ title: card.title, url });
        setMenuOpen(false);
        return;
      }
    } catch {
      // fall through to clipboard
    }
    navigator.clipboard?.writeText(url);
    setShareFeedback(true);
    setTimeout(() => {
      setShareFeedback(false);
      setMenuOpen(false);
    }, 1000);
  }

  function toggleHide(e) {
    e.preventDefault();
    e.stopPropagation();
    const next = !hidden;
    setCardHidden(userId, card.id, next);
    setHidden(next);
    setMenuOpen(false);
  }

  if (hidden) {
    return (
      <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink-500 bg-ink-700/30 p-4 text-center">
        <p className="text-xs text-paper/40">Bu kartı gizledin</p>
        <button
          onClick={() => {
            setCardHidden(userId, card.id, false);
            setHidden(false);
          }}
          className="text-xs text-mint hover:underline"
        >
          Geri getir
        </button>
      </div>
    );
  }

  return (
    <Link href={href} className="group block">
      <div className={`perforated-top relative overflow-hidden rounded-lg border border-ink-500 bg-ink-700 shadow-ticket transition-transform duration-200 group-hover:-translate-y-1 ${dimmed ? 'opacity-50' : ''}`}>
        <div className="relative aspect-[4/3]">
          <CardCover
            accent={card.theme?.accent}
            seed={card.coverSeed ?? 0}
            image={card.coverImage}
            title={card.title}
            className="h-full w-full"
          />

          {played && !topLeftBadge && (
            <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-mint/90 px-2 py-0.5 text-[10px] font-semibold text-ink">
              <Check size={10} /> Oynandı
            </span>
          )}
          {topLeftBadge && (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-ink-900/70 px-2 py-0.5 text-[10px] text-paper/70 backdrop-blur-sm">
              {topLeftBadge}
            </span>
          )}

          {onTogglePin && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePin(!pinned);
              }}
              title={pinned ? 'Sabitlemeyi kaldır' : 'Başa sabitle'}
              className={`absolute right-11 top-2 z-20 grid h-7 w-7 place-items-center rounded-full backdrop-blur-sm ${
                pinned ? 'bg-marker text-ink' : 'bg-ink-900/70 text-paper hover:text-marker'
              }`}
            >
              {pinned ? <PinOff size={13} /> : <Pin size={13} />}
            </button>
          )}

          <div className="absolute right-2 top-2 z-20" ref={menuRef}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              aria-label="Kart seçenekleri"
              className="grid h-7 w-7 place-items-center rounded-full bg-ink-900/70 text-paper backdrop-blur-sm hover:bg-ink-900"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 w-48 overflow-hidden rounded-lg border border-ink-500 bg-ink-800 py-1 shadow-ticket">
                <button
                  onClick={handlePlay}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-paper hover:bg-ink-600"
                >
                  <Play size={13} /> Oyna
                </button>
                <button
                  onClick={toggleBookmark}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-paper hover:bg-ink-600"
                >
                  {bookmarked ? <BookmarkCheck size={13} className="text-marker" /> : <Bookmark size={13} />}
                  {bookmarked ? (savedContext ? 'Kaydedilenlerden kaldır' : 'Kaydedildi') : 'Kaydet'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-paper hover:bg-ink-600"
                >
                  <Share2 size={13} /> {shareFeedback ? 'Kopyalandı ✓' : 'Paylaş'}
                </button>
                <button
                  onClick={toggleHide}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-paper hover:bg-ink-600"
                >
                  <EyeOff size={13} /> Gizle
                </button>
                {extraMenuItems?.length > 0 && (
                  <>
                    <div className="my-1 border-t border-ink-500/50" />
                    {extraMenuItems.map((item, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          item.onClick();
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-paper hover:bg-ink-600"
                      >
                        <item.icon size={13} className={item.active ? 'text-marker' : ''} /> {item.label}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="p-4">
          <p className="line-clamp-2 min-h-[2.75rem] font-display text-base font-bold leading-snug text-paper">
            {card.title}
          </p>
          <div className="mt-2 flex items-center gap-2 font-mono text-xs text-paper/45">
            <span>{card.cellCount} hücre</span>
            {card.metrics?.plays != null && (
              <>
                <span aria-hidden>·</span>
                <span>{formatCount(card.metrics.plays)} oynanma</span>
              </>
            )}
            {card.originalCardId && (
              <>
                <span aria-hidden>·</span>
                <span className="lowercase text-marker">remix</span>
              </>
            )}
            {card.isAd && (
              <>
                <span aria-hidden>·</span>
                <span className="lowercase text-stamp">ad</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
