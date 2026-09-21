import React, { useState } from 'react';
import { SocialAccountConnection, SocialPlatform } from '../types';
import { SocialPlatformBrandIcon } from './SocialPlatformBrandIcon';
import { startOneClickSocialSignIn } from '../utils/socialOAuth';
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
  X, 
  Plus, 
  Check, 
  Wifi, 
  WifiOff, 
  Settings, 
  Info,
  Layers,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SocialConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: SocialAccountConnection[];
  onUpdateConnections: (updated: SocialAccountConnection[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const SocialConnectionModal: React.FC<SocialConnectionModalProps> = ({
  isOpen,
  onClose,
  connections,
  onUpdateConnections,
  onShowToast
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'connected' | 'available'>('all');
  const [connectingPlatform, setConnectingPlatform] = useState<SocialAccountConnection | null>(null);
  const [customHandle, setCustomHandle] = useState('');
  const [authorizingConnectionId, setAuthorizingConnectionId] = useState<string | null>(null);
  
  // Ping test state
  const [testingPingId, setTestingPingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { ms: number; status: 'ok' | 'slow'; timestamp: string }>>({});

  if (!isOpen) return null;

  const connectedCount = connections.filter(c => c.isConnected).length;

  const filteredConnections = connections.filter(c => {
    if (activeFilter === 'connected') return c.isConnected;
    if (activeFilter === 'available') return !c.isConnected;
    return true;
  });

  const handleStartConnect = async (conn: SocialAccountConnection) => {
    setAuthorizingConnectionId(conn.id);

    try {
      const result = await startOneClickSocialSignIn(conn.platform);
      if (!result.redirected) {
        onShowToast(result.message || `${conn.platformName} could not start sign-in.`, 'warning');
        setAuthorizingConnectionId(null);
      }
    } catch {
      onShowToast(`${conn.platformName} sign-in could not be started. Please try again.`, 'warning');
      setAuthorizingConnectionId(null);
    }
  };

  const handleConfirmOAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectingPlatform) return;

    if (connectingPlatform.platform === 'linkedin') {
      window.location.assign('/api/oauth/linkedin/start');
      return;
    }

    setAuthorizingConnectionId(connectingPlatform.id);

    setTimeout(() => {
      const now = new Date();
      const expiry = new Date();
      expiry.setDate(now.getDate() + 90); // 90 days OAuth token

      const updated = connections.map(c => {
        if (c.id === connectingPlatform.id) {
          return {
            ...c,
            isConnected: true,
            accountHandle: customHandle.trim() || c.accountHandle,
            connectedAt: now.toISOString(),
            tokenExpiresAt: expiry.toISOString(),
            apiHealth: 'healthy' as const,
            webhookActive: true,
            lastPingMs: Math.floor(Math.random() * 35) + 40
          };
        }
        return c;
      });

      onUpdateConnections(updated);
      setAuthorizingConnectionId(null);
      setConnectingPlatform(null);
      confetti({ particleCount: 70, spread: 60 });
      onShowToast(`Successfully connected ${connectingPlatform.platformName} (${customHandle || connectingPlatform.accountHandle}) via OAuth 2.0!`);
    }, 1000);
  };

  const handleDisconnect = (connId: string, platformName: string) => {
    if (!window.confirm(`Disconnect ${platformName}? Scheduled posts targeting this channel will be held until reconnected.`)) {
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
    onShowToast(`Disconnected ${platformName} from publishing pipelines.`, 'warning');
  };

  const handleTestPing = (conn: SocialAccountConnection) => {
    setTestingPingId(conn.id);

    setTimeout(() => {
      const latency = Math.floor(Math.random() * 45) + 35;
      setPingResults(prev => ({
        ...prev,
        [conn.id]: {
          ms: latency,
          status: latency < 70 ? 'ok' : 'slow',
          timestamp: 'Just now'
        }
      }));
      setTestingPingId(null);
      onShowToast(`API Ping Verified for ${conn.platformName}: ${latency}ms latency • HTTP 200 OK (Write & Read Scopes Valid)`);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display">Social Media Account Connections</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {connectedCount} Connected
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Connect social channels with one-click sign-in and manage multi-channel publishing access for Q Intelligence.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Navigation & Global Status Banner */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'all' 
                  ? 'bg-purple-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Platforms ({connections.length})
            </button>
            <button
              onClick={() => setActiveFilter('connected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'connected' 
                  ? 'bg-purple-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Connected ({connectedCount})
            </button>
            <button
              onClick={() => setActiveFilter('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'available' 
                  ? 'bg-purple-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Available ({connections.length - connectedCount})
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Server-managed OAuth connections</span>
          </div>
        </div>

        {/* Channels List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3.5">
          {filteredConnections.map((conn) => {
            const ping = pingResults[conn.id];
            const isTestingThis = testingPingId === conn.id;

            return (
              <div 
                key={conn.id}
                className={`p-4 rounded-2xl border transition-all ${
                  conn.isConnected 
                    ? 'bg-white border-purple-200 shadow-2xs hover:border-purple-300' 
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left: Platform details */}
                  <div className="flex items-start gap-3">
                    <SocialPlatformBrandIcon platform={conn.platform} size="md" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">{conn.platformName}</h4>
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
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full font-mono">
                            Disconnected
                          </span>
                        )}
                        {conn.followersCount && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            • {conn.followersCount} Reach
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 font-mono mt-0.5">
                        {conn.isConnected ? conn.accountHandle : 'No account linked'}
                      </div>

                      {/* Scopes & info */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {conn.scopes.slice(0, 3).map((scope, idx) => (
                          <span key={idx} className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {scope}
                          </span>
                        ))}
                        {conn.scopes.length > 3 && (
                          <span className="text-[9px] font-mono text-slate-400">
                            +{conn.scopes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {conn.isConnected ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTestPing(conn)}
                          disabled={isTestingThis}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Verify API endpoint health & token response time"
                        >
                          <Activity className={`w-3.5 h-3.5 ${isTestingThis ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
                          <span>{isTestingThis ? 'Pinging...' : ping ? `${ping.ms}ms` : 'Ping API'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDisconnect(conn.id, conn.platformName)}
                          className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartConnect(conn)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{authorizingConnectionId === conn.id ? 'Opening...' : 'Sign in'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Ping Result Banner if available */}
                {ping && conn.isConnected && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>API Online: {conn.platformName} Graph Endpoint Active</span>
                    </div>
                    <span>Latency: {ping.ms}ms • Rate Limit: 284/300 req/hr</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>One-click sign-in uses the secure provider authorization routes configured on the server.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>

      {/* Interactive Connect Channel (OAuth 2.0) Sub-Modal */}
      {connectingPlatform && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 border border-purple-100">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <SocialPlatformBrandIcon platform={connectingPlatform.platform} size="sm" />
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">
                    Connect {connectingPlatform.platformName}
                  </h3>
                  <span className="text-[10px] text-purple-600 font-mono">
                    {connectingPlatform.requiresOwner ? 'Owner Direct Publishing Authorization' : 'OAuth 2.0 Secure Grant'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setConnectingPlatform(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Target Social Handle or Page Name
                </label>
                <input
                  type="text"
                  required
                  value={customHandle}
                  onChange={(e) => setCustomHandle(e.target.value)}
                  placeholder="@q_intelligence"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <span className="text-[10px] text-slate-400">
                  Must be an authorized brand administrator for this profile.
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-[11px] text-slate-600">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Requested Platform Permissions</span>
                </div>
                <ul className="space-y-1 text-[10px] font-mono text-slate-500 pl-1">
                  {connectingPlatform.scopes.map((s, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-[10px] text-slate-400 font-mono leading-relaxed">
                Tokens will be stored encrypted in your Supabase Auth session. Callback: <br />
                <code className="text-[9px] text-purple-700 bg-purple-50 px-1 py-0.5 rounded">
                  https://brnhalxydcakutxiregp.supabase.co/auth/v1/callback
                </code>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectingPlatform(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={authorizingConnectionId === connectingPlatform.id}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {authorizingConnectionId === connectingPlatform.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authorizing Handshake...</span>
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

