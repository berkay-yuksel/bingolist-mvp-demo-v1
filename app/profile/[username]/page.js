'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useCurrentUser } from '@/components/UserContext';
import CardTile from '@/components/CardTile';
import CardRow from '@/components/CardRow';
import ProfileHeader from '@/components/ProfileHeader';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ProfilePage({ params }) {
  const { username } = use(params);
  const { userId } = useCurrentUser();
  const [bundle, setBundle] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await fetch(`/api/users/${username}?viewerId=${userId}`);
    if (!res.ok) return setNotFound(true);
    const json = await res.json();
    setBundle(json);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, userId]);

  async function toggleCardPin(cardId, value) {
    setBundle((b) => ({
      ...b,
      profile: {
        ...b.profile,
        cards: b.profile.cards.map((c) => (c.id === cardId ? { ...c, pinnedOnProfile: value } : c)),
      },
    }));
    await fetch(`/api/cards/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: userId, pinnedOnProfile: value }),
    });
    load();
  }

  async function toggleBookmarkPin(cardId, pinned) {
    setBundle((b) => ({
      ...b,
      bookmarkedCards: b.bookmarkedCards.map((c) => (c.id === cardId ? { ...c, pinnedBookmark: pinned } : c)),
    }));
    await fetch(`/api/users/${username}/pin-bookmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: userId, cardId, pinned }),
    });
    load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/cards/${deleteTarget.id}?requesterId=${userId}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      setBundle((b) => ({ ...b, profile: { ...b.profile, cards: b.profile.cards.filter((c) => c.id !== deleteTarget.id) } }));
      setDeleteTarget(null);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-xl font-bold">Kullanıcı bulunamadı</p>
        <Link href="/" className="mt-3 inline-block text-mint">← Keşfete dön</Link>
      </div>
    );
  }
  if (!bundle) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-paper/50">Yükleniyor…</div>;

  const { profile, recentlyPlayed, bookmarkedCards, isSelf } = bundle;

  return (
    <div>
      <div className="mx-auto w-[92vw] max-w-[1800px] pt-10">
        <ProfileHeader profile={profile} />
      </div>

      {profile.isCreator && (
        <CardRow
          title="Yayınlanan Kartlar"
          eyebrow={`${profile.cards.length} kart`}
          cards={profile.cards}
          emptyLabel="Henüz yayınlanmış kart yok."
          renderCard={(card) => (
            <CardTile
              card={card}
              pinned={isSelf ? card.pinnedOnProfile : undefined}
              onTogglePin={isSelf ? (val) => toggleCardPin(card.id, val) : undefined}
              extraMenuItems={
                isSelf
                  ? [{ label: 'Kartı sil', icon: Trash2, onClick: () => setDeleteTarget(card) }]
                  : undefined
              }
            />
          )}
        />
      )}

      {isSelf && (
        <CardRow
          title="Kaydedilenler"
          cards={bookmarkedCards || []}
          emptyLabel="Henüz bir kart kaydetmedin."
          renderCard={(card) => (
            <CardTile
              card={card}
              savedContext
              pinned={card.pinnedBookmark}
              onTogglePin={(val) => toggleBookmarkPin(card.id, val)}
              onRemoved={() =>
                setBundle((b) => ({ ...b, bookmarkedCards: b.bookmarkedCards.filter((c) => c.id !== card.id) }))
              }
            />
          )}
        />
      )}

      {recentlyPlayed.length > 0 && <CardRow title="Son Oynananlar" cards={recentlyPlayed} />}

      {deleteTarget && (
        <ConfirmDialog
          title="Kartı sil"
          body={`"${deleteTarget.title}" kartını silmek istediğine emin misin? Bu işlem geri alınamaz.`}
          confirmLabel="Evet, sil"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
