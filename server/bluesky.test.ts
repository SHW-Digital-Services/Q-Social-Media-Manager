import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// Exercise real Express routes without contacting or posting to a live account.
test('Bluesky connection, encryption, refresh, publishing and disconnect', async () => {
  process.env.VERCEL = '1';
  process.env.APP_URL = 'https://social.q-ai.online';
  process.env.BLUESKY_SESSION_SECRET = 'test-secret-at-least-32-characters-long';
  const { default: handler } = await import('../server.js');
  const actualFetch = globalThis.fetch;
  const calls: { url: string; body: any }[] = [];
  let failLogin = false;
  let failUpload = false;
  let staleToken = false;
  let evilService = false;
  const jwt = (exp: number) => `test.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.test`;
  const did = 'did:plc:test-account';
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body;
    calls.push({ url, body });
    if (url.endsWith('createSession')) {
      if (failLogin) return new Response(JSON.stringify({ error: 'AuthenticationRequired' }), { status: 401 });
      return Response.json({ did, handle: 'test.bsky.social', accessJwt: jwt(staleToken ? 0 : Date.now() / 1000 + 3600), refreshJwt: 'private-refresh-token', didDoc: { service: [{ type: 'AtprotoPersonalDataServer', serviceEndpoint: evilService ? 'http://127.0.0.1' : 'https://test.host.bsky.network' }] } });
    }
    if (url.endsWith('refreshSession')) return Response.json({ did, accessJwt: jwt(Date.now() / 1000 + 3600), refreshJwt: 'rotated-private-token' });
    if (url.endsWith('getSession')) return Response.json({ did, handle: 'test.bsky.social' });
    if (url.endsWith('uploadBlob')) return failUpload ? Response.json({ error: 'InvalidBlob' }, { status: 400 }) : Response.json({ blob: { $type: 'blob', ref: { $link: 'image-cid' }, mimeType: 'image/png', size: 4 } });
    if (url.endsWith('createRecord')) return Response.json({ uri: `at://${did}/app.bsky.feed.post/record`, cid: 'post-cid' });
    throw new Error(`Unexpected remote call: ${url}`);
  };
  const server = http.createServer(handler as unknown as http.RequestListener);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  let cookie = '';
  async function request(path: string, body?: unknown, origin = process.env.APP_URL, useCookie = true) {
    const response = await actualFetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin!, ...(useCookie && cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { response, data: await response.json() };
  }
  const login = { handle: 'test.bsky.social', appPassword: 'aaaa-bbbb-cccc-dddd' };
  const publish = (content = 'Hello Bluesky', mediaUrls: string[] = []) => request('/api/publish/broadcast', { content, mediaUrls, platforms: ['bluesky'] });
  try {
    assert.equal((await publish()).data.results[0].status, 'failed');
    assert.equal((await request('/api/bluesky/connect', login, 'https://attacker.example')).response.status, 403);
    assert.equal((await request('/api/bluesky/connect', { ...login, appPassword: 'regular-password' })).response.status, 400);
    failLogin = true;
    assert.equal((await request('/api/bluesky/connect', login)).response.status, 400);
    failLogin = false; evilService = true;
    assert.equal((await request('/api/bluesky/connect', login)).response.status, 400);
    evilService = false; staleToken = true;
    const connected = await request('/api/bluesky/connect', login);
    assert.equal(connected.response.status, 200);
    assert.equal(connected.data.handle, 'test.bsky.social');
    assert.equal(JSON.stringify(connected.data).includes('Jwt'), false);
    const setCookie = connected.response.headers.get('set-cookie')!;
    assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /Secure/); assert.match(setCookie, /SameSite=Strict/i);
    assert.equal(setCookie.includes('private-refresh-token'), false);
    assert.equal(setCookie.includes(login.appPassword), false);
    cookie = setCookie.split(';')[0];
    assert.equal((await request('/api/bluesky/status')).data.connected, true);
    assert.equal((await request('/api/bluesky/status', undefined, undefined, false)).data.connected, false);
    const originalCookie = cookie; cookie += 'tampered';
    assert.equal((await request('/api/bluesky/status')).data.connected, false); cookie = originalCookie;
    const checked = await request('/api/bluesky/check', {});
    assert.equal(checked.response.status, 200);
    assert.ok(calls.some(c => c.url.endsWith('refreshSession')));
    cookie = checked.response.headers.get('set-cookie')!.split(';')[0];
    assert.equal((await publish('a'.repeat(301))).data.results[0].status, 'failed');
    assert.equal((await publish('Hello', Array(5).fill('data:image/png;base64,dGVzdA=='))).data.results[0].status, 'failed');
    assert.equal((await publish('Hello', ['http://127.0.0.1/private'])).data.results[0].status, 'failed');
    failUpload = true;
    const before = calls.filter(c => c.url.endsWith('createRecord')).length;
    assert.equal((await publish('Hello', ['data:image/png;base64,dGVzdA=='])).data.results[0].status, 'failed');
    assert.equal(calls.filter(c => c.url.endsWith('createRecord')).length, before);
    failUpload = false;
    const published = await publish('Hello', ['data:image/png;base64,dGVzdA==']);
    assert.equal(published.data.success, true);
    const record = calls.filter(c => c.url.endsWith('createRecord')).at(-1)!.body;
    assert.equal(record.repo, did);
    assert.equal(record.record.embed.images.length, 1);
    assert.equal(record.record.text, 'Hello');
    assert.ok(published.data.results[0].remoteId.startsWith('at://'));
    assert.equal((await request('/api/bluesky/disconnect', {})).data.connected, false);
    cookie = '';
    assert.equal((await request('/api/bluesky/status')).data.connected, false);
    delete process.env.BLUESKY_SESSION_SECRET;
    assert.equal((await request('/api/bluesky/connect', login)).response.status, 503);
  } finally {
    globalThis.fetch = actualFetch;
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
