# Q Social Media Manager: Social Media Linking and Publishing Setup

This guide explains how to connect the site to social media accounts and turn the current publishing routes into real live posting.

It is written for a non-technical person carrying out the setup with help from a developer where needed. Do not paste passwords, API keys, app secrets, or access tokens into chat, email, screenshots, public documents, GitHub, or the frontend code.

## What Has Already Been Added

The app now has backend routes for social publishing:

- `GET /api/social/status` checks which platforms have setup values.
- `GET /api/oauth/:platform/start` starts OAuth setup for a platform.
- `GET /api/oauth/:platform/callback` receives the platform login result.
- `POST /api/publish/broadcast` is called when the app tries to publish.

The frontend no longer marks a post as published just because the user clicked "Publish Now" or "Instant Broadcast". It now calls the backend first. If the social platforms are not configured yet, the app shows a warning and keeps the post unpublished. LinkedIn is wired through the real OAuth callback and Posts API: approved text posts are published as the configured organization when `LINKEDIN_ORGANIZATION_ID` is set.

LinkedIn publishing is implemented for text posts. OAuth sessions now use encrypted browser cookies; configure the persistent login encryption secret before production use. See **Persistent social logins** below.

## The Plain-English Version

To link this site to social media, you need to do four jobs:

1. Create developer apps with each social media company.
2. Tell each company the exact website URL they are allowed to send users back to.
3. Store the private keys and tokens safely on the server, not in the browser.
4. Add the final publishing call for each platform.

Think of it like getting keys cut for several locked doors. The site already has the keyring. Now each social platform must issue its own approved key.

## Before You Start

You need:

- Admin access to the Q social accounts.
- Access to the hosting provider where this app is deployed.
- Access to the `.env.local` file for local testing, or environment variables in production.
- Access to the Supabase project if tokens will be stored there.
- A confirmed public site URL, for example `https://your-site.vercel.app`.

For local testing, use:

```text
APP_URL=http://localhost:3000
```

For production, use the real public URL:

```text
APP_URL=https://your-public-site-url
```

## Environment Variables

For Facebook Login for Business, set `META_LOGIN_CONFIG_ID` to the configuration ID from the Facebook app's **Facebook Login for Business → Configurations** page. For the current Q configuration, this is `4410601669194113`, belonging to app `1789322359060686`. Set `META_APP_ID` and `META_APP_SECRET` to that app's credentials and register `https://social.q-ai.online/api/oauth/facebook/callback`. When a configuration ID is set, the authorization URL uses `config_id` and lets the configuration define permissions rather than sending `scope`. Redeploy after changing production environment variables.

### Vercel deployment

The `/api/:path*` rewrite in `vercel.json` must come before the frontend fallback and target `/api/index`, the Express serverless entry point. Environment variables alone do not enable API routing. Redeploy after changing routing or production environment variables.

For `social.q-ai.online`, set `APP_URL=https://social.q-ai.online` and configure `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET` in the Vercel Production environment. Register `https://social.q-ai.online/api/oauth/instagram/callback` as an allowed redirect URI in the Instagram developer app.

Use the **Instagram App ID** and **Instagram App Secret** from **Instagram → API setup with Instagram login** in Meta for Developers. The parent Meta app ID and secret are different credentials; using them with Instagram Login can produce **Invalid platform app** before the callback. This flow does not fall back to `META_APP_ID` or `META_APP_SECRET`. After correcting the production credentials, redeploy and verify the `client_id` in `/api/oauth/instagram/start-url` matches the Instagram App ID. The callback exchanges the code at `https://api.instagram.com/oauth/access_token`.

After deployment, open `/api/health`: it must return JSON with `status: "ok"`. `/api/oauth/instagram/start-url` must return JSON containing an Instagram authorization URL, or a JSON setup error identifying missing variables. If either returns the frontend HTML, check that the deployed commit includes the API function and routing configuration.

Copy `.env.example` to `.env.local` for local testing. Fill in only the values you have created through the official developer dashboards.

Required groups:

```text
META_APP_ID=
META_APP_SECRET=
META_FACEBOOK_PAGE_ID=
META_INSTAGRAM_BUSINESS_ACCOUNT_ID=
META_THREADS_USER_ID=

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_ORGANIZATION_ID=


TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

BLUESKY_SESSION_SECRET=

Q_WEBSITE_PUBLISH_ENDPOINT=
Q_WEBSITE_PUBLISH_SECRET=
```

Never put these values into files that are committed to GitHub.

## Step 1: Meta Setup for Instagram and Facebook

Meta covers three targets:

- Instagram professional account
- Facebook Page

You need a Meta Developer account and a Meta app.

1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Sign in with the Facebook account that manages the Q Facebook Page and linked Instagram account.
3. Create a new app.
4. Choose a business or content publishing app type where available.
5. Add products needed for Facebook Login, Instagram API, and Pages API.
6. Add the production website URL in the app settings.
7. Add this callback URL:

