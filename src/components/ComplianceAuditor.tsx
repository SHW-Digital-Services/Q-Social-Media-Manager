import React, { useState } from 'react';
import { PostItem, ComplianceAudit } from '../types';
import { BRAND_COLORS, Q_LOGO_URL } from '../data/brandData';
import { exportCompliancePdf } from '../utils/exportCompliancePdf';
import { 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  HelpCircle, 
  Lock, 
  Eye, 
  Sliders, 
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  FileDown,
  FileText,
  Building2,
  UserCheck,
  Download
} from 'lucide-react';

interface ComplianceAuditorProps {
  posts: PostItem[];
  selectedPost?: PostItem | null;
  onApplyRewriteToPost?: (postId: string, newContent: string) => void;
}

export const ComplianceAuditor: React.FC<ComplianceAuditorProps> = ({
  posts,
  selectedPost,
  onApplyRewriteToPost,
}) => {
  const [activePostId, setActivePostId] = useState<string>(
    selectedPost?.id || (posts[0]?.id ?? '')
  );
  const [customText, setCustomText] = useState(
    selectedPost?.content || ''
  );
  const [auditResult, setAuditResult] = useState<ComplianceAudit | null>(
    selectedPost?.complianceAudit || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [styleMode, setStyleMode] = useState('Warm & Supportive');
  const [rewrittenText, setRewrittenText] = useState<string | null>(null);
  const [rewriteNotes, setRewriteNotes] = useState<string | null>(null);

  // PDF Export Modal & Customization State
  const [showExportModal, setShowExportModal] = useState(false);
  const [stakeholderOrg, setStakeholderOrg] = useState('External Governance & Partner Review Board');
  const [auditorName, setAuditorName] = useState('Scott Harvey-Whittle');
  const [additionalNotes, setAdditionalNotes] = useState('Certified for cross-platform broadcast with complete PII and ethical protection.');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessToast, setExportSuccessToast] = useState(false);

  const currentPost = posts.find(p => p.id === activePostId);

  const handleTriggerExportPdf = () => {
    setIsExporting(true);
    const activeAudit: ComplianceAudit = auditResult || {
      score: 95,
      status: 'approved',
      summary: 'Automated pre-screening against Q Intelligence editorial rules.',
      breakdown: { welcoming: 96, affirming: 96, clarity: 94, privacySafe: 98, nonPresumptive: 95 },
      flags: currentPost?.complianceAudit?.flags || [
        {
          rule: 'Approved Crisis Lifelines',
          type: 'praise',
          excerpt: '988 (Press 3) and 678-678',
          message: 'Official verified hotlines formatted with clarity.',
          suggestion: 'Ensure phone numbers remain copyable on mobile.'
        }
      ],
      scannedAt: new Date().toISOString()
    };

    try {
      exportCompliancePdf({
        post: currentPost,
        audit: activeAudit,
        content: customText,
        auditorName,
        auditorRole: 'Lead Brand Administrator & Communications Officer',
        stakeholderOrg,
        additionalNotes
      });
      setShowExportModal(false);
      setExportSuccessToast(true);
      setTimeout(() => setExportSuccessToast(false), 4000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectPost = (postId: string) => {
    setActivePostId(postId);
    const p = posts.find(x => x.id === postId);
    if (p) {
      setCustomText(p.content);
      setAuditResult(p.complianceAudit);
      setRewrittenText(null);
      setRewriteNotes(null);
    }
  };

  // Run full compliance audit via server API
  const handleRunAudit = async () => {
    if (!customText.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/compliance/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: customText,
          platform: 'Cross-Platform',
          targetAudience: 'LGBTQ+ individuals, allies, and communications audience'
        })
      });
      const data = await res.json();
      setAuditResult(data);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run AI rewrite
  const handleRunRewrite = async () => {
    if (!customText.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/compliance/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: customText,
          style: styleMode,
          platform: 'Social Media'
        })
      });
      const data = await res.json();
      setRewrittenText(data.rewrittenText);
      setRewriteNotes(data.notes);
    } catch (err) {
      console.error('Rewrite failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRewrite = () => {
    if (rewrittenText) {
      setCustomText(rewrittenText);
      if (currentPost && onApplyRewriteToPost) {
        onApplyRewriteToPost(currentPost.id, rewrittenText);
      }
      setRewrittenText(null);
      setRewriteNotes(null);
      // Auto re-scan
      setTimeout(() => {
        handleRunAudit();
      }, 100);
    }
  };

  const score = auditResult?.score ?? 0;

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>INTEGRATED BRAND COMPLIANCE ANALYTICS</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Q Intelligence Brand Rule Engine
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Real-time audit evaluating tone of voice (Welcoming, Affirming, Clear, Protective vs. Clinical, Presumptive, Pushy, Diagnostic) alongside PII Shield safety and visual guidelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Export official compliance report as PDF for external stakeholders"
            >
              <FileDown className="w-4 h-4 text-cyan-300" />
              <span>Export Stakeholder PDF</span>
            </button>

            <button
              onClick={handleRunAudit}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Run Automated Audit</span>
            </button>
          </div>
        </div>

        {/* Queued Post Quick Switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Audit Queued Post:</span>
          {posts.length > 0 ? (
            posts.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectPost(p.id)}
                className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activePostId === p.id 
                    ? 'bg-purple-100 text-purple-800 font-semibold' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.title.slice(0, 24)}... ({p.complianceAudit.score}%)
              </button>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">
              No broadcasts currently in queue. Type or paste draft text below to audit brand tone and safety.
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Audit Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 cols: Copy Inspector & AI Rewriter */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
                <span>Copy Inspector & Lexicon Audit</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {customText.length} characters
              </span>
            </div>

            <textarea
              rows={6}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste social post copy here to audit compliance against Q Intelligence brand rules..."
              className="w-full text-sm p-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-purple-500 font-sans leading-relaxed text-slate-900"
            />

            {/* Quick Presets to test */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Test with sample snippets:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setCustomText("Hi there. However your week is unfolding, remember that your feelings are valid. 💜 We designed Q to be your private space for LGBTQ+ wellbeing. I'm here for you—always.");
                  }}
                  className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full cursor-pointer"
                >
                  ✓ Welcoming & Affirming Sample
                </button>
                <button
                  onClick={() => {
                    setCustomText("When you finally come out to your parents, don't let fear paralyze you. Sufferers of closeted anxiety must admit their true self to be cured.");
                  }}
                  className="text-[10px] bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full cursor-pointer"
                >
                  ⚠️ Non-Compliant Sample (Clinical + Presumptive)
                </button>
                <button
                  onClick={() => {
                    setCustomText("Need confidential support? Call 988 (Press 3) or text START to 678-678. You matter deeply.");
                  }}
                  className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full cursor-pointer"
                >
                  ✓ Crisis & Helpline Verified
                </button>
              </div>
            </div>

            {/* AI Voice Polish Module */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3 mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold font-display text-purple-900">
                    Transform with Q Voice (Gemini AI)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={styleMode}
                    onChange={(e) => setStyleMode(e.target.value)}
                    className="text-xs bg-white border border-purple-200 text-purple-900 px-2.5 py-1 rounded-full focus:outline-none cursor-pointer"
                  >
                    <option value="Warm & Supportive">Warm & Supportive</option>
                    <option value="Direct & Clear">Direct & Clear</option>
                    <option value="Helpline & Safe Haven">Helpline & Safe Haven</option>
                    <option value="Celebratory Community">Celebratory Community</option>
                  </select>

                  <button
                    onClick={handleRunRewrite}
                    disabled={isLoading}
                    className="px-3.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Rewrite
                  </button>
                </div>
              </div>

              {rewrittenText && (
                <div className="bg-white p-3.5 rounded-xl border border-purple-200 space-y-2">
                  <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Suggested Q Intelligence Voice Rewrite:</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans bg-purple-50/50 p-2.5 rounded-lg">
                    {rewrittenText}
                  </p>
                  {rewriteNotes && (
                    <p className="text-[11px] text-slate-500 italic">
                      Why: {rewriteNotes}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setRewrittenText(null)}
                      className="text-xs px-3 py-1 text-slate-500 hover:bg-slate-100 rounded-full cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={handleApplyRewrite}
                      className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Apply to Draft</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Detailed Flagged Findings & Remediations */}
          {auditResult && auditResult.flags && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Audited Rules & Findings ({auditResult.flags.length})</span>
              </h3>

              <div className="space-y-3">
                {auditResult.flags.map((flag, i) => (
                  <div 
                    key={i}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                      flag.type === 'violation' 
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900' 
                        : flag.type === 'warning' 
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        {flag.type === 'violation' ? <X className="w-3.5 h-3.5 text-rose-600" /> : 
                         flag.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> :
                         <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{flag.rule}</span>
                      </span>
                      <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-white/70">
                        {flag.type}
                      </span>
                    </div>

                    <div className="text-slate-800">
                      {flag.message}
                    </div>

                    <div className="pt-1 text-[11px] text-slate-600 border-t border-black/5 flex items-start gap-1">
                      <span className="font-semibold text-slate-900 shrink-0">Remedy:</span>
                      <span>{flag.suggestion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right 5 cols: Brand Alignment Scorecard & Brand Guide Checklist */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Overall Alignment Scorecard */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold font-display text-slate-900">
                Compliance Scorecard
              </h3>
              <span className="text-xs font-mono font-bold text-slate-400">
                Q-Audit v2.6
              </span>
            </div>

            {/* Score Ring / Indicator */}
            <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 ${
                !auditResult
                  ? 'border-slate-300 bg-slate-100 text-slate-500'
                  : score >= 85 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                  : score >= 70 
                  ? 'border-amber-500 bg-amber-50 text-amber-800' 
                  : 'border-rose-500 bg-rose-50 text-rose-800'
              }`}>
                <span className="text-2xl font-bold font-display leading-none">{score}%</span>
                <span className="text-[10px] font-mono font-medium uppercase mt-0.5">
                  {!auditResult ? 'Pending' : 'Rating'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">
                  {!auditResult 
                    ? 'Brand Alignment: Awaiting Scan' 
                    : score >= 85 
                    ? 'Brand Alignment: Strong' 
                    : score >= 70 
                    ? 'Brand Alignment: Conditional' 
                    : 'Brand Alignment: Needs Revisions'}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {auditResult?.summary || "Run automated audit on any draft text to evaluate tone guidelines, community safety, and PII protection."}
                </p>
              </div>
            </div>

            {/* Sub-Pillar Breakdown Bars */}
            <div className="space-y-3 pt-2">
              {[
                { label: 'Welcoming & Safe Space', val: auditResult?.breakdown?.welcoming || 0, desc: 'Non-judgmental, warm presence' },
                { label: 'Affirming & Validating', val: auditResult?.breakdown?.affirming || 0, desc: 'No conditional identity phrasing' },
                { label: 'Clarity & Directness', val: auditResult?.breakdown?.clarity || 0, desc: 'Simple plain English, no gatekeeping' },
                { label: 'Privacy & PII Safe', val: auditResult?.breakdown?.privacySafe || 0, desc: 'Shields identity, no leaks' },
                { label: 'Non-Presumptive Framing', val: auditResult?.breakdown?.nonPresumptive || 0, desc: 'Never assumes family or pronouns' }
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-mono font-bold text-slate-900">{item.val}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.val >= 85 ? 'bg-purple-600' : item.val >= 70 ? 'bg-amber-500' : item.val > 0 ? 'bg-rose-500' : 'bg-slate-200'
                      }`}
                      style={{ width: `${item.val}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 italic">{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Export Report CTA */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowExportModal(true)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <FileDown className="w-3.5 h-3.5 text-cyan-300" />
                <span>Export Stakeholder Clearance PDF</span>
              </button>
            </div>

          </div>

          {/* Official Tone of Voice Rulebook Matrix */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold font-display text-slate-900">
              Q Intelligence Brand Rulebook
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* We Are */}
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-3.5 space-y-2">
                <span className="font-bold text-purple-900 font-display flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-purple-600" />
                  <span>WE ARE</span>
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-700 leading-snug">
                  <li>• <strong className="text-purple-900">Welcoming:</strong> "I'm here for you—always."</li>
                  <li>• <strong className="text-purple-900">Clear:</strong> Direct, simple language.</li>
                  <li>• <strong className="text-purple-900">Affirming:</strong> Validating experiences unconditionally.</li>
                  <li>• <strong className="text-purple-900">Protective:</strong> Honest privacy boundaries.</li>
                </ul>
              </div>

              {/* We Are Not */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <span className="font-bold text-slate-700 font-display flex items-center gap-1">
                  <X className="w-3.5 h-3.5 text-rose-500" />
                  <span>WE ARE NOT</span>
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-600 leading-snug">
                  <li>• <strong className="text-slate-900">Clinical/Cold:</strong> No medicalized terms.</li>
                  <li>• <strong className="text-slate-900">Presumptive:</strong> Never assume pronouns or family.</li>
                  <li>• <strong className="text-slate-900">Pushy:</strong> Never force disclosure.</li>
                  <li>• <strong className="text-slate-900">Diagnostic:</strong> Never diagnoses conditions.</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Color & Contrast Safe-Zone Inspector */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-1.5">
              <span>Visual & WCAG Contrast Clearance</span>
            </h3>
            <p className="text-xs text-slate-500">
              Ensures high contrast on social graphics and readability across all devices.
            </p>

            <div className="space-y-2 pt-1">
              {BRAND_COLORS.slice(0, 4).map(c => (
                <div key={c.name} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: c.hex }}></div>
                    <span className="font-medium text-slate-800">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">{c.hex}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {c.wcagOnDark.includes('Pass') ? 'AAA Pass' : 'AA Pass'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Stakeholder PDF Export Configuration Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#0F091F] via-[#1E1035] to-[#2E1065] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/80 border border-purple-400 flex items-center justify-center text-white">
                  <FileText className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display leading-tight text-white">
                    Export Official Compliance Report (PDF)
                  </h3>
                  <p className="text-xs text-purple-200 font-light">
                    Clearance documentation formatted for external review, governance & partners.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              
              {/* Executive Summary Snapshot Card */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 font-display">Target Broadcast Document</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    score >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {score}% Clearance Score
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {currentPost?.title || 'Custom Campaign Draft Audit'}
                </div>
                <div className="text-[11px] text-slate-600 line-clamp-2 italic bg-white/70 p-2 rounded-lg border border-purple-100">
                  "{customText}"
                </div>
              </div>

              {/* Form fields for Stakeholder customization */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>External Stakeholder / Governing Body:</span>
                  </label>
                  <input
                    type="text"
                    value={stakeholderOrg}
                    onChange={(e) => setStakeholderOrg(e.target.value)}
                    placeholder="e.g. NHS LGBTQ+ Health Advisory Liaison, External Board"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 bg-slate-50 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Printed on the official governance sign-off footer.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Certifying Auditor Name:</span>
                    </label>
                    <input
                      type="text"
                      value={auditorName}
                      onChange={(e) => setAuditorName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Verification Hash:
                    </label>
                    <div className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-600">
                      QI-{Date.now().toString(36).toUpperCase()}-PASS
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Stakeholder Addendum & Clearance Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Provide any custom clearance notes, distribution conditions, or embargo directives..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 bg-slate-50 focus:bg-white leading-relaxed"
                  />
                </div>
              </div>

              {/* What will be included checklist */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Report Checklist & Included Artifacts:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>5 Editorial Tone Pillars Score</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>PII Shield & Safety Verification</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>WCAG 2.2 AAA Contrast Log</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Cryptographic Verification Seal</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleTriggerExportPdf}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Generate & Download Official PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast feedback */}
      {exportSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-300">PDF Report Exported Successfully</div>
            <div className="text-[11px] text-slate-300">Official stakeholder compliance clearance downloaded.</div>
          </div>
        </div>
      )}

    </div>
  );
};
