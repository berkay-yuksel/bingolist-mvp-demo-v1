import { NextResponse } from 'next/server';
import { readDB, updateDB } from '@/lib/db';

// A report targets either a card (cardId) or a user profile
// (targetUsername) — exactly one of the two should be provided.
export async function POST(request) {
  const { cardId, targetUsername, userId, reason } = await request.json();
  if (!userId || !reason || (!cardId && !targetUsername)) {
    return NextResponse.json({ error: 'userId, reason ve (cardId veya targetUsername) gerekli.' }, { status: 400 });
  }

  const result = await updateDB((db) => {
    if (cardId) {
      const card = db.cards.find((c) => c.id === cardId);
      if (!card) return { error: true };
    } else {
      const target = db.users.find((u) => u.username === targetUsername);
      if (!target) return { error: true };
    }

    db.reports.push({
      id: `r_${Date.now()}`,
      cardId: cardId || null,
      targetUsername: targetUsername || null,
      userId,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return { ok: true };
  });

  if (result.error) return NextResponse.json({ error: 'Hedef bulunamadı.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const db = await readDB();
  const reports = db.reports.map((r) => {
    const reporter = db.users.find((u) => u.id === r.userId);
    if (r.cardId) {
      const card = db.cards.find((c) => c.id === r.cardId);
      return {
        ...r,
        type: 'card',
        subjectLabel: card?.title || '(silinmiş kart)',
        cardCategory: card?.category || null,
        reporterName: reporter?.displayName || 'Bilinmiyor',
      };
    }
    return {
      ...r,
      type: 'user',
      subjectLabel: r.targetUsername ? `@${r.targetUsername}` : '(silinmiş kullanıcı)',
      reporterName: reporter?.displayName || 'Bilinmiyor',
    };
  });
  return NextResponse.json({ reports: reports.reverse() });
}
