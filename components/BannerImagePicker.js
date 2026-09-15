'use client';

import { useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/uploadImage';

export default function BannerImagePicker({ value, onChange }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file, 'banner'));
    } catch (err) {
      alert(err.message || 'Görsel yüklenemedi.');
    } finally {
      setUploading(false);
    }
  }

  if (uploading) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-lg border border-dashed border-ink-500 text-paper/45">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (value) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-ink-500 bg-ink-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className="h-full w-full object-cover" />
        <label className="absolute inset-0 flex cursor-pointer items-center justify-center gap-1.5 bg-ink-900/0 text-xs font-medium text-transparent opacity-0 transition hover:bg-ink-900/50 hover:text-paper hover:opacity-100">
          <ImagePlus size={14} /> Değiştir
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 rounded-full bg-ink-900/80 p-1 text-paper hover:bg-stamp"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-500 text-xs text-paper/45 hover:border-mint hover:text-mint">
      <ImagePlus size={18} />
      Banner görseli yükle · 16:9 önerilir
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </label>
  );
}
