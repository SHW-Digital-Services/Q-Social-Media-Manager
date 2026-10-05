import type { Express, Request } from 'express';
import { getBlueskySession } from './bluesky.js';
import { getSocialSession } from './socialSessions.js';
import type { PostItem, SocialPlatform } from '../src/types.js';

async function read(url: string, token?: string) {
  const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(20000), redirect: 'error' });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error('Account posts could not be read. Check the connection and Page read permissions.');
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
  if (!session) return [];
  const graph = 'https://graph.facebook.com/v26.0';
  const accounts = await read(`${graph}/me/accounts?fields=id,name,access_token&limit=100`, session.access_token);
  const pages = accounts.data || [];
  const page = process.env.FACEBOOK_PAGE_ID ? pages.find((p: any) => p.id === process.env.FACEBOOK_PAGE_ID) : pages.length === 1 ? pages[0] : null;
  if (!page) throw new Error('Select the Facebook Page using FACEBOOK_PAGE_ID before syncing posts.');
  const [published, scheduled] = await Promise.all([
    read(`${graph}/${page.id}/published_posts?fields=id,message,created_time,reactions.limit(0).summary(true),comments.limit(0).summary(true),shares&limit=100`, page.access_token),
    read(`${graph}/${page.id}/scheduled_posts?fields=id,message,scheduled_publish_time&limit=100`, page.access_token),
  ]);
  return [
    ...(published.data || []).map((p: any) => platformPost('facebook', p.id, p.message || '', p.created_time, page.name, { likes: p.reactions?.summary?.total_count || 0, comments: p.comments?.summary?.total_count || 0, shares: p.shares?.count || 0 })),
    ...(scheduled.data || []).map((p: any) => platformPost('facebook', p.id, p.message || '', new Date(p.scheduled_publish_time * 1000).toISOString(), page.name, undefined, true)),
  ];
}
export function registerSocialPostRoutes(app: Express) {
  app.get('/api/social/posts', async (req, res) => {
    const results = await Promise.allSettled([readBlueskyPosts(req), readFacebookPosts(req)]);
    res.set('Cache-Control', 'no-store').json({ posts: results.flatMap(result => result.status === 'fulfilled' ? result.value : []), errors: results.flatMap((result, i) => result.status === 'rejected' ? [`${i === 0 ? 'Bluesky' : 'Facebook'}: ${result.reason.message}`] : []), coverage: 'Latest 100 posts per connected account; reach and saves are unavailable.' });
  });
}
