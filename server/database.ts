import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | undefined;
export function database() {
  if (!client) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Shared storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.');
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}
export function requireDatabase<T>(result: { data: T; error: any }): NonNullable<T> {
  if(result.error?.code==='P0001')throw Object.assign(new Error('Delivery has already started or the post is not approved. Refresh the queue and check the platform before retrying.'),{status:409});
  if (result.error) {
    const conflict = ['40001','23505'].includes(result.error.code);
    const code = typeof result.error.code === 'string' && /^[A-Z0-9]{2,10}$/.test(result.error.code) ? result.error.code : 'unknown';
    throw Object.assign(new Error(conflict ? 'This post changed on another device. Refresh before saving.' : `Shared storage could not complete the request (Supabase error ${code}). Your draft has been kept. Check the server’s Supabase connection and database logs.`),{status: conflict?409:503});
  }
  return result.data as NonNullable<T>;
}
