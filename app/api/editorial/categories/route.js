import { NextResponse } from 'next/server';
import { updateDB, hasRole } from '@/lib/db';

// Which category rows ("X kategorisinde trend") show on the homepage, and in
// what order. Two ways to call it:
//   { editorId, slug, featured }          -> switch one category on/off
//   { editorId, featuredCategories: [] }  -> set the whole list in order
export async function PATCH(request) {
  const { editorId, slug, featured, featuredCategories } = await request.json();

  const result = await updateDB((db) => {
    const editor = db.users.find((u) => u.id === editorId);
    if (!editor || !hasRole(editor, ['editor'])) {
      return { error: 'Sadece editörler kategori öne çıkarabilir.', status: 403 };
    }

    if (Array.isArray(featuredCategories)) {
      const valid = new Set(db.categories.map((c) => c.slug));
      const next = [];
      for (const s of featuredCategories) {
        if (valid.has(s) && !next.includes(s)) next.push(s);
      }
      db.featuredCategories = next;
      return { featuredCategories: next };
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