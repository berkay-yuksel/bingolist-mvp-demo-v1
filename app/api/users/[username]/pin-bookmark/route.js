import { NextResponse } from 'next/server';
import { updateDB } from '@/lib/db';

export async function POST(request, { params }) {
  const { username } = await params;
  const { requesterId, cardId, pinned } = await request.json();

  const result = await updateDB((db) => {
    const user = db.users.find((u) => u.username === username);
    if (!user) return { error: 'Kullanıcı bulunamadı.', status: 404 };
    if (requesterId !== user.id) return { error: 'Sadece kendi kaydettiklerini sabitleyebilirsin.', status: 403 };

    if (!user.pinnedBookmarks) user.pinnedBookmarks = [];
    const idx = user.pinnedBookmarks.indexOf(cardId);
    if (pinned && idx === -1) user.pinnedBookmarks.push(cardId);
    if (!pinned && idx !== -1) user.pinnedBookmarks.splice(idx, 1);

    return { pinnedBookmarks: user.pinnedBookmarks };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
