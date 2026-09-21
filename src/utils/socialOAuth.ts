import { SocialPlatform } from '../types';

const OAUTH_SUPPORTED_PLATFORMS = new Set<SocialPlatform>([
  'instagram',
  'threads',
  'facebook',
  'linkedin',
  'twitter',
  'tiktok',
]);

type OAuthStartUrlResponse = {
  authUrl?: string;
  error?: string;
  nextStep?: string;
  missing?: string[];
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

function buildSetupMessage(data: OAuthStartUrlResponse): string {
  const pieces = [data.error, data.nextStep].filter(Boolean);
  if (data.missing?.length) {
    pieces.push(`Missing: ${data.missing.join(', ')}`);
  }

  return pieces.join(' ');
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

  const response = await fetch(`/api/oauth/${platform}/start-url`, {
    headers: { Accept: 'application/json' },
  });
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/html')) {
    return {
      redirected: false,
      message: 'The social sign-in backend is not handling /api routes. Stop the Vite-only server and run npm.cmd run dev so the Express OAuth server is active.',
    };
  }

  const data = await response.json().catch(() => ({})) as OAuthStartUrlResponse;

  if (!response.ok || !data.authUrl) {
    return {
      redirected: false,
      message: buildSetupMessage(data) || `${getSocialPlatformLabel(platform)} sign-in could not be started.`,
    };
  }

  window.location.assign(data.authUrl);
  return { redirected: true };
}

