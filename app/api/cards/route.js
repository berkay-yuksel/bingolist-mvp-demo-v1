import { NextResponse } from 'next/server';
import { readDB, updateDB, publicCardSummary, trendingScore, popularScore, isPubliclyListed } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort'); // trending | popular | new
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');
  const creatorId = searchParams.get('creatorId');
  const visibility = searchParams.get('visibility') || 'public';
  const limit = Number(searchParams.get('limit') || 24);

  const db = await readDB();
  let cards = db.cards.filter((c) => (visibility === 'all' ? true : isPubliclyListed(c)));

  if (category) cards = cards.filter((c) => c.category === category);
  if (tag) cards = cards.filter((c) => c.tags.includes(tag));
  if (creatorId) cards = cards.filter((c) => c.creatorId === creatorId);

  if (sort === 'trending') {
    cards = [...cards].sort((a, b) => trendingScore(b) - trendingScore(a));
  } else if (sort === 'popular') {
    cards = [...cards].sort((a, b) => popularScore(b) - popularScore(a));
  } else if (sort === 'new') {
    cards = [...cards].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return NextResponse.json({ cards: cards.slice(0, limit).map(publicCardSummary) });
}

export async function POST(request) {
  const body = await request.json();

  const requiredOk = body.title && body.category && Array.isArray(body.cells) && body.cells.length > 0;
  if (!requiredOk) {
    return NextResponse.json({ error: 'title, category ve en az bir hücre gerekli.' }, { status: 400 });
  }

  const newCard = await updateDB((db) => {
    const existingIds = new Set(db.cards.map((c) => c.id));
    const id = generateShortCode(existingIds);

    const card = {
      id,
      title: body.title.trim(),
      description: body.description?.trim() || '',
      category: body.category,
      tags: buildTags(body.category, body.tags),
      columns: body.columns || Math.ceil(Math.sqrt(body.cells.length)),
      cellShape: body.cellShape || 'square',
      checkStyle: body.checkStyle || 'check',
      hideCellText: !!body.hideCellText,
      theme: body.theme || { accent: '#38D6A7' },
      visibility: body.visibility === 'private' ? 'private' : 'public',
      creatorId: body.creatorId,
      originalCardId: body.originalCardId || null,
      createdAt: new Date().toISOString(),
      coverSeed: db.cards.length,
      coverImage: body.coverImage || null,
      publicationState: 'PUBLISHED',
      featured: false,
      hiddenFromProfile: false,
      pinnedOnProfile: false,
      moderationEditGrant: null,
      cells: body.cells.map((c, i) => ({
        id: c.id || `c${i + 1}`,
        text: c.text || '',
        emoji: c.emoji || null,
        image: c.image || null,
        description: c.description || '',
      })),
      stats: {
        views: 0,
        plays: 0,
        likedBy: [],
        bookmarkedBy: [],
        pinnedBy: [],
        shares: 0,
        remixes: 0,
        uniquePlayers: [],
        cellSelections: {},
      },
    };

    db.cards.push(card);

    if (body.originalCardId) {
      const original = db.cards.find((c) => c.id === body.originalCardId);
      if (original) original.stats.remixes += 1;
    }

    return card;
  });

  return NextResponse.json({ card: publicCardSummary(newCard) }, { status: 201 });
}

// Short, opaque card IDs instead of a title-derived slug — shorter URLs,
// and the URL no longer leaks/locks in whatever the title was at creation
// time. 7 lowercase-alphanumeric chars (~36^7 ≈ 78 billion combos) is
// comfortably collision-free at this app's scale; the uniqueness check
// against existing IDs is just a belt-and-suspenders backstop.
function generateShortCode(existingIds) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code;
  do {
    code = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (existingIds.has(code));
  return code;
}

function buildTags(category, tags) {
  const cleaned = (tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const withoutCategory = cleaned.filter((t) => t !== category);
  return [category, ...withoutCategory].slice(0, 8);
}