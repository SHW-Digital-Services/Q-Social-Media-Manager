import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = 3000;

type SocialPlatform =
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'threads'
  | 'bluesky'
  | 'facebook'
  | 'website';

type PublishRequest = {
  postId?: string;
  title?: string;
  content?: string;
  platforms?: SocialPlatform[];
  mediaUrls?: string[];
  tags?: string[];
  scheduledFor?: string | null;
  campaign?: string;
};

type PublishResult = {
  platform: SocialPlatform;
  status: 'published' | 'not_configured' | 'failed';
  message: string;
  remoteId?: string;
  setupStep?: string;
};

type PkceRecord = {
  codeVerifier: string;
  createdAt: number;
  platform: string;
};

const SUPPORTED_SOCIAL_PLATFORMS: SocialPlatform[] = [
  'instagram',
  'threads',
  'facebook',
  'linkedin',
  'twitter',
  'tiktok',
  'bluesky',
  'website',
];

const inMemoryOAuthTokens = new Map<string, any>();
const pkceStore = new Map<string, PkceRecord>();
const PKCE_TTL_MS = 10 * 60 * 1000;

const OAUTH_SETUP: Record<string, {
  label: string;
  authUrl: string;
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string[];
}> = {
  meta: {
    label: 'Meta (Instagram, Threads, and Facebook Pages)',
    authUrl: 'https://www.facebook.com/v26.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v26.0/oauth/access_token',
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
    scopes: [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
      'threads_basic',
      'threads_content_publish',
    ],
  },
  linkedin: {
    label: 'LinkedIn',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
    scopes: ['openid', 'profile', 'w_member_social', 'w_organization_social', 'r_organization_social'],
  },
  twitter: {
    label: 'X (Twitter)',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    clientIdEnv: 'X_CLIENT_ID',
    clientSecretEnv: 'X_CLIENT_SECRET',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  },
  tiktok: {
    label: 'TikTok',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    clientIdEnv: 'TIKTOK_CLIENT_KEY',
    clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
    scopes: ['user.info.basic', 'video.upload', 'video.publish'],
  },
};

function getAppUrl(req: express.Request): string {
  return process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
}

function getOAuthProviderForPlatform(platform: string): string {
  if (platform === 'instagram' || platform === 'threads' || platform === 'facebook') {
    return 'meta';
  }
  return platform;
}

