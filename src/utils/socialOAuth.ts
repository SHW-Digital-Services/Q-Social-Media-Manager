import { SocialPlatform } from '../types';

const OAUTH_SUPPORTED_PLATFORMS = new Set<SocialPlatform>([
  'instagram',
  'threads',
  'facebook',
  'linkedin',
  'twitter',
  'tiktok',
]);

export function getSocialPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    instagram: 'Instagram',
    threads: 'Threads',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    twitter: 'X',
    tiktok: 'TikTok',
    bluesky: 'Bluesky',
    website: 'Website',
  };

  return labels[platform] || 'Social channel';
}

export async function startOneClickSocialSignIn(platform: SocialPlatform): Promise<{ redirected: boolean; message?: string }> {
  if (platform === 'website') {
    return {
      redirected: false,
      message: 'Website publishing uses the owner portal connection rather than a social sign-in.',
    };
  }

  if (!OAUTH_SUPPORTED_PLATFORMS.has(platform)) {
    return {
      redirected: false,
      message: `${getSocialPlatformLabel(platform)} does not support one-click OAuth in this app yet.`,
    };
  }

  window.location.assign(`/api/oauth/${platform}/start`);
  return { redirected: true };
}
