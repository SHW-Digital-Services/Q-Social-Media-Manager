import type { Express, Request } from 'express';
import { getBlueskySession } from './bluesky.js';
import { getSocialSession } from './socialSessions.js';
import type { PostItem, SocialPlatform } from '../src/types.js';

async function read(url: string, token?: string) {
  const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(20000), redirect: 'error' });
  const data = await response.json();
  if (!response.ok || data.error) {
    const code = data.error?.code;
    const detail = String(data.error?.message || `Request failed (${response.status})`).replace(/access_token=[^ &]+/gi, 'access_token=[redacted]').slice(0,500);
    throw new Error(code === 190 ? 'Facebook login expired or was revoked. Reconnect Facebook.' : `${detail}${code ? ` (Facebook code ${code})` : ''}`);
  }
  return data;
}
export function platformPost(platform: SocialPlatform, id: string, content: string, date: string, name: string, engagement?: PostItem['engagement'], scheduled = false): PostItem {
  return {
    id: `remote-${platform}-${id}`, remoteIds: [id], source: 'platform', title: content.slice(0, 80) || `${platform} post`, content,
    platforms: [platform], status: scheduled ? 'scheduled' : 'published', scheduledFor: scheduled ? date : null,
    publishedAt: scheduled ? null : date, lastModified: date, author: { name, role: 'Connected account', avatar: '' },
    mediaUrls: [], tags: content.match(/#[\p{L}\p{N}_]+/gu) || [], comments: [], piiShieldVerified: false, engagement,
    complianceAudit: { score: 0, status: 'needs_review', summary: 'Imported platform post; no local audit has been run.', flags: [], scannedAt: '', breakdown: { welcoming: 0, affirming: 0, clarity: 0, privacySafe: 0, nonPresumptive: 0 } },
  };
}
export async function readBlueskyPosts(req: Request) {
  const session = getBlueskySession(req);
  if (!session) return [];
  const data = await read(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(session.did)}&limit=100&filter=posts_no_replies`);
  return (data.feed || []).filter((item: any) => item.post?.author?.did === session.did && !item.reason).map(({ post }: any) =>
    platformPost('bluesky', post.uri, post.record.text || '', post.record.createdAt, session.handle, { likes: post.likeCount || 0, comments: post.replyCount || 0, shares: (post.repostCount || 0) + (post.quoteCount || 0) }));
}
export async function readFacebookPosts(req: Request) {
  const session = getSocialSession(req, 'facebook');
  if (!session) { if(req.headers.cookie?.includes('q_social_facebook=')) throw new Error('Facebook session expired or cannot be decrypted. Reconnect Facebook.'); return []; }
  const graph = 'https://graph.facebook.com/v26.0';
  const accounts = await read(`${graph}/me/accounts?fields=id,name,access_token&limit=100`, session.access_token);
  const pages = accounts.data || [];
  const page = (process.env.FACEBOOK_PAGE_ID || process.env.META_FACEBOOK_PAGE_ID) ? pages.find((p: any) => p.id === (process.env.FACEBOOK_PAGE_ID || process.env.META_FACEBOOK_PAGE_ID)) : pages.length === 1 ? pages[0] : null;
  if (!pages.length) throw new Error('No Facebook Pages were granted to this login. Reconnect Facebook, grant pages_show_list and pages_read_engagement, and select the Page you manage.');
  if (!page) throw new Error((process.env.FACEBOOK_PAGE_ID || process.env.META_FACEBOOK_PAGE_ID) ? 'The configured Facebook Page was not granted to this login. Reconnect and select that Page.' : 'Multiple Facebook Pages are connected. Set FACEBOOK_PAGE_ID to the Page to sync.');
  const warnings: string[] = [];
  let measured = true;
  let published: any;
  try {
    published = await read(`${graph}/${page.id}/published_posts?fields=id,message,created_time,reactions.limit(0).summary(true),comments.limit(0).summary(true),shares&limit=100`, page.access_token);
  } catch (error) {
    measured = false;
    warnings.push(`Facebook interaction counts are unavailable: ${(error as Error).message} Reconnect and grant pages_read_engagement.`);
    published = await read(`${graph}/${page.id}/published_posts?fields=id,message,created_time&limit=100`, page.access_token);
  }
  let scheduled: any = { data: [] };
  try { scheduled = await read(`${graph}/${page.id}/scheduled_posts?fields=id,message,scheduled_publish_time&limit=100`, page.access_token); }
  catch(error) { warnings.push(`Facebook scheduled posts could not be read: ${(error as Error).message}`); }
  const posts = [
    ...(published.data || []).map((p: any) => platformPost('facebook', p.id, p.message || '', p.created_time, page.name, measured ? { likes: p.reactions?.summary?.total_count || 0, comments: p.comments?.summary?.total_count || 0, shares: p.shares?.count || 0 } : undefined)),
    ...(scheduled.data || []).map((p: any) => platformPost('facebook', p.id, p.message || '', new Date(p.scheduled_publish_time * 1000).toISOString(), page.name, undefined, true)),
  ] as PostItem[] & { warnings?: string[] };
  posts.warnings = warnings;
  return posts;
}
export function registerSocialPostRoutes(app: Express) {
  app.get('/api/social/posts', async (req, res) => {
    const results = await Promise.allSettled([readBlueskyPosts(req), readFacebookPosts(req)]);
    res.set('Cache-Control', 'no-store').json({ posts: results.flatMap(result => result.status === 'fulfilled' ? result.value : []), errors: results.flatMap((result, i) => result.status === 'rejected' ? [`${i === 0 ? 'Bluesky' : 'Facebook'}: ${result.reason.message}`] : ((result.value as PostItem[] & { warnings?: string[] }).warnings || [])), coverage: 'Latest 100 posts per connected account; reach and saves are unavailable.' });
  });
}
