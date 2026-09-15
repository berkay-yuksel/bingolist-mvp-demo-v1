import { readDB, publicCardSummary, trendingScore, isPubliclyListed, withAdsFirst } from '@/lib/db';
import CardTile from '@/components/CardTile';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const db = await readDB();
  const category = db.categories.find((c) => c.slug === slug);
  if (!category) notFound();

  // A card belongs on this page if it's naturally in this category, OR an
  // editor pinned it here as an ad card (which may live in a different
  // category otherwise).
  const eligible = db.cards.filter(
    (c) => isPubliclyListed(c) && (c.category === slug || (c.isAd && c.adCategory === slug))
  );
  const sorted = [...eligible].sort((a, b) => trendingScore(b) - trendingScore(a));
  const cards = withAdsFirst(sorted, slug).map(publicCardSummary);

  return (
    <div className="mx-auto w-[92vw] max-w-[1800px] py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: category.accent }} />
        <h1 className="font-display text-3xl font-bold">{category.label}</h1>
        <span className="font-mono text-sm text-paper/40">{cards.length} kart</span>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-500 p-8 text-center text-paper/45">
          Bu kategoride henüz kart yok. İlk kartı sen oluştur.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {cards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
