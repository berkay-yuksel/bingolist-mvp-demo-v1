'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Square, Circle, RectangleVertical, Grid3x3, Lock } from 'lucide-react';
import { useCurrentUser } from '@/components/UserContext';
import { CATEGORIES } from '@/lib/mockData';
import ImagePicker from '@/components/ImagePicker';
import BulkImagePicker from '@/components/BulkImagePicker';
import BingoGrid from '@/components/BingoGrid';
import { parseBulkText, applyBulkText, filenameToText } from '@/lib/bulkFill';

function accentForCategory(category) {
  return CATEGORIES.find((c) => c.slug === category)?.accent || '#38D6A7';
}

const SHAPES = [
  { id: 'square', label: 'Kare', icon: Square },
  { id: 'poster', label: 'Poster', icon: RectangleVertical },
  { id: 'circle', label: 'Daire', icon: Circle, disabled: true },
];
const MARKS = [
  { id: 'check', label: 'Tik ✓', disabled: true },
  { id: 'dot', label: 'Nokta ●', disabled: true },
  { id: 'stamp', label: 'Damga ★', disabled: true },
  { id: 'border', label: 'Çerçeve' },
];
const PRESETS = [
  { id: '3x3', n: 9, rows: 3, cols: 3, label: '3×3' },
  { id: '5x4', n: 20, rows: 4, cols: 5, label: '5×4' },
  { id: '5x5', n: 25, rows: 5, cols: 5, label: '5×5' },
  { id: '10x10', n: 100, rows: 10, cols: 10, label: '10×10' },
];
const MAX_COLS = 10;
const MAX_ROWS = 20;

function emptyCell(i) {
  return { id: `c${Date.now()}_${i}`, text: '', emoji: null, image: null, description: '' };
}

function resizeCells(prev, total) {
  if (total === prev.length) return prev;
  if (total > prev.length) {
    return [...prev, ...Array.from({ length: total - prev.length }, (_, i) => emptyCell(prev.length + i))];
  }
  return prev.slice(0, total);
}

function minutesLeft(iso) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 60000));
}

