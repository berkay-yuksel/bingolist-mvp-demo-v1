import { NextResponse } from 'next/server';
import { readDB, updateDB } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId gerekli.' }, { status: 400 });

  const db = await readDB();
  const notifications = db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 30);

  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  });
}

// Clears (deletes) all notifications for a user.
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId gerekli.' }, { status: 400 });

  await updateDB((db) => {
    db.notifications = db.notifications.filter((n) => n.userId !== userId);
  });
  return NextResponse.json({ ok: true });
}
