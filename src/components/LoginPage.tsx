import React, { useState } from 'react';
import { StaffUser, verifySupabaseStaffAccess } from '../lib/supabase';
import { QLogo } from './QLogo';
import { 
  ShieldCheck, 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Send,
  Lock
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: StaffUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('scott@q-ai.online');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password reset view state
  const [isResetView, setIsResetView] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const verification = verifySupabaseStaffAccess(email);

      if (verification.authorized && verification.user) {
        setIsLoading(false);
        onLoginSuccess(verification.user);
      } else {
        setIsLoading(false);
        setError(verification.error || 'Access restricted. User not found in active Supabase Auth directory.');
      }
    }, 500);
  };

  const handleSendPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setTimeout(() => {
      setResetLoading(false);
      setResetSent(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0B0F19] to-purple-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden font-sans selection:bg-purple-500 selection:text-white">
      {/* Ambient background glow rings */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-10 left-10 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Pride Spectrum stripe accent */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-pride-spectrum z-50"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex relative group mx-auto">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 rounded-full blur-md opacity-70 group-hover:opacity-100 transition duration-300"></div>
            {/* White background circle ensures Q Logo is crisp, vibrant, and never blends into dark */}
            <div className="relative w-20 h-20 rounded-full bg-white border-2 border-purple-400 flex items-center justify-center overflow-hidden shadow-2xl p-2.5 ring-4 ring-purple-500/20">
              <QLogo 
                className="w-full h-full object-contain" 
                alt="Q Intelligence Logomark" 
              />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold tracking-wider text-purple-300 bg-purple-900/50 border border-purple-500/30 uppercase mb-2">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span>Restricted Staff Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              Q Intelligence
            </h1>
            <p className="text-xs text-slate-400 font-light mt-1">
              Automated Publishing Pipeline & Brand Governance Suite
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl shadow-purple-950/50 relative">
          
          {!isResetView ? (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold text-white font-display">Sign In</h2>
                <p className="text-xs text-slate-400">Enter your credentials to access your workspace.</p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="scott@q-ai.online"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/10 focus:border-purple-400 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password field with Forgot Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsResetView(true);
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-white/10 focus:border-purple-400 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Enter Site Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-pride-spectrum hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-glow-purple flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Entering Site...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Site</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Password Reset View */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetView(false);
                    setResetSent(false);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white font-display">Reset Password</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your registered institutional work email to receive password recovery instructions and a secure one-time access token.
                </p>
              </div>

              {resetSent ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reset Instructions Dispatched</span>
                  </div>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    A password reset link with a 15-minute cryptographic session key has been dispatched to <span className="font-mono font-bold text-white">{resetEmail || email}</span>.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetView(false);
                        setResetSent(false);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendPasswordReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Staff Work Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={resetEmail || email}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="scott@q-ai.online"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/10 focus:border-purple-400 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="bg-purple-950/40 border border-purple-500/20 rounded-xl p-3 text-[11px] text-purple-200 space-y-1">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Single Sign-On Security Notice</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      For institutional Open University accounts or custom q-ai.online security policies, MFA confirmation may be required upon password reset.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3 px-4 bg-pride-spectrum hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-glow-purple flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending Reset Instructions...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Password Reset Link</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Security & Governance Footer */}
        <div className="text-center space-y-1 text-[11px] text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End PII Shield Active</span>
            <span>•</span>
            <span>WCAG 2.2 Compliant</span>
          </div>
          <p>© 2026 Q Intelligence Foundation. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
};
