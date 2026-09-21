import { TagPerformanceItem, CampaignTrendItem, EngagementSummary } from '../types';

export const MOCK_ENGAGEMENT_SUMMARY: EngagementSummary = {
  totalImpressions: 0,
  growthPercent: 0,
  avgEngagementRate: 0,
  activeCampaignsCount: 0,
  savesTotal: 0,
  topPerformingTag: 'None',
  highestReachCampaign: 'None'
};

// Blank platform: 0 tag performance metrics
export const MOCK_TOP_TAGS: TagPerformanceItem[] = [];

// Blank platform: 0 campaign metrics
export const MOCK_CAMPAIGN_TRENDS: CampaignTrendItem[] = [];
