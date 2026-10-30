/** Public Supabase coordinates (safe in the browser: RLS decides what the key can do). */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wdejuqvggvayxtrvkqye.supabase.co').replace(/\/$/, '');
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_o5mOEUJmm5Dco0nvjAvi7Q_DRppu1D5';
