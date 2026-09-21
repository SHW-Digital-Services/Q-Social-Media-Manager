import React from 'react';
import { Q_LOGO_URL } from '../data/brandData';
import { QLogo } from './QLogo';
import { 
  ShieldCheck, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  LogOut, 
  User, 
  Calendar as CalendarIcon,
  ExternalLink
} from 'lucide-react';
import { PostItem } from '../types';
import { StaffUser, SUPABASE_PROJECT_REF } from '../lib/supabase';

interface HeaderProps {
  posts: PostItem[];
  onNewPost: () => void;
  onOpenCompliance: () => void;
  onOpenCalendar: () => void;
  onOpenQuickGuide: () => void;
  onOpenAuthModal: () => void;
  onOpenSocialModal?: () => void;
  onSignOut?: () => void;
  currentUser: StaffUser | null;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  posts,
  onNewPost,
  onOpenCompliance,
  onOpenCalendar,
  onOpenQuickGuide,
  onOpenAuthModal,
  onOpenSocialModal,
  onSignOut,
  currentUser,
  activeTab,
}) => {
  const pendingCount = posts.filter(p => p.status === 'pending_approval').length;
  const approvedCount = posts.filter(p => p.status === 'approved' || p.status === 'scheduled').length;
  
  // Calculate average compliance score
  const avgScore = posts.length > 0
    ? Math.round(posts.reduce((sum, p) => sum + (p.complianceAudit?.score || 90), 0) / posts.length)
    : 0;

  return (
    <header className="bg-white border-b border-slate-200 relative pride-topline shadow-xs sticky top-0 z-40">
      {/* Upper Brand & Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Brand Identity with prominent Q Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer" onClick={onOpenQuickGuide}>
            {/* Glow backing */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 rounded-full blur-xs opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-12 h-12 rounded-full bg-white border-2 border-purple-400 flex items-center justify-center overflow-hidden shadow-lg p-1.5 ring-2 ring-purple-200">
              <QLogo 
                className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-300"
                alt="Q Intelligence Cosmic Logomark"
                glow={true}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-slate-900 tracking-tight leading-none">
                Q Intelligence
              </h1>
              <span className="text-[11px] font-mono font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Staff Portal
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                PII Shield Active
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5 flex items-center gap-2">
              <span>Social Media & Communications Command</span>
              <span className="text-slate-300">•</span>
              <a
                href="https://supabase.com/dashboard/project/brnhalxydcakutxiregp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-purple-700 hover:text-purple-900 font-mono flex items-center gap-1"
                title="Supabase Auth Project brnhalxydcakutxiregp"
              >
                <span>Supabase Auth</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>
        </div>

        {/* Middle / Right: Live Operational KPIs */}
        <div className="hidden lg:flex items-center gap-6 border-x border-slate-100 px-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={onOpenCalendar}>
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Content Calendar</div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-1">
                {posts.length} Broadcasts
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Approval Queue</div>
              <div className="text-sm font-bold text-slate-800">
                {pendingCount} Pending Review
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5" onClick={onOpenCompliance}>
            <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Compliance Avg</div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-1">
                {posts.length > 0 ? (
                  <>
                    {avgScore}% <span className="text-[10px] text-emerald-600 font-semibold font-mono">Brand Safe</span>
                  </>
                ) : (
                  <>
                    0% <span className="text-[10px] text-slate-400 font-semibold font-mono">Awaiting Posts</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions, Staff Help Guide & Officer Avatar */}
        <div className="flex items-center gap-2.5">
          {/* Staff Help & Cheatsheet */}
          <button
            type="button"
            onClick={onOpenQuickGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-full transition-colors cursor-pointer"
            title="Non-Technical Staff Quick Guide & Brand Cheatsheet"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Staff Guide</span>
          </button>

          {/* Social Channels Quick Modal */}
          {onOpenSocialModal && (
            <button
              type="button"
              onClick={onOpenSocialModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 hover:border-purple-200 rounded-full transition-colors cursor-pointer"
              title="Manage Social Media Account Connections (OAuth 2.0)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Channels</span>
            </button>
          )}

          <button
            onClick={onNewPost}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-full shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Compose Post</span>
          </button>

          {/* Authenticated Staff Profile */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <div 
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-xl cursor-pointer transition-colors"
                title="Click to switch staff account"
              >
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/30"
                />
                <div className="hidden md:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                      currentUser.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {currentUser.role.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[110px]">
                    {currentUser.title}
                  </div>
                </div>
              </div>

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Sign Out to Login Page"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
