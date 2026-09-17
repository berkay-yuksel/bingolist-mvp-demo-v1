import { readDB, publicCardSummary, isPubliclyListed } from '@/lib/db';
import { notFound } from 'next/navigation';
import CardTile from '@/components/CardTile';

export const dynamic = 'force-dynamic';

export default async function CollectionPage({ params }) {
  const { id } = await params;
  const db = await readDB();
  const collection = db.collections.find((c) => c.id === id);
  if (!collection) notFound();

  const cards = collection.cardIds
    .map((id) => db.cards.find((c) => c.id === id))
    .filter((c) => c && isPubliclyListed(c))
    .map(publicCardSummary);

  return (
    <div className="mx-auto w-[92vw] max-w-[1800px] py-8">
      <p className="font-mono text-xs uppercase tracking-wider text-stamp">Editoryal Koleksiyon</p>
      <h1 className="mb-6 font-display text-3xl font-bold">{collection.title}</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {cards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
