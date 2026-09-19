import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readDB, updateDB, sessionKey, canEditCardContent, editableUntil } from '@/lib/db';

const BUCKET = 'card-images';
const useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
const supabase = useSupabase ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY) : null;

// Pulls the storage object path (e.g. "cover/1234-ab.webp") back out of a
// public Storage URL. Returns null for anything else — an external link
// (AI-sourced Wikipedia image, etc.) or a base64 data URI — so those are
// simply left alone rather than mistakenly targeted for deletion.
function storagePathFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

function buildCardPayload(db, card, userId) {
  const creator = db.users.find((u) => u.id === card.creatorId);
  const original = card.originalCardId ? db.cards.find((c) => c.id === card.originalCardId) : null;
  const originalCreator = original ? db.users.find((u) => u.id === original.creatorId) : null;

  const session = userId ? db.sessions[sessionKey(userId, card.id)] : null;
  const totalPlayers = Math.max(1, card.stats.uniquePlayers.length);
  const isOwner = userId && userId === card.creatorId;

  return {
    card: {
      ...card,
      metrics: {
        views: card.stats.views,
        plays: card.stats.plays,
        likes: card.stats.likedBy.length,
        bookmarks: card.stats.bookmarkedBy.length,
        pins: card.stats.pinnedBy.length,
        shares: card.stats.shares,
        remixes: card.stats.remixes,
        uniquePlayers: card.stats.uniquePlayers.length,
      },
      cellStats: card.cells.reduce((acc, cell) => {
        const count = card.stats.cellSelections[cell.id] || 0;
        acc[cell.id] = { count, percent: Math.min(100, Math.round((count / totalPlayers) * 100)) };
        return acc;
      }, {}),
    },
    creator: creator ? { id: creator.id, username: creator.username, displayName: creator.displayName, avatarColor: creator.avatarColor } : null,
    original: original ? { id: original.id, title: original.title, category: original.category } : null,
    originalCreator: originalCreator ? { username: originalCreator.username, displayName: originalCreator.displayName } : null,
    viewerState: {
      selectedCellIds: session?.selectedCellIds || [],
      saved: session?.saved || false,
      liked: userId ? card.stats.likedBy.includes(userId) : false,
      bookmarked: userId ? card.stats.bookmarkedBy.includes(userId) : false,
      pinned: userId ? card.stats.pinnedBy.includes(userId) : false,
      isOwner,
      canEditContent: isOwner ? canEditCardContent(card, userId) : false,
      editableUntil: editableUntil(card),
      hasModerationEditGrant: !!card.moderationEditGrant,
    },
  };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const track = searchParams.get('track'); // 'view' to count a page view

  if (track === 'view') {
    const payload = await updateDB((db) => {
      const card = db.cards.find((c) => c.id === id);
      if (!card) return { notFound: true };
      card.stats.views += 1;
      return buildCardPayload(db, card, userId);
    });
    if (payload.notFound) return NextResponse.json({ error: 'Kart bulunamadı.' }, { status: 404 });
    return NextResponse.json(payload);
  }

  const db = await readDB();
  const card = db.cards.find((c) => c.id === id);
  if (!card) return NextResponse.json({ error: 'Kart bulunamadı.' }, { status: 404 });
  return NextResponse.json(buildCardPayload(db, card, userId));
}

// Content fields are gated by the 30-minute edit window (or an active
// moderation revision grant). Preference fields are owner-only but not
// time-gated — hiding/pinning your own card on your profile can't corrupt
// community statistics, so there's no reason to lock it down.
const CONTENT_FIELDS = ['title', 'description', 'tags', 'theme', 'cellShape', 'checkStyle', 'hideCellText', 'visibility', 'cells', 'columns', 'coverImage'];
const PREF_FIELDS = ['hiddenFromProfile', 'pinnedOnProfile'];

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  const result = await updateDB((db) => {
    const card = db.cards.find((c) => c.id === id);
    if (!card) return { error: 'Kart bulunamadı.', status: 404 };
    if (body.requesterId && body.requesterId !== card.creatorId) {
      return { error: 'Sadece kartın sahibi düzenleyebilir.', status: 403 };
    }

    const wantsContentChange = CONTENT_FIELDS.some((key) => body[key] !== undefined);
    if (wantsContentChange && body.requesterId) {
      if (!canEditCardContent(card, body.requesterId)) {
        return {
          error: card.moderationEditGrant
            ? 'Bu kart için düzenleme izni bulunamadı.'
            : '30 dakikalık ücretsiz düzenleme süresi doldu. Değişiklik yapmak için moderasyondan revizyon izni gerekiyor.',
          status: 403,
        };
      }
      // A normal (non-moderation) content edit consumes any leftover grant
      // window bookkeeping isn't needed here — the grant is only cleared
      // explicitly by the moderation "submit for review" action.
    }

    CONTENT_FIELDS.forEach((key) => {
      if (body[key] !== undefined) card[key] = body[key];
    });
    PREF_FIELDS.forEach((key) => {
      if (body[key] !== undefined) card[key] = !!body[key];
    });

    return { card };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ card: result.card });
}

// Only the card's own creator can delete it. Any collections that
// reference it are cleaned up too, so nothing links to a ghost card.
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const requesterId = searchParams.get('requesterId');

  const result = await updateDB((db) => {
    const card = db.cards.find((c) => c.id === id);
    if (!card) return { error: 'Kart bulunamadı.', status: 404 };
    if (!requesterId || requesterId !== card.creatorId) {
      return { error: 'Sadece kartın sahibi silebilir.', status: 403 };
    }

    const storagePaths = [card.coverImage, ...card.cells.map((c) => c.image)]
      .map(storagePathFromUrl)
      .filter(Boolean);

    db.cards = db.cards.filter((c) => c.id !== id);
    db.collections.forEach((col) => {
      col.cardIds = col.cardIds.filter((cid) => cid !== id);
    });
    if (db.heroBanner?.cardId === id) db.heroBanner.cardId = null;

    return { ok: true, storagePaths };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  if (useSupabase && result.storagePaths?.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(result.storagePaths);
    if (error) {
      // The card is already gone from the DB either way — a Storage
      // cleanup failure shouldn't block the delete, just get logged.
      console.error('Storage cleanup failed for deleted card:', error.message);
    }
  }

  return NextResponse.json({ ok: true });
}