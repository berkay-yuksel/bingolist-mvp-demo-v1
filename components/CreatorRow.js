'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCount } from '@/lib/format';
import { useCurrentUser } from './UserContext';

const SCROLL_AMOUNT = 500;

function CreatorTile({ c }) {
  const { userId } = useCurrentUser();
  const [following, setFollowing] = useState(false);
  const isSelf = userId === c.id;

  useEffect(() => {
    fetch(`/api/users/${c.username}?viewerId=${userId}`)
      .then((r) => r.json())
      .then((json) => setFollowing(json.isFollowing))
      .catch(() => {});
  }, [c.username, userId]);

  async function toggleFollow(e) {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(`/api/users/${c.username}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: userId }),
    });
    const json = await res.json();
    setFollowing(json.following);
  }

  return (
    // No translate-y hover here — it made the row jitter against its
    // siblings and the scroll container. A border/shadow change reads as
    // "hovered" without the layout wobble.
    <div className="flex w-48 shrink-0 flex-col items-center gap-2 rounded-lg border border-ink-500 bg-ink-700 p-4 text-center shadow-none transition hover:border-mint hover:shadow-ticket">
      <Link href={`/profile/${c.username}`} className="flex flex-col items-center gap-2">
        <span
          className="grid h-14 w-14 place-items-center overflow-hidden rounded-full text-xl font-bold text-ink"
          style={{ backgroundColor: c.avatarColor }}
        >
          {c.avatarImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.avatarImage} alt="" className="h-full w-full object-cover" />
          ) : (
            c.displayName[0]
          )}
        </span>
        <span className="font-display text-sm font-bold text-paper">{c.displayName}</span>
        <span className="text-xs text-paper/45">@{c.username}</span>
        <span className="font-mono text-[11px] text-paper/50">
          {formatCount(c.publicMetrics.followers)} takipçi · {formatCount(c.publicMetrics.uniquePlayers)} oyuncu
        </span>
      </Link>
      {!isSelf && (
        <button
          onClick={toggleFollow}
          className={`mt-1 w-full rounded-full py-1.5 text-xs font-semibold transition ${
            following ? 'border border-ink-500 text-paper/60 hover:border-stamp hover:text-stamp' : 'bg-mint text-ink hover:bg-mint-dark'
          }`}
        >
          {following ? 'Takip ediliyor' : 'Takip et'}
        </button>
      )}
    </div>
  );
}

export default function CreatorRow({ creators }) {
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, creators]);

  function scrollBy(amount) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  if (!creators?.length) return null;

  return (
    <section className="mx-auto w-[92vw] max-w-[1800px] py-6">
      <p className="font-mono text-[11px] uppercase tracking-wider text-stamp">Yükselen isimler</p>
      <Link href="/creators" className="group/title mb-3 flex w-fit items-center gap-1.5">
        <h2 className="font-display text-xl font-bold text-paper group-hover/title:text-mint">Trend Yaratıcılar</h2>
      </Link>

      <div className="group/row relative">
        <div ref={scrollerRef} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-2">
          {creators.map((c) => (
            <CreatorTile key={c.id} c={c} />
          ))}
        </div>

        {canRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink to-transparent" aria-hidden />
        )}
        {canLeft && (
          <button
            onClick={() => scrollBy(-SCROLL_AMOUNT)}
            aria-label="Geri kaydır"
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-ink-500 bg-ink-800/90 p-2 text-paper shadow-ticket hover:border-mint hover:text-mint sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {canRight && (
          <button
            onClick={() => scrollBy(SCROLL_AMOUNT)}
            aria-label="İleri kaydır"
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-ink-500 bg-ink-800/90 p-2 text-paper shadow-ticket hover:border-mint hover:text-mint sm:flex"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </section>
  );
}
