import { SocialAccountConnection } from '../types';

export const INITIAL_SOCIAL_CONNECTIONS: SocialAccountConnection[] = [
  {
    id: 'conn-linkedin',
    platform: 'linkedin',
    platformName: 'LinkedIn Profile',
    accountHandle: 'Your LinkedIn profile',
    displayName: 'LinkedIn personal profile',
    avatarUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=150&q=80',
    accountType: 'personal',
    isConnected: false,
    scopes: ['openid', 'profile', 'w_member_social'],
    webhookActive: false,
    apiHealth: 'disconnected'
  },
  {
    id: 'conn-tiktok',
    platform: 'tiktok',
    platformName: 'TikTok Creator Hub',
    accountHandle: '@q_intelligence',
    displayName: 'Q Intelligence Affirmations',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
    accountType: 'creator',
    isConnected: false,
    scopes: ['video.upload', 'video.publish', 'user.info.basic'],
    webhookActive: false,
    apiHealth: 'disconnected'
  },
  {
    id: 'conn-bluesky',
    platform: 'bluesky',
    platformName: 'Bluesky (AT Protocol)',
    accountHandle: '@q-intelligence.bsky.social',
    displayName: 'Q Intelligence',
    avatarUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=150&q=80',
    accountType: 'organization',
    isConnected: false,
    scopes: ['atproto', 'com.atproto.repo.createRecord'],
    webhookActive: false,
    apiHealth: 'disconnected'
  },
  {
    id: 'conn-facebook',
    platform: 'facebook',
    platformName: 'Facebook Page',
    accountHandle: 'QIntelligenceCommunity',
    displayName: 'Q Intelligence Community Page',
    avatarUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=150&q=80',
    accountType: 'organization',
    isConnected: false,
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
    webhookActive: false,
    apiHealth: 'disconnected'
  },
  {
    id: 'conn-website',
    platform: 'website',
    platformName: 'Official Website (q-ai.online)',
    accountHandle: 'www.q-ai.online/news',
    displayName: 'Q News & Updates',
    avatarUrl: '',
    accountType: 'organization',
    isConnected: false,
    scopes: ['news_publish'],
    webhookActive: false,
    apiHealth: 'disconnected',
    requiresOwner: true,
    notes: 'Publishes to the public News page using a content API token authorised in the website CRM.'
  }
];

