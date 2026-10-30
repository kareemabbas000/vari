import { SUPABASE_URL } from '@/lib/supabase/config';

/** Image src for a media row: Wix media ids go through the image loader; uploads are public Storage URLs. */
export function mediaSrc(source: string, path: string) {
  return source === 'storage' ? `${SUPABASE_URL}/storage/v1/object/public/media/${path.split('/').map(encodeURIComponent).join('/')}` : path;
}
