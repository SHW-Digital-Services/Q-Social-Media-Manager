import React, { useState } from 'react';
import { ActivityLogItem, PostItem } from '../types';
import { MOCK_ACTIVITIES, MOCK_POSTS, Q_LOGO_URL } from '../data/brandData';
import { 
  Users, 
  Send, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  Hash, 
  CheckCircle2, 
  AlertTriangle, 
  Bell,
  Clock,
  ThumbsUp,
  Heart,
  Lock
} from 'lucide-react';

interface CollaborationRoomProps {
  posts: PostItem[];
  onOpenPostInQueue?: (postId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  avatar: string;
  message: string;
  timestamp: string;
  postIdRef?: string;
  reactions?: { [emoji: string]: number };
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'Sarah Jenkins',
    role: 'Brand Integrity Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    message: 'Hey team! The Weekly Wellbeing Reflection is ready in the queue. Checked tone against the Q Brand Guide—no clinical terms, 100% affirming.',
    timestamp: '10:14 AM',
    postIdRef: 'post-1',
    reactions: { '💜': 3, '👍': 2 }
  },
  {
    id: 'msg-2',
    sender: 'Dr. Elena Rostova',
    role: 'Wellbeing & Ethics Advisor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    message: 'Reviewed the crisis helpline copy. The 988 Press 3 and TrevorLifeline 678-678 references are verified. Thank you for keeping the tone clear and non-directive.',
    timestamp: '10:22 AM',
    postIdRef: 'post-3',
    reactions: { '🔒': 4, '❤️': 3 }
  },
  {
    id: 'msg-3',
    sender: 'Marcus Vance',
    role: 'Creative Director',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    message: 'All Pride Topline ribbons rendered in the templates match our hex codes: #E11D48 to #DB2777 spectrum. Graphic passes AAA contrast on dark cosmic mode.',
    timestamp: '10:35 AM',
    reactions: { '🎨': 2, '✨': 3 }
  }
];

