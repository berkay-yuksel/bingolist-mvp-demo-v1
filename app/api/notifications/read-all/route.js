import { NextResponse } from 'next/server';
import { updateDB } from '@/lib/db';

export async function POST(request) {
  const { userId } = await request.json();
  await updateDB((db) => {
    db.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
  });
  return NextResponse.json({ ok: true });
}
