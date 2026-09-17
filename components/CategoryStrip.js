'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SCROLL_AMOUNT = 400;

// A single "Trending Tags" row — categories appear as tags too (lowercase,
// colored with their own accent), always first/leftmost, followed by
// regular content tags. One horizontal scrollable line with nav arrows,
// same pattern as the card rows below it.
export default function CategoryStrip({ categories, popularTags = [] }) {
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
  }, [updateArrows, categories, popularTags]);

  function scrollBy(amount) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  return (
    <div className="mx-auto w-[92vw] max-w-[1800px] py-5">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-paper/40">Trending Tags</p>
      <div className="group/row relative">
        <div ref={scrollerRef} className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto scroll-smooth">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition hover:opacity-80"
              style={{ borderColor: `${cat.accent}66`, backgroundColor: `${cat.accent}1A`, color: cat.accent }}
            >
              {cat.label.toLowerCase()}
            </Link>
          ))}
          {popularTags.map((tag) => (
            <Link
              key={tag}
              href={`/tag/${tag}`}
              className="shrink-0 rounded-full border border-ink-500 px-3.5 py-1.5 text-sm text-paper/60 transition hover:border-mint hover:text-mint"
            >
              #{tag}
            </Link>
          ))}
        </div>

        {canRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink to-transparent" aria-hidden />
        )}
        {canLeft && (
          <button
            onClick={() => scrollBy(-SCROLL_AMOUNT)}
            aria-label="Geri kaydır"
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-ink-500 bg-ink-800/90 p-1.5 text-paper shadow-ticket hover:border-mint hover:text-mint sm:flex"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {canRight && (
          <button
            onClick={() => scrollBy(SCROLL_AMOUNT)}
            aria-label="İleri kaydır"
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-ink-500 bg-ink-800/90 p-1.5 text-paper shadow-ticket hover:border-mint hover:text-mint sm:flex"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
