import type { PostItem } from '../types';

export function postRequest(data: Partial<PostItem>, action: string, expectedRevision: number) {
  // Reviews use the saved server copy; never resend images or audit history.
  const fields: Partial<PostItem> = action === 'approve' ? {} : action === 'changes' ? { feedback: data.feedback } : {
    title: data.title, content: data.content, platforms: data.platforms,
    mediaUrls: data.mediaUrls, tags: data.tags, campaign: data.campaign,
    scheduledFor: data.scheduledFor, complianceAudit: data.complianceAudit,
    piiShieldVerified: data.piiShieldVerified,
  };
  return { data: fields, action, expectedRevision };
}
