import { NextResponse } from 'next/server';
import { updateDB, hasRole } from '@/lib/db';

export async function PATCH(request) {
  const { editorId, slug, featured } = await request.json();

  const result = await updateDB((db) => {
    const editor = db.users.find((u) => u.id === editorId);
    if (!editor || !hasRole(editor, ['editor'])) {
      return { error: 'Sadece editörler kategori öne çıkarabilir.', status: 403 };
    }
    if (!db.categories.some((c) => c.slug === slug)) {
      return { error: 'Kategori bulunamadı.', status: 404 };
    }
    const set = new Set(db.featuredCategories);
    if (featured) set.add(slug);
    else set.delete(slug);
    db.featuredCategories = Array.from(set);
    return { featuredCategories: db.featuredCategories };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
