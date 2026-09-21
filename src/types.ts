export type PostStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'changes_requested' 
  | 'approved' 
  | 'scheduled' 
  | 'published';

export type SocialPlatform = 
  | 'instagram' 
  | 'linkedin' 
  | 'twitter' 
  | 'tiktok' 
  | 'threads' 
  | 'bluesky' 
  | 'facebook'
  | 'website';

export interface Comment {
  id: string;
  author: string;
  authorRole: string;
  avatar: string;
  content: string;
  createdAt: string;
  isResolved?: boolean;
}

export interface ActivityLogItem {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'status_change' | 'comment' | 'compliance_run' | 'edit' | 'schedule';
}

export interface ComplianceFlag {
  rule: string;
  type: 'violation' | 'warning' | 'praise';
  excerpt: string;
  message: string;
  suggestion: string;
}

export interface ComplianceAudit {
  score: number;
  status: 'approved' | 'needs_review' | 'changes_requested';
  summary: string;
  breakdown: {
    welcoming: number;
    affirming: number;
    clarity: number;
    privacySafe: number;
    nonPresumptive: number;
  };
  flags: ComplianceFlag[];
  scannedAt: string;
  source?: string;
}

export interface PostVersion {
  versionId: string;
  versionNumber: string;
  timestamp: string;
  modifiedBy: string;
  authorRole: string;
  authorAvatar?: string;
  author?: string;
  changesSummary: string;
  changeSummary?: string;
  contentSnapshot: string;
  titleSnapshot: string;
  platformsSnapshot: SocialPlatform[];
  mediaUrlsSnapshot: string[];
  complianceScoreSnapshot: number;
  statusSnapshot: PostStatus;
  // Aliases for convenient property access
  title?: string;
  content?: string;
  platforms?: SocialPlatform[];
  mediaUrls?: string[];
  status?: PostStatus;
  complianceScore?: number;
}

export interface AssetVersion {
  versionId: string;
  versionNumber: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  dimensions?: string;
  format: string;
  changeNotes: string;
  fileSize?: string;
}

export interface PostItem {
  id: string;
  title: string;
  content: string;
  platforms: SocialPlatform[];
  status: PostStatus;
  scheduledFor: string | null;
  publishedAt?: string | null;
  approvedBy?: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  assignee?: {
    name: string;
    role: string;
    avatar: string;
  };
  mediaUrls: string[];
  tags: string[];
  complianceAudit: ComplianceAudit;
  comments: Comment[];
  revisionCount?: number;
  currentVersion?: string;
  versionHistory?: PostVersion[];
  lastModified: string;
  createdAt?: string;
  campaign?: string;
  piiShieldVerified: boolean;
  requiresOwner?: boolean;
}

export interface BrandAsset {
  id: string;
  title: string;
  category: 'logo' | 'badge' | 'banner' | 'graphic' | 'palette' | 'audio_stem';
  fileUrl: string;
  dimensions?: string;
  format: string;
  description: string;
  tags: string[];
  isOfficial: boolean;
  backgroundRecommended?: 'dark' | 'light' | 'any';
  currentVersion?: string;
  versionHistory?: AssetVersion[];
}

export interface DesignTemplate {
  id: string;
  title: string;
  category: 'announcement' | 'quote' | 'helpline' | 'pride' | 'privacy' | 'community' | 'resource' | 'celebration' | 'mythbuster' | 'qa' | 'custom';
  description: string;
  defaultAspect: '1:1' | '4:5' | '16:9' | '9:16';
  defaultHeadline: string;
  defaultSubtext: string;
  badgeText: string;
  themeStyle: 'cosmic' | 'light_tint' | 'pride_spectrum' | 'helpline_alert' | 'emerald_safe' | 'sunset_affirming' | 'midnight_minimal';
  previewMockupUrl: string;
  isCustom?: boolean;
  author?: string;
  createdAt?: string;
}

export interface BrandFontSpecimen {
  id: string;
  name: string;
  role: 'display' | 'interface' | 'code';
  family: string;
  weights: string[];
  bestUsedFor: string;
  prohibitedFor: string;
  sampleHeadline: string;
  sampleBody: string;
  cssRule: string;
}

export interface BrandColorSwatch {
  name: string;
  hex: string;
  rgb: string;
  role: string;
  group: 'ui_base' | 'nebula_accents' | 'semantic' | 'gradients';
  wcagOnWhite: string;
  wcagOnDark: string;
  tailwindClass: string;
  notes: string;
}

export interface TagPerformanceItem {
  tag: string;
  postsCount: number;
  totalReach: number;
  engagementRate: number; // e.g. 7.4 (%)
  sharesCount: number;
  savesCount: number;
  sentimentScore: number; // 0-100
  category: 'affirmation' | 'crisis_support' | 'privacy' | 'community' | 'awareness';
  trend: 'up' | 'stable' | 'hot';
  changePercent: number; // +18.4%
}

export interface CampaignTrendItem {
  id: string;
  name: string;
  pillar: string;
  status: 'active' | 'completed' | 'scheduled';
  totalReach: number;
  targetReach: number;
  engagementRate: number;
  weeklyTrend: { week: string; reach: number; engagement: number }[];
  platformDistribution: { platform: SocialPlatform; percentage: number; reach: number }[];
  topTag: string;
  complianceAvg: number;
  startDate: string;
  endDate?: string;
}

export interface EngagementSummary {
  totalImpressions: number;
  growthPercent: number;
  avgEngagementRate: number;
  activeCampaignsCount: number;
  savesTotal: number;
  topPerformingTag: string;
  highestReachCampaign: string;
}

export interface SocialAccountConnection {
  id: string;
  platform: SocialPlatform;
  platformName: string;
  accountHandle: string;
  displayName: string;
  avatarUrl: string;
  accountType: 'business' | 'creator' | 'organization' | 'personal';
  isConnected: boolean;
  connectedAt?: string;
  tokenExpiresAt?: string;
  scopes: string[];
  webhookActive: boolean;
  followersCount?: string;
  apiHealth: 'healthy' | 'warning' | 'disconnected';
  lastPingMs?: number;
  clientId?: string;
  requiresOwner?: boolean;
  notes?: string;
}

