'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CardTile from './CardTile';

const TILE_WIDTH_CLASS = 'w-64 sm:w-72';
const SCROLL_AMOUNT = 620;

export default function CardRow({ title, titleHref, titleClassName = 'text-xl', hideTitleArrow, viewAllHref, viewAllLabel = 'Tümünü gör', eyebrow, cards, tags, tagsHeading, renderCard, emptyLabel = 'Henüz kart yok.' }) {
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
  }, [updateArrows, cards]);

  function scrollBy(amount) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  if (!cards) return null;

  return (
    <section className="mx-auto w-[92vw] max-w-[1800px] py-6">
      <div className="mb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            {eyebrow && <p className="font-mono text-[11px] uppercase tracking-wider text-stamp">{eyebrow}</p>}
            {title && (
              titleHref ? (
                <Link href={titleHref} className="group/title flex items-center gap-1.5">
                  <h2 className={`font-display font-bold text-paper group-hover/title:text-mint ${titleClassName}`}>{title}</h2>
                </Link>
              ) : (
                <h2 className={`font-display font-bold text-paper ${titleClassName}`}>{title}</h2>
              )
            )}
          </div>
          {tags?.length > 0 && !tagsHeading && (
            <div className="flex gap-1.5">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tag/${tag}`}
                  className="rounded-full border border-ink-500 px-2.5 py-0.5 text-[11px] text-paper/55 hover:border-mint hover:text-mint"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {tags?.length > 0 && tagsHeading && (
          <div className="mt-2">
            <p className="mb-1.5 text-xs font-medium text-paper/45">{tagsHeading}</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tag/${tag}`}
                  className="rounded-full border border-ink-500 px-2.5 py-0.5 text-[11px] text-paper/55 hover:border-mint hover:text-mint"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-500 p-6 text-sm text-paper/45">{emptyLabel}</p>
      ) : (
        <div className="group/row relative">
          <div ref={scrollerRef} className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-2">
            {cards.map((card) => (
              <div key={card.id} className={`${TILE_WIDTH_CLASS} shrink-0`}>
                {renderCard ? renderCard(card) : <CardTile card={card} />}
              </div>
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
      )}

      {viewAllHref && cards.length > 0 && (
        <Link href={viewAllHref} className="mt-3 inline-block text-sm text-mint hover:underline">
          {viewAllLabel}
        </Link>
      )}
    </section>
  );
}
