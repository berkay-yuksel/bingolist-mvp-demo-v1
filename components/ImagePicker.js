'use client';

import { useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/uploadImage';

export default function ImagePicker({ value, onChange, label = 'Görsel ekle', compact = false, type = 'cover' }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file, type));
    } catch (err) {
      alert(err.message || 'Görsel yüklenemedi.');
    } finally {
      setUploading(false);
    }
  }

  if (uploading) {
    return (
      <div className={`grid place-items-center rounded-lg border border-dashed border-ink-500 text-paper/45 ${compact ? 'h-10 w-10' : 'h-20 w-full'}`}>
        <Loader2 size={compact ? 14 : 16} className="animate-spin" />
      </div>
    );
  }

  if (value) {
    return (
      <div className={`relative overflow-hidden rounded-lg border border-ink-500 ${compact ? 'h-10 w-10' : 'h-20 w-full'}`}>
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
  }

  return (
    <label
      className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-500 text-paper/45 hover:border-mint hover:text-mint ${
        compact ? 'h-10 w-10' : 'h-20 w-full text-xs'
      }`}
    >
      <ImagePlus size={compact ? 14 : 16} />
      {!compact && label}
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </label>
  );
}
