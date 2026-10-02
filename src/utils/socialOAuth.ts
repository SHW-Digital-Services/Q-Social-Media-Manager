import { SocialPlatform } from '../types';

const OAUTH_SUPPORTED_PLATFORMS = new Set<SocialPlatform>([
  'facebook',
  'linkedin',
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
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
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
      message: 'The social sign-in API returned a web page instead of JSON. On Vercel, route /api requests to the Express serverless function and redeploy. For local development, run npm run dev.',
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


export async function disconnectSocialSignIn(platform: SocialPlatform): Promise<void> {
  if (!OAUTH_SUPPORTED_PLATFORMS.has(platform) && platform !== 'website') return;
  const response = await fetch(`/api/social/${platform}/disconnect`, { method: 'POST' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'The saved social login could not be removed.');
  }
}
