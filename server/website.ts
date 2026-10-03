import { loadPublishingImage } from './media.js';
import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { getSocialSession, saveSocialSession, clearSocialSession } from './socialSessions.js';
import { isBlueskySameOrigin } from './bluesky.js';

const ORIGIN = 'https://www.q-ai.online';
async function websiteRequest(path: string, token: string, body?: unknown) {
  const response = await fetch(`${ORIGIN}/api/content/${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000), redirect: 'error' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'The website publishing token is missing or revoked. Create an authorised API client in the Q website CRM.' : response.status === 404 ? 'Deploy the website publisher-status update before connecting.' : `The Q website could not complete this request (${response.status}).`);
  return data;
}
export function registerWebsiteRoutes(app: Express) {
  app.post('/api/website/connect', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!isBlueskySameOrigin(req)) return res.status(403).json({ error: 'Connect from this website.' });
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (!/^qcp_[A-Za-z0-9_-]{43}$/.test(token)) return res.status(400).json({ error: 'Enter the publishing API token created in the Q website CRM.' });
    try {
      const verified = await websiteRequest('publisher/status', token);
      if (!verified.authorised || !verified.client?.id) throw new Error('The Q website did not verify this publisher.');
      const session = saveSocialSession(res, 'website', { access_token: token, expires_in: 60 * 86400, accountHandle: verified.client.name });
      res.json({ connected: true, name: verified.client.name, connectedAt: session.connectedAt });
    } catch (error) { res.status(400).json({ error: (error as Error).message }); }
  });
  app.post('/api/website/check', async (req, res) => {
    if (!isBlueskySameOrigin(req)) return res.status(403).json({ error: 'Check from this website.' });
    const session = getSocialSession(req, 'website');
    if (!session) return res.status(401).json({ error: 'Connect the Q website first.' });
    try {
      const verified = await websiteRequest('publisher/status', session.access_token);
      if (!verified.authorised) throw new Error('The Q website did not verify this publisher.');
      res.json({ connected: true });
    } catch (error) { res.status(401).json({ error: (error as Error).message }); }
  });
}
export async function publishWebsite(req: Request, payload: { postId?: string; title?: string; content?: string; tags?: string[]; mediaUrls?: string[] }) {
  const session = getSocialSession(req, 'website');
  const fail = (message: string) => ({ platform: 'website' as const, status: 'failed' as const, message });
  if (!session) return { platform: 'website' as const, status: 'not_configured' as const, message: 'Connect the Q website using a CRM-authorised publishing token.' };
  const title = payload.title?.trim() || '';
  const body = payload.content?.trim() || '';
  if (title.length < 3 || title.length > 180) return fail('Website news needs a title between 3 and 180 characters.');
  if (body.length < 20 || body.length > 20000) return fail('Website news needs between 20 and 20,000 characters of content.');
  if ((payload.mediaUrls?.length || 0) > 1) return fail('Website news supports one hero image. Remove extra images before publishing.');
  let hero = payload.mediaUrls?.[0];
  if (hero && !/^https:\/\//i.test(hero) && !hero.startsWith('data:image/')) return fail('Website images must be HTTPS URLs or uploaded PNG, JPEG or WebP images.');
  const tags = [...new Set((payload.tags || []).map(tag => tag.replace(/^#/, '').trim().toLowerCase()).filter(Boolean))];
  if (tags.length > 12 || tags.some(tag => tag.length > 40)) return fail('Website news allows up to 12 tags of at most 40 characters.');
  const summary = body.replace(/[#*_`>]/g, '').replace(/\s+/g, ' ').slice(0, 500).trim();
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'q-news';
  const suffix = crypto.createHash('sha256').update(payload.postId || `${title}:${body}`).digest('hex').slice(0, 12);
  try {
    if (hero?.startsWith('data:image/')) {
      const image = await loadPublishingImage(hero, 3000000);
      const response = await fetch(`${ORIGIN}/api/content/media`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': image.mime }, body: new Uint8Array(image.bytes), signal: AbortSignal.timeout(20000), redirect: 'error' });
      const uploaded = await response.json().catch(() => ({}));
      if (!response.ok || typeof uploaded.url !== 'string' || !uploaded.url.startsWith('https://')) return fail(response.status === 404 ? 'Deploy the Q website media upload endpoint before publishing uploaded images.' : uploaded.error || 'Website image upload failed.');
      hero = uploaded.url;
    }
    const data = await websiteRequest('publish', session.access_token, { title, summary, body, slug: `${baseSlug}-${suffix}`, contentType: 'news', tags, ...(hero ? { heroImageUrl: hero } : {}), publish: true });
    if (!data.post?.id || !data.post?.slug || !data.post?.published_at) return fail('The website did not confirm publication. Check the News page before retrying.');
    return { platform: 'website' as const, status: 'published' as const, message: `Published on ${ORIGIN}/news`, remoteId: data.post.id };
  } catch (error) { return fail((error as Error).message); }
}
