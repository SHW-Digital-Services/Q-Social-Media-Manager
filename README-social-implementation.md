# Q Social Media Manager connections

The manager supports LinkedIn personal profiles, Bluesky and the Q website News API. Facebook and TikTok remain available for sign-in setup; their publishing adapters are not implemented. Instagram, Threads and X have been removed from connection options, publishing selection and OAuth routes.

## Deployment and session storage

The Vercel `/api/:path*` rewrite must target `/api/index` before the frontend fallback. Set `APP_URL=https://social.q-ai.online`. `/api/health` must return JSON, not the frontend HTML.

Set a stable, random server-only `SOCIAL_SESSION_SECRET` of at least 32 characters. OAuth and website connections can reuse `BLUESKY_SESSION_SECRET` if that is already configured. Bluesky itself uses `BLUESKY_SESSION_SECRET`. Never expose these with a `VITE_` prefix or commit the values. Generate a secret locally with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

OAuth and website tokens use AES-256-GCM encrypted, HttpOnly, production-Secure cookies, scoped to `/api`. OAuth callbacks use SameSite=Lax and browser-bound encrypted state valid for ten minutes. Bluesky uses SameSite=Strict. Publishing, checking and disconnect require same-origin requests. Status responses contain metadata only, not credentials.

Connections restore on ordinary reload and survive server restarts with a stable secret. They belong to this browser; there is no shared organisational credential store or unattended scheduler. Rotating the secret requires reconnecting. Staff sign-in remains the existing local profile/demo gate rather than server-verified staff authentication.

## LinkedIn personal profile

1. Create an app at https://www.linkedin.com/developers/apps.
2. Enable **Sign In with LinkedIn using OpenID Connect** and **Share on LinkedIn**.
3. Register `https://social.q-ai.online/api/oauth/linkedin/callback` as an authorised redirect URL.
4. Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` in Vercel Production; optionally set `LINKEDIN_VERSION` to a supported monthly REST API version. The default uses the previous calendar month.
5. Redeploy and select **LinkedIn Profile → Sign in** in Channels.
6. Approve access to your personal profile.

The requested permissions are `openid profile w_member_social`. The callback verifies the member through `/v2/userinfo`, stores their person URN and name, and publishes as that person. `LINKEDIN_ORGANIZATION_ID` is not used. Connection tests call the real profile API.

Publishing supports text up to 3,000 characters including tags, or text with one PNG/JPEG image of at most 10 MB. The image is uploaded and checked as AVAILABLE before the post is created. Extra images, unsupported media and failed uploads return errors rather than silently dropping content. A successful post returns LinkedIn's `x-restli-id`. Provider expiry or revocation requires reconnecting; persistent cookies do not grant indefinite access.

## Q website News integration

The existing Q website publishes public news through `https://www.q-ai.online/api/content/publish`, backed by its CRM-authorised content API clients. Manager content appears at `https://www.q-ai.online/news`.

1. Deploy the companion Q website change adding `GET /api/content/publisher/status`.
2. Sign into the Q website CRM as an administrator and open **News & Updates**.
3. In **Authorised publishing API**, enter **Social Media Manager**, then select **Authorise API**.
4. Copy the `qcp_...` token when shown; the CRM stores only its hash.
5. In the manager, select **Official Website → Connect** and enter that token.

The manager verifies the token through the read-only publisher-status endpoint and saves it in an encrypted browser cookie for up to 60 days. No website token or Supabase service-role key is required in frontend environment variables. The destination origin is fixed to `www.q-ai.online`; tokens are never sent to arbitrary URLs or followed through redirects.

Website publication maps the composer title and content to a `news` article, derives a summary and stable slug, normalises tags, and includes an optional hosted HTTPS hero image. Requirements: title 3–180 characters; body 20–20,000 characters; at most 12 tags of 40 characters; one hero image. Inline images and extra images are rejected. The News endpoint verifies the CRM token on every publish; revoking the client blocks subsequent publishing. Successful publication requires a returned post ID, slug and publication date. Duplicate slugs are rejected by the existing API rather than creating duplicate articles.

The manager's **Test** button verifies the publisher without creating a draft or post. **Disconnect** clears this browser's saved token. Global revocation is performed in the Q website CRM.

## Bluesky

Set `BLUESKY_SESSION_SECRET`, then use **Bluesky → Connect** with a full handle and an app password from https://bsky.app/settings/app-passwords. Only Bluesky-hosted accounts are supported. The app password is used once and is not saved. Access and refresh tokens are encrypted in a browser cookie valid for up to 30 days. Expiring access tokens renew before provider requests. **Test** checks the real session; **Disconnect** removes the cookie. Revoke the app password in Bluesky to remove global access.

Publishing supports 300 grapheme characters including tags and up to four PNG/JPEG/WebP images of at most 1 MB each. Videos/SVG and failed uploads do not silently become text-only posts. Success includes the provider's AT URI.

Image downloads for Bluesky and LinkedIn are restricted to `images.unsplash.com` and the project's public Supabase media host by default. Add trusted public HTTPS hosts explicitly through `PUBLISHING_MEDIA_HOSTS` (the previous `BLUESKY_MEDIA_HOSTS` remains a fallback). Inline supported base64 images are accepted. Credentials are never forwarded to media hosts and redirects are rejected.

## Facebook and TikTok

Facebook uses `META_APP_ID`, `META_APP_SECRET` and optional `META_LOGIN_CONFIG_ID` for Facebook Login for Business. Register `https://social.q-ai.online/api/oauth/facebook/callback`. Permissions are `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, or the permissions in the Business Login configuration. The callback exchanges for a long-lived user token. Facebook publishing is still not implemented.

TikTok setup uses `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` and `https://social.q-ai.online/api/oauth/tiktok/callback`. Provider approval and completion of its provider-specific login/publishing flow are still required. Do not treat an available channel card as proof of working publishing.

## Verification

```sh
npm run lint
npm run test:connections
npm run build
```

HTTP integration tests exercise real manager routes with simulated provider responses: browser-bound OAuth state; persistent encrypted cookies; restart recovery; expiry, isolation and tampering; Bluesky renewal and publishing; LinkedIn profile verification and image publishing; website verification, payload mapping and failures; rejected Instagram routes; and disconnect. Tests create no live posts. Real account authorisation and production publication require the owner's configuration and consent.
