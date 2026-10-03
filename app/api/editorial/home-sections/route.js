import { NextResponse } from 'next/server';
import { updateDB, hasRole, sanitizeHomeSections } from '@/lib/db';

// Sets which rows the homepage shows after "Öne Çıkanlar" and in what order:
//   { editorId, homeSections: ['category:gaming', 'collection:col_1', 'popular'] }
export async function PATCH(request) {
  const { editorId, homeSections } = await request.json();

  const result = await updateDB((db) => {
    const editor = db.users.find((u) => u.id === editorId);
    if (!editor || !hasRole(editor, ['editor'])) {
      return { error: 'Sadece editörler anasayfa satırlarını düzenleyebilir.', status: 403 };
    }
    if (!Array.isArray(homeSections)) {
      return { error: 'homeSections bir liste olmalı.', status: 400 };
    }
    db.homeSections = sanitizeHomeSections(db, homeSections);
    return { homeSections: db.homeSections };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}