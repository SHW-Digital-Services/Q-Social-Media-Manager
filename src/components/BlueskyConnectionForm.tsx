import React, { useState } from 'react';
import { blueskyRequest } from '../utils/bluesky';

export function BlueskyConnectionForm({ initialHandle, onConnected, onCancel }: {
  initialHandle: string;
  onConnected: (handle: string, connectedAt: string) => void;
  onCancel: () => void;
}) {
  const [handle, setHandle] = useState(initialHandle.replace(/^@/, ''));
  const [appPassword, setAppPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await blueskyRequest('connect', { handle, appPassword });
      if (!result.connected || !result.handle || !result.connectedAt) throw new Error('Bluesky did not confirm the connection.');
      setAppPassword('');
      onConnected(result.handle, result.connectedAt);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <p className="text-xs text-slate-600">Connect your Bluesky-hosted account using an app password. This connection is saved for this browser for up to 30 days.</p>
    <label className="block text-xs font-semibold text-slate-700">Bluesky handle
      <input autoComplete="username" required value={handle} onChange={event => setHandle(event.target.value)} placeholder="your-name.bsky.social" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300" />
    </label>
    <label className="block text-xs font-semibold text-slate-700">App password
      <input type="password" autoComplete="off" required value={appPassword} onChange={event => setAppPassword(event.target.value)} placeholder="xxxx-xxxx-xxxx-xxxx" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300" />
    </label>
    <p className="text-xs text-slate-600">Create one in <a href="https://bsky.app/settings/app-passwords" target="_blank" rel="noreferrer" className="text-purple-700 underline">Bluesky → App passwords</a>. Your normal account password is not needed.</p>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    <div className="flex justify-end gap-2">
      <button type="button" disabled={busy} onClick={onCancel} className="px-4 py-2 text-xs">Cancel</button>
      <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold disabled:opacity-50">{busy ? 'Connecting…' : 'Connect Bluesky'}</button>
    </div>
  </form>;
}
