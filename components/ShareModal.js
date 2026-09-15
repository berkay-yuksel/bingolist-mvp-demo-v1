'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Download, Share2, Link as LinkIcon, EyeOff } from 'lucide-react';

const PAD_RATIO = 0.052;

// Curated theme presets — background and mark/border color are paired
// together (e.g. mint background with a matching green mark) instead of
// being picked independently, so results always look coordinated.
const PRESETS = [
  { id: 'original', label: 'Orijinal', colors: ['#12162E', '#0B0E17'], text: '#F4EEDD', muted: 'rgba(244,238,221,0.55)', logoBg: '#F4EEDD', logoText: '#12162E', mark: '#38D6A7' },
  { id: 'sprout', label: 'Filiz', colors: ['#DCEBD8', '#DCEBD8'], text: '#234023', muted: 'rgba(35,64,35,0.6)', logoBg: '#234023', logoText: '#DCEBD8', mark: '#F47C38' },
  { id: 'sky', label: 'Gök', colors: ['#D9EAF4', '#D9EAF4'], text: '#1B3C5A', muted: 'rgba(27,60,90,0.6)', logoBg: '#1B3C5A', logoText: '#D9EAF4', mark: '#F06C5B' },
  { id: 'sand', label: 'Kum', colors: ['#F4E6C8', '#F4E6C8'], text: '#3D2E12', muted: 'rgba(61,46,18,0.6)', logoBg: '#3D2E12', logoText: '#F4E6C8', mark: '#37634A' },
  { id: 'aqua', label: 'Su', colors: ['#DDEFF2', '#DDEFF2'], text: '#1B3C42', muted: 'rgba(27,60,66,0.6)', logoBg: '#1B3C42', logoText: '#DDEFF2', mark: '#D86632' },
  { id: 'wisteria', label: 'Mor', colors: ['#E5DDF4', '#E5DDF4'], text: '#3A2C63', muted: 'rgba(58,44,99,0.6)', logoBg: '#3A2C63', logoText: '#E5DDF4', mark: '#C49A16' },
  { id: 'mint', label: 'Nane', colors: ['#D5EBDD', '#D5EBDD'], text: '#1F4A38', muted: 'rgba(31,74,56,0.6)', logoBg: '#1F4A38', logoText: '#D5EBDD', mark: '#B83E63' },
  { id: 'sage', label: 'Adaçayı', colors: ['#D8E3D5', '#D8E3D5'], text: '#2E4426', muted: 'rgba(46,68,38,0.6)', logoBg: '#2E4426', logoText: '#D8E3D5', mark: '#A8463D' },
  { id: 'parchment', label: 'Parşömen', colors: ['#F0E9DC', '#F0E9DC'], text: '#26241E', muted: 'rgba(38,36,30,0.6)', logoBg: '#26241E', logoText: '#F0E9DC', mark: '#292B32' },
  { id: 'midnight', label: 'Gece', colors: ['#171A24', '#171A24'], text: '#F4EEDD', muted: 'rgba(244,238,221,0.55)', logoBg: '#F4EEDD', logoText: '#171A24', mark: '#FF5C7A' },
];

