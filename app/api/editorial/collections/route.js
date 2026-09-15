import { NextResponse } from 'next/server';
import { updateDB, hasRole } from '@/lib/db';

export async function POST(request) {
  const { editorId, title, cardIds } = await request.json();

  const result = await updateDB((db) => {
    const editor = db.users.find((u) => u.id === editorId);
    if (!editor || !hasRole(editor, ['editor'])) {
      return { error: 'Sadece editörler koleksiyon oluşturabilir.', status: 403 };
    }
    if (!title || !title.trim()) return { error: 'Koleksiyon başlığı gerekli.', status: 400 };

    const collection = {
      id: `col_${Date.now()}`,
      title: title.trim(),
      cardIds: Array.isArray(cardIds) ? cardIds : [],
    };
    db.collections.push(collection);
    return { collection };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ collection: result.collection }, { status: 201 });
}
