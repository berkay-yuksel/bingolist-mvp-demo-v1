import { NextResponse } from 'next/server';
import { updateDB, addNotification } from '@/lib/db';

const LIST_BY_ACTION = { like: 'likedBy', bookmark: 'bookmarkedBy', pin: 'pinnedBy' };

export async function POST(request, { params }) {
  const { id } = await params;
  const { userId, action } = await request.json();
  if (!userId) return NextResponse.json({ error: 'userId gerekli.' }, { status: 400 });

  const result = await updateDB((db) => {
    const card = db.cards.find((c) => c.id === id);
    if (!card) return { error: true };

    let active = null;

    if (action === 'share') {
      card.stats.shares += 1;
    } else {
      const listKey = LIST_BY_ACTION[action];
      if (!listKey) return { invalidAction: true };
      const list = card.stats[listKey];
      const idx = list.indexOf(userId);
      if (idx === -1) {
        list.push(userId);
        active = true;
        if (action === 'like' && card.creatorId && card.creatorId !== userId) {
          const liker = db.users.find((u) => u.id === userId);
          addNotification(db, {
            userId: card.creatorId,
            type: 'card_liked',
            title: 'Kartın beğenildi',
            body: `@${liker?.username || 'Birisi'} "${card.title}" kartını beğendi.`,
            link: `/bingo/${card.category}/${card.id}`,
          });
        }
      } else {
        list.splice(idx, 1);
        active = false;
      }
    }

    return {
      active,
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
  if (result.invalidAction) return NextResponse.json({ error: 'Geçersiz aksiyon.' }, { status: 400 });
  return NextResponse.json(result);
}
