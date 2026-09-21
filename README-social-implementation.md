# Q Social Media Manager: Social Media Linking and Publishing Setup

This guide explains how to connect the site to social media accounts and turn the current publishing routes into real live posting.

It is written for a non-technical person carrying out the setup with help from a developer where needed. Do not paste passwords, API keys, app secrets, or access tokens into chat, email, screenshots, public documents, GitHub, or the frontend code.

## What Has Already Been Added

The app now has backend routes for social publishing:

- `GET /api/social/status` checks which platforms have setup values.
- `GET /api/oauth/:platform/start` starts OAuth setup for a platform.
- `GET /api/oauth/:platform/callback` receives the platform login result.
- `POST /api/publish/broadcast` is called when the app tries to publish.

The frontend no longer marks a post as published just because the user clicked "Publish Now" or "Instant Broadcast". It now calls the backend first. If the social platforms are not configured yet, the app shows a warning and keeps the post unpublished.

Important: the routes are a safe implementation scaffold. They validate the request, start OAuth where possible, and block publishing until each platform's final API adapter and secure token storage are completed.

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

X_CLIENT_ID=
X_CLIENT_SECRET=

TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

BLUESKY_HANDLE=
BLUESKY_APP_PASSWORD=

Q_WEBSITE_PUBLISH_ENDPOINT=
Q_WEBSITE_PUBLISH_SECRET=
```

Never put these values into files that are committed to GitHub.

## Step 1: Meta Setup for Instagram, Facebook, and Threads

Meta covers three targets:

- Instagram professional account
- Facebook Page
- Threads profile

You need a Meta Developer account and a Meta app.

1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Sign in with the Facebook account that manages the Q Facebook Page and linked Instagram account.
3. Create a new app.
4. Choose a business or content publishing app type where available.
5. Add products needed for Facebook Login, Instagram API, Pages API, and Threads API.
6. Add the production website URL in the app settings.
7. Add this callback URL:

```text
https://your-public-site-url/api/oauth/instagram/callback
```

Also add:

```text
https://your-public-site-url/api/oauth/facebook/callback
https://your-public-site-url/api/oauth/threads/callback
```

For local testing, also add:

```text
http://localhost:3000/api/oauth/instagram/callback
http://localhost:3000/api/oauth/facebook/callback
http://localhost:3000/api/oauth/threads/callback
```

8. Request these permissions:

```text
pages_show_list
pages_read_engagement
pages_manage_posts
instagram_basic
instagram_content_publish
instagram_manage_comments
threads_basic
threads_content_publish
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

## Step 3: X / Twitter Setup

X uses OAuth 2.0 with PKCE. The code currently blocks the redirect until the developer adds a session-backed PKCE verifier.

1. Go to the [X Developer Portal](https://developer.x.com/).
2. Create a project and app.
3. Enable OAuth 2.0.
4. Add this callback URL:

```text
https://your-public-site-url/api/oauth/twitter/callback
```

For local testing:

```text
http://localhost:3000/api/oauth/twitter/callback
```

5. Request or enable these scopes:

```text
tweet.read
tweet.write
users.read
offline.access
```

6. Copy the Client ID into `X_CLIENT_ID`.
7. Copy the Client Secret into `X_CLIENT_SECRET`.
8. Ask the developer to add real PKCE storage before enabling:

```text
http://localhost:3000/api/oauth/twitter/start
```

Without PKCE, X will not safely complete the OAuth process.

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

Bluesky uses the AT Protocol. The simplest first version is to use an app password.

1. Sign in to the Q Bluesky account.
2. Open account settings.
3. Create an app password.
4. Save the handle in:

```text
BLUESKY_HANDLE=
```

5. Save the app password in:

```text
BLUESKY_APP_PASSWORD=
```

The developer then adds the Bluesky publish adapter using `com.atproto.server.createSession` and `com.atproto.repo.createRecord`.

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

The development route currently stores OAuth tokens in server memory. That is useful for testing, but it is not suitable for production because tokens disappear when the server restarts.

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
- Threads: create a Threads media container, then publish it.
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
