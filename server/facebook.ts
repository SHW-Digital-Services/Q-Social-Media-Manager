import type { Request } from 'express';
import { getSocialSession } from './socialSessions.js';
import { loadPublishingImage } from './media.js';

const GRAPH = 'https://graph.facebook.com/v26.0';
async function graph(path: string, token: string, body?: URLSearchParams | FormData) {
  const response = await fetch(`${GRAPH}/${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}` }, body, signal: AbortSignal.timeout(20000), redirect: 'error' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(`Facebook: ${data.error?.message || `request failed (${response.status})`}`);
  return data;
}
export async function publishFacebook(req: Request, payload: { content?: string; tags?: string[]; mediaUrls?: string[] }) {
  const fail = (message: string) => ({ platform: 'facebook' as const, status: 'failed' as const, message });
  const session = getSocialSession(req, 'facebook');
  if (!session) return { platform: 'facebook' as const, status: 'not_configured' as const, message: 'Facebook is disconnected. Reconnect before publishing.' };
  try {
    const accounts = await graph('me/accounts?fields=id,name,access_token,tasks&limit=100', session.access_token);
    const pages = (accounts.data || []).filter((page: any) => /^\d+$/.test(page.id) && typeof page.access_token === 'string' && (!page.tasks || page.tasks.includes('CREATE_CONTENT') || page.tasks.includes('MANAGE')));
    const page = process.env.FACEBOOK_PAGE_ID ? pages.find((item: any) => item.id === process.env.FACEBOOK_PAGE_ID) : pages.length === 1 ? pages[0] : null;
    if (!page) return fail(pages.length > 1 ? 'Several Facebook Pages are available. Set FACEBOOK_PAGE_ID to the intended Page ID.' : 'Facebook did not grant publishing access to the requested Page. Reconnect and grant Page permissions.');
    if ((payload.mediaUrls?.length || 0) > 10) return fail('Facebook supports at most ten images per broadcast.');
    // Validate and download every image before uploading any of them.
    const images = await Promise.all((payload.mediaUrls || []).map(url => loadPublishingImage(url, 8000000)));
    const message = [payload.content?.trim(), ...(payload.tags || [])].filter(Boolean).join('\n');
    const form = new URLSearchParams({ message });
    for (const [index, image] of images.entries()) {
      const upload = new FormData();
      upload.set('published', 'false');
      upload.set('source', new Blob([new Uint8Array(image.bytes)], { type: image.mime }), `image-${index}.${image.mime.split('/')[1]}`);
      const photo = await graph(`${page.id}/photos`, page.access_token, upload);
      if (!photo.id) throw new Error('Facebook did not confirm the photo upload.');
      form.set(`attached_media[${index}]`, JSON.stringify({ media_fbid: photo.id }));
    }
    const result = await graph(`${page.id}/feed`, page.access_token, form);
    if (!result.id) throw new Error('Facebook did not confirm publication. Check the Page before retrying.');
    return { platform: 'facebook' as const, status: 'published' as const, message: `Published to Facebook Page ${page.name}.`, remoteId: result.id };
  } catch (error) { return fail((error as Error).message); }
}
