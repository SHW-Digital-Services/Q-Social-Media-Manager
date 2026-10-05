import { apiFetch } from '../lib/supabase';
export async function blueskyRequest(path: string, body?: unknown) {
  const response = await apiFetch(`/api/bluesky/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Bluesky connection could not be verified.');
  return data as { connected: boolean; configured?: boolean; handle?: string; connectedAt?: string };
}
