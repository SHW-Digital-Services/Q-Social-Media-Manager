import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { getSocialSession, saveSocialSession } from './socialSessions.js';

test('social logins survive a fresh process and validate state, expiry and disconnect', async () => {
  process.env.VERCEL = '1';
  process.env.APP_URL = 'https://social.q-ai.online';
  process.env.SOCIAL_SESSION_SECRET = 'synthetic-test-encryption-secret-over-32-characters';
  process.env.META_APP_ID = 'test-app'; process.env.META_APP_SECRET = 'test-secret';
  const { default: handler } = await import('../server.js');
  const actualFetch = globalThis.fetch;
  const calls: string[] = [];
  let failLongToken = false;
  globalThis.fetch = async input => {
    const url = String(input); calls.push(url);
    if (url.includes('grant_type=fb_exchange_token')) {
      return failLongToken ? Response.json({ error: 'invalid' }, { status: 400 }) : Response.json({ access_token: 'private-long-lived-token', expires_in: 5184000 });
    }
    return Response.json({ access_token: 'private-short-lived-token', expires_in: 3600 });
  };
  const server = http.createServer(handler as unknown as http.RequestListener);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const headers = (cookie = '', origin = process.env.APP_URL!) => ({ Cookie: cookie, Origin: origin });
  const metadata = (response: Response) => response.json();
  try {
    for (const platform of ['facebook']) {
      const start = await actualFetch(`${base}/api/oauth/${platform}/start-url`);
      assert.equal(start.status, 200);
      const state = new URL((await start.json()).authUrl).searchParams.get('state');
      const stateCookie = start.headers.getSetCookie()[0].split(';')[0];
      const callCount = calls.length;
      const invalid = await actualFetch(`${base}/api/oauth/${platform}/callback?code=test&state=wrong`, { headers: headers(stateCookie), redirect: 'manual' });
      assert.equal(invalid.status, 400); assert.equal(calls.length, callCount);
      const missing = await actualFetch(`${base}/api/oauth/${platform}/callback?code=test&state=${state}`, { redirect: 'manual' });
      assert.equal(missing.status, 400);
      const callback = await actualFetch(`${base}/api/oauth/${platform}/callback?code=test&state=${state}`, { headers: headers(stateCookie), redirect: 'manual' });
      assert.equal(callback.status, 302);
      const savedCookie = callback.headers.getSetCookie().find(value => value.startsWith(`q_social_${platform}=`))!;
      assert.match(savedCookie, /HttpOnly/); assert.match(savedCookie, /Secure/); assert.match(savedCookie, /SameSite=Lax/i); assert.match(savedCookie, /Max-Age=5184000/);
      assert.equal(savedCookie.includes('private-long-lived-token'), false);
      const cookie = savedCookie.split(';')[0];
      const statusResponse = await actualFetch(base + '/api/social/status', { headers: headers(cookie) });
      assert.equal(statusResponse.headers.get('cache-control'), 'no-store');
      const status = await metadata(statusResponse);
      assert.equal(status.platforms.find((p: any) => p.platform === platform).hasStoredToken, true);
      assert.equal(JSON.stringify(status).includes('private-long-lived-token'), false);
      const isolated = await metadata(await actualFetch(base + '/api/social/status'));
      assert.equal(isolated.platforms.find((p: any) => p.platform === platform).hasStoredToken, false);
      const fresh = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', "import { getSocialSession } from './server/socialSessions.ts'; const saved=getSocialSession({headers:{cookie:process.env.TEST_COOKIE}},process.env.TEST_PLATFORM); console.log(JSON.stringify({connected:!!saved}));"], { cwd: process.cwd(), env: { ...process.env, TEST_COOKIE: cookie, TEST_PLATFORM: platform }, encoding: 'utf8' });
      assert.equal(fresh.status, 0, fresh.stderr); assert.equal(JSON.parse(fresh.stdout).connected, true);
      assert.equal(getSocialSession({ headers: { cookie: cookie + 'tampered' } } as any, platform), null);
      const denied = await actualFetch(`${base}/api/social/${platform}/disconnect`, { method: 'POST', headers: headers(cookie, 'https://attacker.example') });
      assert.equal(denied.status, 403);
      const disconnected = await actualFetch(`${base}/api/social/${platform}/disconnect`, { method: 'POST', headers: headers(cookie) });
      assert.equal(disconnected.status, 200);
      assert.match(disconnected.headers.get('set-cookie')!, /Expires=Thu, 01 Jan 1970/);
      assert.ok(calls.some(url => url.includes('fb_exchange_token')));
    }
    // Provider expiry must not be disguised as a persistent healthy login.
    let saved = '';
    const response = { cookie: (name: string, value: string) => { saved = `${name}=${value}`; } } as any;
    const session = saveSocialSession(response, 'linkedin', { access_token: 'test', expires_in: 1 });
    assert.ok(getSocialSession({ headers: { cookie: saved } } as any, 'linkedin'));
    const originalNow = Date.now;
    try { Date.now = () => session.expiresAt + 1; assert.equal(getSocialSession({ headers: { cookie: saved } } as any, 'linkedin'), null); }
    finally { Date.now = originalNow; }
    failLongToken = true;
    const start = await actualFetch(base + '/api/oauth/facebook/start-url');
    const state = new URL((await start.json()).authUrl).searchParams.get('state');
    const failed = await actualFetch(`${base}/api/oauth/facebook/callback?code=test&state=${state}`, { headers: headers(start.headers.getSetCookie()[0].split(';')[0]), redirect: 'manual' });
    assert.equal(failed.status, 400);
    assert.equal(failed.headers.getSetCookie().some(value => value.startsWith('q_social_facebook=')), false);
  } finally {
    globalThis.fetch = actualFetch;
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
