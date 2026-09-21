import React from 'react';
import { PostItem, PostVersion } from '../types';
import { 
  History, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  User, 
  FileText, 
  ShieldCheck, 
  X, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VersionHistoryModalProps {
  post: PostItem;
  isOpen: boolean;
  onClose: () => void;
  onRevertVersion: (postId: string, version: PostVersion) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  post,
  isOpen,
  onClose,
  onRevertVersion,
}) => {
  if (!isOpen) return null;

  const versions = post.versionHistory && post.versionHistory.length > 0 
    ? post.versionHistory 
    : [
        {
          versionId: `v-init-${post.id}`,
          versionNumber: 'v1.0',
          timestamp: post.lastModified || 'Initial creation',
          modifiedBy: post.author.name,
          authorRole: post.author.role,
          changesSummary: 'Original broadcast draft created.',
          contentSnapshot: post.content,
          titleSnapshot: post.title,
          platformsSnapshot: post.platforms,
          mediaUrlsSnapshot: post.mediaUrls,
          complianceScoreSnapshot: post.complianceAudit?.score || 95,
          statusSnapshot: post.status
        }
      ];

  const handleRevert = (v: PostVersion) => {
    onRevertVersion(post.id, v);
    confetti({ particleCount: 50, spread: 60 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-display text-slate-900">
                  Version History & Audit Trail
                </h3>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {post.currentVersion || 'v1.0'} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every edit and approved revision is tracked safely so you can restore previous drafts anytime.
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

        {/* Post Title Context */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
          <div className="truncate">
            <span className="text-slate-400 font-medium mr-1.5">Post:</span>
            <span className="font-bold text-slate-800">{post.title}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 shrink-0 capitalize">
            Current Status: {post.status.replace('_', ' ')}
          </span>
        </div>

        {/* Timeline of Revisions */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Revisions Timeline ({versions.length})
          </h4>

          <div className="space-y-3">
            {versions.map((v, idx) => {
              const isCurrent = v.versionNumber === (post.currentVersion || 'v1.0');
              return (
                <div
                  key={v.versionId || idx}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                    isCurrent
                      ? 'bg-purple-50/50 border-purple-300 ring-1 ring-purple-400/30'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                        isCurrent ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {v.versionNumber}
                      </span>
                      <span className="font-semibold text-slate-900">{v.modifiedBy}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({v.authorRole})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{v.timestamp}</span>
                      </span>

                      {isCurrent ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Current Version</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevert(v)}
                          className="px-3 py-1 bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-700 font-semibold rounded-full transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Revert to this</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary of what changed */}
                  <div className="text-slate-600 bg-white/70 p-2.5 rounded-xl border border-black/5 leading-relaxed font-sans">
                    <span className="font-semibold text-slate-800 mr-1">Summary:</span>
                    <span>{v.changesSummary}</span>
                  </div>

                  {/* Content snapshot snippet */}
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 italic">
                    "{v.contentSnapshot}"
                  </div>

                  {/* Snapshot Meta Stats */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Compliance Score at snapshot: <strong className="text-slate-700">{v.complianceScoreSnapshot}%</strong></span>
                    </div>
                    <span className="capitalize font-medium text-slate-600">
                      Channels: {v.platformsSnapshot?.join(', ') || 'cross-platform'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info for non-technical users */}
        <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200/80 flex items-start gap-2 text-xs text-purple-900">
          <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Non-Technical Tip:</strong> If you ever make an accidental edit or want to go back to an approved draft, simply click "Revert to this" on the desired revision. Your team's audit log will automatically record the restoration.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close History
          </button>
        </div>

      </div>
    </div>
  );
};
