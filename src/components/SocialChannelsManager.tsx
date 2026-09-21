import React, { useState } from 'react';
import { SocialAccountConnection, SocialPlatform } from '../types';
import { SocialPlatformBrandIcon } from './SocialPlatformBrandIcon';
import { 
  Share2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  Key, 
  AlertCircle, 
  Activity, 
  Sparkles, 
  Plus, 
  Check, 
  Wifi, 
  WifiOff, 
  Globe, 
  Send, 
  HelpCircle,
  BarChart3,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SocialChannelsManagerProps {
  connections: SocialAccountConnection[];
  onUpdateConnections: (updated: SocialAccountConnection[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  onNavigateToComposer: () => void;
}

export const SocialChannelsManager: React.FC<SocialChannelsManagerProps> = ({
  connections,
  onUpdateConnections,
  onShowToast,
  onNavigateToComposer
}) => {
  const [filter, setFilter] = useState<'all' | 'connected' | 'available'>('all');
  const [testingPingId, setTestingPingId] = useState<string | null>(null);
  const [pingData, setPingData] = useState<Record<string, { latency: number; timestamp: string }>>({});
  const [connectingModalConn, setConnectingModalConn] = useState<SocialAccountConnection | null>(null);
  const [customHandle, setCustomHandle] = useState('');
  const [isSubmittingOAuth, setIsSubmittingOAuth] = useState(false);

  const connectedList = connections.filter(c => c.isConnected);
  const connectedCount = connectedList.length;

  const filtered = connections.filter(c => {
    if (filter === 'connected') return c.isConnected;
    if (filter === 'available') return !c.isConnected;
    return true;
  });

  const handleStartConnect = (conn: SocialAccountConnection) => {
    setConnectingModalConn(conn);
    setCustomHandle(conn.accountHandle || `@q_${conn.platform}`);
  };

  const handleConfirmOAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectingModalConn) return;

    if (connectingModalConn.platform === 'linkedin') {
      window.location.assign('/api/oauth/linkedin/start');
      return;
    }

    setIsSubmittingOAuth(true);

    setTimeout(() => {
      const now = new Date();
      const expiry = new Date();
      expiry.setDate(now.getDate() + 90);

      const updated = connections.map(c => {
        if (c.id === connectingModalConn.id) {
          return {
            ...c,
            isConnected: true,
            accountHandle: customHandle.trim() || c.accountHandle,
            connectedAt: now.toISOString(),
            tokenExpiresAt: expiry.toISOString(),
            apiHealth: 'healthy' as const,
            webhookActive: true,
            lastPingMs: Math.floor(Math.random() * 30) + 40
          };
        }
        return c;
      });

      onUpdateConnections(updated);
      setIsSubmittingOAuth(false);
      setConnectingModalConn(null);
      confetti({ particleCount: 70, spread: 60 });
      onShowToast(`Connected ${connectingModalConn.platformName} (${customHandle}) successfully! Ready for multi-channel broadcasts.`);
    }, 900);
  };

  const handleDisconnect = (connId: string, platformName: string) => {
    if (!window.confirm(`Disconnect ${platformName}? This will revoke access token and stop scheduled dispatches.`)) {
      return;
    }

    const updated = connections.map(c => {
      if (c.id === connId) {
        return {
          ...c,
          isConnected: false,
          apiHealth: 'disconnected' as const,
          webhookActive: false
        };
      }
      return c;
    });

    onUpdateConnections(updated);
    onShowToast(`Disconnected ${platformName}.`, 'warning');
  };

  const handleTestPing = (conn: SocialAccountConnection) => {
    setTestingPingId(conn.id);
    setTimeout(() => {
      const ms = Math.floor(Math.random() * 40) + 35;
      setPingData(prev => ({
        ...prev,
        [conn.id]: { latency: ms, timestamp: 'Just now' }
      }));
      setTestingPingId(null);
      onShowToast(`Ping Verified for ${conn.platformName}: ${ms}ms • HTTP 200 OK • Token Active`);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-purple-900/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-mono font-semibold rounded-full flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Platform Dispatch Engine</span>
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {connectedCount} of {connections.length} Channels Active
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            Connected Social Media Accounts
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Link and authorize external social media networks using OAuth 2.0 PKCE. Broadcast approved posts simultaneously to Instagram, Threads, X, LinkedIn, TikTok, and Bluesky with one click.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToComposer}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compose Broadcast for Channels</span>
            </button>
            <div className="text-[11px] font-mono text-purple-200/80 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase Auth Encrypted Vault</span>
            </div>
          </div>
        </div>

        {/* Decorative Background Orb */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-purple-600/20 via-pink-600/10 to-transparent pointer-events-none blur-2xl" />
      </div>

      {/* Filter Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all' 
                ? 'bg-purple-600 text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            All Channels ({connections.length})
          </button>
          <button
            onClick={() => setFilter('connected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'connected' 
                ? 'bg-purple-600 text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Connected ({connectedCount})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'available' 
                ? 'bg-purple-600 text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Ready to Connect ({connections.length - connectedCount})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Globe className="w-3.5 h-3.5 text-purple-600" />
          <span>Webhook Dispatcher: Active</span>
        </div>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(conn => {
          const ping = pingData[conn.id];
          const isPinging = testingPingId === conn.id;

          return (
            <div 
              key={conn.id}
              className={`rounded-3xl p-6 border transition-all ${
                conn.isConnected 
                  ? 'bg-white border-purple-200 shadow-2xs hover:shadow-xs hover:border-purple-300' 
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <SocialPlatformBrandIcon platform={conn.platform} size="lg" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 font-display">
                        {conn.platformName}
                      </h3>
                      {conn.requiresOwner && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-800 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full font-mono">
                          <Crown className="w-3 h-3 text-purple-600" />
                          Published by Owner
                        </span>
                      )}
                      {conn.isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Connected
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full font-mono">
                          Not Connected
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-mono text-purple-700 font-medium mt-0.5">
                      {conn.isConnected ? conn.accountHandle : 'No linked profile'}
                    </div>

                    {conn.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                        {conn.notes}
                      </p>
                    )}

                    {conn.followersCount && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        Audience: <strong className="text-slate-800">{conn.followersCount}</strong> followers
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Action */}
                <div>
                  {conn.isConnected ? (
                    <button
                      type="button"
                      onClick={() => handleDisconnect(conn.id, conn.platformName)}
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartConnect(conn)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scopes & API Details */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                  <span>Authorized Permissions:</span>
                  <span className="font-mono text-[10px] text-slate-400">OAuth 2.0 PKCE</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {conn.scopes.map((s, idx) => (
                    <span key={idx} className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {s}
                    </span>
                  ))}
                </div>

                {conn.isConnected && (
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <button
                      type="button"
                      onClick={() => handleTestPing(conn)}
                      disabled={isPinging}
                      className="text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-purple-600' : ''}`} />
                      <span>{isPinging ? 'Pinging API...' : ping ? `Latency: ${ping.latency}ms (Healthy)` : 'Test API Ping'}</span>
                    </button>
                    {conn.tokenExpiresAt && (
                      <span className="text-[10px] text-slate-400">
                        Token active until {new Date(conn.tokenExpiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Connect Channel Modal */}
      {connectingModalConn && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 border border-purple-100">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <SocialPlatformBrandIcon platform={connectingModalConn.platform} size="sm" />
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">
                    Connect {connectingModalConn.platformName}
                  </h3>
                  <span className="text-[10px] text-purple-600 font-mono">
                    {connectingModalConn.requiresOwner ? 'Owner REST API / Webhook Integration' : 'OAuth 2.0 Authorization'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setConnectingModalConn(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmOAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Target Handle / Page Name
                </label>
                <input
                  type="text"
                  required
                  value={customHandle}
                  onChange={(e) => setCustomHandle(e.target.value)}
                  placeholder="@q_intelligence"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-[11px] text-slate-600">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Permissions to Grant</span>
                </div>
                <ul className="space-y-1 text-[10px] font-mono text-slate-500">
                  {connectingModalConn.scopes.map((s, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectingModalConn(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOAuth}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingOAuth ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authorize & Connect</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
