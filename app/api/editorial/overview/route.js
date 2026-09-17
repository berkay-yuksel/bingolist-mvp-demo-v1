import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function GET() {
  const db = await readDB();
  const cards = db.cards
    .filter((c) => c.visibility === 'public')
    .map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      featured: !!c.featured,
      publicationState: c.publicationState,
      isAd: !!c.isAd,
      adCategory: c.adCategory || null,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json({
    cards,
    categories: db.categories,
    featuredCategories: db.featuredCategories,
    categoryPopularTags: db.categoryPopularTags || {},
    collections: db.collections,
  });
}
