import { NextResponse } from 'next/server';
import { updateDB, sessionKey } from '@/lib/db';

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { userId, selectedCellIds, save } = body;

  if (!userId) return NextResponse.json({ error: 'userId gerekli.' }, { status: 400 });

  const result = await updateDB((db) => {
    const card = db.cards.find((c) => c.id === id);
    if (!card) return { error: true };

    const key = sessionKey(userId, card.id);
    const existing = db.sessions[key] || { selectedCellIds: [], saved: false, hasPlayed: false };
    const nextSelected = Array.isArray(selectedCellIds) ? selectedCellIds : existing.selectedCellIds;

    const oldSet = new Set(existing.selectedCellIds);
    const newSet = new Set(nextSelected);

    newSet.forEach((cellId) => {
      if (!oldSet.has(cellId)) {
        card.stats.cellSelections[cellId] = (card.stats.cellSelections[cellId] || 0) + 1;
      }
    });
    oldSet.forEach((cellId) => {
      if (!newSet.has(cellId)) {
        card.stats.cellSelections[cellId] = Math.max(0, (card.stats.cellSelections[cellId] || 0) - 1);
      }
    });

    let hasPlayed = existing.hasPlayed;
    if (!hasPlayed && newSet.size > 0) {
      hasPlayed = true;
      card.stats.plays += 1;
      if (!card.stats.uniquePlayers.includes(userId)) {
        card.stats.uniquePlayers.push(userId);
      }
    }

    const session = {
      selectedCellIds: Array.from(newSet),
      saved: save === true ? true : existing.saved,
      savedAt: save === true ? new Date().toISOString() : existing.savedAt || null,
      hasPlayed,
    };
    db.sessions[key] = session;

    const totalPlayers = Math.max(1, card.stats.uniquePlayers.length);
    const cellStats = card.cells.reduce((acc, cell) => {
      const count = card.stats.cellSelections[cell.id] || 0;
      acc[cell.id] = { count, percent: Math.min(100, Math.round((count / totalPlayers) * 100)) };
      return acc;
    }, {});

    return {
      session,
      completed: session.selectedCellIds.length === card.cells.length,
      cellStats,
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
    };
  });

  if (result.error) return NextResponse.json({ error: 'Kart bulunamadı.' }, { status: 404 });
  return NextResponse.json(result);
}
