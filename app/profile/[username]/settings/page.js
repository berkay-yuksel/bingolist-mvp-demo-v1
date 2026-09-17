'use client';

import { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, MousePointerClick, Heart, Bookmark, Share2, Repeat, Check, X as XIcon, Trash2 } from 'lucide-react';
import { useCurrentUser } from '@/components/UserContext';
import { formatCount } from '@/lib/format';
import ImagePicker from '@/components/ImagePicker';

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'youtube', label: 'YouTube' },
];

const ISSUE_STATUS_LABEL = {
  OPEN: 'Açık',
  UNDER_REVIEW: 'İnceleniyor',
  REVISION_REQUESTED: 'Revizyon İstendi',
  PENDING_REVIEW: 'İncelemeyi Bekliyor',
  RESOLVED: 'Çözüldü',
};
const ISSUE_STATUS_STYLE = {
  OPEN: 'bg-ink-500/40 text-paper/60',
  UNDER_REVIEW: 'bg-marker/20 text-marker',
  REVISION_REQUESTED: 'bg-stamp/20 text-stamp',
  PENDING_REVIEW: 'bg-mint/20 text-mint',
  RESOLVED: 'bg-ink-500/30 text-paper/50',
};

function ConnectRow({ platform, handle, onConnect, onDisconnect }) {
  const [connecting, setConnecting] = useState(false);
  const [inputValue, setInputValue] = useState('');

  if (connecting) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-mint/40 bg-mint/5 px-3 py-2">
        <span className="w-24 shrink-0 text-sm text-paper/70">{platform.label}</span>
        <input
          autoFocus
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="kullaniciadi"
          className="flex-1 rounded-md border border-ink-500 bg-ink-800 px-2 py-1.5 text-sm"
        />
        <button
          onClick={() => {
            if (inputValue.trim()) onConnect(inputValue.trim());
            setConnecting(false);
            setInputValue('');
          }}
          className="rounded-md bg-mint p-1.5 text-ink hover:bg-mint-dark"
        >
          <Check size={14} />
        </button>
        <button onClick={() => setConnecting(false)} className="rounded-md p-1.5 text-paper/50 hover:bg-ink-600">
          <XIcon size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-ink-500 bg-ink-800 px-3 py-2">
      <span className="flex items-center gap-2 text-sm">
        <span className="w-24 shrink-0 text-paper/70">{platform.label}</span>
        {handle && <span className="text-mint">@{handle}</span>}
      </span>
      {handle ? (
        <button onClick={onDisconnect} className="text-xs text-paper/40 hover:text-stamp">
          Bağlantıyı kaldır
        </button>
      ) : (
        <button
          onClick={() => setConnecting(true)}
          className="rounded-full border border-ink-500 px-3 py-1 text-xs font-medium text-paper/70 hover:border-mint hover:text-mint"
        >
          Bağla
        </button>
      )}
    </div>
  );
}

export default function ProfileSettingsPage({ params }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-16 text-center text-paper/50">Yükleniyor…</div>}>
      <SettingsInner params={params} />
    </Suspense>
  );
}

const NOTIF_ICON = {
  issue_opened: '🔍',
  revision_requested: '✏️',
  issue_resolved: '✅',
  revision_approved: '✅',
  submitted_for_review: '📨',
  creator_reply: '💬',
  moderator_reply: '💬',
  new_follower: '➕',
  card_liked: '❤️',
};

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins}dk önce`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}sa önce`;
  return `${Math.round(hours / 24)}g önce`;
}

