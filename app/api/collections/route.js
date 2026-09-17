import { NextResponse } from 'next/server';
import { readDB, publicCardSummary, isPubliclyListed } from '@/lib/db';

export async function GET() {
  const db = await readDB();
  const collections = db.collections.map((col) => ({
    id: col.id,
    title: col.title,
    cards: col.cardIds
      .map((id) => db.cards.find((c) => c.id === id))
      .filter((c) => c && isPubliclyListed(c))
      .map(publicCardSummary),
  }));
  return NextResponse.json({ collections });
}
