'use client';

import { Images } from 'lucide-react';
import { uploadImage } from '@/lib/uploadImage';

// Lets the person pick several images at once; the caller decides how to
// distribute them across cells (see handleBulkImages in the create page).
// Each result is { url, filename } — filename is the original file's name,
// handed back so the caller can optionally use it as cell text.
export default function BulkImagePicker({ onFiles, label = 'Toplu görsel ekle' }) {
  function handleChange(e) {
    const files = Array.from(e.target.files || []).filter((f) => f.size <= 8 * 1024 * 1024);
    if (!files.length) return;

    Promise.all(
      files.map((file) =>
        uploadImage(file, 'cell')
          .then((url) => (url ? { url, filename: file.name } : null))
          .catch(() => null)
      )
    ).then((results) => {
      const images = results.filter(Boolean);
      if (images.length) onFiles(images);
    });

    e.target.value = '';
  }

  return (
    <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-ink-500 px-3 py-1.5 text-[11px] font-medium text-paper/55 hover:border-mint hover:text-mint">
      <Images size={13} /> {label}
      <input type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />
    </label>
  );
}
