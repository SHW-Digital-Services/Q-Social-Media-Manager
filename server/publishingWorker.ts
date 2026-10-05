import type { Request, Response, Express } from 'express';
import crypto from 'node:crypto';
import { database, requireDatabase } from './database.js';
import { connectionCookies } from './sharedConnections.js';
import { publishBluesky } from './bluesky.js';
import { publishFacebook } from './facebook.js';
import { publishWebsite } from './website.js';
export function deliveryState(result: { status: string; message?: string }) {
  if(result.status==='published')return 'published';
  return /timeout|timed out|abort|did not confirm|fetch failed|network|socket|ECONN|\b5\d\d\b/i.test(result.message||'')?'uncertain':'failed';
}
export async function runPublishingJobs(postId?: string) {
  const db=database();
  requireDatabase(await db.from('social_manager_jobs').update({state:'uncertain',error:'Publishing worker stopped before confirming the result. Check the social platform before retrying.',completed_at:new Date().toISOString()}).eq('state','running').lt('started_at',new Date(Date.now()-10*60000).toISOString()));
  const jobs=requireDatabase(await db.rpc('social_manager_claim_jobs',{batch_size:3,target_post:postId||null}));
  return Promise.all((jobs||[]).map(async (job: any) => {
    let result: {status:string;message:string;remoteId?:string};
    try {
      const origin=new URL(process.env.APP_URL!).origin;
      const req={headers:{cookie:await connectionCookies()},get:(name:string)=>name.toLowerCase()==='origin'?origin:undefined} as unknown as Request;
      const cookies=new Map<string,string>();
      const res={cookie:(name:string,value:string)=>cookies.set(name,value)} as unknown as Response;
      if(job.platform==='bluesky')result=await publishBluesky(req,res,{...job.payload,recordKey:job.id});
      else if(job.platform==='facebook')result=await publishFacebook(req,job.payload);
      else result=await publishWebsite(req,job.payload);
      for(const [name,value] of cookies) { const saved=await db.from('social_manager_connections').upsert({cookie_name:name,ciphertext:value,updated_at:new Date().toISOString()}); if(saved.error) console.error(JSON.stringify({event:'social_connection_refresh_save_failed',platform:job.platform})); }
    }catch(error){result={status:'failed',message:`Publishing did not confirm: ${(error as Error).message}`};}
    const state=deliveryState(result);
    requireDatabase(await db.rpc('social_manager_finish_job',{job_id:job.id,result_state:state,result_remote_id:result.remoteId||null,result_error:state==='published'?null:result.message.slice(0,1000)}));
    return {platform:job.platform,state};
  }));
}
export function registerPublishingWorker(app: Express) {
  app.get('/api/cron/publish',async(req,res)=>{
    const secret=process.env.CRON_SECRET,provided=req.get('authorization')||'';
    const expected=`Bearer ${secret}`;
    if(!secret || Buffer.byteLength(provided)!==Buffer.byteLength(expected) || !crypto.timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return res.status(401).json({error:'Unauthorised scheduler request.'});
    try{res.json({results:await runPublishingJobs()});}catch{res.status(503).json({error:'Publishing worker could not complete its run.'});}
  });
}
