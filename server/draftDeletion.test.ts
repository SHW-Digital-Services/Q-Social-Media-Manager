import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { registerPostRoutes } from './posts.js';

test('draft deletion checks status and revision, preserves delivery history, and handles storage errors', async () => {
  process.env.SUPABASE_URL = 'https://draft-deletion-test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-test-key';
  const originalFetch = globalThis.fetch;
  let status = 'draft';
  let jobs: any[] = [];
  let deletedRows: any[] = [{ id: 'draft-test' }];
  let storageFails = false;
  let deletes = 0;
  const app = express();
  app.use(express.json());
  registerPostRoutes(app);
  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.origin === base) return originalFetch(input, init);
    assert.equal(url.hostname, 'draft-deletion-test.supabase.co');
    if (init?.method === 'DELETE') {
      deletes++;
      assert.equal(url.searchParams.get('id'), 'eq.draft-test');
      assert.equal(url.searchParams.get('revision'), 'eq.2');
      assert.equal(url.searchParams.get('data->>status'), 'eq.draft');
      if (storageFails) return Response.json({ code: 'XX000', message: 'Synthetic failure' }, { status: 500 });
      return Response.json(deletedRows);
    }
    if (url.pathname.endsWith('social_manager_jobs')) return Response.json(jobs);
    return Response.json([{ id: 'draft-test', revision: 2, data: { id: 'draft-test', status }, updated_at: '2026-10-05T10:00:00Z' }]);
  };
  const remove = (revision: number) => fetch(`${base}/api/posts/draft-test`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: revision }),
  });
  try {
    assert.equal((await remove(0)).status, 400);
    assert.equal((await remove(1)).status, 409);
    for (status of ['pending_approval', 'approved', 'scheduled', 'published']) assert.equal((await remove(2)).status, 409);
    status = 'draft';
    jobs = [{ post_id: 'draft-test', state: 'cancelled', platform: 'facebook' }];
    assert.equal((await remove(2)).status, 409);
    assert.equal(deletes, 0);
    jobs = [];
    const removed = await remove(2);
    assert.equal(removed.status, 200);
    assert.deepEqual(await removed.json(), { deleted: true, id: 'draft-test' });
    deletedRows = [];
    assert.equal((await remove(2)).status, 409);
    storageFails = true;
    assert.equal((await remove(2)).status, 503);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
