import { NextResponse } from 'next/server';
import { updateDB, hasRole } from '@/lib/db';

export async function PATCH(request) {
  const { editorId, slug, tags } = await request.json();

  const result = await updateDB((db) => {
    const editor = db.users.find((u) => u.id === editorId);
    if (!editor || !hasRole(editor, ['editor'])) {
      return { error: 'Sadece editörler popüler etiketleri yönetebilir.', status: 403 };
    }
    if (!db.categories.some((c) => c.slug === slug)) {
      return { error: 'Kategori bulunamadı.', status: 404 };
    }
    const cleaned = (Array.isArray(tags) ? tags : [])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 2);
    db.categoryPopularTags[slug] = cleaned;
    return { tags: cleaned };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
