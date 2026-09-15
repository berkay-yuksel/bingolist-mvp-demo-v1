import Link from 'next/link';
import { readDB, publicCardSummary, trendingScore, isPubliclyListed, withAdsFirst, autoPopularTagsForCategory } from '@/lib/db';
import CardRow from '@/components/CardRow';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const db = await readDB();
  const publicCards = db.cards.filter(isPubliclyListed);

  const sections = db.categories.map((cat) => {
    const eligible = publicCards.filter(
      (c) => c.category === cat.slug || (c.isAd && c.adCategory === cat.slug)
    );
    const sorted = [...eligible].sort((a, b) => trendingScore(b) - trendingScore(a));
    const tags = autoPopularTagsForCategory(db, cat.slug, 5);
    const topTag = tags[0] || null;

    const subCards = topTag
      ? sorted.filter((c) => c.tags.includes(topTag)).slice(0, 8).map(publicCardSummary)
      : [];

    return {
      category: cat,
      tags,
      cards: withAdsFirst(sorted, cat.slug).slice(0, 8).map(publicCardSummary),
      topTag,
      subCards,
    };
  });

  const allPopularTags = Array.from(new Set(sections.flatMap((s) => s.tags))).slice(0, 14);

  return (
    <div>
      <div className="mx-auto w-[92vw] max-w-[1800px] pt-10">
        <p className="font-mono text-xs uppercase tracking-wider text-stamp">Keşfet</p>
        <h1 className="mb-2 font-display text-3xl font-bold">Tüm Kategoriler</h1>
        <p className="text-sm text-paper/50">
          Her kategoride en çok trend olan kartlar, ve en popüler etiketinin kendi alt kategori rafı.
        </p>
      </div>

      {sections.map(({ category, tags, cards, topTag, subCards }) => (
        <div key={category.slug}>
          <div className="mx-auto w-[92vw] max-w-[1800px] pt-8">
            <h2 className="font-display text-3xl font-bold text-paper">{category.label}</h2>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
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

          <CardRow cards={cards} viewAllHref={`/category/${category.slug}`} emptyLabel="Bu kategoride henüz kart yok." />

          {topTag && subCards.length > 0 && (
            <>
              <div className="mx-auto w-[92vw] max-w-[1800px] pt-2">
                <div className="flex items-center gap-2 border-l-4 border-mint pl-3">
                  <h3 className="font-display text-xl font-bold text-paper">#{topTag}</h3>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-mint">Bu kategoride trend</span>
                </div>
              </div>
              <CardRow cards={subCards} viewAllHref={`/tag/${topTag}`} />
            </>
          )}
        </div>
      ))}

      {allPopularTags.length > 0 && (
        <section className="mx-auto w-[92vw] max-w-[1800px] py-10">
          <h2 className="mb-3 font-display text-xl font-bold text-paper">Popüler Etiketler</h2>
          <div className="flex flex-wrap gap-2">
            {allPopularTags.map((tag) => (
              <a
                key={tag}
                href={`/tag/${tag}`}
                className="rounded-lg border border-ink-500 bg-ink-700/40 px-4 py-3 text-sm text-paper/70 transition hover:border-mint hover:text-mint"
              >
                #{tag}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
