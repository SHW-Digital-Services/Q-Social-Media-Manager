import React, { useState, useMemo } from 'react';
import { PostItem, SocialPlatform, PostStatus } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Edit3, 
  RotateCcw,
  Sparkles,
  Layers,
  X,
  Instagram,
  Linkedin,
  Twitter,
  Video,
  AtSign,
  Cloud,
  Share2
} from 'lucide-react';
import { PLATFORM_SPECS, Q_LOGO_URL } from '../data/brandData';
import { QLogo } from './QLogo';

interface ContentCalendarProps {
  posts: PostItem[];
  onSelectPost: (post: PostItem) => void;
  onEditPost: (post: PostItem) => void;
  onScheduleNewPost: (dateStr: string) => void;
  onReschedulePost: (postId: string, newDateStr: string) => void;
  onOpenVersionHistory: (post: PostItem) => void;
}

const STATUS_COLORS: Record<PostStatus, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
}> = {
  draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
    label: 'Draft'
  },
  pending_approval: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    label: 'Pending Approval'
  },
  changes_requested: {
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    border: 'border-rose-300',
    dot: 'bg-rose-500',
    label: 'Changes Requested'
  },
  approved: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
    label: 'Approved'
  },
  scheduled: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-900',
    border: 'border-indigo-300',
    dot: 'bg-indigo-600',
    label: 'Scheduled'
  },
  published: {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    border: 'border-purple-300',
    dot: 'bg-purple-600',
    label: 'Published'
  }
};

