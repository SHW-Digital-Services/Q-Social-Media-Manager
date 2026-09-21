import React from 'react';
import { 
  Sparkles, 
  Send, 
  Calendar, 
  History, 
  FolderOpen, 
  HelpCircle, 
  CheckCircle2, 
  X, 
  ShieldCheck,
  Palette,
  HeartHandshake
} from 'lucide-react';
import { Q_LOGO_URL } from '../data/brandData';

interface StaffQuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const StaffQuickGuideModal: React.FC<StaffQuickGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '1',
      title: 'Compose Your Broadcast',
      description: 'Go to the Broadcast Composer. Write your text or pick an official design template. The system checks your character limits for Instagram, X/Twitter, LinkedIn, and Threads automatically.',
      icon: Send,
      color: 'bg-purple-100 text-purple-700',
      actionTab: 'composer',
      actionLabel: 'Open Composer'
    },
    {
      step: '2',
      title: 'Auto-Polish with Q Voice AI',
      description: 'Unsure about tone? Click "AI Polish to Q Voice". Our brand AI ensures your message is warm, clear, affirming, and protective—without any cold or clinical jargon.',
      icon: Sparkles,
      color: 'bg-pink-100 text-pink-700',
      actionTab: 'compliance',
      actionLabel: 'Test Brand Tone'
    },
    {
      step: '3',
      title: 'Review on the Visual Calendar',
      description: 'Switch to the Content Calendar to view the entire month at a glance. Posts are color-coded (Amber for pending review, Green for approved, Blue for scheduled). Click any day to add a post.',
      icon: Calendar,
      color: 'bg-indigo-100 text-indigo-700',
      actionTab: 'calendar',
      actionLabel: 'View Calendar'
    },
    {
      step: '4',
      title: 'Track Versions & Revert Mistakes',
      description: 'Every edit creates an automatic revision (v1.0, v1.1). If you ever want to restore an earlier draft or previous asset image, simply click "Version History" and "Revert".',
      icon: History,
      color: 'bg-emerald-100 text-emerald-700',
      actionTab: 'queue',
      actionLabel: 'Check Approval Queue'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center p-1.5">
              <img src={Q_LOGO_URL} alt="Q" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-display text-slate-900">
                  Staff Quick Guide
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Easy 4-Step Walkthrough
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Everything you need to schedule, polish, and publish brand-compliant communications.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((s) => {
            const IconComponent = s.icon;
            return (
              <div
                key={s.step}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                      {s.step}
                    </span>
                    <div className={`p-2 rounded-xl ${s.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">
                    {s.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab(s.actionTab);
                      onClose();
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    {s.actionLabel} →
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Brand Voice Rulebook Summary Box */}
        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-purple-900">
            <HeartHandshake className="w-4 h-4 text-purple-700" />
            <span>Q Brand Voice Golden Rules</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-purple-900/90 leading-snug">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Welcoming & Gentle:</strong> Let users set the pace without pressure.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Affirming:</strong> Validate diverse identities and self-expression.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>No Clinical Labels:</strong> Do not diagnose or pathologize feelings.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Never Presume:</strong> Do not assume pronouns, family, or closet status.</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            You can reopen this guide anytime from the top bar.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors cursor-pointer shadow-xs"
          >
            Got It, Let's Work!
          </button>
        </div>

      </div>
    </div>
  );
};
