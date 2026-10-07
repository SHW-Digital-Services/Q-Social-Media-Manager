import type { PostItem } from '../types';

export function currentCalendarPosts(posts: PostItem[]): PostItem[] {
  const latestById = new Map<string, PostItem>();
  for (const post of posts) {
    const existing = latestById.get(post.id);
    const revision = post.revision || 0;
    const existingRevision = existing?.revision || 0;
    if (!existing || revision > existingRevision || (revision === existingRevision && Date.parse(post.lastModified) > Date.parse(existing.lastModified))) {
      latestById.set(post.id, post);
    }
  }
  return Array.from(latestById.values());
}
