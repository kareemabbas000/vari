'use client';

import { supabaseBrowser } from '@/lib/supabase/browser';
import { slugify } from './hooks';

export type MediaRow = {
  id: string;
  source: string;
  path: string;
  width: number | null;
  height: number | null;
  alt: Record<string, string>;
  file_name: string | null;
  created_at: string;
};

export const MEDIA_COLUMNS = 'id,source,path,width,height,alt,file_name,created_at';
const MAX_BYTES = 15 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];

async function dimensions(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bmp = await createImageBitmap(file);
    const d = { width: bmp.width, height: bmp.height };
    bmp.close();
    return d;
  } catch {
    return null; // e.g. SVG
  }
}

/** Upload an image to the "media" bucket and register it in the media library. */
export async function uploadImage(file: File): Promise<MediaRow> {
  if (!TYPES.includes(file.type)) throw new Error(`${file.name}: only JPG, PNG, WebP, AVIF or SVG images.`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name}: larger than 15 MB.`);
  const db = supabaseBrowser();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
  const now = new Date();
  const path = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID().slice(0, 8)}-${base}.${ext}`;
  const up = await db.storage.from('media').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (up.error) throw new Error(`${file.name}: ${up.error.message}`);
  const dims = await dimensions(file);
  const { data, error } = await db
    .from('media')
    .insert({ source: 'storage', path, width: dims?.width ?? null, height: dims?.height ?? null, file_name: file.name, alt: {} })
    .select(MEDIA_COLUMNS)
    .single();
  if (error) {
    await db.storage.from('media').remove([path]);
    throw new Error(`${file.name}: ${error.message}`);
  }
  return data as MediaRow;
}
