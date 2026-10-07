import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { PostItem } from '../src/types.js';
import { currentCalendarPosts } from '../src/utils/calendarPosts.js';

test('approved revision supersedes its draft before calendar status filtering, regardless of input order or draft timestamp', () => {
  const draft = { id: 'post', revision: 1, status: 'draft', lastModified: '2026-10-07T12:00:00Z', scheduledFor: '2026-10-08T12:00:00Z' } as PostItem;
  const approved = { ...draft, revision: 2, status: 'approved', lastModified: '2026-10-07T11:00:00Z' } as PostItem;
  const unrelated = { ...draft, id: 'other' };
  for (const posts of [[draft, approved, unrelated], [approved, draft, unrelated]]) {
    const current = currentCalendarPosts(posts);
    assert.equal(current.find(post => post.id === draft.id), approved);
    assert.deepEqual(current.filter(post => post.status === 'draft'), [unrelated]);
  }
  const updated = { ...approved, status: 'scheduled', lastModified: '2026-10-07T13:00:00Z' } as PostItem;
  assert.deepEqual(currentCalendarPosts([updated, approved]), [updated]);
});
