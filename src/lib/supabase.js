import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL || 'https://pwszxdujmpolnxyoquls.supabase.co').trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_QipYvIeeBCD21wFxvc-mHw_NxFt-t2K').trim();

let client = null;
try {
  client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
} catch (e) {
  console.error('Supabase init failed', e);
}
export const supabase = client;
export function requireSupabase() { if (!supabase) throw new Error('تعذر تهيئة الاتصال بقاعدة البيانات.'); return supabase; }
