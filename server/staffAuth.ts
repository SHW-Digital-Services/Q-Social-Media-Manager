import type { Request, Response, NextFunction, Express } from 'express';
import crypto from 'node:crypto';
import { isBlueskySameOrigin } from './bluesky.js';
import { database } from './database.js';
export type StaffIdentity = { id: string; email: string; name: string; role: 'admin' | 'staff'; title: string; avatar: string; isStaffOnly: boolean };
export const LEAD_EMAIL = 'scott@q-ai.online';
export function staffIdentity(user: { id: string; email?: string; email_confirmed_at?: string; app_metadata?: Record<string, unknown> }): StaffIdentity | null {
  const email = user.email?.toLowerCase();
  const allowed = (process.env.SOCIAL_STAFF_EMAILS || 'scott@q-ai.online,scott.harveywhittle@ou.ac.uk').split(',').map(v => v.trim().toLowerCase());
  if (!email || !user.email_confirmed_at || !allowed.includes(email)) return null;
  return { id: user.id, email, name: email === LEAD_EMAIL || email === 'scott.harveywhittle@ou.ac.uk' ? 'Scott Harvey-Whittle' : email.split('@')[0], role: email === LEAD_EMAIL ? 'admin' : 'staff', title: email === LEAD_EMAIL ? 'Lead Approver & Communications Director' : 'Social Media Officer', avatar: 'https://brnhalxydcakutxiregp.supabase.co/storage/v1/object/public/images/Logo.png', isStaffOnly: true };
}
const options = () => ({ httpOnly: true, secure: Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api', maxAge: 3600000 });
function key() {
  const secret = process.env.SOCIAL_SESSION_SECRET || process.env.BLUESKY_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('Server session encryption is not configured.');
  return crypto.createHash('sha256').update(`q-staff-auth:${secret}`).digest();
}
function seal(token: string) {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  return Buffer.concat([iv,cipher.update(token),cipher.final(),cipher.getAuthTag()]).toString('base64url');
}
function cookieToken(req: Request) {
  try {
    const value = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('q_staff_session='))?.slice(16);
    if (!value) return '';
    const bytes = Buffer.from(value,'base64url'), decipher = crypto.createDecipheriv('aes-256-gcm',key(),bytes.subarray(0,12));
    decipher.setAuthTag(bytes.subarray(-16));
    return Buffer.concat([decipher.update(bytes.subarray(12,-16)),decipher.final()]).toString();
  } catch { return ''; }
}
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  if(!['GET','HEAD','OPTIONS'].includes(req.method) && !isBlueskySameOrigin(req))return res.status(403).json({error:'Make this request from the social workspace.'});
  if (req.path.startsWith('/health') || req.path === '/auth/session' || req.path === '/auth/logout' || req.path === '/cron/publish') return next();
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : cookieToken(req);
  if (!token) return res.status(401).json({ error: 'Sign in to access this workspace.' });
  try {
    const {data,error} = await database().auth.getUser(token);
    const staff = !error && data.user ? staffIdentity(data.user) : null;
    if (!staff) return res.status(error ? 401 : 403).json({ error: 'Your session expired or this account is not authorised for this workspace.' });
    if (/^\/(oauth|bluesky\/(connect|disconnect)|website\/connect|social\/[^/]+\/disconnect)/.test(req.path) && staff.email!==LEAD_EMAIL) return res.status(403).json({error:'Only the lead approver can manage shared social connections.'});
    res.locals.staff = staff;
    next();
  } catch { res.status(503).json({ error: 'Authentication is temporarily unavailable. Try again shortly.' }); }
}
export function requireApprover(res: Response) {
  if (res.locals.staff?.email !== LEAD_EMAIL) throw Object.assign(new Error('Only the lead approver can approve, publish or schedule posts.'), { status: 403 });
}
export function registerStaffRoutes(app: Express) {
  app.post('/api/auth/session', async (req, res) => {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'A valid sign-in session is required.' });
    try {
      const {data,error} = await database().auth.getUser(token);
      const staff = !error && data.user ? staffIdentity(data.user) : null;
      if (!staff) return res.status(403).json({ error: 'This account is not authorised for this workspace.' });
      res.cookie('q_staff_session', seal(token), options());
      res.json({user:staff});
    } catch { res.status(503).json({ error: 'Authentication is unavailable.' }); }
  });
  app.post('/api/auth/logout', (_req,res) => { res.clearCookie('q_staff_session', { ...options(), maxAge: undefined }); res.json({ success:true }); });
  app.get('/api/auth/me', (_req,res) => res.json({user:res.locals.staff}));
}