export default function EditCardPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { userId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [moderationGrant, setModerationGrant] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [cellShape, setCellShape] = useState('square');
  const [checkStyle, setCheckStyle] = useState('border');
  const [hideCellText, setHideCellText] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [columns, setColumns] = useState(3);
  const [cells, setCells] = useState([]);
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [useFilenameAsText, setUseFilenameAsText] = useState(false);
  const [activePreset, setActivePreset] = useState('custom');
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [previewSelected, setPreviewSelected] = useState(new Set());

  useEffect(() => {
    fetch(`/api/cards/${id}?userId=${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error('not-found');
        return r.json();
      })
      .then((json) => {
        const card = json.card;
        setTitle(card.title);
        setDescription(card.description || '');
        setCategory(card.category);
        setTagsInput(card.tags.filter((t) => t !== card.category).join(', '));
        setVisibility(card.visibility);
        setCellShape(card.cellShape);
        setCheckStyle(card.checkStyle);
        setHideCellText(!!card.hideCellText);
        setColumns(card.columns);
        setCells(card.cells);
        setCoverImage(card.coverImage || null);
        const rows = Math.ceil(card.cells.length / card.columns);
        setCustomRows(rows);
        setCustomCols(card.columns);
        setViewer(json.viewerState);
        setModerationGrant(card.moderationEditGrant);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId]);

  function applyPreset(preset) {
    setActivePreset(preset.id);
    setColumns(preset.cols);
    setCustomRows(preset.rows);
    setCustomCols(preset.cols);
    setCells((prev) => resizeCells(prev, preset.n));
  }

  function applyCustom(rows, cols) {
    const safeRows = Math.max(1, Math.min(MAX_ROWS, rows || 1));
    const safeCols = Math.max(1, Math.min(MAX_COLS, cols || 1));
    setCustomRows(safeRows);
    setCustomCols(safeCols);
    setColumns(safeCols);
    setCells((prev) => resizeCells(prev, safeRows * safeCols));
  }

  function selectCustom() {
    setActivePreset('custom');
    applyCustom(customRows, customCols);
  }

  function addCell() {
    setCells((prev) => [...prev, emptyCell(prev.length)]);
  }

  function removeCell(cellId) {
    setCells((prev) => prev.filter((c) => c.id !== cellId));
  }

  function updateCell(cellId, patch) {
    setCells((prev) => prev.map((c) => (c.id === cellId ? { ...c, ...patch } : c)));
  }

  function handleBulkImages(images) {
    setCells((prev) => {
      let imgIdx = 0;
      const next = prev.map((c) => {
        if (imgIdx < images.length && !c.image) {
          const img = images[imgIdx++];
          return { ...c, image: img.url, text: useFilenameAsText && !c.text ? filenameToText(img.filename) : c.text };
        }
        return c;
      });
      while (imgIdx < images.length) {
        const img = images[imgIdx++];
        next.push({ ...emptyCell(next.length), image: img.url, text: useFilenameAsText ? filenameToText(img.filename) : '' });
      }
      return next;
    });
  }

  function applyBulkTextInput() {
    const entries = parseBulkText(bulkTextInput);
    setCells((prev) => applyBulkText(prev, entries));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError('Kart için bir başlık gerekli.');
    const filledCells = cells.filter((c) => c.text.trim() || c.image);
    if (filledCells.length === 0) return setError('En az bir hücreye içerik girmelisin.');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/cards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: userId,
          title,
          description,
          tags: [category, ...tagsInput.split(',').map((t) => t.trim()).filter(Boolean)].slice(0, 8),
          visibility,
          theme: { accent: accentForCategory(category) },
          cellShape,
          checkStyle,
          hideCellText,
          coverImage,
          columns,
          cells,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Kaydedilemedi.');
      setSaved(true);
      setSubmitting(false);
      if (!moderationGrant) {
        router.push(`/bingo/${category}/${id}`);
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  async function submitForReview() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/moderation/issues/${moderationGrant.issueId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push(`/bingo/${category}/${id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-paper/50">Yükleniyor…</div>;
  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-2xl font-bold">Kart bulunamadı</p>
        <Link href="/" className="mt-4 inline-block text-mint">← Keşfete dön</Link>
      </div>
    );
  }
  if (!viewer?.isOwner) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Lock size={28} className="mx-auto mb-3 text-paper/40" />
        <p className="font-display text-xl font-bold">Bu kartı düzenleyemezsin</p>
        <p className="mt-2 text-sm text-paper/50">Sadece kartın sahibi düzenleyebilir.</p>
        <Link href={`/bingo/${category}/${id}`} className="mt-4 inline-block text-mint">← Karta dön</Link>
      </div>
    );
  }
  if (!viewer.canEditContent) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Lock size={28} className="mx-auto mb-3 text-paper/40" />
        <p className="font-display text-xl font-bold">Düzenleme penceresi kapandı</p>
        <p className="mt-2 text-sm text-paper/50">
          Kartlar, topluluk istatistiklerinin anlamını korumak için yayınlandıktan sonra 30 dakika boyunca serbestçe
          düzenlenebilir. Bu sürenin ardından içerik değişikliği için bir moderatörün "revizyon" izni vermesi gerekir.
        </p>
        <Link href={`/bingo/${category}/${id}`} className="mt-4 inline-block text-mint">← Karta dön</Link>
      </div>
    );
  }

  if (saved && moderationGrant) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-xl font-bold text-mint">Değişiklikler kaydedildi</p>
        <p className="mt-2 text-sm text-paper/60">
          Bu kart bir moderasyon revizyonu altında. Değişiklikleri moderatöre göndermek için aşağıdaki butona bas.
        </p>
        <button
          onClick={submitForReview}
          disabled={submitting}
          className="mt-4 rounded-lg bg-stamp px-5 py-2.5 text-sm font-semibold text-ink hover:bg-stamp-light disabled:opacity-60"
        >
          {submitting ? 'Gönderiliyor…' : 'İncelemeye Gönder'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6">
      <Link href={`/bingo/${category}/${id}`} className="mb-3 inline-block text-sm text-paper/50 hover:text-paper">
        ← Karta dön
      </Link>
      <h1 className="font-display text-3xl font-bold">Kartı Düzenle</h1>

      {moderationGrant ? (
        <p className="mt-2 rounded-md border border-marker/40 bg-marker/10 px-3 py-2 text-sm text-marker">
          Bu kart bir moderasyon revizyonu bekliyor. Gerekli değişiklikleri yap ve kaydettikten sonra incelemeye gönder.
        </p>
      ) : (
        <p className="mt-2 text-sm text-paper/50">
          Ücretsiz düzenleme penceren: yaklaşık {minutesLeft(viewer.editableUntil)} dakika kaldı.
        </p>
      )}

      {error && <p className="mt-4 rounded-md border border-stamp/40 bg-stamp/10 px-3 py-2 text-sm text-stamp">{error}</p>}

      {/* Basics */}
      <section className="mt-6 space-y-4 rounded-lg border border-ink-500 bg-ink-700/40 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-paper/60">Başlık</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-paper/60">
            Açıklama <span className="text-paper/35">(markdown desteklenir: **kalın**, *italik*, "- " liste)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-paper/60">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-paper/60">Etiketler (virgülle ayır)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-paper/60">Kapak görseli</label>
          <ImagePicker value={coverImage} onChange={setCoverImage} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-paper/60">Görünürlük</label>
          <div className="flex rounded-full bg-ink-800 p-1">
            {['public', 'private'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${visibility === v ? 'bg-mint text-ink' : 'text-paper/50'}`}
              >
                {v === 'public' ? 'Herkese açık' : 'Özel'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Customization */}
      <section className="mt-4 space-y-4 rounded-lg border border-ink-500 bg-ink-700/40 p-4">
        <p className="text-xs text-paper/45">Ana renk kategoriye göre otomatik belirlenir.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-paper/60">Hücre şekli</label>
            <div className="flex gap-2">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={s.disabled}
                  title={s.disabled ? 'Şu an kullanılamıyor' : undefined}
                  onClick={() => setCellShape(s.id)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-md border py-2 text-[11px] ${
                    s.disabled ? 'cursor-not-allowed border-ink-500/40 text-paper/25' : cellShape === s.id ? 'border-mint text-mint' : 'border-ink-500 text-paper/50'
                  }`}
                >
                  <s.icon size={16} /> {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-paper/60">İşaretleme stili</label>
            <div className="grid grid-cols-2 gap-2">
              {MARKS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={m.disabled}
                  title={m.disabled ? 'Şu an kullanılamıyor' : undefined}
                  onClick={() => setCheckStyle(m.id)}
                  className={`rounded-md border py-2 text-[11px] ${
                    m.disabled ? 'cursor-not-allowed border-ink-500/40 text-paper/25' : checkStyle === m.id ? 'border-mint text-mint' : 'border-ink-500 text-paper/50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cells */}
      <section className="mt-4 rounded-lg border border-ink-500 bg-ink-700/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-paper/60">Hücreler ({cells.length})</p>
          <BulkImagePicker onFiles={handleBulkImages} />
        </div>

        <label className="mb-4 flex items-center gap-2 text-xs text-paper/70">
          <input
            type="checkbox"
            checked={hideCellText}
            onChange={(e) => setHideCellText(e.target.checked)}
            className="accent-mint"
          />
          Hücre yazılarını gizle (sadece görseller görünsün){' '}
          <span className="text-paper/35">(tüm hücrelerde görsel olduğunda etkili olur)</span>
        </label>

        <div className="mb-4 rounded-md border border-dashed border-ink-500 p-3">
          <p className="mb-1.5 text-xs font-medium text-paper/60">Hücreleri Toplu Doldur</p>
          <textarea
            value={bulkTextInput}
            onChange={(e) => setBulkTextInput(e.target.value)}
            rows={4}
            placeholder={'Her satır bir hücre olur:\nDark Souls\nElden Ring\nBloodborne\n\n(tek satırsa virgülle de ayırabilirsin)'}
            className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-xs focus:border-mint"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[11px] text-paper/60">
              <input
                type="checkbox"
                checked={useFilenameAsText}
                onChange={(e) => setUseFilenameAsText(e.target.checked)}
                className="accent-mint"
              />
              Toplu görsel yüklerken dosya adını yazı olarak kullan
            </label>
            <button
              type="button"
              onClick={applyBulkTextInput}
              className="rounded-md border border-ink-500 px-3 py-1.5 text-xs font-medium text-paper/70 hover:border-mint hover:text-mint"
            >
              Uygula
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-full border px-3 py-1 text-[11px] ${activePreset === p.id ? 'border-mint text-mint' : 'border-ink-500 text-paper/60 hover:border-mint hover:text-mint'}`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={selectCustom}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] ${activePreset === 'custom' ? 'border-mint text-mint' : 'border-ink-500 text-paper/60 hover:border-mint hover:text-mint'}`}
          >
            <Grid3x3 size={12} /> Özel
          </button>
        </div>

        {activePreset === 'custom' && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-ink-500 bg-ink-800 p-2.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-paper/50">Satır</label>
              <input
                type="number"
                min={1}
                max={MAX_ROWS}
                value={customRows}
                onChange={(e) => applyCustom(Number(e.target.value) || 1, customCols)}
                className="w-16 rounded-md border border-ink-500 bg-ink-700 px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-paper/50">Sütun (max {MAX_COLS})</label>
              <input
                type="number"
                min={1}
                max={MAX_COLS}
                value={customCols}
                onChange={(e) => applyCustom(customRows, Number(e.target.value) || 1)}
                className="w-16 rounded-md border border-ink-500 bg-ink-700 px-2 py-1 text-sm"
              />
            </div>
          </div>
        )}

        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {cells.map((cell, i) => (
            <div key={cell.id} className="flex items-center gap-2 rounded-md border border-ink-500 bg-ink-800 p-2">
              <span className="w-6 shrink-0 text-center font-mono text-[10px] text-paper/30">{i + 1}</span>
              <input
                value={cell.text}
                onChange={(e) => updateCell(cell.id, { text: e.target.value })}
                placeholder={`Hücre ${i + 1} metni`}
                className="min-w-0 flex-1 rounded-md border border-ink-500 bg-ink-700 px-2 py-1.5 text-sm"
              />
              <ImagePicker value={cell.image} onChange={(img) => updateCell(cell.id, { image: img })} compact type="cell" />
              <button
                type="button"
                onClick={() => removeCell(cell.id)}
                className="shrink-0 rounded-md p-1.5 text-paper/35 hover:bg-stamp/15 hover:text-stamp"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addCell}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-ink-500 py-2 text-sm text-paper/50 hover:border-mint hover:text-mint"
        >
          <Plus size={15} /> Hücre ekle
        </button>
      </section>

      {/* Preview */}
      <section className="mt-4 rounded-lg border border-ink-500 bg-ink-700/40 p-4">
        <p className="mb-3 text-xs font-medium text-paper/60">Önizleme</p>
        <div className="rounded-lg border border-ink-500 bg-ink-800 p-3">
          <BingoGrid
            cells={cells}
            columns={columns}
            selectedIds={previewSelected}
            showStats={false}
            checkStyle={checkStyle}
            shape={cellShape}
            accent={accentForCategory(category)}
            hideText={hideCellText && cells.every((c) => c.image)}
            onToggle={(cellId) =>
              setPreviewSelected((prev) => {
                const next = new Set(prev);
                next.has(cellId) ? next.delete(cellId) : next.add(cellId);
                return next;
              })
            }
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-lg bg-stamp py-3.5 text-sm font-bold text-ink shadow-stamp transition hover:bg-stamp-light disabled:opacity-60"
      >
        {submitting ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
      </button>
    </form>
  );
}