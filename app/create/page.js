'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Square, Circle, RectangleVertical, Grid3x3 } from 'lucide-react';
import { useCurrentUser } from '@/components/UserContext';
import { CATEGORIES } from '@/lib/mockData';
import ImagePicker from '@/components/ImagePicker';
import BulkImagePicker from '@/components/BulkImagePicker';
import BingoGrid from '@/components/BingoGrid';
import HoverTooltip from '@/components/HoverTooltip';
import { parseBulkText, applyBulkText, filenameToText, computeAutoGrid } from '@/lib/bulkFill';

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
  { id: '3x3', n: 9, rows: 3, cols: 3 },
  { id: '5x4', n: 20, rows: 5, cols: 4 },
  { id: '5x5', n: 25, rows: 5, cols: 5 },
  { id: '10x10', n: 100, rows: 10, cols: 10 },
];
const MAX_COLS = 10;
const MAX_ROWS = 20;

function emptyCell(i) {
  return { id: `c${Date.now()}_${i}`, text: '', emoji: null, image: null, description: '', sourceFilename: null };
}

function resizeCells(prev, total) {
  if (total === prev.length) return prev;
  if (total > prev.length) {
    return [...prev, ...Array.from({ length: total - prev.length }, (_, i) => emptyCell(prev.length + i))];
  }
  return prev.slice(0, total);
}

