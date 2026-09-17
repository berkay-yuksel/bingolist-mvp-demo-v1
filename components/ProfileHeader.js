'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, Flag } from 'lucide-react';
import { useCurrentUser } from './UserContext';
import { formatCount } from '@/lib/format';
import ReportDialog from './ReportDialog';

export default function ProfileHeader({ profile }) {
  const { userId } = useCurrentUser();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [reportOpen, setReportOpen] = useState(false);
  const isSelf = userId === profile.id;

  useEffect(() => {
    fetch(`/api/users/${profile.username}?viewerId=${userId}`)
      .then((r) => r.json())
      .then((json) => setFollowing(json.isFollowing));
  }, [profile.username, userId]);

  async function toggleFollow() {
    const res = await fetch(`/api/users/${profile.username}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: userId }),
    });
    const json = await res.json();
    setFollowing(json.following);
    setFollowerCount(json.followerCount);
  }

  async function handleReport(reason) {
    await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUsername: profile.username, userId, reason }),
    });
  }

  const metricItems = profile.isCreator
    ? [
        ['Takipçi', followerCount],
        ['Oyuncu', profile.publicMetrics.uniquePlayers],
        ['Görüntülenme', profile.publicMetrics.cardViews],
        ['Paylaşım', profile.publicMetrics.shares],
      ]
    : [['Takipçi', followerCount]];

  return (
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
      <span
        className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full text-3xl font-bold text-ink"
        style={{ backgroundColor: profile.avatarColor }}
      >
        {profile.avatarImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarImage} alt="" className="h-full w-full object-cover" />
        ) : (
          profile.displayName[0]
        )}
      </span>
      <div className="flex-1">
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <h1 className="font-display text-2xl font-bold">{profile.displayName}</h1>
          {profile.isCreator && (
            <span className="rounded-full bg-stamp/15 px-2 py-0.5 text-[11px] font-semibold text-stamp">Creator</span>
          )}
        </div>
        <p className="text-sm text-paper/45">@{profile.username}</p>
        {profile.bio && <p className="mx-auto mt-2 max-w-md text-sm text-paper/70 sm:mx-0">{profile.bio}</p>}

        {Object.keys(profile.social || {}).length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-mint sm:justify-start">
            {Object.entries(profile.social).map(([platform, handle]) => (
              <span key={platform}>
                {platform}: @{handle}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 font-mono text-xs text-paper/55 sm:justify-start">
          {metricItems.map(([label, value]) => (
            <span key={label}>
              <strong className="text-paper">{formatCount(value)}</strong> {label}
            </span>
          ))}
        </div>
      </div>

      {!isSelf && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={toggleFollow}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              following ? 'border border-ink-500 text-paper/70 hover:border-stamp hover:text-stamp' : 'bg-mint text-ink hover:bg-mint-dark'
            }`}
          >
            {following ? 'Takip ediliyor' : 'Takip et'}
          </button>
          <button
            onClick={() => setReportOpen(true)}
            aria-label="Profili bildir"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink-500 text-paper/50 hover:border-stamp hover:text-stamp"
          >
            <Flag size={15} />
          </button>
        </div>
      )}
      {isSelf && (
        <Link
          href={`/profile/${profile.username}/settings`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink-500 px-4 py-2 text-sm font-semibold text-paper/70 hover:border-mint hover:text-mint"
        >
          <Settings size={15} /> Seçenekler
        </Link>
      )}
      {reportOpen && <ReportDialog onClose={() => setReportOpen(false)} onSubmit={handleReport} />}
    </div>
  );
}
