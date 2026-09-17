import { NextResponse } from 'next/server';
import { updateDB } from '@/lib/db';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const result = await updateDB((db) => {
    const n = db.notifications.find((x) => x.id === id);
    if (!n) return { error: true };
    n.read = true;
    return { notification: n };
  });
  if (result.error) return NextResponse.json({ error: 'Bildirim bulunamadı.' }, { status: 404 });
  return NextResponse.json(result);
}
