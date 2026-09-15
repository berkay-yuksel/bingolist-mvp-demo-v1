import { NextResponse } from 'next/server';
import { readDB, creatorAnalytics } from '@/lib/db';

export async function GET(request, { params }) {
  const { username } = await params;
  const { searchParams } = new URL(request.url);
  const requesterId = searchParams.get('requesterId');

  const db = await readDB();
  const user = db.users.find((u) => u.username === username);
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
  if (requesterId !== user.id) {
    return NextResponse.json({ error: 'Sadece kendi analitiğini görebilirsin.' }, { status: 403 });
  }

  return NextResponse.json({ cards: creatorAnalytics(db, user.id) });
}
