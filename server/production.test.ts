import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {staffIdentity} from './staffAuth.js';
import {nextPost} from './posts.js';
import {deliveryState} from './publishingWorker.js';
const lead=staffIdentity({id:'test-id',email:'scott@q-ai.online',email_confirmed_at:'2026-01-01'})!;
const draft={title:'Durable draft',content:'A community update with welcoming copy.',platforms:['facebook'] as any,mediaUrls:[],tags:[],scheduledFor:null};
test('verified staff identities cannot be promoted through email suffixes or user claims',()=>{
 assert.equal(staffIdentity({id:'id',email:'attacker@q-ai.online',email_confirmed_at:'today',app_metadata:{isAdmin:true}}),null);
 assert.equal(staffIdentity({id:'id',email:'scott@q-ai.online'}),null);
 assert.equal(staffIdentity({id:'id',email:'scott.harveywhittle@ou.ac.uk',email_confirmed_at:'today'})?.role,'staff');
});
test('queue transitions retain content, enforce lead review and block edits after scheduling',()=>{
 const saved=nextPost(null,draft,'draft',lead,'synthetic-draft');
 const pending=nextPost(saved,draft,'submit',lead,saved.id);
 assert.equal(pending.content,draft.content);assert.equal(pending.status,'pending_approval');assert.equal(pending.versionHistory?.length,2);
 assert.throws(()=>nextPost(pending,draft,'approve',{...lead,email:'scott.harveywhittle@ou.ac.uk',role:'staff'},saved.id),/lead approver/);
 const approved=nextPost(pending,draft,'approve',lead,saved.id);assert.equal(approved.status,'approved');assert.equal(approved.approvedBy,lead.email);
 assert.throws(()=>nextPost({...approved,status:'scheduled'},draft,'draft',lead,saved.id),/Cancel the schedule/);
 assert.throws(()=>nextPost(null,{...draft,content:''},'submit',lead,'new'),/Write the post/);
});
test('ambiguous delivery results do not trigger automatic retries',()=>{
 assert.equal(deliveryState({status:'failed',message:'The operation was aborted due to timeout'}),'uncertain');
 assert.equal(deliveryState({status:'failed',message:'request failed (502)'}),'uncertain');
 assert.equal(deliveryState({status:'failed',message:'Missing permission'}),'failed');
 assert.equal(deliveryState({status:'published'}),'published');
});
test('production routes reject unauthenticated access and scheduler calls',async()=>{
 process.env.VERCEL='1';const {createApp}=await import('../server.js');const app=await createApp();
 const server=http.createServer(app);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${(server.address() as any).port}`;process.env.APP_URL=base;
 try{for(const path of ['/api/posts','/api/social/posts','/api/social/status','/api/oauth/facebook/start'])assert.equal((await fetch(base+path)).status,401,path);
 assert.equal((await fetch(base+'/api/cron/publish')).status,401);
 assert.equal((await fetch(base+'/api/auth/session',{method:'POST',headers:{Origin:base}})).status,401);
 assert.equal((await fetch(base+'/api/posts/new',{method:'PUT',headers:{Origin:'https://attacker.example'}})).status,403);
 assert.equal((await fetch(base+'/api/health')).status,200);}
 finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
