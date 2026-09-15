import { NextResponse } from 'next/server';
import { updateDB, hasRole } from '@/lib/db';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { editorId, featured } = await request.json();

  const result = await updateDB((db) => {
    const editor = db.users.find((u) => u.id === editorId);
    if (!editor || !hasRole(editor, ['editor'])) {
      return { error: 'Sadece editörler öne çıkan kartları yönetebilir.', status: 403 };
    }
    const card = db.cards.find((c) => c.id === id);
    if (!card) return { error: 'Kart bulunamadı.', status: 404 };
    card.featured = !!featured;
    return { card };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ featured: result.card.featured });
}
