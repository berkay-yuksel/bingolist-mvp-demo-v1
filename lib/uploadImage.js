'use client';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — server compresses it down from here

// Uploads `file` through our own server route (/api/upload), which
// resizes/compresses it with sharp and stores it in Supabase Storage,
// returning a short public URL to save on the card/profile — never a
// giant base64 blob. `type` controls how large the server keeps it:
// 'cover' | 'cell' | 'avatar' | 'banner'. Without Supabase configured
// (local dev with no env vars), the server still compresses the image
// but returns it as a data URI instead — same call site either way.
export async function uploadImage(file, type = 'cover') {
  if (!file) return null;
  if (file.size > MAX_BYTES) {
    throw new Error('Görsel 8MB altında olmalı.');
  }

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`/api/upload?type=${type}`, { method: 'POST', body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error || 'Görsel yüklenemedi.');
  }
  const json = await res.json();
  return json.url;
}
