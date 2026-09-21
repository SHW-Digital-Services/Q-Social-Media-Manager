import React, { useState } from 'react';
import { 
  TrendingUp, 
  Tag, 
  BarChart3, 
  Flame, 
  ArrowUpRight, 
  Share2, 
  Bookmark, 
  Copy, 
  Check, 
  Layers, 
  Calendar, 
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import { 
  MOCK_ENGAGEMENT_SUMMARY, 
  MOCK_TOP_TAGS, 
  MOCK_CAMPAIGN_TRENDS 
} from '../data/insightsData';
import { TagPerformanceItem, CampaignTrendItem } from '../types';

interface EngagementInsightsCardProps {
  onInsertTagIntoComposer?: (tag: string) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export const EngagementInsightsCard: React.FC<EngagementInsightsCardProps> = ({
  onInsertTagIntoComposer,
  className = '',
  defaultExpanded = true,
}) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'q3'>('30d');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'tags' | 'campaigns'>('overview');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [selectedTagCategory, setSelectedTagCategory] = useState<string>('all');

  const handleCopyTag = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const filteredTags = selectedTagCategory === 'all' 
    ? MOCK_TOP_TAGS 
    : MOCK_TOP_TAGS.filter(t => t.category === selectedTagCategory);

  // Multipliers based on timeframe
  const multiplier = timeframe === '7d' ? 0.35 : timeframe === 'q3' ? 2.4 : 1.0;
  const summaryImpressions = Math.round(MOCK_ENGAGEMENT_SUMMARY.totalImpressions * multiplier);
  const summarySaves = Math.round(MOCK_ENGAGEMENT_SUMMARY.savesTotal * multiplier);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden transition-all duration-300 ${className}`}>
      
      {/* Top Header & Toggle */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-50/70 via-white to-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs shadow-purple-600/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                <Sparkles className="w-3 h-3 text-purple-600" />
                Live Brand Analytics
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Updated 15 mins ago</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight mt-0.5">
              Engagement Insights & Campaign Reach
            </h3>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Real-time cross-platform metrics tracking community resonance, high-performing hashtag discovery, and campaign trajectory.
            </p>
          </div>
        </div>

        {/* Action Controls & Collapse */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-medium">
            {(['7d', '30d', 'q3'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  timeframe === tf 
                    ? 'bg-white text-purple-900 font-bold shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : 'Q3 2026'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Insights' : 'Expand Insights'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* 1. Quick Stats Metric Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Total Reach & Views</span>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3 text-slate-400" /> {MOCK_ENGAGEMENT_SUMMARY.growthPercent}%
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-display text-purple-950">
                {summaryImpressions.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">
                {summaryImpressions > 0 ? 'Across connected channels' : 'Awaiting published broadcasts'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Avg Engagement Rate</span>
                <span className="text-[11px] font-mono text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {MOCK_ENGAGEMENT_SUMMARY.avgEngagementRate > 0 ? 'Live' : 'Baseline 0.0%'}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-display text-indigo-950">
                {MOCK_ENGAGEMENT_SUMMARY.avgEngagementRate}%
              </div>
              <div className="text-[11px] text-slate-500">Benchmark: 3.2% for wellbeing organizations</div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Community Saves / Keeps</span>
                <Bookmark className="w-3.5 h-3.5 text-cyan-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-display text-cyan-950">
                {summarySaves.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">Direct saves of crisis hotlines & guides</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Top Campaign Velocity</span>
                <span className="text-[11px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded-full border border-slate-200">
                  {MOCK_ENGAGEMENT_SUMMARY.activeCampaignsCount > 0 ? 'Active' : 'Idle'}
                </span>
              </div>
              <div className="text-sm font-bold font-display text-emerald-950 truncate">
                {MOCK_ENGAGEMENT_SUMMARY.highestReachCampaign}
              </div>
              <div className="text-[11px] text-slate-500">0 verified reach • Platform clean slate</div>
            </div>
          </div>

          {/* 2. Sub-tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('overview')}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                  activeSubTab === 'overview' 
                    ? 'bg-purple-600 text-white shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Combined Overview
              </button>
              <button
                onClick={() => setActiveSubTab('tags')}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'tags' 
                    ? 'bg-purple-600 text-white shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Top-Performing Tags ({MOCK_TOP_TAGS.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('campaigns')}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'campaigns' 
                    ? 'bg-purple-600 text-white shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Campaign Reach Trends ({MOCK_CAMPAIGN_TRENDS.length})</span>
              </button>
            </div>

            {/* Quick Tag category filter when on tags tab or overview */}
            {(activeSubTab === 'tags' || activeSubTab === 'overview') && (
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-400 font-medium">Filter Tags:</span>
                {(['all', 'affirmation', 'crisis_support', 'privacy', 'community'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedTagCategory(cat)}
                    className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                      selectedTagCategory === cat 
                        ? 'bg-slate-900 text-white font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Tab Contents */}

          {/* Overview or Tags View */}
          {(activeSubTab === 'overview' || activeSubTab === 'tags') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-pink-600" />
                  <h4 className="text-sm font-bold font-display text-slate-900">
                    Top-Performing Tags & Keyword Velocity
                  </h4>
                </div>
                <span className="text-xs text-slate-500">
                  Sorted by Engagement Rate & Community Reach
                </span>
              </div>

              {/* Tag Grid Cards */}
              {filteredTags.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {filteredTags.slice(0, activeSubTab === 'overview' ? 4 : filteredTags.length).map((t, idx) => (
                    <div
                      key={t.tag}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-purple-300 hover:shadow-2xs transition-all duration-200 flex flex-col justify-between space-y-3 group"
                    >
                      <div>
                        {/* Top row */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center font-mono">
                              #{idx + 1}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              t.trend === 'hot' ? 'bg-pink-100 text-pink-700 border border-pink-200' :
                              t.trend === 'up' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {t.trend === 'hot' ? '🔥 Hot' : t.trend === 'up' ? '↗ Rising' : 'Stable'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleCopyTag(t.tag, e)}
                              className="p-1 text-slate-400 hover:text-purple-600 rounded-md transition-colors cursor-pointer"
                              title="Copy hashtag"
                            >
                              {copiedTag === t.tag ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {onInsertTagIntoComposer && (
                              <button
                                onClick={() => onInsertTagIntoComposer(t.tag)}
                                className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
                                title="Use in Composer"
                              >
                                Use
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Tag Name */}
                        <div className="font-bold text-sm text-slate-900 font-mono tracking-tight group-hover:text-purple-700 transition-colors">
                          {t.tag}
                        </div>

                        {/* Reach & Engagement */}
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-medium">Reach:</span>
                            <span className="font-bold text-slate-800">{(t.totalReach * multiplier).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-medium">Engagement:</span>
                            <span className="font-bold text-emerald-600 font-mono">{t.engagementRate}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-medium">Saves / Shares:</span>
                            <span className="text-slate-700 font-mono">{t.savesCount} / {t.sharesCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress indicator */}
                      <div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            style={{ width: `${Math.min(100, (t.totalReach / 150000) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>{t.postsCount} posts</span>
                          <span>{t.sentimentScore}% Brand Fit</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Tag className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold font-display text-slate-700">
                    No Hashtag Metrics Recorded
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Hashtag performance and resonance velocity metrics will calculate automatically as broadcasts containing tags are published across connected channels.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Campaign Reach Trends View */}
          {(activeSubTab === 'overview' || activeSubTab === 'campaigns') && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-bold font-display text-slate-900">
                    Campaign Reach Trends & Growth Trajectory
                  </h4>
                </div>
                <span className="text-xs text-slate-500">
                  Weekly reach progression across active initiatives
                </span>
              </div>

              {/* Campaign Cards with Sparkline Visualizers */}
              {MOCK_CAMPAIGN_TRENDS.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {MOCK_CAMPAIGN_TRENDS.map(camp => {
                    const maxWeeklyReach = Math.max(...camp.weeklyTrend.map(w => w.reach));
                    const progressPct = Math.min(100, Math.round((camp.totalReach / camp.targetReach) * 100));

                    return (
                      <div 
                        key={camp.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 shadow-2xs space-y-4 transition-all"
                      >
                        {/* Campaign Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {camp.status}
                              </span>
                              <span className="text-xs text-slate-400">Pillar: {camp.pillar}</span>
                            </div>
                            <h5 className="text-base font-bold font-display text-slate-900 mt-1">
                              {camp.name}
                            </h5>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-slate-400 font-medium">Total Reach</div>
                            <div className="text-lg font-bold font-display text-purple-900">
                              {Math.round(camp.totalReach * multiplier).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Weekly Reach Trend Visual Sparkline */}
                        <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">5-Week Reach Progression:</span>
                            <span className="font-mono text-purple-700 font-bold">
                              Avg Eng: {camp.engagementRate}%
                            </span>
                          </div>

                          <div className="flex items-end gap-2 h-16 pt-2 px-1">
                            {camp.weeklyTrend.map((pt, wIdx) => {
                              const barHeight = Math.round((pt.reach / maxWeeklyReach) * 100);
                              return (
                                <div key={pt.week} className="flex-1 flex flex-col items-center gap-1 group/bar relative">
                                  <div className="text-[9px] font-mono text-slate-400 opacity-0 group-hover/bar:opacity-100 transition-opacity absolute -top-4 whitespace-nowrap bg-slate-900 text-white px-1 py-0.5 rounded">
                                    {pt.reach.toLocaleString()} ({pt.engagement}%)
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-t-md h-full flex items-end overflow-hidden">
                                    <div 
                                      className={`w-full rounded-t-md transition-all duration-500 ${
                                        wIdx === camp.weeklyTrend.length - 1 
                                          ? 'bg-purple-600 group-hover/bar:bg-purple-700' 
                                          : 'bg-purple-300 group-hover/bar:bg-purple-400'
                                      }`}
                                      style={{ height: `${barHeight}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-500">{pt.week}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Target Progress & Platform Share */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 flex items-center gap-1">
                              <Target className="w-3.5 h-3.5 text-purple-600" />
                              <span>Reach Target Progress:</span>
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                              {progressPct}% ({camp.totalReach.toLocaleString()} / {camp.targetReach.toLocaleString()})
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-600 rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>

                          {/* Platform distribution tags */}
                          <div className="pt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-medium">Platform Share:</span>
                            {camp.platformDistribution.map(dist => (
                              <span 
                                key={dist.platform}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {dist.platform}: <strong className="text-purple-900">{dist.percentage}%</strong>
                              </span>
                            ))}
                            <span className="ml-auto text-[10px] text-purple-700 font-mono font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              {camp.complianceAvg}% Tone Pass
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold font-display text-slate-700">
                    No Campaign Trends Recorded
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Assign posts to strategic campaigns in the Multi-Platform Composer to monitor weekly cross-platform reach growth and milestone targets.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