```text
https://your-public-site-url/api/oauth/instagram/callback
```

Also add:

```text
https://your-public-site-url/api/oauth/facebook/callback
```

For local testing, also add:

```text
http://localhost:3000/api/oauth/instagram/callback
http://localhost:3000/api/oauth/facebook/callback
```

8. Request these permissions:

```text
pages_show_list
pages_read_engagement
pages_manage_posts
instagram_basic
instagram_content_publish
instagram_manage_comments
```

9. Copy the App ID into `META_APP_ID`.
10. Copy the App Secret into `META_APP_SECRET`.
11. Ask the developer to retrieve and save:

```text
META_FACEBOOK_PAGE_ID
META_INSTAGRAM_BUSINESS_ACCOUNT_ID
META_THREADS_USER_ID
```

12. Test OAuth by visiting:

```text
http://localhost:3000/api/oauth/instagram/start
```

Expected result: Meta asks you to approve permissions, then returns to the site callback route.

Production note: Meta usually requires app review and business verification before public users can publish through the app.

## Step 2: LinkedIn Setup

LinkedIn is used for posting to the Q organization page.

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/).
2. Create an app.
3. Associate it with the correct Q organization page.
4. In the OAuth settings, add:

```text
https://your-public-site-url/api/oauth/linkedin/callback
```

For local testing:

```text
http://localhost:3000/api/oauth/linkedin/callback
```

5. Request permissions for organization posting, usually:

```text
w_member_social
w_organization_social
r_organization_social
```

6. Copy the Client ID into `LINKEDIN_CLIENT_ID`.
7. Copy the Client Secret into `LINKEDIN_CLIENT_SECRET`.
8. Ask the developer to find the organization ID and save it as:

```text
LINKEDIN_ORGANIZATION_ID
```

9. Test OAuth by visiting:

```text
http://localhost:3000/api/oauth/linkedin/start
```

LinkedIn may require review before organization posting is allowed.

## Step 4: TikTok Setup

TikTok direct publishing requires approval for the Content Posting API.

