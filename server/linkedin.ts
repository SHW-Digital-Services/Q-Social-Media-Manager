import type { Express } from 'express';
import { getSocialSession } from './socialSessions.js';
import { isBlueskySameOrigin } from './bluesky.js';
import { loadPublishingImage } from './media.js';

export function linkedinVersion() {
  const date = new Date(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() - 1);
  return process.env.LINKEDIN_VERSION || `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
export async function publishLinkedIn(payload: { content?: string; tags?: string[]; mediaUrls?: string[]; title?: string }, token: { access_token: string; memberUrn?: string }) {
  const result = (status: 'failed' | 'published' | 'not_configured', message: string, remoteId?: string) => ({ platform: 'linkedin' as const, status, message, remoteId });
  if (!token.memberUrn?.startsWith('urn:li:person:')) return result('not_configured', 'Reconnect LinkedIn to verify your personal profile.');
  const text = [payload.content?.trim(), ...(payload.tags || [])].filter(Boolean).join('\n');
  if (text.length > 3000) return result('failed', 'LinkedIn posts must be at most 3,000 characters, including tags.');
  const media = payload.mediaUrls || [];
  if (media.length > 1) return result('failed', 'This LinkedIn integration supports one image per post. Remove extra images before publishing.');
  const headers = { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json', 'LinkedIn-Version': linkedinVersion(), 'X-Restli-Protocol-Version': '2.0.0' };
  let content: unknown;
  try {
    if (media.length) {
      const { bytes, mime } = await loadPublishingImage(media[0], 10000000);
      if (!['image/png', 'image/jpeg'].includes(mime)) return result('failed', 'Use a PNG or JPEG image for LinkedIn.');
      const initialized = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', { method: 'POST', headers, body: JSON.stringify({ initializeUploadRequest: { owner: token.memberUrn } }), signal: AbortSignal.timeout(20000), redirect: 'error' });
      const initializedData = await initialized.json().catch(() => ({}));
      if (!initialized.ok || !initializedData.value?.image || !initializedData.value?.uploadUrl) return result('failed', 'LinkedIn could not initialise the image upload.');
      const uploadUrl = new URL(initializedData.value.uploadUrl);
      if (uploadUrl.protocol !== 'https:' || uploadUrl.username || uploadUrl.password || !(uploadUrl.hostname === 'linkedin.com' || uploadUrl.hostname.endsWith('.linkedin.com'))) return result('failed', 'LinkedIn returned an unexpected image upload destination.');
      const uploaded = await fetch(uploadUrl, { method: 'PUT', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': mime }, body: new Uint8Array(bytes), signal: AbortSignal.timeout(20000), redirect: 'error' });
      if (!uploaded.ok) return result('failed', 'LinkedIn image upload failed. No post was created.');
      let available = false;
      for (let attempt = 0; attempt < 4; attempt++) {
        const checked = await fetch(`https://api.linkedin.com/rest/images/${encodeURIComponent(initializedData.value.image)}`, { headers, signal: AbortSignal.timeout(20000), redirect: 'error' });
        const checkedData = await checked.json().catch(() => ({}));
        if (!checked.ok || checkedData.status === 'PROCESSING_FAILED') break;
        if (checkedData.status === 'AVAILABLE') { available = true; break; }
        if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (!available) return result('failed', 'LinkedIn has not confirmed the image is ready. No post was created; try again later.');
      content = { media: { id: initializedData.value.image, altText: (payload.title || '').slice(0, 1000) } };
    }
    const response = await fetch('https://api.linkedin.com/rest/posts', { method: 'POST', headers, body: JSON.stringify({ author: token.memberUrn, commentary: text, visibility: 'PUBLIC', distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: 'PUBLISHED', isReshareDisabledByAuthor: false, ...(content ? { content } : {}) }), signal: AbortSignal.timeout(20000), redirect: 'error' });
    if (!response.ok) return result('failed', response.status === 401 ? 'LinkedIn login expired or was revoked. Reconnect your profile.' : 'LinkedIn rejected the post. Check Share on LinkedIn access and reconnect your profile.');
    const id = response.headers.get('x-restli-id');
    if (!id) return result('failed', 'LinkedIn accepted the request but did not return a post ID. Check your profile before retrying.');
    return result('published', 'Published to your LinkedIn profile.', id);
  } catch { return result('failed', 'LinkedIn publishing could not be confirmed. Check your profile before retrying.'); }
}


export function registerLinkedInRoutes(app: Express) {
  app.post('/api/linkedin/check', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!isBlueskySameOrigin(req)) return res.status(403).json({ error: 'Check from this website.' });
    const session = getSocialSession(req, 'linkedin');
    if (!session) return res.status(401).json({ error: 'Reconnect your LinkedIn profile.' });
    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${session.access_token}` }, signal: AbortSignal.timeout(20000), redirect: 'error' });
      const profile = await response.json().catch(() => ({}));
      if (!response.ok || session.memberUrn !== `urn:li:person:${profile.sub}`) return res.status(401).json({ error: 'LinkedIn could not verify this profile. Reconnect.' });
      res.json({ connected: true, name: profile.name });
    } catch { res.status(502).json({ error: 'LinkedIn could not be reached. Try again later.' }); }
  });
}
