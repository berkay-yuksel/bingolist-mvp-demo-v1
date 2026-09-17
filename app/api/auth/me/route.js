import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDB } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const userId = token ? verifySessionToken(token) : null;
  if (!userId) return NextResponse.json({ user: null });

  const db = await readDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return NextResponse.json({ user: null });

  const { passwordHash, ...publicUser } = user;
  return NextResponse.json({ user: publicUser });
}
