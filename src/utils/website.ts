import { apiFetch } from '../lib/supabase';
export async function websiteRequest(path: string, body: unknown = {}) {
  const response = await apiFetch(`/api/website/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The Q website connection could not be verified.');
  return data as { connected: boolean; name?: string; connectedAt?: string };
}
