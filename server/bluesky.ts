import { loadPublishingImage } from './media.js';
import crypto from 'node:crypto';
import type { Request, Response, Express } from 'express';

const COOKIE = 'q_bluesky_session';
const MAX_AGE = 30 * 24 * 60 * 60;
type Session = { accessJwt: string; refreshJwt: string; did: string; handle: string; service: string; connectedAt: string; expiresAt: number };

function key() {
  const secret = process.env.BLUESKY_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('Bluesky setup requires BLUESKY_SESSION_SECRET with at least 32 random characters.');
  return crypto.createHash('sha256').update(secret).digest();
}
function seal(session: Session) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  return Buffer.concat([iv, cipher.update(JSON.stringify(session)), cipher.final(), cipher.getAuthTag()]).toString('base64url');
}
export function getBlueskySession(req: Request): Session | null {
  try {
    const value = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    if (!value) return null;
    const data = Buffer.from(value, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(-16));
    const session = JSON.parse(Buffer.concat([decipher.update(data.subarray(12, -16)), decipher.final()]).toString()) as Session;
    if (session.expiresAt <= Date.now()) return null;
    return session;
  } catch { return null; }
}
function save(res: Response, session: Session) {
  const value = seal(session);
  if (value.length > 3800) throw new Error('Bluesky session is too large to save.');
  res.cookie(COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL), sameSite: 'strict', path: '/api', maxAge: MAX_AGE * 1000 });
}
export function isBlueskySameOrigin(req: Request) {
  const expected = new URL(process.env.APP_URL || `${req.protocol}://${req.get('host')}`).origin;
  return req.get('origin') === expected;
}
function serviceUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !(['bsky.social'].includes(url.hostname) || url.hostname.endsWith('.bsky.network'))) {
    throw new Error('This integration currently supports Bluesky-hosted accounts only.');
  }
  return url.origin;
}
async function xrpc(service: string, method: string, body?: unknown, token?: string) {
  const response = await fetch(`${service}/xrpc/${method}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000), redirect: 'error',
  });
  const data = await response.json().catch(() => ({})) as any;
  if (!response.ok) {
    const error = new Error(data.error === 'AuthenticationRequired' || data.error === 'InvalidToken' ? 'Bluesky rejected this session. Reconnect using an app password.' : `Bluesky request failed (${response.status}): ${data.error || 'provider error'}`) as Error & { code?: string };
    error.code = data.error;
    throw error;
  }
  return data;
}
async function refresh(req: Request, res: Response) {
  const session = getBlueskySession(req);
  if (!session) throw new Error('Connect your Bluesky account before publishing.');
  // JWT expiry is used only to decide when to refresh; the PDS validates the token.
  let expiry = 0;
  try { expiry = JSON.parse(Buffer.from(session.accessJwt.split('.')[1], 'base64url').toString()).exp * 1000; } catch {}
  if (expiry < Date.now() + 60000) {
    const data = await xrpc(session.service, 'com.atproto.server.refreshSession', {}, session.refreshJwt);
    if (!data.accessJwt || !data.refreshJwt || data.did !== session.did) throw new Error('Bluesky session renewal failed. Reconnect your account.');
    session.accessJwt = data.accessJwt;
    session.refreshJwt = data.refreshJwt;
    save(res, session);
  }
  return session;
}
export function registerBlueskyRoutes(app: Express) {
  app.get('/api/bluesky/status', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const session = getBlueskySession(req);
    res.json({ configured: Boolean(process.env.BLUESKY_SESSION_SECRET && process.env.BLUESKY_SESSION_SECRET.length >= 32), connected: Boolean(session), handle: session?.handle, connectedAt: session?.connectedAt });
  });
  app.post('/api/bluesky/connect', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!isBlueskySameOrigin(req)) return res.status(403).json({ error: 'Connection must be made from this website.' });
    try { key(); } catch (error) { return res.status(503).json({ error: (error as Error).message }); }
    const handle = typeof req.body?.handle === 'string' ? req.body.handle.trim().replace(/^@/, '').toLowerCase() : '';
    const password = typeof req.body?.appPassword === 'string' ? req.body.appPassword.trim() : '';
    if (!/^[a-z0-9][a-z0-9.-]{1,251}\.[a-z]{2,}$/i.test(handle) || !/^[a-z0-9]{4}(?:-[a-z0-9]{4}){3}$/i.test(password)) return res.status(400).json({ error: 'Enter your full Bluesky handle and generated app password (xxxx-xxxx-xxxx-xxxx).' });
    try {
      const data = await xrpc('https://bsky.social', 'com.atproto.server.createSession', { identifier: handle, password });
      if (!data.accessJwt || !data.refreshJwt || !data.did || !data.handle) throw new Error('Bluesky did not return a valid session.');
      const endpoint = data.didDoc?.service?.find((s: any) => s.type === 'AtprotoPersonalDataServer')?.serviceEndpoint;
      const session: Session = { accessJwt: data.accessJwt, refreshJwt: data.refreshJwt, did: data.did, handle: data.handle, service: serviceUrl(endpoint || 'https://bsky.social'), connectedAt: new Date().toISOString(), expiresAt: Date.now() + MAX_AGE * 1000 };
      save(res, session);
      res.json({ connected: true, handle: session.handle, connectedAt: session.connectedAt });
    } catch { res.status(400).json({ error: 'Bluesky sign-in failed. Check your handle and app password. Only Bluesky-hosted accounts are supported.' }); }
  });
  app.post('/api/bluesky/disconnect', (req, res) => {
    if (!isBlueskySameOrigin(req)) return res.status(403).json({ error: 'Disconnect must be made from this website.' });
    res.clearCookie(COOKIE, { path: '/api', httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL) });
    res.json({ connected: false });
  });
  app.post('/api/bluesky/check', async (req, res) => {
    if (!isBlueskySameOrigin(req)) return res.status(403).json({ error: 'Check must be made from this website.' });
    try {
      const session = await refresh(req, res);
      await xrpc(session.service, 'com.atproto.server.getSession', undefined, session.accessJwt);
      res.json({ connected: true, handle: session.handle });
    } catch (error) { res.status(401).json({ error: (error as Error).message }); }
  });
}
export async function publishBluesky(req: Request, res: Response, payload: { content?: string; mediaUrls?: string[]; tags?: string[]; title?: string; postId?: string }) {
  if (!isBlueskySameOrigin(req)) throw new Error('Publishing must be requested from this website.');
  const text = [payload.content?.trim(), ...(payload.tags || [])].filter(Boolean).join('\n');
  if ([...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].length > 300 || Buffer.byteLength(text) > 3000) throw new Error('Bluesky posts must be at most 300 characters. Shorten the text or tags.');
  if ((payload.mediaUrls?.length || 0) > 4) throw new Error('Bluesky accepts at most four images per post.');
  const session = await refresh(req, res);
  const images = [];
  for (const value of payload.mediaUrls || []) {
    const { bytes, mime } = await loadPublishingImage(value);
    const response = await fetch(`${session.service}/xrpc/com.atproto.repo.uploadBlob`, { method: 'POST', headers: { Authorization: `Bearer ${session.accessJwt}`, 'Content-Type': mime }, body: new Uint8Array(bytes), signal: AbortSignal.timeout(20000), redirect: 'error' });
    const data = await response.json() as any;
    if (!response.ok || !data.blob) throw new Error('Bluesky image upload failed. The post was not published.');
    images.push({ alt: (payload.title || '').slice(0, 1000), image: data.blob });
  }
  const record = { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString(), ...(images.length ? { embed: { $type: 'app.bsky.embed.images', images } } : {}) };
  const data = await xrpc(session.service, 'com.atproto.repo.createRecord', { repo: session.did, collection: 'app.bsky.feed.post', record }, session.accessJwt);
  if (!data.uri || !data.cid) throw new Error('Bluesky did not confirm the post.');
  return { platform: 'bluesky' as const, status: 'published' as const, message: 'Bluesky post published successfully.', remoteId: data.uri };
}
