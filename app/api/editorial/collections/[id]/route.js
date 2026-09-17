import { NextResponse } from 'next/server';
import { updateDB, hasRole } from '@/lib/db';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { editorId, title, cardIds } = await request.json();

  const result = await updateDB((db) => {
    const editor = db.users.find((u) => u.id === editorId);
    if (!editor || !hasRole(editor, ['editor'])) {
      return { error: 'Sadece editörler koleksiyonları düzenleyebilir.', status: 403 };
    }
    const collection = db.collections.find((c) => c.id === id);
    if (!collection) return { error: 'Koleksiyon bulunamadı.', status: 404 };
    if (title !== undefined) collection.title = title.trim();
    if (Array.isArray(cardIds)) collection.cardIds = cardIds;
    return { collection };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ collection: result.collection });
}
