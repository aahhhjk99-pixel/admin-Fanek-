import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
let client = null;
try {
  if (url && key) {
    client = createClient(url.trim(), key.trim(), { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  }
} catch (e) {
  console.error('Supabase init failed', e);
}
export const supabase = client;
export function requireSupabase() { if (!supabase) throw new Error('أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env'); return supabase; }
