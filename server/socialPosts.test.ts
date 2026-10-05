import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publishFacebook } from './facebook.js';
import { saveSocialSession } from './socialSessions.js';
import { platformPost, readFacebookPosts } from './socialPosts.js';
import { localDateKey, localDateTime } from '../src/utils/postDates.js';

test('native Facebook scheduling confirms the remote post and never publishes immediately', async () => {
  process.env.SOCIAL_SESSION_SECRET = 'synthetic-schedule-secret-at-least-32-characters';
  delete process.env.FACEBOOK_PAGE_ID; delete process.env.META_FACEBOOK_PAGE_ID;
  let cookie = '';
  saveSocialSession({ cookie: (name: string, value: string) => { cookie = `${name}=${value}`; } } as any, 'facebook', { access_token: 'synthetic-token', expires_in: 3600 });
  const req = { headers: { cookie } } as any;
  const original = globalThis.fetch;
  let writes = 0;
  const scheduledFor = new Date(Date.now() + 3600000).toISOString();
  globalThis.fetch = async (input, init) => {
    if (String(input).includes('me/accounts')) return Response.json({ data: [{ id: '123', name: 'Test Page', access_token: 'page-token' }] });
    writes++;
    const body = init!.body as URLSearchParams;
    assert.equal(body.get('published'), 'false');
    assert.equal(body.get('scheduled_publish_time'), String(Math.floor(new Date(scheduledFor).getTime() / 1000)));
    return Response.json({ id: '123_scheduled' });
  };
  try {
    const result = await publishFacebook(req, { content: 'Regression', scheduledFor }, true);
    assert.equal(result.status, 'published');
    assert.ok('remoteId' in result);
    assert.equal(result.remoteId, '123_scheduled');
    assert.equal((await publishFacebook(req, { content: 'Regression', scheduledFor: '' }, true)).status, 'failed');
    assert.equal(writes, 1);
    globalThis.fetch = async () => Response.json({ error: { message: 'Denied' } }, { status: 403 });
    assert.equal((await publishFacebook(req, { content: 'Regression', scheduledFor }, true)).status, 'failed');
  } finally { globalThis.fetch = original; }
});

test('Facebook imports dates, interaction counts and native scheduled posts', async () => {
  process.env.SOCIAL_SESSION_SECRET = 'synthetic-read-secret-at-least-32-characters';
  let cookie = '';
  saveSocialSession({ cookie: (name: string, value: string) => { cookie = `${name}=${value}`; } } as any, 'facebook', { access_token: 'synthetic-token', expires_in: 3600 });
  const original = globalThis.fetch;
  globalThis.fetch = async input => {
    const url = String(input);
    if (url.includes('me/accounts')) return Response.json({ data: [{ id: '123', name: 'Test', access_token: 'page-token' }] });
    if (url.includes('published_posts')) return Response.json({ data: [{ id: '123_p', message: '#Q Hello', created_time: '2026-10-05T10:00:00Z', reactions: { summary: { total_count: 7 } }, comments: { summary: { total_count: 2 } }, shares: { count: 1 } }] });
    return Response.json({ data: [{ id: '123_s', message: 'Later', scheduled_publish_time: 1791280800 }] });
  };
  try {
    const posts = await readFacebookPosts({ headers: { cookie } } as any);
    assert.equal(posts.length, 2);
    assert.deepEqual(posts[0].engagement, { likes: 7, comments: 2, shares: 1 });
    assert.deepEqual(posts[0].tags, ['#Q']);
    assert.equal(posts[1].status, 'scheduled');
    assert.equal(posts[1].publishedAt, null);
  } finally { globalThis.fetch = original; }
});

test('calendar keys and composer values retain local dates across midnight and month boundaries', () => {
  const date = new Date(2026, 9, 1, 0, 15);
  assert.equal(localDateKey(date), '2026-10-01');
  assert.equal(localDateTime(date), '2026-10-01T00:15');
  assert.equal(platformPost('bluesky', 'uri', 'Hello', date.toISOString(), 'Test').scheduledFor, null);
});


