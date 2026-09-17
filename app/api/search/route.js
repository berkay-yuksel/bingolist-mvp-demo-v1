import { NextResponse } from 'next/server';
import { readDB, publicCardSummary, publicUserSummary, isPubliclyListed } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  const db = await readDB();
  if (!q) return NextResponse.json({ cards: [], creators: [] });

  const cards = db.cards
    .filter(isPubliclyListed)
    .filter((c) => c.title.toLowerCase().includes(q) || c.category.includes(q) || c.tags.some((t) => t.includes(q)))
    .map(publicCardSummary);

  const creators = db.users
    .filter((u) => u.isCreator)
    .filter((u) => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q))
    .map((u) => publicUserSummary(u, db));

  return NextResponse.json({ cards, creators });
}
