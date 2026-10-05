import type { Express, NextFunction, Request, Response } from 'express';
import { getSocialSession } from './socialSessions.js';
import { getBlueskySession } from './bluesky.js';
import { database, requireDatabase } from './database.js';
const names = new Set(['q_bluesky_session','q_social_facebook','q_social_website']);
export async function sharedConnections(req: Request, res: Response, next: NextFunction) {
  if (!res.locals.staff || !/^\/(social|bluesky|website|oauth|publish|schedule|posts)/.test(req.path)) return next();
  try {
    let rows = requireDatabase(await database().from('social_manager_connections').select('cookie_name,ciphertext'));
    // Preserve a lead approver's existing encrypted connections during the shared-storage upgrade.
    if(res.locals.staff.email==='scott@q-ai.online') {
      for(const name of names) {
        const value=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(`${name}=`))?.slice(name.length+1);
        const valid=name==='q_bluesky_session'?getBlueskySession(req):getSocialSession(req,name.slice('q_social_'.length));
        if(value && value.length<=3800 && valid && !rows.some(row=>row.cookie_name===name))requireDatabase(await database().from('social_manager_connections').upsert({cookie_name:name,ciphertext:value},{onConflict:'cookie_name',ignoreDuplicates:true}));
      }
      rows=requireDatabase(await database().from('social_manager_connections').select('cookie_name,ciphertext'));
    }
    const browser = (req.headers.cookie || '').split(';').map(v=>v.trim()).filter(v=>!names.has(v.split('=')[0]));
    req.headers.cookie = [...browser,...rows.map(row=>`${row.cookie_name}=${row.ciphertext}`)].join('; ');
    const pending = new Map<string,string | null>();
    const setCookie = res.cookie.bind(res), clearCookie = res.clearCookie.bind(res), end = res.end.bind(res);
    res.cookie = ((name: string, value: string, options?: any) => { if(names.has(name)) pending.set(name,value); return setCookie(name,value,options); }) as typeof res.cookie;
    res.clearCookie = ((name: string, options?: any) => { const result = clearCookie(name,options); if(names.has(name)) pending.set(name,null); return result; }) as typeof res.clearCookie;
    let finished = false;
    res.end = ((...args: any[]) => {
      if (finished) return res;
      finished = true;
      (async () => {
        for (const [name,value] of pending) {
          // An empty tombstone prevents old browser cookies from restoring a disconnected account.
          requireDatabase(await database().from('social_manager_connections').upsert({cookie_name:name,ciphertext:value||'',updated_at:new Date().toISOString()}));
        }
      })().then(()=>end(...args as [any])).catch(()=>{
        if(!res.headersSent) { res.status(503); res.removeHeader('Content-Length'); res.removeHeader('Location'); res.removeHeader('Set-Cookie'); res.setHeader('Content-Type','application/json'); end(JSON.stringify({error:'The social login could not be saved securely. Reconnect and try again.'})); }
        else end();
      });
      return res;
    }) as typeof res.end;
    next();
  } catch { res.status(503).json({error:'Shared social connections could not be loaded. Try again shortly.'}); }
}
export async function connectionCookies() {
  const rows = requireDatabase(await database().from('social_manager_connections').select('cookie_name,ciphertext'));
  return rows.map(row=>`${row.cookie_name}=${row.ciphertext}`).join('; ');
}
