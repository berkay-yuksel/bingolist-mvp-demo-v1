import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const BUCKET = 'card-images';

// Different contexts never display an image larger than these widths, so
// there is no reason to keep — or pay egress for — pixels beyond that.
// Cropping/aspect is left to the browser (object-cover); this only caps
// the largest dimension.
const MAX_WIDTH = {
  cover: 1600, // card cover photos, hero banner
  cell: 900, // individual bingo cell photos
  avatar: 500,
  banner: 1600,
};

const useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
const supabase = useSupabase ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY) : null;

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'cover';
  const maxWidth = MAX_WIDTH[type] || MAX_WIDTH.cover;

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'Görsel 8MB altında olmalı.' }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let outputBuffer;
  try {
    outputBuffer = await sharp(inputBuffer)
      .rotate() // respect EXIF orientation before stripping metadata
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (err) {
    return NextResponse.json({ error: 'Görsel işlenemedi. Geçerli bir resim dosyası mı?' }, { status: 400 });
  }

  if (useSupabase) {
    const fileName = `${type}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, outputBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000', // 1 year — filenames are unique, never reused
    });
    if (error) {
      return NextResponse.json({ error: `Görsel depolanamadı: ${error.message}` }, { status: 500 });
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return NextResponse.json({ url: data.publicUrl });
  }

  // No Supabase configured (local dev without env vars) — fall back to a
  // compressed base64 data URI, same as before but at least resized now.
  const base64 = outputBuffer.toString('base64');
  return NextResponse.json({ url: `data:image/webp;base64,${base64}` });
}
