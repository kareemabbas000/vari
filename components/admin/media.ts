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

/**
 * Uploads are made web-ready in the browser before they reach storage: JPG, PNG and WebP are
 * re-encoded as WebP (about 25–35% smaller than JPEG at the same quality, transparency kept),
 * capped at 2560 px on the long side, and saved with two smaller copies (640 and 1280 px).
 * Phones then download a 640 px file instead of the original, which keeps Supabase's free
 * bandwidth for what matters. SVG and AVIF are uploaded as they are (already optimal).
 * Files named "-rv.webp" have the copies; lib/image-loader.ts picks the right one.
 */
const MAX_SIDE = 2560;
export const VARIANT_WIDTHS = [640, 1280] as const;

async function encodeWebp(bmp: ImageBitmap, width: number, quality = 0.82): Promise<Blob | null> {
  const scale = Math.min(1, width / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) return null;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob =
    canvas instanceof HTMLCanvasElement
      ? await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/webp', quality))
      : await canvas.convertToBlob({ type: 'image/webp', quality });
  // Browsers without a WebP encoder silently return PNG: treat that as "cannot convert".
  return blob && blob.type === 'image/webp' ? blob : null;
}

/** The web-ready main file plus its smaller copies, or null to upload the file unchanged. */
async function webReady(file: File): Promise<{ main: Blob; variants: { width: number; blob: Blob }[]; width: number; height: number } | null> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return null;
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    return null;
  }
  try {
    const main = await encodeWebp(bmp, MAX_SIDE);
    if (!main) return null;
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const width = Math.round(bmp.width * scale);
    const height = Math.round(bmp.height * scale);
    const variants: { width: number; blob: Blob }[] = [];
    for (const w of VARIANT_WIDTHS) {
      const target = Math.round(Math.max(bmp.width, bmp.height) * (w / bmp.width));
      const blob = bmp.width > w ? await encodeWebp(bmp, target) : null;
      variants.push({ width: w, blob: blob ?? main });
    }
    return { main, variants, width, height };
  } finally {
    bmp.close();
  }
}

/** Storage paths of an upload's smaller copies (for deleting them with the original). */
export function variantPaths(path: string): string[] {
  return path.endsWith('-rv.webp') ? VARIANT_WIDTHS.map((w) => path.replace(/-rv\.webp$/, `-rv.w${w}.webp`)) : [];
}

/** Upload an image to the "media" bucket and register it in the media library. */
export async function uploadImage(file: File): Promise<MediaRow> {
  if (!TYPES.includes(file.type)) throw new Error(`${file.name}: only JPG, PNG, WebP, AVIF or SVG images.`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name}: larger than 15 MB.`);
  const db = supabaseBrowser();
  const ready = await webReady(file);
  const ext = ready ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase();
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
  const now = new Date();
  const stem = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID().slice(0, 8)}-${base}`;
  const path = ready ? `${stem}-rv.webp` : `${stem}.${ext}`;
  const opts = { contentType: ready ? 'image/webp' : file.type, cacheControl: '31536000', upsert: false };
  const up = await db.storage.from('media').upload(path, ready ? ready.main : file, opts);
  if (up.error) throw new Error(`${file.name}: ${up.error.message}`);
  if (ready) {
    const copies = await Promise.all(ready.variants.map((v) => db.storage.from('media').upload(path.replace(/-rv\.webp$/, `-rv.w${v.width}.webp`), v.blob, opts)));
    const failed = copies.find((c) => c.error);
    if (failed) {
      await db.storage.from('media').remove([path, ...variantPaths(path)]);
      throw new Error(`${file.name}: ${failed.error!.message}`);
    }
  }
  const dims = ready ? { width: ready.width, height: ready.height } : await dimensions(file);
  const { data, error } = await db
    .from('media')
    .insert({ source: 'storage', path, width: dims?.width ?? null, height: dims?.height ?? null, file_name: file.name, alt: {} })
    .select(MEDIA_COLUMNS)
    .single();
  if (error) {
    await db.storage.from('media').remove([path, ...variantPaths(path)]);
    throw new Error(`${file.name}: ${error.message}`);
  }
  return data as MediaRow;
}
