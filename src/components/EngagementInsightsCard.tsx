import React, { useState } from 'react';
import type { PostItem } from '../types';
interface Props { posts: PostItem[]; error?: string; onInsertTagIntoComposer?: (tag: string) => void; className?: string; defaultExpanded?: boolean; }
export const EngagementInsightsCard: React.FC<Props> = ({ posts, error, onInsertTagIntoComposer, className = '', defaultExpanded = true }) => {
  const [days, setDays] = useState(30);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const measured = posts.filter(p => p.status === 'published' && p.engagement && p.publishedAt && new Date(p.publishedAt).getTime() >= Date.now() - days * 86400000);
  const totals = measured.reduce((sum, p) => ({ likes: sum.likes + p.engagement!.likes, comments: sum.comments + p.engagement!.comments, shares: sum.shares + p.engagement!.shares }), { likes: 0, comments: 0, shares: 0 });
  const tags = new Map<string, number>();
  measured.forEach(p => new Set(p.tags).forEach(tag => tags.set(tag, (tags.get(tag) || 0) + p.engagement!.likes + p.engagement!.comments + p.engagement!.shares)));
  return <section className={`bg-white rounded-3xl border border-slate-200 p-6 space-y-4 ${className}`}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button className="text-lg font-bold text-slate-900 cursor-pointer" onClick={() => setExpanded(!expanded)}>Social Engagement Insights {expanded ? '−' : '+'}</button>
      <div className="flex gap-2">{[7, 30, 90].map(value => <button key={value} onClick={() => setDays(value)} className={`px-3 py-1 rounded-full text-xs cursor-pointer ${days === value ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{value} days</button>)}</div>
    </div>
    {expanded && <>
      <p className="text-sm text-slate-600">Platform counts for posts published in the selected period. Synced every minute from connected Facebook and Bluesky accounts; latest 100 posts per account.</p>
      {error && <p role="alert" className="text-sm text-amber-800">{error}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[['Measured posts', measured.length], ['Likes / reactions', totals.likes], ['Comments / replies', totals.comments], ['Shares / reposts', totals.shares]].map(([label, value]) => <div key={label} className="rounded-2xl bg-purple-50 p-4"><p className="text-xs text-slate-600">{label}</p><p className="text-2xl font-bold text-purple-950">{measured.length ? value.toLocaleString() : '—'}</p></div>)}</div>
      {!measured.length && <p className="text-sm text-slate-600">No measured platform posts in this period. Connect an account or select a longer period.</p>}
      <p className="text-xs text-slate-500">Reach, impressions, saves and engagement rate are unavailable from these post reads.</p>
      {tags.size > 0 && <div><p className="text-sm font-semibold mb-2">Hashtags by interactions</p><div className="flex flex-wrap gap-2">{[...tags].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => <button key={tag} className="text-xs bg-purple-50 text-purple-800 rounded-full px-3 py-2" onClick={() => onInsertTagIntoComposer?.(tag)}>{tag} · {count}</button>)}</div></div>}
    </>}
  </section>;
};
