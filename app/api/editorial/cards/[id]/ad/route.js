import { NextResponse } from 'next/server';
import { updateDB, hasRole } from '@/lib/db';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { editorId, isAd, adCategory } = await request.json();

  const result = await updateDB((db) => {
    const editor = db.users.find((u) => u.id === editorId);
    if (!editor || !hasRole(editor, ['editor'])) {
      return { error: 'Sadece editörler ad card yönetebilir.', status: 403 };
    }
    const card = db.cards.find((c) => c.id === id);
    if (!card) return { error: 'Kart bulunamadı.', status: 404 };
    if (isAd && adCategory && !db.categories.some((c) => c.slug === adCategory)) {
      return { error: 'Kategori bulunamadı.', status: 404 };
    }
    card.isAd = !!isAd;
    card.adCategory = isAd ? adCategory || null : null;
    return { card };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ isAd: result.card.isAd, adCategory: result.card.adCategory });
}
