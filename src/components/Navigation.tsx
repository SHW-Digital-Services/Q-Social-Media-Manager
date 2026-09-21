import React from 'react';
import { 
  CheckSquare, 
  Calendar, 
  Send, 
  ShieldAlert, 
  Image as ImageIcon, 
  Type, 
  Palette, 
  Users,
  Share2
} from 'lucide-react';

export type TabKey = 'queue' | 'calendar' | 'composer' | 'compliance' | 'channels' | 'templates' | 'media' | 'fonts' | 'collab';

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  pendingCount: number;
  activityCount: number;
  connectedChannelsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  pendingCount,
  activityCount,
  connectedChannelsCount = 3
}) => {
  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode; badge?: number | string; badgeColor?: string }> = [
    {
      key: 'queue',
      label: 'Approval Queue',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      key: 'calendar',
      label: 'Content Calendar',
      icon: <Calendar className="w-4 h-4" />,
      badge: 'Interactive',
      badgeColor: 'bg-indigo-100 text-indigo-700 font-mono text-[10px]'
    },
    {
      key: 'composer',
      label: 'Multi-Platform Publishing',
      icon: <Send className="w-4 h-4" />
    },
    {
      key: 'channels',
      label: 'Social Channels',
      icon: <Share2 className="w-4 h-4" />,
      badge: connectedChannelsCount > 0 ? `${connectedChannelsCount} Connected` : 'Ready',
      badgeColor: connectedChannelsCount > 0 ? 'bg-emerald-100 text-emerald-800 font-mono text-[10px]' : 'bg-slate-100 text-slate-600 font-mono text-[10px]'
    },
    {
      key: 'compliance',
      label: 'Brand Compliance Analytics',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: 'Rules Active',
      badgeColor: 'bg-purple-100 text-purple-700 font-mono text-[10px]'
    },
    {
      key: 'templates',
      label: 'Design Templates Studio',
      icon: <Palette className="w-4 h-4" />,
      badge: '5 Official',
      badgeColor: 'bg-slate-100 text-slate-700 font-mono text-[10px]'
    },
    {
      key: 'media',
      label: 'Shared Media Asset Library',
      icon: <ImageIcon className="w-4 h-4" />
    },
    {
      key: 'fonts',
      label: 'Brand Fonts Repository',
      icon: <Type className="w-4 h-4" />
    },
    {
      key: 'collab',
      label: 'Collaboration & Audit Trail',
      icon: <Users className="w-4 h-4" />,
      badge: activityCount > 0 ? `${activityCount} Live` : undefined,
      badgeColor: 'bg-emerald-500 text-white'
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-[65px] z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                className={`
                  flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 font-semibold shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
              >
                <span className={isActive ? 'text-purple-600' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${tab.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
