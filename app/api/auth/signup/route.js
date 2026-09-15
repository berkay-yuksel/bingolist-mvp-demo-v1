import { NextResponse } from 'next/server';
import { updateDB } from '@/lib/db';
import { hashPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth';

const AVATAR_COLORS = ['#38D6A7', '#FF8A3D', '#4FA3FF', '#B98CFF', '#F06EC7', '#FFC53D', '#22A06B', '#FF4B6E'];

export async function POST(request) {
  const { username, displayName, password } = await request.json();

  const cleanUsername = (username || '').trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
    return NextResponse.json(
      { error: 'Kullanıcı adı 3-20 karakter olmalı; sadece küçük harf, rakam ve alt çizgi kullanılabilir.' },
      { status: 400 }
    );
  }
  if (!displayName || !displayName.trim()) {
    return NextResponse.json({ error: 'İsim gerekli.' }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı.' }, { status: 400 });
  }

  const result = await updateDB((db) => {
    if (db.users.some((u) => u.username === cleanUsername)) {
      return { error: 'Bu kullanıcı adı zaten alınmış.', status: 409 };
    }
    const user = {
      id: `u_${Date.now()}`,
      username: cleanUsername,
      displayName: displayName.trim(),
      bio: '',
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      avatarImage: null,
      isCreator: true,
      role: 'player',
      social: {},
      following: [],
      followers: [],
      passwordHash: hashPassword(password),
    };
    db.users.push(user);
    return { user };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  const { passwordHash, ...publicUser } = result.user;
  const res = NextResponse.json({ user: publicUser });
  res.cookies.set(SESSION_COOKIE, createSessionToken(result.user.id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