1. Go to [TikTok for Developers](https://developers.tiktok.com/).
2. Create an app.
3. Add the Content Posting API product.
4. Enable direct post configuration.
5. Add this redirect URL:

```text
https://your-public-site-url/api/oauth/tiktok/callback
```

For local testing:

```text
http://localhost:3000/api/oauth/tiktok/callback
```

6. Request these scopes:

```text
user.info.basic
video.upload
video.publish
```

7. Copy the Client Key into `TIKTOK_CLIENT_KEY`.
8. Copy the Client Secret into `TIKTOK_CLIENT_SECRET`.
9. Test OAuth by visiting:

```text
http://localhost:3000/api/oauth/tiktok/start
```

TikTok can restrict posts from unaudited apps to private visibility until the app passes review.

## Step 5: Bluesky Setup

Set the server-only `BLUESKY_SESSION_SECRET`, deploy, then connect from the manager using your handle and app password. See **Bluesky connection and publishing** below for the implementation, security, and supported media limits.

## Step 6: Official Website Publishing

The website target is different from social media. It needs a private endpoint on the official Q website.

The Q website should expose a protected endpoint such as:

```text
POST https://q-ai.online/api/journal/publish
```

The social manager should save:

```text
Q_WEBSITE_PUBLISH_ENDPOINT=https://q-ai.online/api/journal/publish
Q_WEBSITE_PUBLISH_SECRET=private-shared-secret
```

The receiving website must check the secret before creating a public article.

## Step 7: Secure Token Storage

OAuth tokens are stored in encrypted browser cookies and survive server restarts with a stable encryption secret. Shared organisational credentials and unattended scheduling would require a separate server-side credential store.

Production should use one of these:

- Supabase Vault for encrypted secrets.
- A dedicated `social_account_tokens` table with encryption and strict Row Level Security.
- A hosting-provider secrets manager.

Recommended production table shape:

```sql
create table social_account_tokens (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  account_handle text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  expires_at timestamptz,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table social_account_tokens enable row level security;
```

Do not create broad public read policies for this table.

## Step 8: Add the Final Publish Adapters

The current adapter lives in `server.ts` in this function:

```text
publishToPlatform(platform, payload)
```

A developer needs to replace each `not_configured` response with the real platform call.

Examples of what each adapter must do:

- Instagram: create a media container, then publish that container.
- Facebook Page: publish to the Page feed, photos, videos, or reels endpoint.
- LinkedIn: create an organization post using the organization ID.
- X: call the tweet creation endpoint with the authorized user token.
- TikTok: initialize a direct post upload, then upload or provide media URL details.
- Bluesky: create an AT Protocol post record.
- Website: call the Q website publishing endpoint with the shared secret.

Each adapter must return:

```json
{
  "platform": "instagram",
  "status": "published",
  "message": "Published successfully.",
  "remoteId": "platform-post-id"
}
```

If the adapter cannot publish, it must return or throw a clear error. Do not mark a post as published unless the platform confirms success.

## Step 9: Test Checklist

Use this checklist in order:

1. Start the local app:

```powershell
npm.cmd run dev
```

2. Check server health:

```text
http://localhost:3000/api/health
```

3. Check social setup:

```text
http://localhost:3000/api/social/status
```

4. Try one OAuth setup route, for example:

```text
http://localhost:3000/api/oauth/linkedin/start
```

5. In the app, create a draft post.
6. Try "Instant Broadcast".
7. Confirm that the app refuses to mark the post published until backend publishing is fully configured.
8. After a real adapter is enabled, publish a test post to a private or low-risk test account first.
9. Check the actual social platform manually.
10. Save the platform post URL or ID as evidence.

## Official Documentation Links

- Meta for Developers: https://developers.facebook.com/
- Instagram API collection: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- LinkedIn Posts API: https://learn.microsoft.com/en-au/linkedin/marketing/community-management/shares/posts-api
- X Developer Portal: https://developer.x.com/
- TikTok Content Posting API: https://developers.tiktok.com/docs/en/content-posting-api-get-started
- Bluesky API: https://bsky.network/docs/bluesky-api/
- Supabase Vault: https://supabase.com/docs/guides/database/vault

## Safety Rules

- Never put access tokens in frontend React files.
- Never put app secrets in `VITE_` variables.
- Never commit `.env.local`.
- Use a test account before posting to the real Q accounts.
- Do not publish sensitive personal information.
- Do not rely on the app UI alone. Always check the real social platform after testing.


## Bluesky connection and publishing

Bluesky now supports real app-password sign-in, session renewal, text posts, and up to four PNG/JPEG/WebP images (1 MB each). Only Bluesky-hosted accounts are supported. Set a random server-only `BLUESKY_SESSION_SECRET` of at least 32 characters in Vercel Production and redeploy. Generate it locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Do not use a `VITE_` prefix or commit the value.

In Channels or the header's connection manager, select **Bluesky → Connect**, enter the full handle and an app password from https://bsky.app/settings/app-passwords. The app password is used for authentication and is not saved. Access and refresh tokens are stored in an AES-256-GCM encrypted, HttpOnly, Secure, SameSite=Strict cookie for this browser, valid for up to 30 days. Keep the encryption secret stable across deployments; rotating it requires reconnecting. There is no shared organisational connection or unattended scheduled dispatch in this implementation. Another browser must connect separately.

Connection status restores after reload. **Test** checks the actual session; **Disconnect** removes this browser's cookie. To revoke the app password globally, delete it in Bluesky. Publishing requires the encrypted session cookie and a same-origin request; no globally configured account credentials can be used by anonymous requests. The app uses the account's Bluesky-hosted PDS returned during login and refreshes expiring access tokens before requests.

Image uploads can be inline base64 PNG/JPEG/WebP or HTTPS URLs from the current approved hosts: `images.unsplash.com` and the project's public Supabase media host. Add other trusted public image hosts explicitly in `BLUESKY_MEDIA_HOSTS`; credentials are never forwarded to media hosts and redirects are rejected. Videos and SVG are rejected rather than silently omitted. Long posts, too many images, image fetch/upload failures, and expired/revoked sessions return a failure and do not claim a successful post. A successful publish includes the provider's AT URI.

Validation: `npm run test:bluesky` runs mocked HTTP integration checks through the real Express routes; no test publishes to a live account. Real login and publishing require the owner's app password entered in the UI.


## Persistent social logins

Facebook, Instagram, LinkedIn and TikTok sessions now use per-provider encrypted HttpOnly cookies rather than server memory. Set a stable random server-only `SOCIAL_SESSION_SECRET` of at least 32 characters (or reuse the existing `BLUESKY_SESSION_SECRET`) in Vercel Production and redeploy. AES-GCM tokens remain readable across server instances using the same secret. Rotating the secret requires reconnecting. Cookies are Secure in production, SameSite=Lax to allow provider callbacks, and scoped to `/api`; publishing and disconnect require same-origin requests. OAuth state is encrypted, browser-bound and valid for ten minutes.

The manager restores all connection statuses on ordinary reload, not just OAuth returns. Disconnect clears the provider cookie. Instagram and Facebook exchange initial tokens for long-lived tokens before saving. Sessions last until provider expiry, capped at 60 days; unknown expiry defaults to one day. LinkedIn/TikTok require reconnecting when their token expires; there is no promise of indefinite provider access. Tokens are never stored in localStorage or returned by the status API. There is no cross-browser shared login or unattended scheduler. Existing server-memory connections must reconnect once after deployment.

Staff sign-in remains saved in localStorage until explicit sign-out. This is the existing staff profile/demo gate, not a new server-verified authentication system.
