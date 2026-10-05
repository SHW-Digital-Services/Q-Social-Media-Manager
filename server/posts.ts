import type { Express, Response } from 'express';
import { database, requireDatabase } from './database.js';
import { requireApprover, type StaffIdentity } from './staffAuth.js';
import type { PostItem, PostVersion, SocialPlatform } from '../src/types.js';
import { getBlueskySession } from './bluesky.js';
import { getSocialSession } from './socialSessions.js';
import { runPublishingJobs } from './publishingWorker.js';

export const channels: SocialPlatform[] = ['facebook','bluesky','website'];
export function validatePost(data: Partial<PostItem>, action: string) {
  if (!data || typeof data !== 'object') throw new Error('A post is required.');
  if (!Array.isArray(data.platforms) || !data.platforms.length || data.platforms.some(p=>!channels.includes(p)) || new Set(data.platforms).size!==data.platforms.length) throw new Error('Choose at least one supported publishing channel.');
  if (typeof data.content !== 'string' || data.content.length>20000 || typeof data.title !== 'string' || data.title.length>200) throw new Error('Enter a title of up to 200 characters and copy of up to 20,000 characters.');
  if (action!=='draft' && !data.content.trim()) throw new Error('Write the post copy before submitting for approval.');
  if (!Array.isArray(data.tags) || data.tags.length>30 || data.tags.some(t=>typeof t!=='string'||t.length>100)) throw new Error('Use at most 30 tags, each under 100 characters.');
  if (!Array.isArray(data.mediaUrls) || data.mediaUrls.length>10 || data.mediaUrls.some(v=>typeof v!=='string'||v.length>3000000||(!v.startsWith('data:image/')&&!v.startsWith('https://')))) throw new Error('Use up to ten HTTPS images or uploaded image assets.');
  if (data.scheduledFor && !Number.isFinite(new Date(data.scheduledFor).getTime())) throw new Error('Choose a valid schedule date and time.');
  const text=[data.content.trim(),...data.tags].join('\n');
  if(action!=='draft' && data.platforms.includes('bluesky') && ([...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)].length>300 || Buffer.byteLength(text)>3000 || data.mediaUrls.length>4)) throw new Error('Bluesky accepts up to 300 characters including tags, and four images.');
  if(action!=='draft' && data.platforms.includes('website') && data.content.trim().length<20) throw new Error('Website news needs at least 20 characters.');
}
export function nextPost(existing: PostItem | null, incoming: Partial<PostItem>, action: string, staff: StaffIdentity, id: string): PostItem {
  const now=new Date().toISOString();
  if(existing?.status==='published') throw new Error('Published posts cannot be changed here. Create a new draft.');
  if(existing?.status==='scheduled') throw new Error('Cancel the schedule before editing this post.');
  if(['approve','changes'].includes(action) && staff.email!=='scott@q-ai.online') throw Object.assign(new Error('Only the lead approver can review posts.'),{status:403});
  if(action==='approve' && existing?.status!=='pending_approval') throw new Error('Only a pending post can be approved.');
  if(action==='changes' && !incoming.feedback?.trim()) throw new Error('Explain the requested changes.');
  const editable=['draft','submit'].includes(action);
  if(!existing && !editable) throw new Error('Save the draft before reviewing it.');
  const fields=editable?incoming:existing!;
  validatePost(fields,editable?action:'submit');
  const status=action==='submit'?'pending_approval':action==='approve'?'approved':action==='changes'?'changes_requested':'draft';
  const audit=fields.complianceAudit || {score:0,status:'needs_review' as const,summary:'Awaiting brand review.',breakdown:{welcoming:0,affirming:0,clarity:0,privacySafe:0,nonPresumptive:0},flags:[],scannedAt:now};
  const post: PostItem={
    ...existing,id,title:fields.title || 'Untitled post',content:fields.content || '',platforms:fields.platforms!,mediaUrls:fields.mediaUrls!,tags:fields.tags!,campaign:typeof fields.campaign==='string'?fields.campaign.slice(0,150):'General',
    scheduledFor:fields.scheduledFor?new Date(fields.scheduledFor).toISOString():null,status,createdAt:existing?.createdAt||now,lastModified:now,
    author:existing?.author||{name:staff.name,role:staff.title,avatar:staff.avatar},comments:existing?.comments||[],complianceAudit:audit,piiShieldVerified:Boolean(fields.piiShieldVerified),
    approvedBy:action==='approve'?staff.email:undefined,
  };
  if(action==='changes') post.comments=[...post.comments,{id:crypto.randomUUID(),author:staff.name,authorRole:staff.title,avatar:staff.avatar,content:incoming.feedback!.slice(0,3000),createdAt:now}];
  const history=existing?.versionHistory||[];
  const version: PostVersion={versionId:crypto.randomUUID(),versionNumber:`v${(parseInt(existing?.currentVersion?.slice(1)||'0')||0)+1}.0`,timestamp:now,modifiedBy:staff.name,authorRole:staff.title,changesSummary:action,contentSnapshot:post.content,titleSnapshot:post.title,platformsSnapshot:post.platforms,mediaUrlsSnapshot:post.mediaUrls,complianceScoreSnapshot:post.complianceAudit.score,statusSnapshot:post.status};
  post.versionHistory=[version,...history].slice(0,30);post.currentVersion=version.versionNumber;
  return post;
}
export function apiError(res: Response,error: any) {
  const status=error.status || (/another device/.test(error.message)?409:400);
  res.status(status).json({error:error.message||'The request could not be completed.'});
}
export async function loadPosts(id?: string) {
  let query=database().from('social_manager_posts').select('id,data,revision,updated_at').order('updated_at',{ascending:false}).limit(1000);
  if(id)query=query.eq('id',id);
  const rows=requireDatabase(await query);
  const jobs=rows.length?requireDatabase(await database().from('social_manager_jobs').select('post_id,platform,state,remote_id,error').in('post_id',rows.map(r=>r.id))):[];
  return rows.map(row=>{
    const deliveries=jobs.filter(j=>j.post_id===row.id);
    const published=deliveries.filter(j=>j.state==='published');
    return {...row.data,revision:row.revision,deliveryStates:deliveries,remoteIds:published.map(j=>j.remote_id).filter(Boolean),status:deliveries.length && published.length===deliveries.length?'published':row.data.status,publishedAt:published.length===deliveries.length && deliveries.length?row.updated_at:row.data.publishedAt} as PostItem;
  });
}
export function registerPostRoutes(app: Express) {
  app.get('/api/posts',async (_req,res)=>{try{res.json({posts:await loadPosts()});}catch(error){apiError(res,error);}});
  app.put('/api/posts/:id',async (req,res)=>{
    try {
      if(!/^[a-zA-Z0-9_-]{1,100}$/.test(req.params.id)) throw new Error('Invalid post ID.');
      const revision=req.body?.expectedRevision,action=req.body?.action;
      if(!Number.isInteger(revision)||revision<0||!['draft','submit','approve','changes'].includes(action))throw new Error('A revision and valid post action are required.');
      const existing=(await loadPosts(req.params.id))[0]||null;
      if(existing && existing.revision!==revision)throw Object.assign(new Error('This post changed on another device. Refresh before saving.'),{status:409});
      const post=nextPost(existing,req.body.data,action,res.locals.staff,req.params.id);
      requireDatabase(await database().rpc('social_manager_save_post',{post_id:post.id,post_data:post,expected_revision:revision,actor:res.locals.staff.id}));
      res.json({post:(await loadPosts(post.id))[0]});
    } catch(error){apiError(res,error);}
  });
  app.post('/api/posts/:id/comments',async(req,res)=>{
    try{
      const post=(await loadPosts(req.params.id))[0];if(!post)throw new Error('Save the post before commenting.');
      if(!Number.isInteger(req.body?.expectedRevision)||req.body.expectedRevision!==post.revision)throw Object.assign(new Error('This post changed on another device. Refresh before saving.'),{status:409});
      const text=req.body?.content;if(typeof text!=='string'||!text.trim()||text.length>3000)throw new Error('Write a comment of up to 3,000 characters.');
      const staff=res.locals.staff;post.comments=[...post.comments,{id:crypto.randomUUID(),author:staff.name,authorRole:staff.title,avatar:staff.avatar,content:text.trim(),createdAt:new Date().toISOString()}].slice(-200);
      requireDatabase(await database().rpc('social_manager_save_post',{post_id:post.id,post_data:post,expected_revision:post.revision,actor:staff.id}));
      res.json({post:(await loadPosts(post.id))[0]});
    }catch(error){apiError(res,error);}
  });
  app.post('/api/posts/:id/schedule',async(req,res)=>{
    try{
      requireApprover(res);
      if(!Number.isInteger(req.body?.expectedRevision)||req.body.expectedRevision<1)throw new Error('A saved post revision is required.');
      const post=(await loadPosts(req.params.id))[0];
      if(!post)throw new Error('Post not found.');
      const instant=req.body?.instant===true;
      const runAt=instant?new Date():new Date(req.body?.scheduledFor||post.scheduledFor||'');
      if(!Number.isFinite(runAt.getTime())||(!instant && runAt.getTime()<Date.now()+60000))throw new Error('Choose a schedule at least one minute in the future.');
      if(post.platforms.some(p=>p==='bluesky'?!getBlueskySession(req):!getSocialSession(req,p)))throw new Error('Connect every selected channel before scheduling.');
      requireDatabase(await database().rpc('social_manager_enqueue',{post_id:post.id,expected_revision:req.body.expectedRevision,actor:res.locals.staff.id,send_at:runAt.toISOString(),instant}));
      if(instant)await runPublishingJobs(post.id);
      res.json({post:(await loadPosts(post.id))[0]});
    }catch(error){apiError(res,error);}
  });
  app.post('/api/posts/:id/cancel',async(req,res)=>{
    try{
      requireApprover(res);
      if(!Number.isInteger(req.body?.expectedRevision)||req.body.expectedRevision<1)throw new Error('A saved post revision is required.');
      requireDatabase(await database().rpc('social_manager_cancel',{post_id:req.params.id,expected_revision:req.body?.expectedRevision,actor:res.locals.staff.id}));
      res.json({post:(await loadPosts(req.params.id))[0]});
    }catch(error){apiError(res,error);}
  });
}
