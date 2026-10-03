import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publishFacebook } from './facebook.js';
import { saveSocialSession } from './socialSessions.js';

test('Facebook resolves Page tokens, uploads images and refuses ambiguous Pages', async () => {
  process.env.SOCIAL_SESSION_SECRET = 'synthetic-facebook-secret-at-least-32-characters';
  delete process.env.FACEBOOK_PAGE_ID;
  let cookie = '';
  saveSocialSession({ cookie: (name: string, value: string) => { cookie = `${name}=${value}`; } } as any, 'facebook', { access_token: 'user-token', expires_in: 3600 });
  const req = { headers: { cookie } } as any;
  const realFetch = globalThis.fetch;
  let multiple = false, reject = false, uploads = 0, posts = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes('me/accounts')) return Response.json({ data: [{ id: '123', name: 'Q Page', access_token: 'page-token', tasks: ['CREATE_CONTENT'] }, ...(multiple ? [{ id: '456', access_token: 'other-token' }] : [])] });
    assert.equal((init!.headers as any).Authorization, 'Bearer page-token');
    if (url.endsWith('/photos')) { uploads++; assert.ok(init!.body instanceof FormData); return Response.json({ id: 'photo-123' }); }
    if (url.endsWith('/feed')) {
      posts++;
      assert.ok(init!.body instanceof URLSearchParams);
      assert.equal(init!.body.get('attached_media[0]'), JSON.stringify({ media_fbid: 'photo-123' }));
      return reject ? Response.json({ error: { message: 'Missing Page permission' } }, { status: 403 }) : Response.json({ id: '123_post' });
    }
    throw new Error('Unexpected request');
  };
  try {
    const payload = { content: 'Hello', mediaUrls: ['data:image/png;base64,dGVzdA=='] };
    assert.equal((await publishFacebook(req, payload)).status, 'published');
    multiple = true;
    assert.match((await publishFacebook(req, payload)).message, /FACEBOOK_PAGE_ID/);
    assert.equal(uploads, 1); assert.equal(posts, 1);
    process.env.FACEBOOK_PAGE_ID = '123'; reject = true;
    assert.match((await publishFacebook(req, payload)).message, /Missing Page permission/);
  } finally { globalThis.fetch = realFetch; delete process.env.FACEBOOK_PAGE_ID; }
});
