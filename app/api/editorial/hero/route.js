import { NextResponse } from 'next/server';
import { readDB, updateDB, hasRole, publicCardSummary } from '@/lib/db';

export async function GET() {
  const db = await readDB();
  const card = db.heroBanner.cardId ? db.cards.find((c) => c.id === db.heroBanner.cardId) : null;
  return NextResponse.json({
    heroBanner: db.heroBanner,
    card: card ? publicCardSummary(card) : null,
  });
}

export async function PATCH(request) {
  const { editorId, cardId, media } = await request.json();

  const result = await updateDB((db) => {
    const editor = db.users.find((u) => u.id === editorId);
    if (!editor || !hasRole(editor, ['editor'])) {
      return { error: 'Sadece editörler banner\'ı yönetebilir.', status: 403 };
    }
    if (cardId !== undefined) {
      if (cardId && !db.cards.some((c) => c.id === cardId)) {
        return { error: 'Kart bulunamadı.', status: 404 };
      }
      db.heroBanner.cardId = cardId || null;
    }
    if (media !== undefined) db.heroBanner.media = media;
    return { heroBanner: db.heroBanner };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