function getConfiguredToken(platform: SocialPlatform): any {
  const provider = getOAuthProviderForPlatform(platform);
  return inMemoryOAuthTokens.get(platform) || inMemoryOAuthTokens.get(provider);
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function generateCodeVerifier(): string {
  return base64UrlEncode(crypto.randomBytes(64));
}

function generateCodeChallenge(codeVerifier: string): string {
  return base64UrlEncode(
    crypto.createHash('sha256').update(codeVerifier).digest()
  );
}

function generateOAuthState(): string {
  return crypto.randomUUID();
}

function cleanupExpiredPkceRecords() {
  const now = Date.now();
  for (const [state, record] of pkceStore.entries()) {
    if (now - record.createdAt > PKCE_TTL_MS) {
      pkceStore.delete(state);
    }
  }
}

type OAuthStartResult = {
  status: number;
  authUrl?: string;
  body?: Record<string, unknown>;
};

function buildOAuthStartResult(platform: string, req: express.Request): OAuthStartResult {
  const provider = getOAuthProviderForPlatform(platform);
  const setup = OAUTH_SETUP[provider];

  if (!setup) {
    return {
      status: 400,
      body: {
        error: `OAuth start is not available for ${platform}.`,
        nextStep: 'Use the README instructions for this provider. Bluesky uses an app password instead of this OAuth flow.',
      },
    };
  }

  const clientId = process.env[setup.clientIdEnv];
  const clientSecret = process.env[setup.clientSecretEnv];
  if (!clientId || !clientSecret) {
    return {
      status: 501,
      body: {
        error: `${setup.label} one-click sign-in is not enabled on the server yet.`,
        missing: [
          !clientId ? setup.clientIdEnv : null,
          !clientSecret ? setup.clientSecretEnv : null,
        ].filter(Boolean),
        nextStep: 'Ask the app owner to add the provider app configuration once in the server environment, then restart the server.',
      },
    };
  }

  if (provider === 'twitter') {
    cleanupExpiredPkceRecords();

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateOAuthState();

    pkceStore.set(state, {
      codeVerifier,
      createdAt: Date.now(),
      platform,
    });

    const redirectUri = `${getAppUrl(req)}/api/oauth/${platform}/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: setup.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return {
      status: 200,
      authUrl: `${setup.authUrl}?${params.toString()}`,
    };
  }

  const redirectUri = `${getAppUrl(req)}/api/oauth/${platform}/callback`;
  const state = Buffer.from(JSON.stringify({
    platform,
    provider,
    createdAt: Date.now(),
  })).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: setup.scopes.join(' '),
    state,
  });

  return {
    status: 200,
    authUrl: `${setup.authUrl}?${params.toString()}`,
  };
}

function requirePublishFields(payload: PublishRequest): string | null {
  if (!payload || typeof payload !== 'object') return 'A post payload is required.';
  if (!payload.content || typeof payload.content !== 'string' || payload.content.trim().length === 0) {
    return 'Post content is required before publishing.';
  }
  if (!Array.isArray(payload.platforms) || payload.platforms.length === 0) {
    return 'Choose at least one social platform before publishing.';
  }
  const unsupported = payload.platforms.find(platform => !SUPPORTED_SOCIAL_PLATFORMS.includes(platform));
  if (unsupported) return `Unsupported platform: ${unsupported}.`;
  return null;
}

async function publishToLinkedIn(payload: PublishRequest, token: any): Promise<PublishResult> {
  const organizationId = process.env.LINKEDIN_ORGANIZATION_ID;
  const author = organizationId
    ? `urn:li:organization:${organizationId}`
    : token.memberUrn;

  if (!author) {
    return {
      platform: 'linkedin',
      status: 'not_configured',
      message: 'LinkedIn needs LINKEDIN_ORGANIZATION_ID before it can publish.',
      setupStep: 'Set LINKEDIN_ORGANIZATION_ID to the LinkedIn organization page ID, then reconnect LinkedIn.',
    };
  }

  const response = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': process.env.LINKEDIN_VERSION || '202601',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author,
      commentary: payload.content!.trim(),
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!response.ok) {
    const providerResponse = await response.json().catch(() => ({}));
    return {
      platform: 'linkedin',
      status: 'failed',
      message: 'LinkedIn rejected the post.',
      setupStep: JSON.stringify(providerResponse),
    };
  }

  return {
    platform: 'linkedin',
    status: 'published',
    message: 'LinkedIn post published successfully.',
    remoteId: response.headers.get('x-restli-id') || undefined,
  };
}

async function publishToPlatform(platform: SocialPlatform, payload: PublishRequest): Promise<PublishResult> {
  const token = getConfiguredToken(platform);

  if (!token) {
    return {
      platform,
      status: 'not_configured',
      message: `${platform} has no stored OAuth token yet.`,
      setupStep: `Open /api/oauth/${platform}/start after creating the provider app and setting the required environment variables.`,
    };
  }

  if (platform === 'linkedin') {
    return publishToLinkedIn(payload, token);
  }

  return {
    platform,
    status: 'not_configured',
    message: `${platform} token storage is present, but the final provider-specific publish adapter has not been enabled yet.`,
    setupStep: 'Use README-social-implementation.md to complete the final API call for this provider.',
  };
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Brand rules context for Q Intelligence
const Q_BRAND_GUIDE_PROMPT = `
You are the official Brand Compliance & Editorial Reviewer for "Q Intelligence".
Brand Mission: "Your private space for LGBTQ+ wellbeing and personal reflection. We provide intelligent support, safe conversations, resources, and guidance for LGBTQ+ individuals and allies."
Pillars: Secure & Private, Built with Empathy, Connected Community.

TONE OF VOICE RULES:
WE ARE:
1. Welcoming: Non-judgmental, warm ("I'm here for you—always").
2. Clear: Direct, plain language without convoluted jargon or confusing identity gatekeeping.
3. Affirming: Validating user experiences and identities without reservation or conditional phrasing.
4. Protective: Transparent about privacy choices without over-promising impossible encryption or exposing sensitive data.

WE ARE NOT:
1. Clinical/Cold: NEVER use overly medicalized, detached, or pathological terms (avoid "sufferers", "afflicted", "disorder", "pathology", "symptoms of being queer").
2. Presumptive: NEVER assume pronouns, gender expression, family relationships, coming-out status, or transition steps (e.g. avoid assuming parents are unsupportive or that everyone has or wants to "come out").
3. Pushy: NEVER force disclosure, demand radical openness, or urge users toward actions they aren't ready for.
4. Diagnostic: The AI or brand NEVER diagnoses psychological conditions; it only observes, reflects, and supports.
`;

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      brand: 'Q Intelligence',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/social/status', (req, res) => {
    res.json({
      platforms: SUPPORTED_SOCIAL_PLATFORMS.map(platform => {
        const provider = getOAuthProviderForPlatform(platform);
        const setup = OAUTH_SETUP[provider];
        return {
          platform,
          provider,
          hasStoredToken: Boolean(getConfiguredToken(platform)),
          hasClientId: setup ? Boolean(process.env[setup.clientIdEnv]) : false,
          hasClientSecret: setup ? Boolean(process.env[setup.clientSecretEnv]) : false,
          setupRoute: setup ? `/api/oauth/${platform}/start` : null,
        };
      }),
    });
  });

  app.get('/api/oauth/:platform/start-url', (req, res) => {
    const result = buildOAuthStartResult(req.params.platform, req);
    if (!result.authUrl) {
      return res.status(result.status).json(result.body || { error: 'OAuth sign-in could not be started.' });
    }

    res.json({ authUrl: result.authUrl });
  });

  app.get('/api/oauth/:platform/start', (req, res) => {
    const result = buildOAuthStartResult(req.params.platform, req);
    if (!result.authUrl) {
      return res.status(result.status).json(result.body || { error: 'OAuth sign-in could not be started.' });
    }

    res.redirect(result.authUrl);
  });

  app.get('/api/oauth/:platform/callback', async (req, res) => {
    try {
      const { platform } = req.params;
      const provider = getOAuthProviderForPlatform(platform);
      const setup = OAUTH_SETUP[provider];
      const code = typeof req.query.code === 'string' ? req.query.code : '';

      if (!setup) {
        return res.status(400).json({ error: `OAuth callback is not available for ${platform}.` });
      }

      if (!code) {
        return res.status(400).json({ error: 'The provider did not return an authorization code.' });
      }

      const clientId = process.env[setup.clientIdEnv];
      const clientSecret = process.env[setup.clientSecretEnv];
      if (!clientId || !clientSecret) {
        return res.status(501).json({
          error: `${setup.label} OAuth credentials are incomplete.`,
          missing: [
            !clientId ? setup.clientIdEnv : null,
            !clientSecret ? setup.clientSecretEnv : null,
          ].filter(Boolean),
        });
      }

      if (provider === 'twitter') {
        cleanupExpiredPkceRecords();

        const returnedState = typeof req.query.state === 'string' ? req.query.state : '';
        const stored = pkceStore.get(returnedState);

        if (!returnedState || !stored) {
          return res.status(400).json({
            error: 'Invalid or expired X OAuth state. Please start the X connection again.',
          });
        }

        if (stored.platform !== platform) {
          pkceStore.delete(returnedState);
          return res.status(400).json({
            error: 'X OAuth state did not match the requested platform.',
          });
        }

        pkceStore.delete(returnedState);

        const redirectUri = `${getAppUrl(req)}/api/oauth/${platform}/callback`;
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          code_verifier: stored.codeVerifier,
        });
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const tokenResponse = await fetch(setup.tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
          },
          body,
        });
        const tokenBody = await tokenResponse.json().catch(() => ({}));

        if (!tokenResponse.ok) {
          return res.status(tokenResponse.status).json({
            error: 'X token exchange failed.',
            providerResponse: tokenBody,
          });
        }

        inMemoryOAuthTokens.set(platform, {
          ...tokenBody,
          provider,
          platform,
          connectedAt: new Date().toISOString(),
        });

        const callbackUrl = new URL(getAppUrl(req));
        callbackUrl.searchParams.set('oauth', 'success');
        callbackUrl.searchParams.set('platform', platform);
        return res.redirect(callbackUrl.toString());
      }

      const redirectUri = `${getAppUrl(req)}/api/oauth/${platform}/callback`;
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const tokenResponse = await fetch(setup.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const tokenBody = await tokenResponse.json().catch(() => ({}));

      if (!tokenResponse.ok) {
        return res.status(tokenResponse.status).json({
          error: `${setup.label} token exchange failed.`,
          providerResponse: tokenBody,
        });
      }

      inMemoryOAuthTokens.set(platform, {
        ...tokenBody,
        provider,
        platform,
        connectedAt: new Date().toISOString(),
      });

      const callbackUrl = new URL(getAppUrl(req));
      callbackUrl.searchParams.set('oauth', 'success');
      callbackUrl.searchParams.set('platform', platform);
      return res.redirect(callbackUrl.toString());
    } catch (err: any) {
      console.error('OAuth callback error:', err);
      res.status(500).json({ error: err.message || 'OAuth callback failed.' });
    }
  });

  app.post('/api/publish/broadcast', async (req, res) => {
    try {
      const payload = req.body as PublishRequest;
      const validationError = requirePublishFields(payload);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const results = await Promise.all(
        payload.platforms!.map(platform => publishToPlatform(platform, payload))
      );
      const published = results.filter(result => result.status === 'published');
      const failed = results.filter(result => result.status !== 'published');

      if (failed.length > 0) {
        return res.status(501).json({
          success: false,
          message: 'Publishing was not completed because one or more platforms still need setup.',
          publishedCount: published.length,
          failedCount: failed.length,
          results,
        });
      }

      res.json({
        success: true,
        message: 'Broadcast published through configured backend providers.',
        publishedAt: new Date().toISOString(),
        results,
      });
    } catch (err: any) {
      console.error('Broadcast publish error:', err);
      res.status(500).json({ error: err.message || 'Broadcast publish failed.' });
    }
  });

  // Compliance Audit Endpoint
  app.post('/api/compliance/audit', async (req, res) => {
    try {
      const { text, platform, targetAudience } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required for compliance audit.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback heuristic scoring if API key is not yet set
        const clinicalTerms = ['disorder', 'pathology', 'afflicted', 'sufferers', 'diagnose', 'symptom'];
        const presumptiveTerms = ['when you come out to your parents', 'your mother', 'your father', 'as a normal person'];
        const pushyTerms = ['you must', 'you need to disclose', 'don\'t delay', 'admit it'];

        const lower = text.toLowerCase();
        const flagged: Array<{ rule: string; type: 'violation' | 'warning' | 'praise'; excerpt: string; message: string; suggestion: string }> = [];

        clinicalTerms.forEach(term => {
          if (lower.includes(term)) {
            flagged.push({
              rule: 'Avoid Clinical/Cold Tone',
              type: 'violation',
              excerpt: term,
              message: `The term "${term}" feels clinical or medicalized. Q Intelligence maintains compassionate, empathetic language.`,
              suggestion: `Consider softer, non-pathologizing language focusing on personal reflection.`,
            });
          }
        });

        presumptiveTerms.forEach(term => {
          if (lower.includes(term)) {
            flagged.push({
              rule: 'Avoid Presumptive Assumptions',
              type: 'violation',
              excerpt: term,
              message: `Phrasing like "${term}" assumes specific family or personal circumstances.`,
              suggestion: `Use inclusive, non-assumptive phrasing like "your support network" or "those close to you".`,
            });
          }
        });

        pushyTerms.forEach(term => {
          if (lower.includes(term)) {
            flagged.push({
              rule: 'Avoid Pushy Directives',
              type: 'warning',
              excerpt: term,
              message: `Language like "${term}" can feel coercive or pushy.`,
              suggestion: `Frame as an invitation: "Whenever you feel ready..."`,
            });
          }
        });

        // Affirming check
        if (/welcome|safe space|here for you|reflect|journey|affirm|support|privacy|belong/i.test(text)) {
          flagged.push({
            rule: 'Warm & Welcoming Spirit',
            type: 'praise',
            excerpt: 'Validating tone detected',
            message: 'Matches Q Intelligence values: welcoming, validating, and safe.',
            suggestion: 'Maintain this gentle and affirming approach.',
          });
        }

        const score = Math.max(45, Math.min(100, 100 - (flagged.filter(f => f.type === 'violation').length * 25) - (flagged.filter(f => f.type === 'warning').length * 10)));

        return res.json({
          score,
          status: score >= 85 ? 'approved' : score >= 70 ? 'needs_review' : 'changes_requested',
          summary: score >= 85 
            ? 'Complies strongly with Q Intelligence tone guidelines.' 
            : 'Contains potential tone or framing adjustments needed before publishing.',
          breakdown: {
            welcoming: 88,
            affirming: 85,
            clarity: 92,
            privacySafe: 95,
            nonPresumptive: score < 75 ? 65 : 90,
          },
          flags: flagged,
          source: 'rule_engine_local',
        });
      }

      const prompt = `
Analyze the following social media draft for Q Intelligence.
Platform: ${platform || 'Cross-Platform'}
Target Audience: ${targetAudience || 'LGBTQ+ community & allies'}

Draft content:
"""
${text}
"""

Evaluate strictly against Q Intelligence Brand Guidelines:
1. Welcoming & Safe (creating an affirming, non-judgmental space)
2. Clear & Direct (no jargon, transparent)
3. Affirming & Validating (no invalidation of queer experiences)
4. Protective & Private (respects confidentiality, honest boundaries)
5. NOT Clinical/Cold (no medicalizing of queer identity)
6. NOT Presumptive (no assuming pronouns, journey status, coming out timeline, or biological family acceptance)
7. NOT Pushy (no demanding action or disclosure)
8. NOT Diagnostic (no diagnosing mental health or conditions)

Return valid JSON adhering to the specified schema.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: Q_BRAND_GUIDE_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: 'Overall compliance score 0 to 100' },
              status: { type: Type.STRING, description: 'approved, needs_review, or changes_requested' },
              summary: { type: Type.STRING, description: 'Executive assessment of brand compliance' },
              breakdown: {
                type: Type.OBJECT,
                properties: {
                  welcoming: { type: Type.INTEGER },
                  affirming: { type: Type.INTEGER },
                  clarity: { type: Type.INTEGER },
                  privacySafe: { type: Type.INTEGER },
                  nonPresumptive: { type: Type.INTEGER },
                },
                required: ['welcoming', 'affirming', 'clarity', 'privacySafe', 'nonPresumptive'],
              },
              flags: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    rule: { type: Type.STRING },
                    type: { type: Type.STRING, description: 'violation, warning, or praise' },
                    excerpt: { type: Type.STRING },
                    message: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                  },
                  required: ['rule', 'type', 'excerpt', 'message', 'suggestion'],
                },
              },
            },
            required: ['score', 'status', 'summary', 'breakdown', 'flags'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      parsed.source = 'gemini_3_8_flash';
      return res.json(parsed);
    } catch (err: any) {
      console.error('Compliance audit error:', err);
      res.status(500).json({ error: err.message || 'Failed to execute compliance audit.' });
    }
  });

  // Rewrite in Q Intelligence Voice
  app.post('/api/compliance/rewrite', async (req, res) => {
    try {
      const { text, style = 'Warm & Supportive', platform = 'Instagram' } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required for rewrite.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // High-quality deterministic fallback
        const rewritten = `Hi there. ${text.replace(/sufferers|afflicted/gi, 'members of our community').replace(/you must/gi, 'you are always welcome to')} We're here for you—always. Your journey is yours to define. 💜✨`;
        return res.json({
          rewrittenText: rewritten,
          notes: 'Enhanced with welcoming, non-presumptive Q tone and affirming sign-off.',
          styleApplied: style,
          source: 'local_preset',
        });
      }

      const prompt = `
Rewrite the following post copy to align with the Q Intelligence brand voice.
Desired Style: ${style} (e.g. "Warm & Supportive", "Direct & Clear", "Helpline & Safe Haven", or "Celebratory & Community")
Platform: ${platform}

Original Draft:
"""
${text}
"""

Guidelines to apply:
- Infuse Q's signature voice: welcoming, affirming, clear, and privacy-protective.
- Eliminate clinical, cold, or prescriptive phrasing.
- Ensure no assumptions are made regarding user disclosure, identity timeline, or family background.
- Include appropriate gentle hashtags and community-affirming emojis if suitable for ${platform}.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: Q_BRAND_GUIDE_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rewrittenText: { type: Type.STRING, description: 'The polished brand-compliant caption' },
              notes: { type: Type.STRING, description: 'Explanation of changes made for brand compliance' },
              suggestedHashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['rewrittenText', 'notes', 'suggestedHashtags'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Rewrite error:', err);
      res.status(500).json({ error: err.message || 'Failed to rewrite text.' });
    }
  });

  // Hashtag & Tag Suggestions
  app.post('/api/compliance/hashtags', async (req, res) => {
    try {
      const { topic, platform } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          hashtags: ['#QIntelligence', '#LGBTQWellbeing', '#SafeSpace', '#InclusiveCommunity', '#AffirmingSpaces', '#MentalWellbeing'],
          platformTip: 'Keep hashtags between 3 and 5 for optimal engagement without cluttering the message.',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate 6 respectful, brand-safe, and affirming hashtags for Q Intelligence on topic: "${topic || 'General LGBTQ+ wellbeing and safe reflection'}" for platform: ${platform || 'Social Media'}. Do not use sensationalized or outdated terminology.`,
        config: {
          systemInstruction: Q_BRAND_GUIDE_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              platformTip: { type: Type.STRING },
            },
            required: ['hashtags', 'platformTip'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Hashtags error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate hashtags.' });
    }
  });

  // In-memory version history cache with Supabase sync support
  const postVersionStore = new Map<string, any[]>();
  const assetVersionStore = new Map<string, any[]>();

  // Fetch versions for a post
  app.get('/api/posts/versions/:postId', (req, res) => {
    const { postId } = req.params;
    const versions = postVersionStore.get(postId) || [];
    res.json({ postId, versions });
  });

  // Record a new version for a post
  app.post('/api/posts/versions/:postId', (req, res) => {
    const { postId } = req.params;
    const version = req.body;
    if (!version) {
      return res.status(400).json({ error: 'Version data is required.' });
    }
    const current = postVersionStore.get(postId) || [];
    const updated = [version, ...current];
    postVersionStore.set(postId, updated);
    res.json({ success: true, postId, totalVersions: updated.length, version });
  });

  // Fetch versions for an asset
  app.get('/api/assets/versions/:assetId', (req, res) => {
    const { assetId } = req.params;
    const versions = assetVersionStore.get(assetId) || [];
    res.json({ assetId, versions });
  });

  // Record a new version for an asset
  app.post('/api/assets/versions/:assetId', (req, res) => {
    const { assetId } = req.params;
    const version = req.body;
    if (!version) {
      return res.status(400).json({ error: 'Asset version data is required.' });
    }
    const current = assetVersionStore.get(assetId) || [];
    const updated = [version, ...current];
    assetVersionStore.set(assetId, updated);
    res.json({ success: true, assetId, totalVersions: updated.length, version });
  });

  // Vite middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

let appPromise: Promise<express.Express> | null = null;

function getApp() {
  appPromise ||= createApp();
  return appPromise;
}

export default async function handler(req: express.Request, res: express.Response) {
  const app = await getApp();
  return app(req, res);
}

if (!process.env.VERCEL) {
  getApp().then(app => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Q Intelligence Communications Hub server running on http://0.0.0.0:${PORT}`);
    });
  });
}

