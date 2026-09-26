'use client';

import { useState } from 'react';
import { Images, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/uploadImage';

// Only this many uploads run at once — sending 50+ requests simultaneously
// overwhelmed the server (each one does image compression + a Storage
// write) and just failed outright. A small concurrent pool keeps things
// moving without hammering it, and lets us report real progress.
const CONCURRENCY = 4;

async function uploadWithConcurrency(files, onProgress) {
  const results = new Array(files.length);
  let nextIndex = 0;
  let done = 0;

  async function worker() {
    while (nextIndex < files.length) {
      const i = nextIndex++;
      const file = files[i];
      try {
        const url = await uploadImage(file, 'cell');
        results[i] = url ? { url, filename: file.name } : null;
      } catch {
        results[i] = null;
      }
      done += 1;
      onProgress(done, files.length);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker());
  await Promise.all(workers);
  return results.filter(Boolean);
}

// Lets the person pick several images at once; the caller decides how to
// distribute them across cells (see handleBulkImages in the create page).
// Each result is { url, filename } — filename is the original file's name,
// handed back so the caller can optionally use it as cell text.
export default function BulkImagePicker({ onFiles, label = 'Toplu görsel ekle' }) {
  const [progress, setProgress] = useState(null); // { done, total } while uploading

  async function handleChange(e) {
    const files = Array.from(e.target.files || []).filter((f) => f.size <= 8 * 1024 * 1024);
    e.target.value = '';
    if (!files.length) return;

    setProgress({ done: 0, total: files.length });
    const images = await uploadWithConcurrency(files, (done, total) => setProgress({ done, total }));
    setProgress(null);

    if (images.length) onFiles(images);
  }

  if (progress) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-ink-500 px-3 py-1.5 text-[11px] font-medium text-paper/70">
        <Loader2 size={13} className="animate-spin" />
        {progress.done}/{progress.total} görsel yüklendi
      </div>
    );
  }

  return (
    <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-ink-500 px-3 py-1.5 text-[11px] font-medium text-paper/55 hover:border-mint hover:text-mint">
      <Images size={13} /> {label}
      <input type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />
    </label>
  );
}