import crypto from 'node:crypto';
import type { Request, Response } from 'express';

const PROVIDERS = new Set(['facebook', 'linkedin', 'tiktok', 'website']);
const COOKIE_DAYS = 60;
export type SocialSession = {
  platform: string;
  access_token: string;
  refresh_token?: string;
  memberUrn?: string;
  accountHandle?: string;
  user_id?: string;
  connectedAt: string;
  expiresAt: number;
};
function key() {
  const secret = process.env.SOCIAL_SESSION_SECRET || process.env.BLUESKY_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('Set SOCIAL_SESSION_SECRET (or BLUESKY_SESSION_SECRET) to at least 32 random characters before connecting social accounts.');
  return crypto.createHash('sha256').update(`q-social-sessions:${secret}`).digest();
}
function cookieName(platform: string, state = false) {
  if (!PROVIDERS.has(platform)) throw new Error('Unsupported social provider.');
  return `q_social_${state ? 'state_' : ''}${platform}`;
}
function seal(value: unknown) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  return Buffer.concat([iv, cipher.update(JSON.stringify(value)), cipher.final(), cipher.getAuthTag()]).toString('base64url');
}
function unseal(req: Request, name: string): any {
  try {
    const value = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1);
    if (!value) return null;
    const bytes = Buffer.from(value, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(-16));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString());
  } catch { return null; }
}
const options = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL), sameSite: 'lax' as const, path: '/api' });
export function startSocialState(req: Request, res: Response, platform: string) {
  const state = crypto.randomBytes(32).toString('base64url');
  const redirectUri = `${(process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '')}/api/oauth/${platform}/callback`;
  res.cookie(cookieName(platform, true), seal({ state, platform, redirectUri, expiresAt: Date.now() + 600000 }), { ...options(), maxAge: 600000 });
  return { state, redirectUri };
}
export function consumeSocialState(req: Request, res: Response, platform: string) {
  const name = cookieName(platform, true);
  const saved = unseal(req, name);
  res.clearCookie(name, options());
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  if (!saved || saved.platform !== platform || saved.expiresAt <= Date.now() || !state || state !== saved.state) throw new Error('Invalid or expired login state. Start this social connection again in the same browser.');
  return saved.redirectUri as string;
}
export function saveSocialSession(res: Response, platform: string, token: any) {
  if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('The provider did not return an access token.');
  const seconds = Number(token.expires_in);
  const lifetime = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, COOKIE_DAYS * 86400) : 86400;
  const session: SocialSession = { platform, access_token: token.access_token, connectedAt: new Date().toISOString(), expiresAt: Date.now() + lifetime * 1000 };
  if (typeof token.refresh_token === 'string') session.refresh_token = token.refresh_token;
  if (typeof token.accountHandle === 'string') session.accountHandle = token.accountHandle;
  if (typeof token.memberUrn === 'string') session.memberUrn = token.memberUrn;
  if (token.user_id) session.user_id = String(token.user_id);
  const value = seal(session);
  if (value.length > 3800) throw new Error('The provider session is too large to save safely.');
  res.cookie(cookieName(platform), value, { ...options(), maxAge: lifetime * 1000 });
  return session;
}
export function getSocialSession(req: Request, platform: string): SocialSession | null {
  if (!PROVIDERS.has(platform)) return null;
  const session = unseal(req, cookieName(platform));
  return session?.platform === platform && typeof session.access_token === 'string' && session.expiresAt > Date.now() ? session : null;
}
export function clearSocialSession(res: Response, platform: string) {
  res.clearCookie(cookieName(platform), options());
}
export function supportedSessionProvider(platform: string) { return PROVIDERS.has(platform); }
