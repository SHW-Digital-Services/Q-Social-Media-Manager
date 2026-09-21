import React, { useState } from 'react';
import { PostItem, PostStatus, SocialPlatform } from '../types';
import { PLATFORM_SPECS, Q_LOGO_URL } from '../data/brandData';
import { QLogo } from './QLogo';
import { EngagementInsightsCard } from './EngagementInsightsCard';
import { StaffUser } from '../lib/supabase';
import { SocialPlatformBrandIcon } from './SocialPlatformBrandIcon';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Send, 
  Edit3, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  ListFilter, 
  Check, 
  X, 
  ShieldAlert, 
  Calendar, 
  Sparkles,
  Search,
  History,
  TrendingUp,
  Lock,
  ShieldCheck,
  Plus,
  Crown
} from 'lucide-react';

interface ApprovalQueueProps {
  posts: PostItem[];
  onApprovePost: (postId: string) => void;
  onRequestChanges: (postId: string, feedback: string) => void;
  onPublishNow: (postId: string) => void;
  onEditPost: (post: PostItem) => void;
  onOpenCollab: (post: PostItem) => void;
  onOpenComplianceForPost: (post: PostItem) => void;
  onOpenVersionHistory: (post: PostItem) => void;
  onNewPost: () => void;
  onInsertTagIntoComposer?: (tag: string) => void;
  currentUser?: StaffUser | null;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  posts,
  onApprovePost,
  onRequestChanges,
  onPublishNow,
  onEditPost,
  onOpenCollab,
  onOpenComplianceForPost,
  onOpenVersionHistory,
  onNewPost,
  onInsertTagIntoComposer,
  currentUser,
}) => {
  const isLeadApprover = currentUser?.email?.toLowerCase() === 'scott@q-ai.online';
  const [selectedStatus, setSelectedStatus] = useState<PostStatus | 'all'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showEngagementInsights, setShowEngagementInsights] = useState(true);

  // Change request modal state
  const [rejectModalPostId, setRejectModalPostId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const filteredPosts = posts.filter(post => {
    if (selectedStatus !== 'all' && post.status !== selectedStatus) return false;
    if (selectedPlatform !== 'all' && !post.platforms.includes(selectedPlatform)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchContent = post.content.toLowerCase().includes(q);
      const matchAuthor = post.author.name.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }
    return true;
  });

  const handleTriggerPublish = (postId: string) => {
    onPublishNow(postId);
  };

  const handleConfirmChanges = () => {
    if (rejectModalPostId && feedbackText.trim()) {
      onRequestChanges(rejectModalPostId, feedbackText);
      setRejectModalPostId(null);
      setFeedbackText('');
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full"><Check className="w-3 h-3" /> Approved</span>;
      case 'scheduled':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Scheduled</span>;
      case 'pending_approval':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Pending Review</span>;
      case 'changes_requested':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" /> Changes Requested</span>;
      case 'published':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Published</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">Draft</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Hero Overview */}
      <div className="bg-cosmic-gradient rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        {/* Subtle decorative nebula accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-600/30 via-pink-600/20 to-transparent rounded-full -mr-32 -mt-32 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-mono tracking-wider text-purple-200 backdrop-blur-xs">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>AUTOMATED WORKFLOW QUEUE</span>
              </div>
              {isLeadApprover ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-xs font-semibold text-emerald-300 backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lead Approver Authorized (scott@q-ai.online)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-xs font-semibold text-amber-300 backdrop-blur-xs" title="Only scott@q-ai.online can approve posts">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reviewer Mode (scott@q-ai.online approval required)</span>
                </div>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
              Social Media Content & Approval Pipeline
            </h2>
            <p className="text-sm text-slate-300 font-light leading-relaxed">
              Every post is pre-screened against Q Intelligence tone rules (welcoming, affirming, clear, and privacy-shielded) before entering the multi-platform scheduling queue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-xs font-semibold transition-all cursor-pointer backdrop-blur-xs"
            >
              {viewMode === 'list' ? (
                <>
                  <CalendarIcon className="w-4 h-4 text-cyan-300" />
                  <span>Calendar Timeline</span>
                </>
              ) : (
                <>
                  <ListFilter className="w-4 h-4 text-purple-300" />
                  <span>List View</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowEngagementInsights(!showEngagementInsights)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                showEngagementInsights 
                  ? 'bg-white text-purple-950 shadow-md font-extrabold' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span>{showEngagementInsights ? 'Insights Active' : 'Show Engagement Insights'}</span>
            </button>

            <button
              onClick={onNewPost}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pride-spectrum hover:opacity-90 text-white rounded-full text-xs font-bold shadow-glow-purple transition-opacity cursor-pointer"
            >
              <span>+ Compose New Post</span>
            </button>
          </div>
        </div>

        {/* Quick metrics in hero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-xs text-slate-400 font-medium">Pending Review</div>
            <div className="text-2xl font-bold font-display text-amber-300">
              {posts.filter(p => p.status === 'pending_approval').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Scheduled / Ready</div>
            <div className="text-2xl font-bold font-display text-emerald-400">
              {posts.filter(p => p.status === 'scheduled' || p.status === 'approved').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Changes Requested</div>
            <div className="text-2xl font-bold font-display text-rose-400">
              {posts.filter(p => p.status === 'changes_requested').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Published Live</div>
            <div className="text-2xl font-bold font-display text-cyan-300">
              {posts.filter(p => p.status === 'published').length}
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Insights Dashboard Card */}
      {showEngagementInsights && (
        <EngagementInsightsCard 
          onInsertTagIntoComposer={onInsertTagIntoComposer}
          defaultExpanded={true}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(['all', 'pending_approval', 'changes_requested', 'approved', 'scheduled', 'published'] as const).map(status => {
            const labels: Record<string, string> = {
              all: 'All Posts',
              pending_approval: 'Pending Review',
              changes_requested: 'Needs Revision',
              approved: 'Approved',
              scheduled: 'Scheduled',
              published: 'Published'
            };
            const count = status === 'all' ? posts.length : posts.filter(p => p.status === status).length;
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  isSelected 
                    ? 'bg-purple-600 text-white font-semibold' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[status]} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Platform filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search posts, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-full focus:outline-none cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">X / Twitter</option>
            <option value="threads">Threads</option>
            <option value="tiktok">TikTok</option>
            <option value="bluesky">Bluesky</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
      </div>

      {/* Main View: Calendar or List */}
      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>Multi-Platform Schedule Calendar</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Optimal broadcasting slots scheduled across marketing channels.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-sync enabled
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {['Mon, Sep 21', 'Tue, Sep 22', 'Wed, Sep 23', 'Thu, Sep 24', 'Fri, Sep 25', 'Sat, Sep 26', 'Sun, Sep 27'].map((day, idx) => {
              const dayPosts = posts.filter((_, postIdx) => (postIdx % 7) === idx);
              return (
                <div key={day} className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60 min-h-[220px] flex flex-col">
                  <div className="text-xs font-bold text-slate-700 pb-2 border-b border-slate-200/80 mb-2.5">
                    {day}
                  </div>
                  <div className="space-y-2 flex-1">
                    {dayPosts.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic py-4 text-center">
                        No posts slotted
                      </div>
                    ) : (
                      dayPosts.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => onEditPost(p)}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-400 cursor-pointer transition-all text-left"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono text-purple-700 font-semibold">
                              {p.scheduledFor ? new Date(p.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible'}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.complianceAudit.score >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                            {p.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5">
                            {p.platforms.map(pl => (
                              <span key={pl} className="text-[9px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 uppercase font-mono">
                                {pl.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-display text-slate-900">Your Content Pipeline is Ready</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The platform has been initialized as a blank canvas with no posts. Create your first branded post with AI and media alteration tools, or connect your social accounts.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={onNewPost}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Draft First Post</span>
                </button>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <ListFilter className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No posts match your filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try selecting a different status filter, resetting your platform selection, or composing a new post.
              </p>
              <button
                onClick={() => { setSelectedStatus('all'); setSelectedPlatform('all'); setSearchQuery(''); }}
                className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredPosts.map(post => {
              const audit = post.complianceAudit;
              const isApproved = post.status === 'approved' || post.status === 'scheduled';
              const isPending = post.status === 'pending_approval';

              return (
                <div 
                  key={post.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow space-y-4"
                >
                  {/* Top row: Status, Platforms, Compliance Score */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(post.status)}
                      {post.campaign && (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          📁 {post.campaign}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Platforms */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {post.platforms.map(pl => {
                          const spec = PLATFORM_SPECS[pl];
                          const isWeb = pl === 'website';
                          return (
                            <span 
                              key={pl}
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                isWeb 
                                  ? 'bg-purple-50 text-purple-800 border-purple-200' 
                                  : 'text-slate-700 bg-slate-100 border-slate-200'
                              }`}
                              title={`${spec?.name || pl} targeting`}
                            >
                              <SocialPlatformBrandIcon platform={pl} size="xs" showBorder={false} />
                              <span className="capitalize">{pl}</span>
                              {isWeb && <Crown className="w-2.5 h-2.5 text-purple-600" />}
                            </span>
                          );
                        })}
                      </div>

                      {/* Compliance Badge */}
                      <button
                        onClick={() => onOpenComplianceForPost(post)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold transition-transform hover:scale-105 cursor-pointer ${
                          audit.score >= 90
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : audit.score >= 70
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                        title="Click to inspect full brand compliance audit"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Score: {audit.score}%</span>
                      </button>
                    </div>
                  </div>

                  {/* Middle: Title & Content Preview */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold font-display text-slate-900">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed font-sans bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      {post.content}
                    </p>

                    {/* Media Attachments Preview if any */}
                    {post.mediaUrls.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        {post.mediaUrls.map((url, i) => {
                          const isLogo = url === Q_LOGO_URL || url.includes('Logo.png') || url.includes('logo');
                          return (
                            <div key={i} className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-950 flex items-center justify-center p-1.5 shrink-0">
                              {isLogo ? (
                                <QLogo className="w-full h-full object-contain" />
                              ) : (
                                <img src={url} alt="Attached asset" className="w-full h-full object-contain" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map(t => (
                          <span key={t} className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Flagged warnings if any */}
                  {audit.flags.some(f => f.type === 'violation') && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-3 text-xs text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-semibold">Automated Compliance Flag:</div>
                        {audit.flags.filter(f => f.type === 'violation').map((flag, idx) => (
                          <div key={idx} className="text-rose-700">
                            • <span className="font-medium">"{flag.excerpt}"</span>: {flag.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom: Author, Schedule info, Workflow Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
                    {/* Author & Assignee */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <img 
                          src={post.author.avatar} 
                          alt={post.author.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-xs font-medium text-slate-700">
                          {post.author.name}
                        </span>
                      </div>

                      {post.scheduledFor && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(post.scheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Comments / Collab drawer trigger */}
                      <button
                        onClick={() => onOpenCollab(post)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comments.length} Comments</span>
                      </button>

                      {/* Edit button */}
                      <button
                        onClick={() => onEditPost(post)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Version History button */}
                      <button
                        onClick={() => onOpenVersionHistory(post)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                        title="View revision history and rollback changes"
                      >
                        <History className="w-3.5 h-3.5 text-purple-600" />
                        <span>{post.currentVersion || 'v1.0'}</span>
                      </button>

                      {/* Request Changes button */}
                      {post.status !== 'published' && (
                        <button
                          onClick={() => setRejectModalPostId(post.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Request Changes</span>
                        </button>
                      )}

                      {/* 1-Click Approve or Publish - Restricted to scott@q-ai.online */}
                      {isPending && (
                        isLeadApprover ? (
                          <button
                            onClick={() => onApprovePost(post.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
                            title="Authorized: Lead Approver (scott@q-ai.online)"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Schedule</span>
                          </button>
                        ) : (
                          <div
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                            title="Approval restricted: Only Lead Approver (scott@q-ai.online) can approve posts"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Approval Locked (scott@q-ai.online only)</span>
                          </div>
                        )
                      )}

                      {isApproved && (
                        post.platforms.includes('website') && !isLeadApprover ? (
                          <div
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                            title="Website broadcast requires Owner (scott@q-ai.online) sign-off"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Owner Required for Website (Scott)</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleTriggerPublish(post.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-pride-spectrum hover:opacity-90 shadow-2xs transition-opacity cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Publish Now</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* Change Request Modal */}
      {rejectModalPostId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Request Revisions</span>
              </h3>
              <button 
                onClick={() => setRejectModalPostId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Specify what tone or brand compliance adjustments are required before this post can be approved for publishing.
            </p>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="E.g., Please soften clinical language and ensure non-presumptive phrasing regarding coming out..."
                className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 bg-slate-50"
              />
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Soften clinical language',
                  'Ensure non-presumptive framing',
                  'Add verified helpline badge',
                  'Check brand logo safe-zone'
                ].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setFeedbackText(prev => prev ? `${prev} • ${chip}` : chip)}
                    className="text-[10px] bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 cursor-pointer transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRejectModalPostId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmChanges}
                disabled={!feedbackText.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