const CANVAS_W = 1080;

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new window.Image();
    // Cross-origin images (e.g. Unsplash cover photos) must be requested
    // with CORS or the canvas becomes "tainted" and toDataURL()/export
    // throws — even though the image displays fine on-screen. Data URIs
    // (locally uploaded images) are unaffected by this either way.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default function ShareModal({ card, selectedIds, cellStats, shareUrl, onClose, onShared }) {
  const canvasRef = useRef(null);
  const imageCacheRef = useRef({});
  const drawTokenRef = useRef(0);

  const hasTextCells = card.cells.some((c) => c.text && c.text.trim());
  const VIEWS = [
    { id: 'card', label: 'Kart' },
    { id: 'card_percent', label: 'Kart + Yüzdeler' },
    ...(hasTextCells ? [{ id: 'stats', label: 'İstatistik odaklı' }] : []),
  ];

  const [view, setView] = useState('card');
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [hideTitle, setHideTitle] = useState(false);
  const [hideBorder, setHideBorder] = useState(false);
  const [borderThickness, setBorderThickness] = useState('thin');
  const [hideCaptions, setHideCaptions] = useState(false);
  const [dataUrl, setDataUrl] = useState(null);
  const [canvasAspect, setCanvasAspect] = useState(1);
  const [copied, setCopied] = useState(false);
  const [rendering, setRendering] = useState(true);
  const [exportError, setExportError] = useState(false);

  useEffect(() => {
    const token = ++drawTokenRef.current;
    setRendering(true);
    setExportError(false);
    drawAsync(token).then(() => {
      if (drawTokenRef.current === token) setRendering(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, presetId, hideTitle, hideBorder, hideCaptions, borderThickness]);

  async function drawAsync(token) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cache = imageCacheRef.current;
    await Promise.all(
      card.cells
        .filter((c) => c.image && !(c.id in cache))
        .map(async (c) => {
          cache[c.id] = await loadImage(c.image);
        })
    );
    if (drawTokenRef.current !== token) return;

    const theme = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
    const markColor = theme.mark;
    const PAD = Math.round(CANVAS_W * PAD_RATIO);

    // --- Work out header height first, so we know how much room is left
    // for the grid, then decide the canvas's overall shape from that.
    const tmpCtx = canvas.getContext('2d');
    let titleLines = [];
    let headerH = PAD;
    if (!hideTitle) {
      tmpCtx.font = `bold 32px sans-serif`;
      titleLines = wrapLines(tmpCtx, card.title, CANVAS_W - PAD * 2, 2);
      headerH = PAD + titleLines.length * 38 + 16;
    }

    const cols = card.columns;
    const rows = Math.ceil(card.cells.length / cols);
    const availW = CANVAS_W - PAD * 2;
    const gap = 10;
    const cellAspect = card.cellShape === 'poster' ? 131 / 193 : 1; // width / height
    const MIN_CELL = 60; // never shrink cells below this — the image grows taller instead
    const cellByWidth = (availW - gap * (cols - 1)) / cols;
    const effectiveCellW = Math.max(cellByWidth, MIN_CELL * cellAspect);
    const naturalGridH = rows * (effectiveCellW / cellAspect) + (rows - 1) * gap;

    // Never force a square, and never cap the height either — a big grid
    // simply makes a taller image with no left/right dead space, instead
    // of shrinking every cell down to fit an arbitrary frame.
    const naturalTotalH = headerH + naturalGridH + PAD + 56; // +56 reserves the corner mark
    const CANVAS_H = Math.max(naturalTotalH, CANVAS_W);
    setCanvasAspect(CANVAS_W / CANVAS_H);

    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    grad.addColorStop(0, theme.colors[0]);
    grad.addColorStop(1, theme.colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    let cursorY = PAD;

    if (!hideTitle) {
      ctx.fillStyle = theme.text;
      ctx.font = `bold 32px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const titleLineH = 38;
      titleLines.forEach((line, i) => ctx.fillText(line, PAD, cursorY + i * titleLineH));
      cursorY += titleLines.length * titleLineH + 16;
    }

    const contentBottom = CANVAS_H - PAD - 56; // leave room for the corner mark

    if (view === 'stats') {
      drawStatsBlock(ctx, theme, markColor, PAD, cursorY, availW, contentBottom - cursorY);
    } else if (view === 'card') {
      drawGrid(ctx, cache, markColor, PAD, cursorY, availW, contentBottom - cursorY, false);
    } else {
      drawGrid(ctx, cache, markColor, PAD, cursorY, availW, contentBottom - cursorY, true);
    }

    // small "B" wordmark, bottom-right corner only
    const logo = 34;
    const lx = CANVAS_W - PAD - logo;
    const ly = CANVAS_H - PAD - logo + 20;
    ctx.fillStyle = theme.logoBg;
    roundRect(ctx, lx, ly, logo, logo, 8);
    ctx.fill();
    ctx.fillStyle = theme.logoText;
    ctx.font = `bold 18px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B', lx + logo / 2, ly + logo / 2 + 1);

    if (drawTokenRef.current !== token) return;
    try {
      setDataUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      // A cross-origin cover image without proper CORS headers taints the
      // canvas — export throws even though the canvas displays fine.
      console.error('Share image export failed:', err);
      setDataUrl(null);
      setExportError(true);
    }
  }

  // Mirrors the live card: image dimmed when unselected / brightened when
  // selected, emoji+text caption together, maximized within the available
  // area — including the card's actual cell shape (square, poster 131:193,
  // or circle) and its own square corners (no artificial rounding), plus
  // the selected border-mark color when the card uses that check style.
  function drawGrid(ctx, cache, markColor, x0, y0, w, maxH, showPercent) {
    const cols = card.columns;
    const rows = Math.ceil(card.cells.length / cols);
    const gap = 10;
    const shape = card.cellShape;
    const aspect = shape === 'poster' ? 131 / 193 : 1; // width / height

    let cellW = (w - gap * (cols - 1)) / cols;
    let cellH = cellW / aspect;
    // Height is allowed to grow (the canvas itself was already sized for
    // this), so cells are never shrunk below their natural width-driven
    // size — no cropping into a fixed frame.

    const gridW = cellW * cols + gap * (cols - 1);
    const gridH = cellH * rows + gap * (rows - 1);
    const startX = x0 + (w - gridW) / 2;
    const startY = y0 + Math.max(0, (maxH - gridH) / 2);
    const minSide = Math.min(cellW, cellH);
    const showBorderMark = card.checkStyle === 'border' && !hideBorder;

    card.cells.forEach((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cellW + gap);
      const y = startY + row * (cellH + gap);
      const isSelected = selectedIds.has(c.id);
      const img = cache[c.id];

      ctx.save();
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(x + cellW / 2, y + cellH / 2, Math.min(cellW, cellH) / 2, 0, Math.PI * 2);
        ctx.clip();
      } else {
        ctx.beginPath();
        ctx.rect(x, y, cellW, cellH);
        ctx.clip();
      }

      // The card's own face is always this dark ink tone — regardless of
      // the chosen backdrop theme — otherwise unselected cells nearly
      // vanish against light pastel backgrounds (a transparent white tint
      // over a light page reads as almost nothing).
      ctx.fillStyle = isSelected ? 'rgba(50,58,88,1)' : '#171B27';
      ctx.fillRect(x, y, cellW, cellH);

      if (img) {
        ctx.filter = isSelected ? 'brightness(1.05)' : 'brightness(0.55)';
        drawCover(ctx, img, x, y, cellW, cellH);
        ctx.filter = 'none';

        // A strong scrim is only needed when the photo is at full
        // brightness (selected) — piling a heavy scrim on top of an
        // already-dimmed (unselected) image made the whole cell read as
        // "entirely blacked out". Unselected cells get a much lighter
        // touch, just enough to anchor the caption.
        const hasCaption = !hideCaptions && (c.emoji || (c.text && c.text.trim()));
        if (hasCaption) {
          const scrimH = isSelected ? cellH * 0.5 : cellH * 0.38;
          const scrim = ctx.createLinearGradient(0, y + cellH - scrimH, 0, y + cellH);
          scrim.addColorStop(0, 'rgba(6,7,12,0)');
          scrim.addColorStop(1, isSelected ? 'rgba(6,7,12,0.82)' : 'rgba(6,7,12,0.5)');
          ctx.fillStyle = scrim;
          ctx.fillRect(x, y + cellH - scrimH, cellW, scrimH);
        }
      }

      const caption = `${c.emoji ? c.emoji + ' ' : ''}${c.text || ''}`.trim();
      const showCaption = caption && !hideCaptions && (img ? minSide >= 26 : true);
      const captionFont = Math.min(20, Math.max(11, minSide * 0.13));
      const captionLineH = captionFont * 1.2;
      const pct = cellStats?.[c.id]?.percent ?? 0;
      const pillFont = Math.min(16, Math.max(10, minSide * 0.12));
      const pillH = Math.max(14, pillFont * 1.5);

      if (!img && showCaption && showPercent) {
        // Text-only cell showing both caption and percent — stack them as
        // one centered group (caption above, pill below), matching the
        // live play screen instead of drawing both independently centered
        // on top of each other.
        ctx.font = `${captionFont}px sans-serif`;
        const lines = wrapLines(ctx, caption, cellW - 12, 3);
        const captionH = lines.length * captionLineH;
        const gapBetween = 6;
        const groupH = captionH + gapBetween + pillH;
        const groupTop = y + cellH / 2 - groupH / 2;

        ctx.fillStyle = isSelected ? '#F4EEDD' : 'rgba(244,238,221,0.75)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        lines.forEach((line, li) => {
          ctx.fillText(line, x + cellW / 2, groupTop + li * captionLineH + captionLineH / 2);
        });

        drawPercentPill(ctx, pct, x + cellW / 2, groupTop + captionH + gapBetween + pillH / 2, pillFont, pillH);
      } else {
        if (showCaption) {
          ctx.fillStyle = img ? '#F4EEDD' : isSelected ? '#F4EEDD' : 'rgba(244,238,221,0.75)';
          ctx.font = `${captionFont}px sans-serif`;
          const capY = img ? y + cellH - cellH * 0.16 : y + cellH / 2;
          wrapCenteredText(ctx, caption, x + cellW / 2, capY, cellW - 12, captionLineH, 3);
        }

        if (showPercent) {
          // On image cells the caption sits near the bottom, so the pill
          // can stay centered without colliding with it.
          drawPercentPill(ctx, pct, x + cellW / 2, y + cellH / 2, pillFont, pillH);
        }
      }

      if (isSelected && showBorderMark) {
        ctx.strokeStyle = markColor;
        const thicknessFactor = borderThickness === 'thin' ? 0.0175 : 0.035;
        ctx.lineWidth = Math.max(borderThickness === 'thin' ? 1 : 2, minSide * thicknessFactor);
        if (shape === 'circle') {
          ctx.beginPath();
          ctx.arc(x + cellW / 2, y + cellH / 2, Math.min(cellW, cellH) / 2 - ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, cellW - ctx.lineWidth, cellH - ctx.lineWidth);
        }
      }

      ctx.restore();
    });
  }

  function drawStatsBlock(ctx, theme, markColor, x0, y0, w, maxH) {
    ctx.fillStyle = theme.muted;
    ctx.font = `25px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Topluluk karşılaştırması', x0, y0 + 24);

    const top = [...card.cells]
      .filter((c) => c.text && c.text.trim())
      .map((c) => ({ c, pct: cellStats?.[c.id]?.percent ?? 0 }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 6);

    const rowH = Math.min(62, Math.max(40, (maxH - 50) / Math.max(1, top.length)));

    top.forEach(({ c, pct }, i) => {
      const y = y0 + 58 + i * rowH;
      ctx.fillStyle = theme.text;
      ctx.font = `26px sans-serif`;
      ctx.textAlign = 'left';
      const label = c.text.length > 34 ? c.text.slice(0, 34) + '…' : c.text;
      ctx.fillText(label, x0, y);

      const barY = y + 11;
      ctx.fillStyle = theme.id === 'original' ? 'rgba(244,238,221,0.12)' : 'rgba(0,0,0,0.08)';
      roundRect(ctx, x0, barY, w, 9, 4.5);
      ctx.fill();
      ctx.fillStyle = markColor;
      roundRect(ctx, x0, barY, Math.max(6, (w * pct) / 100), 9, 4.5);
      ctx.fill();

      ctx.fillStyle = theme.muted;
      ctx.font = `21px sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`%${pct}`, x0 + w, y);
    });
  }

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${card.id}-bingolist.png`;
    a.click();
    onShared?.();
  }

  async function handleSystemShare() {
    onShared?.();
    try {
      if (navigator.share && dataUrl) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${card.id}-bingolist.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: card.title, text: card.title, url: shareUrl });
          return;
        }
        await navigator.share({ title: card.title, url: shareUrl });
        return;
      }
    } catch {
      // user cancelled or unsupported — fall through to copy link
    }
    handleCopyLink();
  }

  function handleCopyLink() {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    onShared?.();
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-ink-500 bg-ink-800 p-4 shadow-ticket sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Sonucunu paylaş</h3>
          <button onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-paper/60 hover:bg-ink-600">
            <X size={18} />
          </button>
        </div>

        <div className="mb-3 flex gap-1.5 rounded-full bg-ink-700 p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex-1 rounded-full py-1.5 text-xs font-medium transition ${
                view === v.id ? 'bg-stamp text-ink' : 'text-paper/60 hover:text-paper'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="mb-3">
          <span className="mb-1.5 block text-xs text-paper/45">Tema</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPresetId(p.id)}
                aria-label={p.label}
                title={p.label}
                className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 ${presetId === p.id ? 'border-paper' : 'border-transparent'}`}
                style={{ background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})` }}
              >
                <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: p.mark }} />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-paper/60">
            <input type="checkbox" checked={hideTitle} onChange={(e) => setHideTitle(e.target.checked)} className="accent-mint" />
            <EyeOff size={13} /> Başlığı gizle
          </label>
          <label className="flex items-center gap-2 text-xs text-paper/60">
            <input type="checkbox" checked={hideBorder} onChange={(e) => setHideBorder(e.target.checked)} className="accent-mint" />
            Çerçeveyi gizle
          </label>
          <label className="flex items-center gap-2 text-xs text-paper/60">
            <input type="checkbox" checked={hideCaptions} onChange={(e) => setHideCaptions(e.target.checked)} className="accent-mint" />
            Yazıları gizle
          </label>
        </div>

        {!hideBorder && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-paper/45">Çerçeve kalınlığı</span>
            <div className="flex rounded-full bg-ink-700 p-1">
              {[
                ['thin', 'İnce'],
                ['thick', 'Kalın'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBorderThickness(id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    borderThickness === id ? 'bg-mint text-ink' : 'text-paper/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative overflow-hidden rounded-lg border border-ink-500">
          <canvas ref={canvasRef} className="w-full" style={{ aspectRatio: canvasAspect }} />
          {rendering && !exportError && (
            <div className="absolute inset-0 grid place-items-center bg-ink-900/40 text-xs text-paper/60">
              Görsel hazırlanıyor…
            </div>
          )}
          {exportError && (
            <div className="absolute inset-0 grid place-items-center bg-ink-900/70 p-4 text-center text-xs text-paper/70">
              Görsel dışa aktarılamadı (dış kaynaklı bir görsel engellendi). Linki kopyalayarak paylaşabilirsin.
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            title={exportError ? 'Bu görsel dışa aktarılamıyor' : undefined}
            className="flex flex-col items-center gap-1 rounded-lg border border-ink-500 py-2.5 text-xs text-paper/80 hover:border-mint disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-500"
          >
            <Download size={16} /> İndir
          </button>
          <button
            onClick={handleSystemShare}
            className="flex flex-col items-center gap-1 rounded-lg bg-paper py-2.5 text-xs font-semibold text-ink"
          >
            <Share2 size={16} /> Paylaş
          </button>
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1 rounded-lg border border-ink-500 py-2.5 text-xs text-paper/80 hover:border-mint"
          >
            <LinkIcon size={16} /> {copied ? 'Kopyalandı' : 'Linki kopyala'}
          </button>
        </div>
      </div>
    </div>
  );
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draws the "X%" pill centered on (cx, cy) — no separate darkening bar
// underneath it anymore, just the pill itself.
function drawPercentPill(ctx, pct, cx, cy, pillFont, pillH) {
  ctx.font = `bold ${pillFont}px sans-serif`;
  const label = `${pct}%`;
  const tw = ctx.measureText(label).width;
  const pillW = tw + 10;
  const pillX = cx - pillW / 2;
  const pillY = cy - pillH / 2;
  ctx.fillStyle = 'rgba(11,14,23,0.75)';
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#F4EEDD';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy + 0.5);
}

function roundRect(ctx, x, y, w, h, r) {
  roundRectPath(ctx, x, y, w, h, r);
}

function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = text.split(' ');
  let line = '';
  let lines = [];
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function wrapCenteredText(ctx, text, cx, cy, maxWidth, lineHeight, maxLines) {
  const words = (text || '').split(' ');
  let line = '';
  let lines = [];
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  lines = lines.slice(0, maxLines);
  const totalH = lines.length * lineHeight;
  const startY = cy - totalH / 2 + lineHeight / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
}
