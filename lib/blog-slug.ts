/**
 * URL-safe slug that keeps words readable in every language: German umlauts become
 * ae/oe/ue (the German convention), Turkish letters their plain Latin form (ş → s,
 * ı → i, ö → o), accents are dropped (ñ → n).
 */
export function postSlug(s: string, locale?: string) {
  let out = locale === 'tr' ? s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr') : s.toLowerCase();
  if (locale === 'de' || !locale) out = out.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
  return out
    .replace(/ß/g, 'ss')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/, '');
}
