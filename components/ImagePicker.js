'use client';

import { useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/uploadImage';

// One image slot: click to choose a file, or drag a file onto it (also onto
// an existing image to replace it).
//
// `fit`:
//   'crop'    (default) fixed small box, image cropped to fill it — fine for
//             avatars and the tiny per-cell thumbnails.
//   'card'    previews the image exactly the way the small card tile shows
//             it (4:3, cropped to fill) plus its original pixel size and a
//             note when the crop will cut something off — used for the cover.
// `hint`: small helper text shown under the slot (e.g. the recommended size).
export default function ImagePicker({ value, onChange, label = 'Görsel ekle', compact = false, type = 'cover', fit = 'crop', hint }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dims, setDims] = useState(null);

  async function upload(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Sadece görsel dosyası yükleyebilirsin.');
      return;
    }
    setUploading(true);
    try {
      setDims(null);
      onChange(await uploadImage(file, type));
    } catch (err) {
      alert(err.message || 'Görsel yüklenemedi.');
    } finally {
      setUploading(false);
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    upload(file);
  }

  const dropProps = {
    onDragEnter: (e) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragOver: (e) => {
      e.preventDefault();
      if (!dragging) setDragging(true);
    },
    onDragLeave: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
    },
    onDrop: (e) => {
      e.preventDefault();
      setDragging(false);
      upload(e.dataTransfer.files?.[0]);
    },
  };

  let control;

  if (uploading) {
    control = (
      <div className={`grid place-items-center rounded-lg border border-dashed border-ink-500 text-paper/45 ${compact ? 'h-10 w-10' : 'h-20 w-full'}`}>
        <Loader2 size={compact ? 14 : 16} className="animate-spin" />
      </div>
    );
  } else if (value && fit === 'card' && !compact) {
    // The card tile crops covers to 4:3 (object-cover) — mirror that here.
    const ratio = dims ? dims.w / dims.h : null;
    const cropNote =
      ratio && Math.abs(ratio - 4 / 3) > 0.03
        ? ratio > 4 / 3
          ? 'Görsel 4:3\'ten daha yatay — kart görünümünde sağ ve sol kenarlar kırpılıyor.'
          : 'Görsel 4:3\'ten daha dikey — kart görünümünde üst ve alt kısım kırpılıyor.'
        : null;
    control = (
      <div>
        <div
          {...dropProps}
          className={`relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded-lg border ${dragging ? 'border-mint' : 'border-ink-500'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            onLoad={(e) => setDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setDims(null);
              onChange(null);
            }}
            aria-label="Görseli kaldır"
            className="absolute right-1.5 top-1.5 rounded-full bg-ink-900/80 p-1 text-paper hover:bg-stamp"
          >
            <X size={14} />
          </button>
          {dragging && (
            <div className="absolute inset-0 grid place-items-center bg-ink-900/70 text-xs font-medium text-mint">Bırak, görseli değiştir</div>
          )}
        </div>
        <p className="mt-1 font-mono text-[11px] text-paper/40">
          Kart görünümü (4:3){dims ? ` · orijinal ${dims.w} × ${dims.h} px` : ''}
        </p>
        {cropNote && <p className="mt-0.5 text-[11px] text-marker">{cropNote}</p>}
      </div>
    );
  } else if (value) {
    control = (
      <div
        {...dropProps}
        className={`relative overflow-hidden rounded-lg border ${dragging ? 'border-mint' : 'border-ink-500'} ${compact ? 'h-10 w-10' : 'h-20 w-full'}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-0.5 top-0.5 rounded-full bg-ink-900/80 p-0.5 text-paper hover:bg-stamp"
        >
          <X size={12} />
        </button>
      </div>
    );
  } else {
    control = (
      <label
        {...dropProps}
        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed transition-colors ${
          dragging ? 'border-mint bg-mint/10 text-mint' : 'border-ink-500 text-paper/45 hover:border-mint hover:text-mint'
        } ${compact ? 'h-10 w-10' : 'h-20 w-full text-xs'}`}
      >
        <ImagePlus size={compact ? 14 : 16} />
        {!compact && (dragging ? 'Bırak' : label)}
        {!compact && !dragging && <span className="hidden text-paper/30 sm:inline">· ya da sürükleyip bırak</span>}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </label>
    );
  }

  if (!hint) return control;
  return (
    <div>
      {control}
      <p className="mt-1.5 text-[11px] leading-snug text-paper/40">{hint}</p>
    </div>
  );
}