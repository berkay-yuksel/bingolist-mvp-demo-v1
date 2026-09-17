import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { verifyPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request) {
  const { username, password } = await request.json();
  const cleanUsername = (username || '').trim().toLowerCase();

  const db = await readDB();
  const user = db.users.find((u) => u.username === cleanUsername);

  if (!user || !user.passwordHash || !verifyPassword(password || '', user.passwordHash)) {
    return NextResponse.json({ error: 'Kullanıcı adı veya şifre hatalı.' }, { status: 401 });
  }

  const { passwordHash, ...publicUser } = user;
  const res = NextResponse.json({ user: publicUser });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
