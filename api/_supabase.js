// /api/_supabase.js
import { createClient } from '@supabase/supabase-js';

export function svc() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE env');
  return createClient(url, key, { auth: { persistSession: false } });
}
