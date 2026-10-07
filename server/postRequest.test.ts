import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postRequest } from '../src/utils/postRequest.js';
import { nextPost } from './posts.js';
import { staffIdentity } from './staffAuth.js';

test('image-heavy posts can be approved and reviewed without resending saved media', () => {
  const lead = staffIdentity({ id: 'lead', email: 'scott@q-ai.online', email_confirmed_at: '2026-01-01' })!;
  const image = 'data:image/png;base64,' + 'A'.repeat(2_000_000);
  const pending = nextPost(null, { title: 'Review', content: 'A community update.', platforms: ['facebook'], mediaUrls: [image], tags: [] }, 'submit', lead, 'post');
  pending.versionHistory = Array(3).fill(pending.versionHistory![0]);
  assert.ok(Buffer.byteLength(JSON.stringify(pending)) > 4_500_000);
  const request = postRequest(pending, 'approve', 4);
  assert.ok(Buffer.byteLength(JSON.stringify(request)) < 100);
  assert.equal(request.expectedRevision, 4);
  const approved = nextPost(pending, request.data, request.action, lead, pending.id);
  assert.equal(approved.status, 'approved');
  assert.deepEqual(approved.mediaUrls, [image]);
  const review = postRequest({ ...pending, feedback: 'Please revise the title.' }, 'changes', 4);
  assert.deepEqual(review.data, { feedback: 'Please revise the title.' });
  assert.equal(nextPost(pending, review.data, review.action, lead, pending.id).comments.at(-1)?.content, review.data.feedback);
  const edit = postRequest(pending, 'submit', 4);
  assert.equal(edit.data.versionHistory, undefined);
  assert.deepEqual(edit.data.mediaUrls, pending.mediaUrls);
  assert.equal(nextPost(pending, edit.data, edit.action, lead, pending.id).versionHistory?.length, 4);
});
