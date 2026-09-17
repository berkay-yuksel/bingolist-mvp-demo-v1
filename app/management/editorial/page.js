'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Save, Image as ImageIcon, Video, ChevronDown } from 'lucide-react';
import { useCurrentUser } from '@/components/UserContext';
import BannerImagePicker from '@/components/BannerImagePicker';

function parseIdList(text) {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function EditorialPage() {
  const { user, userId } = useCurrentUser();
  const [data, setData] = useState(null);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [newCollectionCardIds, setNewCollectionCardIds] = useState(new Set());
  const [newCollectionIdInput, setNewCollectionIdInput] = useState('');
  const [savingCollectionId, setSavingCollectionId] = useState(null);
  const [expandedCollections, setExpandedCollections] = useState(new Set());

  const [bannerCardId, setBannerCardId] = useState('');
  const [bannerMediaType, setBannerMediaType] = useState('image');
  const [bannerMediaUrl, setBannerMediaUrl] = useState(null);
  const [bannerVideoUrl, setBannerVideoUrl] = useState('');
  const [savingBanner, setSavingBanner] = useState(false);

  const [newAdCardId, setNewAdCardId] = useState('');
  const [newAdCategory, setNewAdCategory] = useState('');
  const [savingAd, setSavingAd] = useState(false);
  const [adError, setAdError] = useState(null);

  async function load() {
    const res = await fetch('/api/editorial/overview');
    const json = await res.json();
    setData(json);

    const heroRes = await fetch('/api/editorial/hero');
    const heroJson = await heroRes.json();
    setBannerCardId(heroJson.heroBanner?.cardId || '');
    setBannerMediaType(heroJson.heroBanner?.media?.type || 'image');
    if (heroJson.heroBanner?.media?.type === 'image') setBannerMediaUrl(heroJson.heroBanner.media.url);
    if (heroJson.heroBanner?.media?.type === 'video') setBannerVideoUrl(heroJson.heroBanner.media.url || '');
  }

  useEffect(() => {
    load();
  }, []);

  if (user.role !== 'editor') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-paper/50">Bu ekran sadece editörler için.</p>
        <Link href="/management" className="mt-3 inline-block text-mint">← Yönetime dön</Link>
      </div>
    );
  }

  if (!data) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-paper/50">Yükleniyor…</div>;

  function toggleCollectionExpanded(id) {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addIdsToNewCollection() {
    const ids = parseIdList(newCollectionIdInput).filter((id) => data.cards.some((c) => c.id === id));
    setNewCollectionCardIds((prev) => new Set([...prev, ...ids]));
    setNewCollectionIdInput('');
  }

  function addIdsToExistingCollection(colId, text) {
    const ids = parseIdList(text).filter((id) => data.cards.some((c) => c.id === id));
    setData((d) => ({
      ...d,
      collections: d.collections.map((c) =>
        c.id === colId ? { ...c, cardIds: Array.from(new Set([...c.cardIds, ...ids])) } : c
      ),
    }));
  }

  async function createCollection() {
    if (!newCollectionTitle.trim() || newCollectionCardIds.size === 0) return;
    const res = await fetch('/api/editorial/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editorId: userId, title: newCollectionTitle, cardIds: Array.from(newCollectionCardIds) }),
    });
    if (res.ok) {
      setNewCollectionTitle('');
      setNewCollectionCardIds(new Set());
      load();
    }
  }

  async function saveCollection(col) {
    setSavingCollectionId(col.id);
    await fetch(`/api/editorial/collections/${col.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editorId: userId, title: col.title, cardIds: col.cardIds }),
    });
    setSavingCollectionId(null);
    load();
  }

  function updateLocalCollection(id, patch) {
    setData((d) => ({ ...d, collections: d.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }

  function toggleLocalCollectionCard(id, cardId) {
    setData((d) => ({
      ...d,
      collections: d.collections.map((c) => {
        if (c.id !== id) return c;
        const has = c.cardIds.includes(cardId);
        return { ...c, cardIds: has ? c.cardIds.filter((cid) => cid !== cardId) : [...c.cardIds, cardId] };
      }),
    }));
  }

  async function saveBanner() {
    setSavingBanner(true);
    const media =
      bannerMediaType === 'image' && bannerMediaUrl
        ? { type: 'image', url: bannerMediaUrl }
        : bannerMediaType === 'video' && bannerVideoUrl.trim()
        ? { type: 'video', url: bannerVideoUrl.trim() }
        : null;
    await fetch('/api/editorial/hero', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editorId: userId, cardId: bannerCardId || null, media }),
    });
    setSavingBanner(false);
    load();
  }

  const adCards = data.cards.filter((c) => c.isAd);
  const bannerCard = data.cards.find((c) => c.id === bannerCardId);

  async function addAdCard() {
    setAdError(null);
    const id = newAdCardId.trim();
    if (!id) return;
    if (!data.cards.some((c) => c.id === id)) {
      setAdError('Bu ID ile bir kart bulunamadı.');
      return;
    }
    if (!newAdCategory) {
      setAdError('Bir kategori seç.');
      return;
    }
    setSavingAd(true);
    const res = await fetch(`/api/editorial/cards/${id}/ad`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editorId: userId, isAd: true, adCategory: newAdCategory }),
    });
    setSavingAd(false);
    if (res.ok) {
      setNewAdCardId('');
      setNewAdCategory('');
      load();
    } else {
      setAdError((await res.json()).error);
    }
  }

  async function removeAdCard(id) {
    await fetch(`/api/editorial/cards/${id}/ad`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editorId: userId, isAd: false }),
    });
    load();
  }

  return (
    <div className="mx-auto w-[92vw] max-w-[1800px] py-10">
      <Link href="/management" className="mb-4 inline-block text-sm text-paper/50 hover:text-paper">← Yönetim</Link>
      <p className="font-mono text-xs uppercase tracking-wider text-stamp">Editöryal</p>
      <h1 className="mb-8 font-display text-3xl font-bold">İçerik Yönetimi</h1>

      <datalist id="editorial-card-options">
        {data.cards.map((c) => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </datalist>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Ad cards */}
        <section className="rounded-lg border border-ink-500 bg-ink-700/40 p-4">
          <h2 className="mb-1 font-display text-lg font-bold">Ad Cards</h2>
          <p className="mb-3 text-xs text-paper/45">
            Belirlediğin kategoride en başta görünen, "ad" etiketiyle işaretlenmiş reklam kartları.
          </p>
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-paper/60">Kart ID</label>
              <input
                value={newAdCardId}
                onChange={(e) => setNewAdCardId(e.target.value)}
                list="editorial-card-options"
                placeholder="Kart ID yaz veya listeden seç…"
                className="w-64 rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm font-mono focus:border-mint"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-paper/60">Kategori</label>
              <select
                value={newAdCategory}
                onChange={(e) => setNewAdCategory(e.target.value)}
                className="rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
              >
                <option value="">Seç…</option>
                {data.categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{cat.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addAdCard}
              disabled={savingAd}
              className="flex items-center gap-1.5 rounded-md bg-stamp px-4 py-2 text-sm font-semibold text-ink hover:bg-stamp-light disabled:opacity-60"
            >
              <Save size={14} /> Onayla
            </button>
          </div>
          {adError && <p className="mb-2 text-xs text-stamp">{adError}</p>}
          {adCards.length === 0 ? (
            <p className="text-xs text-paper/40">Henüz ad card yok.</p>
          ) : (
            <div className="space-y-1">
              {adCards.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md bg-ink-800 px-3 py-2 text-sm">
                  <span className="truncate">
                    {c.title} <span className="ml-1 font-mono text-[10px] text-paper/30">{c.id}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-marker/20 px-2 py-0.5 text-[10px] font-medium text-marker">
                      {data.categories.find((cat) => cat.slug === c.adCategory)?.label || c.adCategory}
                    </span>
                    <button onClick={() => removeAdCard(c.id)} className="text-xs text-paper/40 hover:text-stamp">
                      Kaldır
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Hero banner */}
        <section className="rounded-lg border border-ink-500 bg-ink-700/40 p-4">
          <h2 className="mb-1 font-display text-lg font-bold">Anasayfa Banner'ı</h2>
          <p className="mb-3 text-xs text-paper/45">
            Anasayfanın en üstünde gösterilen kart ve yanındaki reklam görseli/videosu.
          </p>

          <div className="grid gap-4">
            <div>
              <p className="mb-1 text-xs font-medium text-paper/60">Önizleme (16:9)</p>
              {bannerMediaType === 'image' ? (
                <BannerImagePicker value={bannerMediaUrl} onChange={setBannerMediaUrl} />
              ) : (
                <input
                  value={bannerVideoUrl}
                  onChange={(e) => setBannerVideoUrl(e.target.value)}
                  placeholder="https://…mp4"
                  className="aspect-video w-full rounded-lg border border-dashed border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
                />
              )}
              <div className="mt-2 flex rounded-full bg-ink-800 p-1">
                <button
                  type="button"
                  onClick={() => setBannerMediaType('image')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium ${bannerMediaType === 'image' ? 'bg-mint text-ink' : 'text-paper/50'}`}
                >
                  <ImageIcon size={13} /> Görsel
                </button>
                <button
                  type="button"
                  onClick={() => setBannerMediaType('video')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium ${bannerMediaType === 'video' ? 'bg-mint text-ink' : 'text-paper/50'}`}
                >
                  <Video size={13} /> Video
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-paper/60">Banner'da gösterilecek kart</label>
              <input
                value={bannerCardId}
                onChange={(e) => setBannerCardId(e.target.value)}
                list="editorial-card-options"
                placeholder="Kart ID yaz veya listeden seç…"
                className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm font-mono focus:border-mint"
              />
              {bannerCard ? (
                <div className="mt-3 flex items-center gap-3 rounded-md border border-ink-500 bg-ink-800 p-3">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-ink-700">
                    {bannerCard.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bannerCard.coverImage} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-paper">{bannerCard.title}</p>
                    <p className="text-xs text-paper/40">{bannerCard.category}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-paper/35">Bu ID ile eşleşen bir kart bulunamadı.</p>
              )}
              <button
                onClick={saveBanner}
                disabled={savingBanner}
                className="mt-3 flex items-center gap-1.5 rounded-md bg-stamp px-4 py-2 text-sm font-semibold text-ink hover:bg-stamp-light disabled:opacity-60"
              >
                <Save size={14} /> Banner'ı Kaydet
              </button>
            </div>
          </div>
        </section>

        {/* Existing collections */}
        <section className="rounded-lg border border-ink-500 bg-ink-700/40 p-4 lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-bold">Koleksiyonlar</h2>
          <div className="space-y-3">
            {data.collections.map((col) => {
              const expanded = expandedCollections.has(col.id);
              return (
                <div key={col.id} className="rounded-md border border-ink-500 bg-ink-800">
                  <button
                    type="button"
                    onClick={() => toggleCollectionExpanded(col.id)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                  >
                    <span className="text-sm font-medium text-paper">
                      {col.title} <span className="text-xs text-paper/40">({col.cardIds.length} kart)</span>
                    </span>
                    <ChevronDown size={16} className={`text-paper/50 transition ${expanded ? 'rotate-180' : ''}`} />
                  </button>

                  {expanded && (
                    <div className="border-t border-ink-500 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <input
                          value={col.title}
                          onChange={(e) => updateLocalCollection(col.id, { title: e.target.value })}
                          className="flex-1 rounded-md border border-ink-500 bg-ink-700 px-2 py-1.5 text-sm"
                        />
                        <button
                          onClick={() => saveCollection(col)}
                          disabled={savingCollectionId === col.id}
                          className="flex items-center gap-1 rounded-md bg-mint px-3 py-1.5 text-xs font-semibold text-ink hover:bg-mint-dark disabled:opacity-60"
                        >
                          <Save size={13} /> Kaydet
                        </button>
                      </div>
                      <input
                        placeholder="Kart ID'leri ekle (virgülle ayır, Enter'a bas)"
                        list="editorial-card-options"
                        className="mb-2 w-full rounded-md border border-ink-500 bg-ink-700 px-2 py-1.5 text-xs font-mono"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addIdsToExistingCollection(col.id, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <div className="max-h-40 overflow-y-auto rounded-md border border-ink-500 bg-ink-700/50 p-2">
                        {data.cards.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-ink-600">
                            <input
                              type="checkbox"
                              checked={col.cardIds.includes(c.id)}
                              onChange={() => toggleLocalCollectionCard(col.id, c.id)}
                              className="accent-mint"
                            />
                            <span className="truncate">{c.title}</span>
                            <span className="ml-auto shrink-0 font-mono text-[10px] text-paper/30">{c.id}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-md border border-dashed border-ink-500 p-3">
            <p className="mb-2 text-sm font-medium text-paper/70">Yeni Koleksiyon</p>
            <input
              value={newCollectionTitle}
              onChange={(e) => setNewCollectionTitle(e.target.value)}
              placeholder="Koleksiyon başlığı"
              className="mb-2 w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
            />
            <div className="mb-2 flex gap-2">
              <input
                value={newCollectionIdInput}
                onChange={(e) => setNewCollectionIdInput(e.target.value)}
                list="editorial-card-options"
                placeholder="Kart ID'lerini gir, virgülle ayır…"
                className="flex-1 rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-xs font-mono focus:border-mint"
              />
              <button
                type="button"
                onClick={addIdsToNewCollection}
                className="rounded-md border border-ink-500 px-3 text-xs text-paper/70 hover:border-mint hover:text-mint"
              >
                Ekle
              </button>
            </div>
            {newCollectionCardIds.size > 0 && (
              <p className="mb-2 text-[11px] text-paper/40">{newCollectionCardIds.size} kart seçili (ID veya aşağıdaki listeden)</p>
            )}
            <div className="mb-2 max-h-40 overflow-y-auto rounded-md border border-ink-500 bg-ink-800 p-2">
              {data.cards.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-ink-600">
                  <input
                    type="checkbox"
                    checked={newCollectionCardIds.has(c.id)}
                    onChange={() =>
                      setNewCollectionCardIds((prev) => {
                        const next = new Set(prev);
                        next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                        return next;
                      })
                    }
                    className="accent-mint"
                  />
                  <span className="truncate">{c.title}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-paper/30">{c.id}</span>
                </label>
              ))}
            </div>
            <button
              onClick={createCollection}
              disabled={!newCollectionTitle.trim() || newCollectionCardIds.size === 0}
              className="flex items-center gap-1.5 rounded-md bg-stamp px-3 py-2 text-sm font-semibold text-ink hover:bg-stamp-light disabled:opacity-50"
            >
              <Plus size={14} /> Koleksiyonu Oluştur
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
