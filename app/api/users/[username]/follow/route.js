import { NextResponse } from 'next/server';
import { updateDB, addNotification } from '@/lib/db';

export async function POST(request, { params }) {
  const { username } = await params;
  const { followerId } = await request.json();
  if (!followerId) return NextResponse.json({ error: 'followerId gerekli.' }, { status: 400 });

  const result = await updateDB((db) => {
    const target = db.users.find((u) => u.username === username);
    const follower = db.users.find((u) => u.id === followerId);
    if (!target || !follower) return { error: 'Kullanıcı bulunamadı.', status: 404 };
    if (target.id === follower.id) return { error: 'Kendini takip edemezsin.', status: 400 };

    const idx = target.followers.indexOf(follower.id);
    let following;
    if (idx === -1) {
      target.followers.push(follower.id);
      if (!follower.following.includes(target.id)) follower.following.push(target.id);
      following = true;
      addNotification(db, {
        userId: target.id,
        type: 'new_follower',
        title: 'Yeni takipçi',
        body: `@${follower.username} seni takip etmeye başladı.`,
        link: `/profile/${follower.username}`,
      });
    } else {
      target.followers.splice(idx, 1);
      follower.following = follower.following.filter((id) => id !== target.id);
      following = false;
    }

    return { following, followerCount: target.followers.length };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