function CreateInner() {
  const searchParams = useSearchParams();
  const remixOf = searchParams.get('remixOf');
  const router = useRouter();
  const { userId, isRealSession, devSwitcherEnabled, ready } = useCurrentUser();

  useEffect(() => {
    if (ready && !isRealSession && !devSwitcherEnabled) {
      router.replace('/login?next=/create');
    }
  }, [ready, isRealSession, devSwitcherEnabled, router]);

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
  const [cells, setCells] = useState(Array.from({ length: 9 }, (_, i) => emptyCell(i)));
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [activePreset, setActivePreset] = useState('3x3');
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [originalCardId, setOriginalCardId] = useState(null);
  const [originalTitle, setOriginalTitle] = useState(null);
  const [originalCellsSnapshot, setOriginalCellsSnapshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadingRemix, setLoadingRemix] = useState(!!remixOf);
  const [previewSelected, setPreviewSelected] = useState(new Set());

  useEffect(() => {
    if (!remixOf) return;
    fetch(`/api/cards/${remixOf}`)
      .then((r) => r.json())
      .then(({ card }) => {
        setTitle(`${card.title} (Remix)`);
        setDescription(card.description || '');
        setCategory(card.category);
        setTagsInput(card.tags.filter((t) => t !== card.category).join(', '));
        setCellShape(card.cellShape);
        setCheckStyle(card.checkStyle === 'border' ? 'border' : card.checkStyle);
        setHideCellText(!!card.hideCellText);
        setColumns(card.columns);
        setCells(card.cells.map((c, i) => ({ ...c, id: `c${Date.now()}_${i}` })));
        const rows = Math.ceil(card.cells.length / card.columns);
        setCustomRows(rows);
        setCustomCols(card.columns);
        setActivePreset('custom');
        setOriginalCardId(card.id);
        setOriginalTitle(card.title);
        setOriginalCellsSnapshot(card.cells.map((c) => ({ text: (c.text || '').trim(), image: c.image || null })));
        setLoadingRemix(false);
      });
  }, [remixOf]);

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

  function removeCell(id) {
    setCells((prev) => prev.filter((c) => c.id !== id));
  }

  function updateCell(id, patch) {
    setCells((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  // Distributes a batch of uploaded images across cells: fills empty-image
  // slots first (in order), then appends new cells for any leftover images.
  // The grid auto-switches to "Özel" and grows (never shrinks) to fit.
  // The original filename is always kept on the cell (not shown by
  // default) so "dosya adlarından içe aktar" can paste it into the bulk
  // text box later, and so the hover preview has something to fall back to.
  function handleBulkImages(images) {
    if (!images.length) return;
    const { rows, cols } = computeAutoGrid(Math.max(cells.length, images.length));
    setActivePreset('custom');
    setCustomRows(rows);
    setCustomCols(cols);
    setColumns(cols);
    setCells((prev) => {
      const resized = resizeCells(prev, rows * cols);
      let imgIdx = 0;
      const next = resized.map((c) => {
        if (imgIdx < images.length && !c.image) {
          const img = images[imgIdx++];
          return { ...c, image: img.url, sourceFilename: img.filename };
        }
        return c;
      });
      while (imgIdx < images.length) {
        const img = images[imgIdx++];
        next.push({ ...emptyCell(next.length), image: img.url, sourceFilename: img.filename });
      }
      return next;
    });
  }

  // Fills text in from each cell's stored filename — works for any cell
  // that currently has an image and no text yet, whether it was uploaded
  // just now or earlier in this session.
  // Pastes each image-having cell's filename into the bulk-text box (one
  // per line, in cell order) so the person can review/edit before hitting
  // "Uygula" — never silently rewrites cell text on its own.
  function importFilenamesToTextarea() {
    const names = cells.filter((c) => c.image && c.sourceFilename).map((c) => filenameToText(c.sourceFilename));
    setBulkTextInput(names.join('\n'));
  }

  function applyBulkTextInput() {
    const entries = parseBulkText(bulkTextInput);
    if (entries.length === 0) {
      setCells((prev) => applyBulkText(prev, entries));
      return;
    }
    const { rows, cols } = computeAutoGrid(Math.max(cells.length, entries.length));
    setActivePreset('custom');
    setCustomRows(rows);
    setCustomCols(cols);
    setColumns(cols);
    setCells((prev) => applyBulkText(resizeCells(prev, rows * cols), entries));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError('Kart için bir başlık gerekli.');
    const filledCells = cells.filter((c) => c.text.trim() || c.image);
    if (filledCells.length === 0) return setError('En az bir hücreye içerik girmelisin.');

    if (originalCardId && originalCellsSnapshot) {
      const currentSnapshot = cells.map((c) => ({ text: (c.text || '').trim(), image: c.image || null }));
      const identical =
        currentSnapshot.length === originalCellsSnapshot.length &&
        currentSnapshot.every((c, i) => c.text === originalCellsSnapshot[i].text && c.image === originalCellsSnapshot[i].image);
      if (identical) {
        return setError('Remix yapmak için en az bir hücrede (yazı veya görsel) değişiklik yapmalısın.');
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
          visibility,
          theme: { accent: accentForCategory(category) },
          cellShape,
          checkStyle,
          hideCellText,
          coverImage,
          columns,
          cells,
          creatorId: userId,
          originalCardId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Bir şeyler ters gitti.');
      router.push(`/bingo/${json.card.category}/${json.card.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loadingRemix) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-paper/50">Orijinal kart yükleniyor…</div>;
  }

  if (!ready || (!isRealSession && !devSwitcherEnabled)) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-paper/50">Yükleniyor…</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6">
      <h1 className="font-display text-3xl font-bold">
        {originalCardId ? 'Kartı Remixle' : 'Yeni BingoCard Oluştur'}
      </h1>
      {originalTitle && (
        <p className="mt-1 text-sm text-paper/50">
          "{originalTitle}" kartından türetiliyor — orijinale atıf otomatik eklenecek.
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
            placeholder="Örn. İstanbul Sokak Lezzetleri"
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
            placeholder="Bu kart neyle ilgili? Kısaca anlat."
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
            <label className="mb-1 block text-xs font-medium text-paper/60">Etiketler (en fazla 7 ek, virgülle ayır)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="istanbul, sokak lezzetleri"
              className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-paper/60">Kapak görseli (opsiyonel — yoksa otomatik üretilir)</label>
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
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  visibility === v ? 'bg-mint text-ink' : 'text-paper/50'
                }`}
              >
                {v === 'public' ? 'Herkese açık' : 'Özel'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Customization */}
      <section className="mt-4 space-y-4 rounded-lg border border-ink-500 bg-ink-700/40 p-4">
        <p className="text-xs font-medium text-paper/60">
          Kartının karakterini özelleştir — serbest bir tasarım tuvali değil, sınırlı ama etkili seçenekler. Ana renk
          kategoriye göre otomatik belirlenir.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-paper/60">Hücre şekli</label>
            <div className="flex gap-2">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={s.disabled}
                  onClick={() => setCellShape(s.id)}
                  title={s.disabled ? 'Şu an kullanılamıyor' : undefined}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-md border py-2 text-[11px] ${
                    s.disabled
                      ? 'cursor-not-allowed border-ink-500/40 text-paper/25'
                      : cellShape === s.id
                      ? 'border-mint text-mint'
                      : 'border-ink-500 text-paper/50'
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
                  onClick={() => setCheckStyle(m.id)}
                  title={m.disabled ? 'Şu an kullanılamıyor' : undefined}
                  className={`rounded-md border py-2 text-[11px] ${
                    m.disabled
                      ? 'cursor-not-allowed border-ink-500/40 text-paper/25'
                      : checkStyle === m.id
                      ? 'border-mint text-mint'
                      : 'border-ink-500 text-paper/50'
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
        <p className="text-sm font-bold text-paper">Hücreler ({cells.length})</p>
        <p className="mb-3 text-xs text-paper/45">Toplu eklemek için burayı, tek tek eklemek için aşağıdaki alanı kullanabilirsin.</p>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <BulkImagePicker onFiles={handleBulkImages} label="Görsel ekle" />
          <span className="text-xs text-paper/40">
            {cells.filter((c) => c.image).length}/{cells.length} hücrede görsel
          </span>
        </div>

        <textarea
          value={bulkTextInput}
          onChange={(e) => setBulkTextInput(e.target.value)}
          rows={5}
          placeholder={'Buraya yapıştır:\nDark Souls\nElden Ring\nBloodborne'}
          className="themed-scroll w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-xs focus:border-mint"
        />
        <div className="mb-4 mt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={importFilenamesToTextarea}
            title="Görselli hücrelerin dosya adlarını yukarıdaki kutuya yapıştırır — düzenleyip Uygula'ya basabilirsin"
            className="text-xs font-medium text-paper/40 hover:text-mint"
          >
            dosya adlarından içe aktar
          </button>
          <button
            type="button"
            onClick={applyBulkTextInput}
            disabled={!bulkTextInput.trim()}
            className="rounded-md border border-ink-500 px-4 py-1.5 text-xs font-semibold text-paper/80 hover:border-mint hover:text-mint disabled:cursor-not-allowed disabled:border-ink-600 disabled:text-paper/25 disabled:hover:border-ink-600 disabled:hover:text-paper/25"
          >
            Uygula
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-t border-ink-500/50 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`rounded-full border px-3 py-1 text-[11px] ${
                  activePreset === p.id ? 'border-mint text-mint' : 'border-ink-500 text-paper/60 hover:border-mint hover:text-mint'
                }`}
              >
                {p.rows}×{p.cols}
              </button>
            ))}
            <button
              type="button"
              onClick={selectCustom}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] ${
                activePreset === 'custom' ? 'border-mint text-mint' : 'border-ink-500 text-paper/60 hover:border-mint hover:text-mint'
              }`}
            >
              <Grid3x3 size={12} /> Özel
            </button>
          </div>

          <button type="button" onClick={() => setHideCellText((v) => !v)} className="flex items-center gap-2 text-xs text-paper/60">
            Metinleri sadece istatistik için kullan <span className="text-paper/35">(ızgarada gizlenir)</span>
            <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${hideCellText ? 'bg-mint' : 'bg-ink-500'}`}>
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-ink-900 transition-transform ${
                  hideCellText ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </span>
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
            <span className="text-[11px] text-paper/35">
              Toplam {customRows * customCols} hücre — büyük listeler için (örn. 200 hücre → 5 sütun) satır sayısını artırabilirsin.
            </span>
          </div>
        )}

        <div className="themed-scroll max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {cells.map((cell, i) => (
            <div key={cell.id} className="flex items-center gap-2 rounded-md border border-ink-500 bg-ink-800 p-2">
              <span className="w-6 shrink-0 text-center font-mono text-[10px] text-paper/30">{i + 1}</span>
              <input
                value={cell.text}
                onChange={(e) => updateCell(cell.id, { text: e.target.value })}
                placeholder={`Hücre ${i + 1} metni`}
                className="min-w-0 flex-1 rounded-md border border-ink-500 bg-ink-700 px-2 py-1.5 text-sm"
              />
              <HoverTooltip text={cell.text || (cell.sourceFilename ? filenameToText(cell.sourceFilename) : null)}>
                <ImagePicker value={cell.image} onChange={(img) => updateCell(cell.id, { image: img })} compact type="cell" />
              </HoverTooltip>
              <button
                type="button"
                onClick={() => removeCell(cell.id)}
                className="shrink-0 rounded-md p-1.5 text-paper/35 hover:bg-stamp/15 hover:text-stamp"
                aria-label="Hücreyi sil"
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

      {/* Live preview */}
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
            onToggle={(id) =>
              setPreviewSelected((prev) => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
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
        {submitting ? 'Yayınlanıyor…' : visibility === 'public' ? 'Kartı Yayınla' : 'Özel Kart Olarak Kaydet'}
      </button>
    </form>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-16 text-center text-paper/50">Yükleniyor…</div>}>
      <CreateInner />
    </Suspense>
  );
}