test('Facebook retains readable posts when reaction or scheduling permissions fail', async () => {
 process.env.SOCIAL_SESSION_SECRET='synthetic-partial-read-secret-at-least-32-characters';
 delete process.env.FACEBOOK_PAGE_ID;delete process.env.META_FACEBOOK_PAGE_ID;
 let cookie='';saveSocialSession({cookie:(name:string,value:string)=>{cookie=`${name}=${value}`;}} as any,'facebook',{access_token:'synthetic-token',expires_in:3600});
 const original=globalThis.fetch;
 globalThis.fetch=async input=>{const url=String(input);if(url.includes('me/accounts'))return Response.json({data:[{id:'123',name:'Q',access_token:'page-token'}]});
 if(url.includes('reactions')||url.includes('scheduled_posts'))return Response.json({error:{code:10,message:'Missing Page permission'}},{status:403});
 return Response.json({data:[{id:'123_p',message:'Readable copy',created_time:'2026-10-05T10:00:00Z'}]});};
 try{const posts=await readFacebookPosts({headers:{cookie}} as any);assert.equal(posts.length,1);assert.equal(posts[0].engagement,undefined);assert.equal(posts.warnings?.length,2);assert.match(posts.warnings![0],/Facebook code 10/);}
 finally{globalThis.fetch=original;}
});

test('Facebook distinguishes revoked logins from Page selection problems', async()=>{
 process.env.SOCIAL_SESSION_SECRET='synthetic-revoked-read-secret-at-least-32-characters';let cookie='';saveSocialSession({cookie:(name:string,value:string)=>{cookie=`${name}=${value}`;}} as any,'facebook',{access_token:'synthetic-token',expires_in:3600});
 const original=globalThis.fetch;
 try{globalThis.fetch=async()=>Response.json({error:{code:190,message:'Expired token'}},{status:400});await assert.rejects(()=>readFacebookPosts({headers:{cookie}} as any),/expired or was revoked/);
 globalThis.fetch=async()=>Response.json({data:[]});await assert.rejects(()=>readFacebookPosts({headers:{cookie}} as any),/No Facebook Pages were granted/);}
 finally{globalThis.fetch=original;}
});

test('Facebook comment permission errors recommend pages_read_user_content and preserve posts', async () => {
  process.env.SOCIAL_SESSION_SECRET = 'synthetic-comment-read-secret-at-least-32-characters';
  delete process.env.FACEBOOK_PAGE_ID; delete process.env.META_FACEBOOK_PAGE_ID;
  let cookie = '';
  saveSocialSession({ cookie: (name: string, value: string) => { cookie = `${name}=${value}`; } } as any, 'facebook', { access_token: 'synthetic-token', expires_in: 3600 });
  const original = globalThis.fetch;
  globalThis.fetch = async input => {
    const url = String(input);
    if (url.includes('me/accounts')) return Response.json({ data: [{ id: '123', name: 'Q', access_token: 'page-token' }] });
    if (url.includes('comments.limit')) return Response.json({ error: { code: 10, message: "This endpoint requires the 'pages_read_user_content' permission." } }, { status: 403 });
    if (url.includes('scheduled_posts')) return Response.json({ data: [] });
    return Response.json({ data: [{ id: '123_p', message: 'Readable copy', created_time: '2026-10-05T10:00:00Z' }] });
  };
  try {
    const posts = await readFacebookPosts({ headers: { cookie } } as any);
    assert.equal(posts.length, 1);
    assert.equal(posts[0].engagement, undefined);
    assert.match(posts.warnings![0], /enable pages_read_user_content/);
    assert.doesNotMatch(posts.warnings![0], /grant pages_read_engagement/);
  } finally { globalThis.fetch = original; }
});
