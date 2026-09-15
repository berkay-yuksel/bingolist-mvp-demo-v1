'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';
import CardTile from '@/components/CardTile';
import { formatCount } from '@/lib/format';

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get('q') || '';
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState({ cards: [], creators: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQ(initial);
    if (initial) runSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  async function runSearch(query) {
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    setResults(json);
    setLoading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="mx-auto w-[92vw] max-w-[1800px] py-8">
      <form onSubmit={handleSubmit} className="relative mb-8 max-w-lg">
        <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kart veya @kullanıcı ara"
          className="w-full rounded-full border border-ink-500 bg-ink-700 py-3 pl-11 pr-4 text-sm text-paper placeholder:text-paper/35 focus:border-mint"
          autoFocus
        />
      </form>

      {loading && <p className="text-paper/45">Aranıyor…</p>}

      {!loading && initial && (
        <>
          {results.creators.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 font-display text-lg font-bold">Yaratıcılar</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.creators.map((c) => (
                  <Link
                    key={c.id}
                    href={`/profile/${c.username}`}
                    className="flex items-center gap-3 rounded-xl border border-ink-500 bg-ink-700 p-3 hover:border-mint"
                  >
                    <span
                      className="grid h-11 w-11 place-items-center rounded-full text-lg font-bold text-ink"
                      style={{ backgroundColor: c.avatarColor }}
                    >
                      {c.displayName[0]}
                    </span>
                    <span>
                      <span className="block font-semibold text-paper">{c.displayName}</span>
                      <span className="block text-xs text-paper/45">
                        @{c.username} · {formatCount(c.publicMetrics.followers)} takipçi
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-lg font-bold">Kartlar</h2>
            {results.cards.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-500 p-8 text-center text-paper/45">
                "{initial}" için sonuç bulunamadı.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                {results.cards.map((card) => (
                  <CardTile key={card.id} card={card} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {!initial && <p className="text-paper/40">Aramaya başlamak için bir kart adı veya @kullanıcı adı yaz.</p>}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-[92vw] max-w-[1800px] py-8 text-paper/45">Yükleniyor…</div>}>
      <SearchInner />
    </Suspense>
  );
}
