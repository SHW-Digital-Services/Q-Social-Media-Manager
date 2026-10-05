import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

test('Removed providers are rejected and Q website publishing works through manager routes', async () => {
  process.env.VERCEL = '1'; process.env.APP_URL = 'https://social.q-ai.online';
  process.env.SOCIAL_SESSION_SECRET = 'synthetic-test-secret-at-least-32-characters';
  process.env.LINKEDIN_CLIENT_ID = 'test-client'; process.env.LINKEDIN_CLIENT_SECRET = 'test-client-secret'; process.env.LINKEDIN_VERSION = '202609';
  const { providerTestApp } = await import('./testApp.js');
  const handler=await providerTestApp();
  const actualFetch = globalThis.fetch;
  const calls: { url: string; body: any; headers: any }[] = [];
  let rejectProfile = false, rejectWebsite = false, failImage = false, failPublish = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body;
    calls.push({ url, body, headers: init?.headers });
    if (url.includes('/oauth/v2/accessToken')) return Response.json({ access_token: 'private-linkedin-token', expires_in: 5184000 });
    if (url.endsWith('/v2/userinfo')) return rejectProfile ? Response.json({ error: 'invalid' }, { status: 401 }) : Response.json({ sub: 'person-123', name: 'Test Profile' });
    if (url.endsWith('publisher/status')) return rejectWebsite ? Response.json({ error: 'revoked' }, { status: 403 }) : Response.json({ authorised: true, client: { id: 'client-1', name: 'Social Manager' } });
    if (url.includes('initializeUpload')) return Response.json({ value: { uploadUrl: 'https://www.linkedin.com/dms-uploads/test', image: 'urn:li:image:123' } });
    if (url.includes('/dms-uploads/')) return new Response('', { status: failImage ? 400 : 201 });
    if (url.includes('/rest/images/')) return Response.json({ status: 'AVAILABLE' });
    if (url.endsWith('/rest/posts')) return new Response('', { status: failPublish ? 403 : 201, headers: { 'x-restli-id': 'urn:li:share:123' } });
    if (url.endsWith('/api/content/media')) return Response.json({ url: 'https://brnhalxydcakutxiregp.supabase.co/storage/v1/object/public/content-media/test.png' }, { status: 201 });
    if (url.endsWith('/api/content/publish')) return Response.json({ post: { id: 'news-123', slug: body.slug, published_at: new Date().toISOString() } }, { status: 201 });
    throw new Error(`Unexpected remote call: ${url}`);
  };
  const server = http.createServer(handler as unknown as http.RequestListener);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  let cookie = '';
  async function request(path: string, body?: any, origin = process.env.APP_URL!) {
    const response = await actualFetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, Origin: origin, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
    return { response, data: response.status === 302 ? null : await response.json() };
  }
  const publish = (platform: string, mediaUrls: string[] = [], content = 'A public news story from the Q Social Media Manager.') => request('/api/publish/broadcast', { postId: 'stable-post', title: 'Q website announcement', content, tags: ['#community'], platforms: [platform], mediaUrls });
  try {
    const status = await request('/api/social/status');
    assert.equal(status.data.platforms.some((p: any) => p.platform === 'instagram'), false);
    assert.equal((await request('/api/oauth/instagram/start-url')).response.status, 400);
    assert.equal((await publish('instagram')).response.status, 400);
    for (const platform of ['linkedin', 'tiktok', 'twitter', 'x']) {
      assert.equal((await request(`/api/oauth/${platform}/start-url`)).response.status, 400);
      assert.equal((await publish(platform)).response.status, 400);
    }
    cookie = '';
    assert.equal((await publish('website')).data.results[0].status, 'not_configured');
    const token = 'qcp_' + 'a'.repeat(43);
    rejectWebsite = true; assert.equal((await request('/api/website/connect', { token })).response.status, 400);
    rejectWebsite = false;
    const connected = await request('/api/website/connect', { token });
    assert.equal(connected.response.status, 200);
    cookie = connected.response.headers.getSetCookie()[0].split(';')[0];
    assert.equal(cookie.includes(token), false);
    assert.equal((await request('/api/website/check', {})).response.status, 200);
    assert.equal((await publish('website', ['https://images.unsplash.com/test.png'])).data.success, true);
    const news = calls.filter(c => c.url.endsWith('/api/content/publish')).at(-1)!.body;
    assert.equal(news.publish, true); assert.equal(news.contentType, 'news'); assert.equal(news.heroImageUrl, 'https://images.unsplash.com/test.png'); assert.deepEqual(news.tags, ['community']);
    assert.equal((await publish('website', [], 'Too short')).data.results[0].status, 'failed');
    assert.equal((await publish('website', ['data:image/png;base64,dGVzdA=='])).data.success, true);
    assert.match(calls.filter(c => c.url.endsWith('/api/content/publish')).at(-1)!.body.heroImageUrl, /content-media/);
    assert.equal((await request('/api/website/connect', { token }, 'https://attacker.example')).response.status, 403);
    rejectWebsite = true; assert.equal((await request('/api/website/check', {})).response.status, 401);
    assert.equal((await request('/api/social/website/disconnect', {})).response.status, 200);
  } finally { globalThis.fetch = actualFetch; await new Promise<void>(resolve => server.close(() => resolve())); }
});