export const CollaborationRoom: React.FC<CollaborationRoomProps> = ({
  posts,
  onOpenPostInQueue,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('#approval-coordination');
  const [attachedPostId, setAttachedPostId] = useState<string>('none');
  const [teamMembers] = useState([
    { name: 'Alex Rivera', role: 'Social Media Officer (You)', status: 'online' },
    { name: 'Sarah Jenkins', role: 'Brand Lead', status: 'online' },
    { name: 'Marcus Vance', role: 'Creative Director', status: 'busy' },
    { name: 'Dr. Elena Rostova', role: 'Ethics Advisor', status: 'online' },
    { name: 'Taylor Swift', role: 'Community Mod', status: 'offline' }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'Alex Rivera',
      role: 'Social Media Officer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      message: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      postIdRef: attachedPostId !== 'none' ? attachedPostId : undefined,
      reactions: {}
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setAttachedPostId('none');
  };

  const handleSimulateColleague = () => {
    const simulationPool = [
      {
        sender: 'Sarah Jenkins',
        role: 'Brand Integrity Lead',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        message: 'Approved! The automated compliance audit just cleared with a 96% score. Ready for cross-platform broadcast.'
      },
      {
        sender: 'Marcus Vance',
        role: 'Creative Director',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        message: 'The Instagram mockup looks pristine. The circular Q Logo badge has the exact 24px safe padding.'
      },
      {
        sender: 'Dr. Elena Rostova',
        role: 'Wellbeing & Ethics Advisor',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
        message: 'Remember team: In tonight’s broadcast, keep language soft. Affirming unconditional belonging without medicalizing anxiety.'
      }
    ];

    const pick = simulationPool[Math.floor(Math.random() * simulationPool.length)];
    const simMsg: ChatMessage = {
      id: `sim-${Date.now()}`,
      sender: pick.sender,
      role: pick.role,
      avatar: pick.avatar,
      message: pick.message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: { '💜': 1 }
    };
    setMessages(prev => [...prev, simMsg]);
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const reactions = { ...(m.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...m, reactions };
      }
      return m;
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-mono font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>REAL-TIME COLLABORATION & EDITORIAL WORKFLOW</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Q Intelligence Team Sync & Review Room
            </h2>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Coordinate broadcasts between communications officers, brand leads, and wellbeing ethicists. Tag approval queue posts directly in review threads.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateColleague}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Colleague Feedback</span>
            </button>
          </div>
        </div>

        {/* Channel Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto pb-1 scrollbar-none">
          {['#approval-coordination', '#crisis-helpline-review', '#pride-campaign-2026', '#legal-pii-shield'].map(ch => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedChannel === ch 
                  ? 'bg-purple-600 text-white font-semibold shadow-2xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Hash className="w-3 h-3" />
              <span>{ch.replace('#', '')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 8 cols: Main Chat Stream */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-col h-[600px] overflow-hidden">
          
          {/* Channel Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-900 font-display">
                {selectedChannel}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                • End-to-end encrypted staff sync
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Collaboration Active</span>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className="flex items-start gap-3 group">
                <img 
                  src={msg.avatar} 
                  alt={msg.sender} 
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5" 
                />

                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-900">{msg.sender}</span>
                    <span className="text-[10px] font-mono text-purple-600">{msg.role}</span>
                    <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>

                  {/* Attached Post Reference Card */}
                  {msg.postIdRef && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 font-medium">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                      <span>Referencing Post: #{msg.postIdRef}</span>
                      {onOpenPostInQueue && (
                        <button
                          onClick={() => onOpenPostInQueue(msg.postIdRef!)}
                          className="text-[10px] underline font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
                        >
                          View in Queue →
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-slate-800 leading-relaxed font-sans bg-slate-50/80 p-3 rounded-2xl rounded-tl-none border border-slate-100 max-w-xl">
                    {msg.message}
                  </p>

                  {/* Reactions */}
                  <div className="flex items-center gap-1 pt-1">
                    {msg.reactions && Object.entries(msg.reactions).map(([emoji, count]) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(msg.id, emoji)}
                        className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-purple-100 border border-slate-200 rounded-full flex items-center gap-1 cursor-pointer"
                      >
                        <span>{emoji}</span>
                        <span className="font-mono text-[10px] text-slate-600">{count}</span>
                      </button>
                    ))}

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                      {['💜', '👍', '🔒', '✨'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(msg.id, emoji)}
                          className="w-5 h-5 rounded-full hover:bg-slate-200 text-xs flex items-center justify-center cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
            {/* Tag a post in queue option */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Tag Post:</span>
              <select
                value={attachedPostId}
                onChange={(e) => setAttachedPostId(e.target.value)}
                className="text-[11px] bg-white border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-700 focus:outline-none"
              >
                <option value="none">None (General Note)</option>
                {posts.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.id}: {p.title.slice(0, 28)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${selectedChannel}... (mention @colleague or tag post)`}
                className="flex-1 text-xs px-4 py-2.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-purple-500 font-sans"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

        </div>

        {/* Right 4 cols: Team Directory & Safety Guard Notice */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Collaborators Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold font-display text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Editorial Team ({teamMembers.length})</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold">3 Active</span>
            </h3>

            <div className="divide-y divide-slate-100 space-y-3">
              {teamMembers.map(member => (
                <div key={member.name} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{member.name}</div>
                    <div className="text-[11px] text-slate-500">{member.role}</div>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${
                    member.status === 'online' ? 'bg-emerald-500 ring-2 ring-emerald-100' :
                    member.status === 'busy' ? 'bg-amber-500' : 'bg-slate-300'
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Ethics & PII Communications Notice */}
          <div className="bg-purple-50/70 rounded-3xl p-6 border border-purple-200/80 space-y-3">
            <div className="flex items-center gap-2 text-purple-900">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h4 className="text-sm font-bold font-display">Staff Safety & Ethics Guard</h4>
            </div>

            <p className="text-xs text-purple-950 leading-relaxed">
              All communications between officers, advisors, and leads are audited to safeguard community anonymity. Never share private user disclosures, IP addresses, or un-anonymized quotes in public feeds.
            </p>

            <div className="pt-2 border-t border-purple-200 text-[11px] font-mono text-purple-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>PII SHIELD: ACTIVE PROTOCOL</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
