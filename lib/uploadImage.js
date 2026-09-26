'use client';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — hard cap on the original file

// Server-side caps per context (kept in sync with app/api/upload/route.js).
// Resizing slightly above these client-side avoids a double-downsample
// quality hit while still cutting the upload payload down drastically —
// a typical 4000px, 5MB phone photo becomes ~150-300KB before it even
// leaves the browser, which is the main thing that was making bulk
// uploads feel slow (the network transfer, not the server-side work).
// The size win comes from shrinking dimensions, not from a low quality
// setting — 0.92 here keeps this pass close to lossless so the server's
// own WebP compression (the one that actually determines final quality)
// is working from a clean source, not a second round of visible artifacts.
const CLIENT_MAX_WIDTH = { cover: 1600, cell: 1000, avatar: 600, banner: 1600 };

function resizeImageClientSide(file, maxWidth, quality = 0.92) {
  return new Promise((resolve) => {
    // Nothing to gain resizing an SVG (vector, no pixels to shrink) or a
    // file that's already small — skip the canvas round-trip for those.
    if (file.type === 'image/svg+xml' || file.size < 250 * 1024) {
      resolve(file);
      return;
    }

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      if (scale >= 1) {
        resolve(file); // already narrower than our target, leave it alone
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // couldn't decode client-side — let the server try as-is
    };
    img.src = objectUrl;
  });
}

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

  const resized = await resizeImageClientSide(file, CLIENT_MAX_WIDTH[type] || CLIENT_MAX_WIDTH.cover);

  const form = new FormData();
  form.append('file', resized);

  const res = await fetch(`/api/upload?type=${type}`, { method: 'POST', body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error || 'Görsel yüklenemedi.');
  }
  const json = await res.json();
  return json.url;
}