import { readDB, publicCardSummary, trendingScore, isPubliclyListed } from '@/lib/db';
import CardTile from '@/components/CardTile';

export const dynamic = 'force-dynamic';

export default async function TagPage({ params }) {
  const { slug } = await params;
  const db = await readDB();
  const cards = db.cards
    .filter((c) => isPubliclyListed(c) && c.tags.includes(slug))
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .map(publicCardSummary);

  return (
    <div className="mx-auto w-[92vw] max-w-[1800px] py-8">
      <p className="font-mono text-xs uppercase tracking-wider text-stamp">Etiket</p>
      <h1 className="mb-6 font-display text-3xl font-bold">#{slug}</h1>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-500 p-8 text-center text-paper/45">
          Bu etikete sahip kart bulunamadı.
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
