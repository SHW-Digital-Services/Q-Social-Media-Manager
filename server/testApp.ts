// Provider regression harness: no bypass is exposed by the production server.
import express from 'express';
import {createApp, requirePublishFields, publishToPlatform} from '../server.js';
import {isBlueskySameOrigin} from './bluesky.js';
export async function providerTestApp() {
  const app=express();app.use(express.json({limit:'10mb'}));
  app.post('/api/publish/broadcast',async(req,res)=>{
    if(!isBlueskySameOrigin(req))return res.status(403).json({error:'Invalid origin.'});
    const error=requirePublishFields(req.body);if(error)return res.status(400).json({error});
    const results=await Promise.all(req.body.platforms.map((p:any)=>publishToPlatform(p,req.body,req,res)));
    const failed=results.filter(r=>r.status!=='published');
    res.status(failed.length?(failed.some(r=>r.status==='failed')?502:409):200).json({success:!failed.length,results});
  });
  app.use(await createApp({authenticate:(_req,res,next)=>{res.locals.staff={id:'synthetic-user',email:'scott@q-ai.online'};next();},connections:(_req,_res,next)=>next()}));
  return app;
}
