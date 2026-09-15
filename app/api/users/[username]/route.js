import { NextResponse } from 'next/server';
import { readDB, updateDB, getProfileBundle } from '@/lib/db';

export async function GET(request, { params }) {
  const { username } = await params;
  const { searchParams } = new URL(request.url);
  const viewerId = searchParams.get('viewerId');

  const db = await readDB();
  const bundle = getProfileBundle(db, username, viewerId);
  if (!bundle) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });

  return NextResponse.json(bundle);
}

const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'twitter', 'youtube'];

// A user can only ever edit their own profile (requesterId must match).
export async function PATCH(request, { params }) {
  const { username } = await params;
  const { requesterId, displayName, bio, social, avatarImage } = await request.json();

  const result = await updateDB((db) => {
    const user = db.users.find((u) => u.username === username);
    if (!user) return { error: 'Kullanıcı bulunamadı.', status: 404 };
    if (requesterId !== user.id) return { error: 'Sadece kendi profilini düzenleyebilirsin.', status: 403 };

    if (displayName !== undefined && displayName.trim()) user.displayName = displayName.trim();
    if (bio !== undefined) user.bio = bio.slice(0, 240);
    if (avatarImage !== undefined) user.avatarImage = avatarImage;
    if (social && typeof social === 'object') {
      const cleaned = {};
      SOCIAL_PLATFORMS.forEach((p) => {
        const handle = (social[p] || '').trim().replace(/^@/, '');
        if (handle) cleaned[p] = handle;
      });
      user.social = cleaned;
    }
    return { user };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({
    profile: {
      username: result.user.username,
      displayName: result.user.displayName,
      bio: result.user.bio,
      social: result.user.social,
      avatarImage: result.user.avatarImage,
    },
  });
}
