import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

test('rewrite recovers from AI failure and broadcast explains disconnected channels', async () => {
  process.env.VERCEL = '1';
  process.env.GEMINI_API_KEY = 'synthetic-invalid-key';
  const { providerTestApp } = await import('./testApp.js');
  const handler=await providerTestApp();
  const server = http.createServer(handler as unknown as http.RequestListener);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  process.env.APP_URL = base;
  const actualFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith(base)) return actualFetch(input, init);
    return Response.json({ error: { code: 403, message: 'Synthetic provider failure', status: 'PERMISSION_DENIED' } }, { status: 403 });
  };
  try {
    const post = (path: string, body: unknown) => actualFetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify(body) });
    const rewrite = await post('/api/compliance/rewrite', { text: 'You must reflect.' });
    assert.equal(rewrite.status, 200);
    const data = await rewrite.json();
    assert.equal(data.source, 'local_preset');
    assert.equal(data.degraded, true);
    assert.match(data.rewrittenText, /welcome to reflect/);
    assert.equal((await post('/api/compliance/rewrite', { text: 123 })).status, 400);
    const broadcast = await post('/api/publish/broadcast', { content: 'Test draft', platforms: ['facebook'] });
    assert.equal(broadcast.status, 409);
    const result = await broadcast.json();
    assert.equal(result.success, false);
    assert.match(result.results[0].message, /disconnected/);
  } finally {
    globalThis.fetch = actualFetch;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