function SettingsInner({ params }) {
  const { username } = use(params);
  const { user, userId } = useCurrentUser();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'notifications' ? 'notifications' : 'profile');

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [social, setSocial] = useState({});
  const [avatarImage, setAvatarImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [issues, setIssues] = useState(null);
  const [notifications, setNotifications] = useState(null);

  const isSelf = user.username === username;

  useEffect(() => {
    if (!isSelf) return;
    setDisplayName(user.displayName);
    setBio(user.bio || '');
    setSocial(user.social || {});
    setAvatarImage(user.avatarImage || null);
  }, [isSelf, user]);

  useEffect(() => {
    if (!isSelf || !user.isCreator || tab !== 'analytics') return;
    fetch(`/api/creator-analytics/${username}?requesterId=${userId}`)
      .then((r) => r.json())
      .then((json) => setAnalytics(json.cards || []));
  }, [isSelf, user.isCreator, tab, username, userId]);

  useEffect(() => {
    if (!isSelf || tab !== 'moderation') return;
    fetch(`/api/moderation/issues?creatorId=${userId}`)
      .then((r) => r.json())
      .then((json) => setIssues(json.issues || []));
  }, [isSelf, tab, userId]);

  useEffect(() => {
    if (!isSelf || tab !== 'notifications') return;
    fetch(`/api/notifications?userId=${userId}`)
      .then((r) => r.json())
      .then((json) => setNotifications(json.notifications || []));
  }, [isSelf, tab, userId]);

  async function clearNotifications() {
    await fetch(`/api/notifications?userId=${userId}`, { method: 'DELETE' });
    setNotifications([]);
  }

  if (!isSelf) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-paper/50">Sadece kendi profil ayarlarını görebilirsin.</p>
        <Link href={`/profile/${username}`} className="mt-3 inline-block text-mint">← Profile dön</Link>
      </div>
    );
  }

  async function persist(patch) {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/users/${username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: userId, ...patch }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleSave(e) {
    e.preventDefault();
    persist({ displayName, bio, social, avatarImage });
  }

  function connectPlatform(platformId, handle) {
    const next = { ...social, [platformId]: handle };
    setSocial(next);
    persist({ social: next });
  }

  function disconnectPlatform(platformId) {
    const next = { ...social };
    delete next[platformId];
    setSocial(next);
    persist({ social: next });
  }

  const totals = analytics?.reduce(
    (acc, c) => ({
      views: acc.views + c.views,
      plays: acc.plays + c.plays,
      likes: acc.likes + c.likes,
      bookmarks: acc.bookmarks + c.bookmarks,
      shares: acc.shares + c.shares,
      remixes: acc.remixes + c.remixes,
    }),
    { views: 0, plays: 0, likes: 0, bookmarks: 0, shares: 0, remixes: 0 }
  );

  return (
    <div className="mx-auto w-[92vw] max-w-[1400px] py-10">
      <Link href={`/profile/${username}`} className="mb-4 inline-block text-sm text-paper/50 hover:text-paper">
        ← Profile dön
      </Link>
      <h1 className="mb-6 font-display text-4xl font-bold">Seçenekler</h1>

      <div className="mb-8 flex gap-1.5 rounded-full bg-ink-700 p-1 sm:w-fit">
        <button
          onClick={() => setTab('profile')}
          className={`rounded-full px-6 py-2.5 text-sm font-medium ${tab === 'profile' ? 'bg-stamp text-ink' : 'text-paper/60'}`}
        >
          Profili Düzenle
        </button>
        {user.isCreator && (
          <button
            onClick={() => setTab('analytics')}
            className={`rounded-full px-6 py-2.5 text-sm font-medium ${tab === 'analytics' ? 'bg-stamp text-ink' : 'text-paper/60'}`}
          >
            Creator Analytics
          </button>
        )}
        <button
          onClick={() => setTab('moderation')}
          className={`rounded-full px-6 py-2.5 text-sm font-medium ${tab === 'moderation' ? 'bg-stamp text-ink' : 'text-paper/60'}`}
        >
          Moderasyon
        </button>
        <button
          onClick={() => setTab('notifications')}
          className={`rounded-full px-6 py-2.5 text-sm font-medium ${tab === 'notifications' ? 'bg-stamp text-ink' : 'text-paper/60'}`}
        >
          Bildirimler
        </button>
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="rounded-xl border border-ink-500 bg-ink-700/40 p-5 text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-paper/45">Profil fotoğrafı</p>
            <div className="mx-auto mb-3 h-32 w-32 overflow-hidden rounded-full border border-ink-500">
              {avatarImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="grid h-full w-full place-items-center text-4xl font-bold text-ink"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {displayName[0]}
                </div>
              )}
            </div>
            <ImagePicker value={avatarImage} onChange={setAvatarImage} label="Fotoğraf yükle" type="avatar" />
          </div>

          <div className="space-y-5 rounded-xl border border-ink-500 bg-ink-700/40 p-6">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-paper/60">Görünen ad</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2.5 text-sm focus:border-mint"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-paper/60">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 240))}
                rows={3}
                className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2.5 text-sm focus:border-mint"
              />
              <p className="mt-1 text-right text-[11px] text-paper/35">{bio.length}/240</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-paper/60">Sosyal hesaplar</p>
              <div className="space-y-2">
                {SOCIAL_PLATFORMS.map((p) => (
                  <ConnectRow
                    key={p.id}
                    platform={p}
                    handle={social[p.id]}
                    onConnect={(handle) => connectPlatform(p.id, handle)}
                    onDisconnect={() => disconnectPlatform(p.id)}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-stamp py-3 text-sm font-semibold text-ink hover:bg-stamp-light disabled:opacity-60"
            >
              {saving ? 'Kaydediliyor…' : saved ? 'Kaydedildi ✓' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}

      {tab === 'analytics' && (
        <div>
          {!analytics ? (
            <p className="text-sm text-paper/45">Yükleniyor…</p>
          ) : analytics.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-500 p-8 text-center text-sm text-paper/45">
              Henüz kartın yok.
            </p>
          ) : (
            <>
              {totals && (
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    ['Görüntülenme', totals.views, Eye],
                    ['Oyuncu', analytics.reduce((s, c) => s + c.uniquePlayers, 0), MousePointerClick],
                    ['Beğeni', totals.likes, Heart],
                    ['Kaydetme', totals.bookmarks, Bookmark],
                    ['Paylaşım', totals.shares, Share2],
                    ['Remix', totals.remixes, Repeat],
                  ].map(([label, value, Icon]) => (
                    <div key={label} className="rounded-xl border border-ink-500 bg-ink-700/40 p-4 text-center">
                      <Icon size={16} className="mx-auto mb-1.5 text-mint" />
                      <p className="font-display text-2xl font-bold">{formatCount(value)}</p>
                      <p className="text-[11px] text-paper/45">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {analytics.map((c) => (
                  <div key={c.id} className="rounded-xl border border-ink-500 bg-ink-700/40 p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <Link href={`/bingo/${c.category}/${c.id}`} className="font-display text-sm font-bold text-paper hover:underline">
                        {c.title}
                      </Link>
                      {c.visibility === 'private' && (
                        <span className="shrink-0 rounded-full bg-ink-800 px-2 py-0.5 text-[10px] text-paper/40">özel</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        ['Görünt.', c.views],
                        ['Oyuncu', c.uniquePlayers],
                        ['Beğeni', c.likes],
                        ['Kayıt', c.bookmarks],
                        ['Paylaşım', c.shares],
                        ['Remix', c.remixes],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-md bg-ink-800 py-2">
                          <p className="font-mono text-sm font-semibold text-paper">{formatCount(value)}</p>
                          <p className="text-[10px] text-paper/40">{label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-center text-[11px] text-paper/40">Tamamlanma oranı: %{c.completionRate}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'moderation' && (
        <div>
          {!issues ? (
            <p className="text-sm text-paper/45">Yükleniyor…</p>
          ) : issues.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-500 p-8 text-center text-sm text-paper/45">
              Kartlarınla ilgili herhangi bir moderasyon issue'su yok.
            </p>
          ) : (
            <div className="space-y-2">
              {issues.map((i) => (
                <Link
                  key={i.id}
                  href={`/management/moderation/${i.id}`}
                  className="flex items-center gap-3 rounded-lg border border-ink-500 bg-ink-700/40 p-3 hover:border-mint"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-paper">{i.cardTitle}</p>
                    <p className="text-[11px] text-paper/40">{i.reason}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${ISSUE_STATUS_STYLE[i.status]}`}>
                    {ISSUE_STATUS_LABEL[i.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'notifications' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-paper/50">Tüm bildirim geçmişin.</p>
            {notifications?.length > 0 && (
              <button
                onClick={clearNotifications}
                className="flex items-center gap-1.5 rounded-full border border-ink-500 px-3 py-1.5 text-xs text-paper/60 hover:border-stamp hover:text-stamp"
              >
                <Trash2 size={13} /> Tümünü temizle
              </button>
            )}
          </div>
          {!notifications ? (
            <p className="text-sm text-paper/45">Yükleniyor…</p>
          ) : notifications.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-500 p-8 text-center text-sm text-paper/45">
              Henüz bildirim yok.
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || '#'}
                  className={`flex items-start gap-3 rounded-lg border border-ink-500 p-3 hover:border-mint ${
                    !n.read ? 'bg-ink-700/60' : 'bg-ink-700/20'
                  }`}
                >
                  <span className="shrink-0 text-lg">{NOTIF_ICON[n.type] || '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-paper">{n.title}</p>
                    {n.body && <p className="text-xs text-paper/55">{n.body}</p>}
                    <p className="mt-0.5 text-[11px] text-paper/35">{timeAgo(n.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
