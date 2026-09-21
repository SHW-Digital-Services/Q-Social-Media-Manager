import { SocialPlatform } from '../types';

type SocialStatusPlatform = {
  platform: SocialPlatform;
  hasStoredToken: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  setupRoute: string | null;
};

type SocialStatusResponse = {
  platforms?: SocialStatusPlatform[];
};

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

  const response = await fetch('/api/social/status');
  const status = await response.json().catch(() => ({})) as SocialStatusResponse;
  const platformStatus = status.platforms?.find(item => item.platform === platform);

  if (!response.ok || !platformStatus) {
    return {
      redirected: false,
      message: 'Connection status could not be loaded. Please try again in a moment.',
    };
  }

  if (!platformStatus.setupRoute) {
    return {
      redirected: false,
      message: `${getSocialPlatformLabel(platform)} does not support one-click OAuth in this app yet.`,
    };
  }

  if (!platformStatus.hasClientId || !platformStatus.hasClientSecret) {
    return {
      redirected: false,
      message: 'One-click sign-in is not enabled for this channel yet. Ask the app owner to add the provider app configuration once on the server.',
    };
  }

  window.location.assign(platformStatus.setupRoute);
  return { redirected: true };
}

