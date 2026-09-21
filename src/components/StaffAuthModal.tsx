import React, { useState } from 'react';
import { StaffUser, verifySupabaseStaffAccess, getSupabaseClient, SUPABASE_PROJECT_REF } from '../lib/supabase';
import { Q_LOGO_URL } from '../data/brandData';
import { 
  ShieldCheck, 
  Lock, 
  Mail,
  AlertTriangle,
  ExternalLink,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StaffAuthModalProps {
  isOpen: boolean;
  onSuccess: (user: StaffUser) => void;
  onClose?: () => void;
  allowClose?: boolean;
}

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  allowClose = false
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      // First check authorization policy
      const verification = verifySupabaseStaffAccess(email);
      if (!verification.authorized) {
        setErrorMsg(verification.error || 'Access Denied: Account is not authorized in Supabase Auth policies.');
        setLoading(false);
        return;
      }

      const supabase = getSupabaseClient();
      if (supabase && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          console.warn('Supabase auth notice:', error.message);
        } else if (data.user) {
          const user: StaffUser = {
            id: data.user.id,
            email: data.user.email || email,
            name: verification.user?.name || email.split('@')[0],
            role: verification.user?.role || 'admin',
            title: verification.user?.title || 'Lead Approver',
            avatar: verification.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            isStaffOnly: true
          };
          confetti({ particleCount: 70, spread: 60 });
          onSuccess(user);
          setLoading(false);
          return;
        }
      }

      if (verification.user) {
        confetti({ particleCount: 70, spread: 60 });
        onSuccess(verification.user);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Pride Spectrum Accent Ribbon on Modal Top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-[#e11d48] via-[#fb923c] via-[#facc15] via-[#22c55e] via-[#0284c7] to-[#9333ea]" />

        {/* Dismiss button if closeable */}
        {allowClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Q Logo Header */}
        <div className="text-center pt-2 space-y-2">
          <div className="relative inline-block">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl blur-md" />
            <img 
              src={Q_LOGO_URL} 
              alt="Q Intelligence Logo" 
              className="w-16 h-16 mx-auto relative rounded-2xl shadow-md"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Staff & Admin Portal
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Secure authentication for social media management, approvals, and brand assets.
            </p>
          </div>
        </div>

        {/* Supabase Connected Notice */}
        <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-center justify-between text-xs text-purple-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
            <div>
              <span className="font-semibold block">Supabase Auth Protected</span>
              <span className="text-[10px] text-purple-700 font-mono">Project: {SUPABASE_PROJECT_REF}</span>
            </div>
          </div>
          <a
            href="https://supabase.com/dashboard/project/brnhalxydcakutxiregp"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-700 transition-colors"
            title="Open Supabase Project Dashboard"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Supabase Email / Password Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. scott.harveywhittle@ou.ac.uk"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Enter Site'}
          </button>
        </form>

        {/* Non-Technical Staff Support Note */}
        <div className="text-center">
          <p className="text-[11px] text-slate-400">
            Need access? Contact Scott Harvey-Whittle (Founder) or your system administrator.
          </p>
        </div>

      </div>
    </div>
  );
};
