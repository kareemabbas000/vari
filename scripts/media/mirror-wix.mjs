#!/usr/bin/env node
/**
 * Self-host the Wix media: download every original once and write web-ready copies to
 * public/media/<id>/ so the website no longer depends on static.wixstatic.com.
 *
 *   node scripts/media/mirror-wix.mjs            # collect ids from code + live database, convert new ones
 *   node scripts/media/mirror-wix.mjs --force    # rebuild every image
 *
 * For each image: AVIF and WebP at 256, 640, 1280, 1920 and 2560 px wide (never wider than the
 * original), plus og.jpg (1200×630, for social cards, which cannot show AVIF). The site serves
 * AVIF to browsers that accept it and WebP to the rest (next.config.mjs), cached for a year.
 * lib/media-manifest.json records each image's size and widths; lib/image-loader.ts reads it.
 * Images not in the manifest still load from Wix, so nothing breaks while this is incomplete.
 * Needs sharp (installed with Next.js) and network access to static.wixstatic.com.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'public', 'media');
const MANIFEST = join(ROOT, 'lib', 'media-manifest.json');
export const WIDTHS = [256, 640, 1280, 1920, 2560];
const ID = /[0-9a-f]{6}_[0-9a-f]{32}~mv2\.(?:png|jpe?g|webp)/gi;
const force = process.argv.includes('--force');

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.next', '.git', 'public'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(ts|tsx|js|mjs|py|json|sql|md)$/.test(name)) files.push(p);
  }
  return files;
}

async function idsFromDatabase() {
  const cfg = readFileSync(join(ROOT, 'lib', 'supabase', 'config.ts'), 'utf8');
  const url = cfg.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0];
  const key = cfg.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
  if (!url || !key) return [];
  const queries = ['media?select=path', 'blog_posts?select=cover', 'blog_post_translations?select=html', 'pages?select=blocks,seo', 'site_settings?select=data', 'content_blocks?select=value', 'blog_authors?select=avatar'];
  const texts = await Promise.all(queries.map((q) => fetch(`${url}/rest/v1/${q}`, { headers: { apikey: key } }).then((r) => (r.ok ? r.text() : '')).catch(() => '')));
  return texts.join('\n').match(ID) ?? [];
}

const stemOf = (id) => id.replace(/~mv2\.[a-z]+$/i, '');

/** Written after every image, so an interrupted run keeps its progress. */
function save(manifest) {
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  writeFileSync(MANIFEST, JSON.stringify(sorted, null, 1) + '\n');
}

async function main() {
  const fromCode = walk(join(ROOT, 'lib')).concat(walk(join(ROOT, 'components')), walk(join(ROOT, 'app')), walk(join(ROOT, 'scripts')))
    .flatMap((f) => readFileSync(f, 'utf8').match(ID) ?? []);
  const ids = [...new Set([...fromCode, ...(await idsFromDatabase())].map((i) => i.replace(/\.jpeg$/i, '.jpeg')))].sort();
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  console.log(`${ids.length} images referenced`);
  let done = 0;
  // Several images at once: AVIF encoding is the slow part and uses one core per image.
  const convert = async (id) => {
    const stem = stemOf(id);
    const dir = join(OUT, stem);
    if (!force && existsSync(join(dir, 'og.jpg'))) {
      // Already converted (also after an interrupted run): rebuild its manifest entry from the files.
      if (!manifest[stem]) {
        const widths = readdirSync(dir).filter((f) => f.endsWith('.avif')).map((f) => Number(f.split('.')[0])).sort((a, b) => a - b);
        const meta = await sharp(join(dir, `${widths.at(-1)}.webp`)).metadata();
        manifest[stem] = { w: meta.width, h: meta.height, widths };
        save(manifest);
      }
      return;
    }
    const res = await fetch(`https://static.wixstatic.com/media/${id}`);
    if (!res.ok) {
      console.warn(`  ! ${id}: download failed (${res.status}), keeps loading from Wix`);
      return;
    }
    const original = Buffer.from(await res.arrayBuffer());
    const img = sharp(original, { failOn: 'none' }).rotate();
    const { width, height } = await img.metadata();
    mkdirSync(dir, { recursive: true });
    const widths = WIDTHS.filter((w) => w < width).concat(width < WIDTHS.at(-1) ? [width] : []).filter((w, i, a) => a.indexOf(w) === i);
    const sizes = widths.length ? widths : [width];
    for (const w of sizes) {
      const resized = img.clone().resize({ width: w, withoutEnlargement: true });
      await resized.clone().avif({ quality: 52, effort: 4 }).toFile(join(dir, `${w}.avif`));
      await resized.clone().webp({ quality: 80, effort: 5 }).toFile(join(dir, `${w}.webp`));
    }
    await img.clone().resize(1200, 630, { fit: 'cover', position: 'attention' }).flatten({ background: '#101418' }).jpeg({ quality: 84, mozjpeg: true }).toFile(join(dir, 'og.jpg'));
    manifest[stem] = { w: width, h: height, widths: sizes };
    save(manifest);
    done++;
    console.log(`  ✓ ${stem} ${width}×${height} → ${sizes.join(', ')}`);
  };
  const queue = [...ids];
  const workers = Array.from({ length: Math.max(1, Math.min(6, (await import('node:os')).cpus().length)) }, async () => {
    while (queue.length) await convert(queue.shift());
  });
  await Promise.all(workers);
  save(manifest);
  console.log(`${done} converted, ${Object.keys(manifest).length} in the manifest`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
