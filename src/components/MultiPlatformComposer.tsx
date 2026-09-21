import React, { useState, useEffect } from 'react';
import { PostItem, SocialPlatform } from '../types';
import { PLATFORM_SPECS, Q_LOGO_URL } from '../data/brandData';
import { QLogo } from './QLogo';
import { MediaEditorModal } from './MediaEditorModal';
import { SocialPlatformBrandIcon } from './SocialPlatformBrandIcon';
import { StaffUser } from '../lib/supabase';
import { 
  Send, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Image as ImageIcon, 
  Clock, 
  Calendar, 
  Hash, 
  CheckCircle2, 
  RefreshCw, 
  Smartphone, 
  HelpCircle,
  X,
  Lock,
  Sliders,
  PenTool,
  Scissors,
  Crown,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MultiPlatformComposerProps {
  initialPost?: PostItem | null;
  onSaveDraft: (postData: Partial<PostItem>) => void;
  onSubmitForApproval: (postData: Partial<PostItem>) => void;
  onPublishDirect: (postData: Partial<PostItem>) => void;
  onOpenMediaPicker: (onSelect: (url: string) => void) => void;
  onOpenComplianceTab: () => void;
  currentUser?: StaffUser | null;
}

export const MultiPlatformComposer: React.FC<MultiPlatformComposerProps> = ({
  initialPost,
  onSaveDraft,
  onSubmitForApproval,
  onPublishDirect,
  onOpenMediaPicker,
  onOpenComplianceTab,
  currentUser,
}) => {
  const isOwner = currentUser?.email?.toLowerCase() === 'scott@q-ai.online' || currentUser?.role === 'admin';
  const [title, setTitle] = useState(initialPost?.title || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(
    initialPost?.platforms || ['instagram', 'threads', 'twitter']
  );
  const hasWebsiteTarget = selectedPlatforms.includes('website');
  const [previewPlatform, setPreviewPlatform] = useState<SocialPlatform>('instagram');
  const [mediaUrls, setMediaUrls] = useState<string[]>(initialPost?.mediaUrls || [Q_LOGO_URL]);
  const [campaign, setCampaign] = useState(initialPost?.campaign || 'General Wellbeing 2026');
  const [scheduledDateTime, setScheduledDateTime] = useState(
    initialPost?.scheduledFor 
      ? new Date(initialPost.scheduledFor).toISOString().slice(0, 16) 
      : new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [tags, setTags] = useState<string[]>(
    initialPost?.tags || ['#QIntelligence', '#LGBTQWellbeing', '#SafeSpace']
  );
  const [newTagInput, setNewTagInput] = useState('');
  const [piiVerified, setPiiVerified] = useState(true);

  // Media alteration studio modal state
  const [editingMediaIndex, setEditingMediaIndex] = useState<number | null>(null);

  // AI Assistant states
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteStyle, setRewriteStyle] = useState('Warm & Supportive');
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  // Real-time compliance pre-screen check
  const [flaggedWords, setFlaggedWords] = useState<string[]>([]);
  const [piiWarnings, setPiiWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (initialPost) {
      setTitle(initialPost.title);
      setContent(initialPost.content);
      setSelectedPlatforms(initialPost.platforms);
      setMediaUrls(initialPost.mediaUrls);
      setCampaign(initialPost.campaign || '');
      setTags(initialPost.tags || []);
      if (initialPost.platforms.length > 0) {
        setPreviewPlatform(initialPost.platforms[0]);
      }
    }
  }, [initialPost]);

  // Run local pre-screening on text change
  useEffect(() => {
    const lower = content.toLowerCase();
    const bannedOrClinical = [
      'sufferers', 'afflicted', 'disorder', 'pathology', 
      'come out to your parents', 'normal person', 'cured of',
      'you must disclose', 'don\'t delay'
    ];
    const foundFlags = bannedOrClinical.filter(term => lower.includes(term));
    setFlaggedWords(foundFlags);

    // Simple PII detector (emails or phone numbers)
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const foundPii: string[] = [];
    if (emailRegex.test(content)) foundPii.push('Email address detected in copy');
    if (phoneRegex.test(content) && !content.includes('678-678')) foundPii.push('Possible phone number detected');
    setPiiWarnings(foundPii);
  }, [content]);

  const togglePlatform = (p: SocialPlatform) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(p)) {
        if (prev.length === 1) return prev; // keep at least one
        const updated = prev.filter(x => x !== p);
        if (previewPlatform === p) setPreviewPlatform(updated[0]);
        return updated;
      } else {
        return [...prev, p];
      }
    });
  };

  const handleAddTag = () => {
    if (newTagInput.trim()) {
      const formatted = newTagInput.startsWith('#') ? newTagInput.trim() : `#${newTagInput.trim()}`;
      if (!tags.includes(formatted)) {
        setTags([...tags, formatted]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAttachAsset = () => {
    onOpenMediaPicker((selectedUrl: string) => {
      if (!mediaUrls.includes(selectedUrl)) {
        setMediaUrls([...mediaUrls, selectedUrl]);
      }
    });
  };

  const handleRemoveMedia = (idx: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== idx));
  };

  // AI Q-Voice Rewrite Handler
  const handleAiPolish = async () => {
    if (!content.trim()) return;
    setIsRewriting(true);
    setAiNote(null);
    try {
      const res = await fetch('/api/compliance/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          style: rewriteStyle,
          platform: PLATFORM_SPECS[previewPlatform]?.name || 'Social Media'
        })
      });
      const data = await res.json();
      if (data.rewrittenText) {
        setContent(data.rewrittenText);
        setAiNote(data.notes || 'Refined to match Q Intelligence welcoming and non-presumptive tone.');
        if (data.suggestedHashtags && Array.isArray(data.suggestedHashtags)) {
          const merged = Array.from(new Set([...tags, ...data.suggestedHashtags]));
          setTags(merged.slice(0, 6));
        }
      }
    } catch (e) {
      console.error('Failed to rewrite:', e);
    } finally {
      setIsRewriting(false);
    }
  };

  // AI Suggest Hashtags
  const handleGenerateHashtags = async () => {
    setIsGeneratingTags(true);
    try {
      const res = await fetch('/api/compliance/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: title || content.slice(0, 50),
          platform: previewPlatform
        })
      });
      const data = await res.json();
      if (data.hashtags && Array.isArray(data.hashtags)) {
        const merged = Array.from(new Set([...tags, ...data.hashtags]));
        setTags(merged.slice(0, 8));
      }
    } catch (e) {
      console.error('Failed to get hashtags:', e);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const currentPlatformSpec = PLATFORM_SPECS[previewPlatform] || PLATFORM_SPECS.instagram;
  const currentChars = content.length + tags.join(' ').length + (tags.length > 0 ? 1 : 0);
  const isOverLimit = currentChars > currentPlatformSpec.maxChars;

  const buildPostPayload = (): Partial<PostItem> => ({
    title: title.trim() || 'Untitled Social Broadcast',
    content: content.trim(),
    platforms: selectedPlatforms,
    mediaUrls,
    tags,
    campaign,
    scheduledFor: new Date(scheduledDateTime).toISOString(),
    piiShieldVerified: piiVerified && piiWarnings.length === 0,
    complianceAudit: {
      score: flaggedWords.length === 0 ? 95 : 65,
      status: flaggedWords.length === 0 ? 'approved' : 'needs_review',
      summary: flaggedWords.length === 0 
        ? 'Passes Q Intelligence welcoming and affirming tone baseline.' 
        : 'Flags detected: clinical or presumptive phrasing needs review.',
      breakdown: {
        welcoming: flaggedWords.length === 0 ? 95 : 70,
        affirming: flaggedWords.length === 0 ? 96 : 60,
        clarity: 94,
        privacySafe: piiWarnings.length === 0 ? 98 : 50,
        nonPresumptive: flaggedWords.length === 0 ? 95 : 55
      },
      flags: flaggedWords.map(word => ({
        rule: 'Avoid Clinical or Presumptive Terms',
        type: 'warning',
        excerpt: word,
        message: `Word "${word}" flagged by Q Brand Rules.`,
        suggestion: 'Consider softer, welcoming phrasing.'
      })),
      scannedAt: new Date().toISOString()
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Left 7 cols: Editor & Compliance Controls */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Editor Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900">
                Multi-Platform Broadcast Composer
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Draft once, tailor for platforms, and audit brand alignment.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
              Q-Publish Engine
            </span>
          </div>

          {/* Platforms Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 block">
                Target Publishing Channels ({selectedPlatforms.length} selected)
              </label>
              {hasWebsiteTarget && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-800 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full font-mono">
                  <Crown className="w-3 h-3 text-purple-600" />
                  Website Requires Owner Sign-Off
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PLATFORM_SPECS).map(([key, spec]) => {
                const isSelected = selectedPlatforms.includes(key as SocialPlatform);
                const isWeb = key === 'website';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePlatform(key as SocialPlatform)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border
                      ${isSelected 
                        ? 'bg-slate-900 text-white font-semibold shadow-2xs border-slate-800' 
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }
                    `}
                  >
                    <SocialPlatformBrandIcon platform={key} size="xs" showBorder={false} />
                    <span>{spec.name}</span>
                    {isWeb && (
                      <Crown className={`w-3 h-3 ${isSelected ? 'text-amber-300' : 'text-purple-600'}`} />
                    )}
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Internal Title / Campaign */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Post Subject / Campaign Hook
              </label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Weekly Wellbeing Check-in"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500 transition-colors font-medium text-slate-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Brand Campaign Pillar
              </label>
              <input 
                type="text"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="E.g. Safe Reflection 2026"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500 transition-colors font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Post Copy</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Voice: Welcoming, Affirming, Non-Presumptive)
                </span>
              </label>
              <div className={`font-mono text-xs font-semibold ${isOverLimit ? 'text-rose-600' : 'text-slate-500'}`}>
                {currentChars} / {currentPlatformSpec.maxChars} chars
              </div>
            </div>

            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your affirming broadcast copy... (e.g., Hi there. We're here for you—always.)"
              className={`w-full p-4 text-sm leading-relaxed rounded-2xl border transition-colors bg-white font-sans ${
                isOverLimit 
                  ? 'border-rose-400 focus:border-rose-600' 
                  : 'border-slate-200 focus:border-purple-500 focus:outline-none'
              }`}
            />

            {/* Flagged Warnings Real-time */}
            {flaggedWords.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Brand Lexicon Alert:</div>
                  <div>
                    Flagged phrasing: <span className="font-mono text-amber-800 font-bold">{flaggedWords.join(', ')}</span>.
                    Q guidelines prohibit clinical/cold pathologizing or presumptive assumptions.
                  </div>
                </div>
              </div>
            )}

            {/* PII Warnings */}
            {piiWarnings.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-900">
                <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">PII Shield Flag:</div>
                  {piiWarnings.map((w, idx) => (
                    <div key={idx}>• {w}</div>
                  ))}
                  <div className="text-[11px] text-rose-700 mt-1">
                    Please ensure no community member's personal identity or contact info is disclosed.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Q-Voice Assistant Toolbar */}
          <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold font-display text-purple-900">
                  AI Brand Voice Assistant
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={rewriteStyle}
                  onChange={(e) => setRewriteStyle(e.target.value)}
                  className="text-xs bg-white border border-purple-200 text-purple-900 px-2.5 py-1 rounded-full focus:outline-none cursor-pointer font-medium"
                >
                  <option value="Warm & Supportive">Warm & Supportive</option>
                  <option value="Direct & Clear">Direct & Clear</option>
                  <option value="Helpline & Safe Haven">Helpline & Safe Haven</option>
                  <option value="Celebratory Community">Celebratory Community</option>
                </select>

                <button
                  type="button"
                  onClick={handleAiPolish}
                  disabled={isRewriting || !content.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isRewriting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Polish with Q Voice</span>
                </button>
              </div>
            </div>

            {aiNote && (
              <p className="text-xs text-purple-800 bg-white/80 p-2.5 rounded-xl border border-purple-200/60">
                ✨ <span className="font-semibold">Editorial Enhancement:</span> {aiNote}
              </p>
            )}
          </div>

          {/* Attached Media Asset Shelf */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700">
                Visual Assets ({mediaUrls.length})
              </label>
              <div className="flex items-center gap-2">
                {mediaUrls.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEditingMediaIndex(0)}
                    className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full cursor-pointer flex items-center gap-1.5 transition-colors"
                    title="Open creative media studio: background removal, drawing brush, and typography text boxes"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                    <span>Alter Media Studio</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAttachAsset}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700 cursor-pointer flex items-center gap-1"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>+ Pick from Shared Library</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative group w-20 h-20 rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img src={url} alt="Attached asset" className="w-full h-full object-contain p-1" />
                  
                  {/* Overlay Action Buttons */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                    <button
                      type="button"
                      onClick={() => setEditingMediaIndex(i)}
                      className="w-7 h-7 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                      title="Alter this media (cutout, draw, add text)"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(i)}
                      className="w-7 h-7 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                      title="Remove asset"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAttachAsset}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 hover:border-purple-400 hover:bg-purple-50/50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Add Media</span>
              </button>
            </div>
          </div>

          {/* Hashtags Manager */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Community Tags ({tags.length})
              </label>
              <button
                type="button"
                onClick={handleGenerateHashtags}
                disabled={isGeneratingTags}
                className="text-xs font-medium text-purple-600 hover:text-purple-700 cursor-pointer flex items-center gap-1"
              >
                <Hash className="w-3.5 h-3.5" />
                <span>{isGeneratingTags ? 'Generating...' : 'AI Suggest Tags'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {tags.map(t => (
                <span 
                  key={t}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono rounded-full"
                >
                  <span>{t}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="#addtag"
                  className="text-xs px-2.5 py-1 bg-slate-100 rounded-full border border-slate-200 w-24 focus:w-32 focus:bg-white focus:outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Schedule & PII Shield Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>Broadcast Schedule Slot</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                Optimal time: 7:30 PM (Evening safe reflection window)
              </span>
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={piiVerified}
                  onChange={(e) => setPiiVerified(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
                <span>Confirm PII Shield & Anonymity</span>
              </label>
              <p className="text-[11px] text-slate-500 leading-tight">
                Certifies that no confidential disclosures, personal emails, or sensitive medical info appear in this broadcast.
              </p>
            </div>
          </div>

          {/* Owner Requirement Notice for Website */}
          {hasWebsiteTarget && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Crown className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-purple-900 flex items-center gap-1.5">
                  <span>Website Publishing Policy (q-ai.online)</span>
                  <span className="text-[10px] font-mono bg-purple-200/80 text-purple-800 px-2 py-0.5 rounded-full">
                    Owner Exclusive
                  </span>
                </div>
                <p className="text-purple-700 leading-relaxed">
                  Articles and broadcasts to the official portal must be published or authorized by Owner Scott Harvey-Whittle. 
                  {isOwner 
                    ? ' You are authenticated as Owner/Admin (Scott Harvey-Whittle) and may broadcast or approve directly.' 
                    : ' Please submit this draft to the Approval Queue for Scott\'s review and sign-off.'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Publishing & Approval Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onSaveDraft(buildPostPayload())}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Save Local Draft
            </button>

            <div className="flex items-center gap-3">
              {hasWebsiteTarget && !isOwner ? (
                <div 
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 flex items-center gap-1.5 cursor-not-allowed"
                  title="Website broadcast requires Owner authorization (Scott Harvey-Whittle). Submit to Approval Queue instead."
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Instant Broadcast (Owner Only)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
                    onPublishDirect(buildPostPayload());
                  }}
                  disabled={isOverLimit}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Instant Broadcast</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
                  onSubmitForApproval(buildPostPayload());
                }}
                disabled={isOverLimit}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-pride-spectrum hover:opacity-95 shadow-glow-purple transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit to Approval Queue</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Right 5 cols: Live Device & Cross-Platform Preview Switcher */}
      <div className="lg:col-span-5 space-y-4">
        
        {/* Mockup Preview Switcher Tabs */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-display text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-purple-600" />
              <span>Live Channel Mockup Preview</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {currentPlatformSpec.optimalRatio}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl">
            {selectedPlatforms.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPreviewPlatform(p)}
                className={`flex-1 py-1 px-2.5 text-xs font-semibold rounded-xl capitalize transition-all cursor-pointer ${
                  previewPlatform === p 
                    ? 'bg-white text-purple-700 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Platform Card Mockup */}
        <div className="bg-slate-900/5 rounded-3xl p-4 sm:p-6 border border-slate-200/80 flex items-center justify-center">
          
          {/* Instagram Phone Mockup */}
          {previewPlatform === 'instagram' && (
            <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden text-slate-900 font-sans">
              {/* Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#020617] border border-purple-500/40 p-0.5 overflow-hidden flex items-center justify-center">
                    <QLogo className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-none">qintelligence.app</div>
                    <div className="text-[10px] text-slate-500 font-mono">LGBTQ+ Wellbeing</div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-bold">•••</span>
              </div>

              {/* Media Graphic */}
              <div className="w-full aspect-square bg-cosmic-gradient relative overflow-hidden flex items-center justify-center">
                {mediaUrls[0] ? (
                  <img src={mediaUrls[0]} alt="Post Visual" className="w-full h-full object-contain p-4" />
                ) : (
                  <div className="text-center p-6 text-white space-y-2">
                    <div className="w-16 h-16 rounded-full bg-white/10 mx-auto flex items-center justify-center p-2">
                      <QLogo className="w-12 h-12 object-contain" glow={true} />
                    </div>
                    <p className="text-sm font-display font-bold">Q Intelligence</p>
                  </div>
                )}
                {/* Pride Topline in mockup */}
                <div className="absolute top-0 inset-x-0 h-1 bg-pride-spectrum"></div>
              </div>

              {/* Engagement icons */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-700">
                    <span className="text-rose-500 text-sm font-bold">❤️ 1,248</span>
                    <span className="text-sm">💬 84</span>
                    <span className="text-sm">↗️</span>
                  </div>
                  <span className="text-sm">🔖</span>
                </div>

                {/* Caption */}
                <div className="text-xs leading-relaxed">
                  <span className="font-bold mr-1.5">qintelligence.app</span>
                  <span>{content || "Hi there. We're here for you—always."}</span>
                  {tags.length > 0 && (
                    <div className="text-purple-600 mt-1 font-mono text-[11px]">
                      {tags.join(' ')}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono pt-1">
                  Scheduled for {new Date(scheduledDateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          )}

          {/* LinkedIn Mockup */}
          {previewPlatform === 'linkedin' && (
            <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-md p-4 text-slate-900 space-y-3 font-sans">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#020617] p-1 border border-purple-400 overflow-hidden flex items-center justify-center">
                  <QLogo className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-xs font-bold">Q Intelligence</div>
                  <div className="text-[10px] text-slate-500">
                    4,820 followers • 2h • 🌐
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-800">
                {content || "How does Q protect your reflection? We believe privacy is a core right, not an afterthought."}
              </p>

              {tags.length > 0 && (
                <div className="text-[11px] font-semibold text-blue-700">
                  {tags.join(' ')}
                </div>
              )}

              {mediaUrls[0] && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video flex items-center justify-center">
                  <img src={mediaUrls[0]} alt="Media" className="w-full h-full object-contain p-2" />
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>👍 412 Likes</span>
                <span>💬 28 Comments</span>
                <span>🔁 64 Reposts</span>
              </div>
            </div>
          )}

          {/* X / Twitter Mockup */}
          {previewPlatform === 'twitter' && (
            <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-md p-4 text-slate-900 space-y-3 font-sans">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#020617] p-1 border border-purple-400 shrink-0 flex items-center justify-center overflow-hidden">
                  <QLogo className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">Q Intelligence</span>
                    <span className="text-cyan-500 text-xs">☑️</span>
                    <span className="text-xs text-slate-400">@QIntelligence</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-800">
                    {content || "Hi there. However your week is unfolding, remember that your feelings are valid. 💜"}
                  </p>
                  {tags.length > 0 && (
                    <div className="text-[11px] text-cyan-600 font-mono">
                      {tags.join(' ')}
                    </div>
                  )}
                  {mediaUrls[0] && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video flex items-center justify-center">
                      <img src={mediaUrls[0]} alt="Media" className="w-full h-full object-contain p-2" />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 font-mono">
                    <span>💬 32</span>
                    <span>🔁 142</span>
                    <span>❤️ 890</span>
                    <span>📊 12.4K</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Threads / Bluesky / TikTok Fallback Card */}
          {(previewPlatform === 'threads' || previewPlatform === 'tiktok' || previewPlatform === 'bluesky' || previewPlatform === 'facebook') && (
            <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-md p-5 text-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white border border-purple-300 p-1 flex items-center justify-center overflow-hidden shadow-xs">
                    <QLogo className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs font-bold">Q Intelligence ({PLATFORM_SPECS[previewPlatform]?.name})</span>
                </div>
                <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                  Official Feed
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-800">
                {content || "I'm here for you—always. Your private space for LGBTQ+ wellbeing."}
              </p>
              {mediaUrls[0] && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-square flex items-center justify-center">
                  <img src={mediaUrls[0]} alt="Media" className="w-full h-full object-contain p-2" />
                </div>
              )}
            </div>
          )}

          {/* Official Website (q-ai.online) Web Portal Mockup */}
          {previewPlatform === 'website' && (
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden font-sans text-slate-900">
              {/* Browser Window Chrome */}
              <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
                <div className="bg-white border border-slate-200 px-3 py-0.5 rounded-md text-[10px] font-mono text-slate-600 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-emerald-600" />
                  <span>https://q-ai.online/journal/{title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'wellbeing-update'}</span>
                </div>
                <div className="w-8"></div>
              </div>

              {/* Website Header Bar */}
              <div className="px-4 py-3 bg-[#020617] text-white flex items-center justify-between border-b border-purple-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/10 p-1 flex items-center justify-center">
                    <QLogo className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="text-xs font-bold font-display leading-none">Q INTELLIGENCE</div>
                    <div className="text-[9px] text-purple-300 font-mono">Official Community Journal</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-200">
                  q-ai.online
                </span>
              </div>

              {/* Pride Gradient Topline */}
              <div className="h-1 bg-pride-spectrum"></div>

              {/* Article Container */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-semibold rounded-md font-mono">
                    {campaign || 'General Wellbeing'}
                  </span>
                  <span className="text-slate-400 font-mono">
                    • {new Date(scheduledDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-slate-400 font-mono">• 3 min read</span>
                </div>

                <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 leading-tight">
                  {title || 'Community Wellbeing Spotlight'}
                </h3>

                {/* Author Info */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    alt="Scott Harvey-Whittle"
                    className="w-7 h-7 rounded-full object-cover border border-purple-200"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                      <span>Scott Harvey-Whittle</span>
                      <Crown className="w-3 h-3 text-purple-600" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Owner & Communications Director</div>
                  </div>
                </div>

                {/* Cover Media Graphic */}
                {mediaUrls[0] && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video flex items-center justify-center">
                    <img src={mediaUrls[0]} alt="Media" className="w-full h-full object-contain p-2" />
                  </div>
                )}

                {/* Body Content */}
                <div className="text-xs text-slate-700 leading-relaxed space-y-2 whitespace-pre-wrap">
                  {content || "Welcome to Q Intelligence. Your private, evidence-based sanctuary for LGBTQ+ wellbeing. We believe that everyone deserves affirmative, accessible mental health support and community guidance."}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {tags.map(t => (
                      <span key={t} className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Owner Verification Seal */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5 text-purple-800 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Verified Website Dispatch</span>
                  </div>
                  <span className="text-slate-400">Scott Harvey-Whittle Sign-off</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Media Alteration Studio Modal */}
      {editingMediaIndex !== null && mediaUrls[editingMediaIndex] && (
        <MediaEditorModal
          isOpen={true}
          initialImageSrc={mediaUrls[editingMediaIndex]}
          onClose={() => setEditingMediaIndex(null)}
          onSave={(alteredUrl) => {
            setMediaUrls(prev => prev.map((url, idx) => idx === editingMediaIndex ? alteredUrl : url));
            setEditingMediaIndex(null);
          }}
        />
      )}

    </div>
  );
};
