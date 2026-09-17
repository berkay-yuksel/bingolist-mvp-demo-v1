import { notFound } from 'next/navigation';
import { readDB, publicCardSummary, trendingScore, popularScore, isPubliclyListed } from '@/lib/db';
import CardTile from '@/components/CardTile';

export const dynamic = 'force-dynamic';

const CONFIG = {
  trending: { title: 'Trend Bingolar', eyebrow: 'Şu an yükselişte' },
  popular: { title: 'Popüler Bingolar', eyebrow: 'Her zaman güçlü' },
  new: { title: 'Yeniler', eyebrow: 'Yeni eklendi' },
  featured: { title: 'Öne Çıkanlar', eyebrow: 'Editörün seçimi' },
};

export default async function BrowsePage({ params }) {
  const { type } = await params;
  const config = CONFIG[type];
  if (!config) notFound();

  const db = await readDB();
  let cards = db.cards.filter(isPubliclyListed);

  if (type === 'trending') cards = [...cards].sort((a, b) => trendingScore(b) - trendingScore(a));
  else if (type === 'popular') cards = [...cards].sort((a, b) => popularScore(b) - popularScore(a));
  else if (type === 'new') cards = [...cards].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (type === 'featured') cards = cards.filter((c) => c.featured);

  const summaries = cards.map(publicCardSummary);

  return (
    <div className="mx-auto w-[92vw] max-w-[1800px] py-8">
      <p className="font-mono text-xs uppercase tracking-wider text-stamp">{config.eyebrow}</p>
      <h1 className="mb-6 font-display text-3xl font-bold">{config.title}</h1>

      {summaries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-500 p-8 text-center text-paper/45">Henüz kart yok.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {summaries.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
