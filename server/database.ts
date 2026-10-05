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
  if (result.error) throw Object.assign(new Error(result.error.code === '40001' || result.error.code === '23505' ? 'This post changed on another device. Refresh before saving.' : 'Shared storage could not complete the request. Your draft has been kept.'),{status: ['40001','23505'].includes(result.error.code)?409:503});
  return result.data as NonNullable<T>;
}
