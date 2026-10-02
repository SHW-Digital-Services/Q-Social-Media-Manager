import React, { useState } from 'react';
import { websiteRequest } from '../utils/website';

export function WebsiteConnectionForm({ onConnected, onCancel }: { onConnected: (name: string, connectedAt: string) => void; onCancel: () => void }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const verified = await websiteRequest('connect', { token });
      if (!verified.connected || !verified.name || !verified.connectedAt) throw new Error('The website did not confirm the connection.');
      setToken(''); onConnected(verified.name, verified.connectedAt);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <p className="text-xs text-slate-600">Publish approved content to the Q website’s public News page. This connection is saved in this browser.</p>
    <p className="text-xs text-slate-600">In the <a href="https://www.q-ai.online/crm" target="_blank" rel="noreferrer" className="text-purple-700 underline">Q website CRM</a>, open News &amp; Updates and authorise a content API client named “Social Media Manager”. Copy its token when shown.</p>
    <label className="block text-xs font-semibold text-slate-700">Website publishing token
      <input type="password" autoComplete="off" required value={token} onChange={event => setToken(event.target.value)} placeholder="qcp_…" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300" />
    </label>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    <div className="flex justify-end gap-2">
      <button type="button" disabled={busy} onClick={onCancel} className="px-4 py-2 text-xs">Cancel</button>
      <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold disabled:opacity-50">{busy ? 'Verifying…' : 'Connect Q website'}</button>
    </div>
  </form>;
}