export const ContentCalendar: React.FC<ContentCalendarProps> = ({
  posts,
  onSelectPost,
  onEditPost,
  onScheduleNewPost,
  onReschedulePost,
  onOpenVersionHistory,
}) => {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 8, 20)); // Sep 2026 current date
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inspectedPost, setInspectedPost] = useState<PostItem | null>(null);
  const [rescheduleDateInput, setRescheduleDateInput] = useState<string>('');
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);

  // Month navigation
  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const jumpToToday = () => {
    setCurrentDate(new Date(2026, 8, 20));
  };

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (platformFilter !== 'all' && !p.platforms.includes(platformFilter as SocialPlatform)) {
        return false;
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [posts, platformFilter, statusFilter]);

  // Group posts by date string YYYY-MM-DD
  const postsByDate = useMemo(() => {
    const map: Record<string, PostItem[]> = {};
    filteredPosts.forEach(post => {
      const dateSource = post.scheduledFor || post.publishedAt || post.lastModified;
      if (dateSource) {
        const key = dateSource.slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(post);
      }
    });
    return map;
  }, [filteredPosts]);

  // Month Grid Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Get calendar days for month view
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: {
      date: Date;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      dayNumber: number;
    }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateKey: key,
        isCurrentMonth: false,
        isToday: key === '2026-09-20',
        dayNumber: d.getDate()
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        date: d,
        dateKey: key,
        isCurrentMonth: true,
        isToday: key === '2026-09-20',
        dayNumber: i
      });
    }

    // Next month padding to round up to full weeks
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateKey: key,
        isCurrentMonth: false,
        isToday: key === '2026-09-20',
        dayNumber: i
      });
    }

    return days;
  }, [year, month]);

  // Week Grid Calculation
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const firstDayOfWeek = curr.getDate() - curr.getDay();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(firstDayOfWeek + i));
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: d.getDate(),
        dayName: d.toLocaleDateString('default', { weekday: 'short' }),
        isToday: key === '2026-09-20'
      });
    }
    return days;
  }, [currentDate]);

  const renderPlatformIcon = (plat: SocialPlatform) => {
    switch (plat) {
      case 'instagram': return <Instagram className="w-3 h-3 text-pink-600" />;
      case 'linkedin': return <Linkedin className="w-3 h-3 text-blue-600" />;
      case 'twitter': return <Twitter className="w-3 h-3 text-slate-800" />;
      case 'tiktok': return <Video className="w-3 h-3 text-black" />;
      case 'threads': return <AtSign className="w-3 h-3 text-slate-900" />;
      case 'bluesky': return <Cloud className="w-3 h-3 text-sky-500" />;
      case 'facebook': return <Share2 className="w-3 h-3 text-blue-700" />;
      default: return null;
    }
  };

  const handleOpenReschedule = (post: PostItem) => {
    const currentVal = post.scheduledFor 
      ? post.scheduledFor.slice(0, 16) 
      : '2026-09-21T10:00';
    setRescheduleDateInput(currentVal);
    setShowRescheduleModal(true);
  };

  const handleSaveReschedule = () => {
    if (inspectedPost && rescheduleDateInput) {
      onReschedulePost(inspectedPost.id, new Date(rescheduleDateInput).toISOString());
      setShowRescheduleModal(false);
      setInspectedPost(prev => prev ? { ...prev, scheduledFor: new Date(rescheduleDateInput).toISOString() } : null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Calendar Top Banner & Quick Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900">
                  Visual Content Calendar
                </h2>
                <p className="text-xs text-slate-500">
                  Plan, preview, and review multi-platform releases at a glance.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation and View Switcher */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Week
              </button>
            </div>

            {/* Prev / Next Period */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={prevPeriod}
                className="w-8 h-8 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={jumpToToday}
                className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={nextPeriod}
                className="w-8 h-8 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="font-display font-bold text-slate-900 text-sm sm:text-base px-2">
              {monthName}
            </div>

            <button
              type="button"
              onClick={() => onScheduleNewPost(new Date().toISOString().slice(0, 10))}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Post</span>
            </button>
          </div>
        </div>

        {/* Filters Bar & Color Legend */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Status and Platform Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Channels</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">X (Twitter)</option>
              <option value="threads">Threads</option>
              <option value="bluesky">Bluesky</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="changes_requested">Changes Requested</option>
            </select>
          </div>

          {/* Color-Coding Legend */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-slate-500">
            <span className="text-slate-400 font-semibold">Status:</span>
            {Object.entries(STATUS_COLORS).map(([stKey, stVal]) => (
              <div key={stKey} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${stVal.dot}`} />
                <span className="capitalize">{stVal.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid of Calendar Days */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((dayItem, idx) => {
              const dayPosts = postsByDate[dayItem.dateKey] || [];
              return (
                <div
                  key={idx}
                  className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors group ${
                    dayItem.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-400'
                  } ${dayItem.isToday ? 'ring-2 ring-purple-400/40 bg-purple-50/10' : ''}`}
                >
                  {/* Date Header & Quick Plus */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        dayItem.isToday
                          ? 'bg-purple-600 text-white shadow-xs'
                          : dayItem.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {dayItem.dayNumber}
                    </span>

                    <button
                      type="button"
                      onClick={() => onScheduleNewPost(dayItem.dateKey)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-md hover:bg-purple-100 text-purple-700 flex items-center justify-center cursor-pointer"
                      title={`Schedule post on ${dayItem.dateKey}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Scheduled Posts in Cell */}
                  <div className="space-y-1 my-1 overflow-y-auto max-h-[85px]">
                    {dayPosts.map(p => {
                      const color = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setInspectedPost(p)}
                          className={`p-1.5 rounded-xl border text-[11px] font-medium leading-tight cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${color.bg} ${color.text} ${color.border}`}
                          title={`${p.title} (${color.label}) - Click to inspect`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                              <div className="flex -space-x-1">
                                {p.platforms.slice(0, 2).map(plat => (
                                  <span key={plat} className="p-0.5 rounded-full bg-white/80 shadow-2xs">
                                    {renderPlatformIcon(plat)}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono opacity-80">
                              {p.complianceAudit?.score ? `${p.complianceAudit.score}%` : ''}
                            </span>
                          </div>
                          <p className="truncate font-semibold">{p.title}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty state prompt on hover */}
                  {dayPosts.length === 0 && (
                    <div 
                      onClick={() => onScheduleNewPost(dayItem.dateKey)}
                      className="text-[10px] text-slate-300 group-hover:text-purple-500 font-medium cursor-pointer transition-colors py-1 truncate"
                    >
                      + Add broadcast
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {weekDays.map((dayItem, idx) => {
              const dayPosts = postsByDate[dayItem.dateKey] || [];
              return (
                <div key={idx} className="min-h-[400px] flex flex-col">
                  {/* Day Header */}
                  <div className={`p-3 text-center border-b border-slate-100 ${
                    dayItem.isToday ? 'bg-purple-50/80' : 'bg-slate-50'
                  }`}>
                    <div className="text-xs font-bold text-slate-400 uppercase">{dayItem.dayName}</div>
                    <div className={`text-base font-bold font-display inline-block mt-0.5 w-7 h-7 rounded-full leading-7 ${
                      dayItem.isToday ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-800'
                    }`}>
                      {dayItem.dayNumber}
                    </div>
                  </div>

                  {/* Day Posts Column */}
                  <div className="p-2 space-y-2 flex-1 bg-white">
                    {dayPosts.map(p => {
                      const color = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setInspectedPost(p)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer hover:shadow-md transition-all ${color.bg} ${color.text} ${color.border}`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                              {color.label}
                            </span>
                            <div className="flex items-center gap-1">
                              {p.platforms.map(plat => (
                                <span key={plat} className="p-1 rounded-full bg-white/90">
                                  {renderPlatformIcon(plat)}
                                </span>
                              ))}
                            </div>
                          </div>

                          <h4 className="font-bold text-slate-900 line-clamp-2 leading-snug mb-1">
                            {p.title}
                          </h4>

                          <p className="text-[11px] opacity-80 line-clamp-2 mb-2">
                            {p.content}
                          </p>

                          <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-black/5">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {p.scheduledFor ? new Date(p.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible'}
                            </span>
                            <span className="font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                              {p.complianceAudit?.score || 95}% Safe
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => onScheduleNewPost(dayItem.dateKey)}
                      className="w-full py-2 border border-dashed border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-400 hover:text-purple-700 text-xs font-semibold rounded-2xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Post</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK POST INSPECTOR MODAL */}
      {inspectedPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${STATUS_COLORS[inspectedPost.status].bg} ${STATUS_COLORS[inspectedPost.status].text} ${STATUS_COLORS[inspectedPost.status].border}`}>
                    {STATUS_COLORS[inspectedPost.status].label}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-400">
                    {inspectedPost.currentVersion || 'v1.0'}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-display text-slate-900 mt-1">
                  {inspectedPost.title}
                </h3>
              </div>

              <button
                onClick={() => setInspectedPost(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media preview snippet if any */}
            {inspectedPost.mediaUrls && inspectedPost.mediaUrls.length > 0 && (
              <div className="h-36 rounded-2xl overflow-hidden bg-slate-950 relative flex items-center justify-center p-2">
                {inspectedPost.mediaUrls[0] === Q_LOGO_URL || inspectedPost.mediaUrls[0].includes('logo') || inspectedPost.mediaUrls[0].includes('Logo.png') ? (
                  <QLogo className="h-28 w-28 object-contain" />
                ) : (
                  <img 
                    src={inspectedPost.mediaUrls[0]} 
                    alt={inspectedPost.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-white font-medium">
                  {inspectedPost.mediaUrls.length} Media Attachment{inspectedPost.mediaUrls.length > 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Content snippet */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-32 overflow-y-auto">
              "{inspectedPost.content}"
            </div>

            {/* Channels & Meta info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">Target Channels</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {inspectedPost.platforms.map(plat => (
                    <span key={plat} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium capitalize flex items-center gap-1">
                      {renderPlatformIcon(plat)}
                      <span>{plat}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">Scheduled Time</span>
                <div className="flex items-center gap-1 text-slate-800 font-semibold font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {inspectedPost.scheduledFor 
                      ? new Date(inspectedPost.scheduledFor).toLocaleString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Unscheduled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance Badge */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Q Tone Alignment: <strong>{inspectedPost.complianceAudit?.score || 95}%</strong></span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Safe & Affirming
              </span>
            </div>

            {/* Actions for Non-Technical Staff */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onOpenVersionHistory(inspectedPost);
                  setInspectedPost(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Version History</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReschedule(inspectedPost)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Reschedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onEditPost(inspectedPost);
                    setInspectedPost(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit in Composer</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && inspectedPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Reschedule Broadcast</h3>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Choose a new publication date and time for <strong>"{inspectedPost.title}"</strong>.
            </p>

            <input
              type="datetime-local"
              value={rescheduleDateInput}
              onChange={(e) => setRescheduleDateInput(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReschedule}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-xs"
              >
                Save New Time
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
