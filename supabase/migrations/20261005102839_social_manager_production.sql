create table public.social_manager_posts (
  id text primary key check (length(id) between 1 and 100),
  data jsonb not null,
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  check (data->>'id' = id)
);
create table public.social_manager_connections (
  cookie_name text primary key,
  ciphertext text not null,
  updated_at timestamptz not null default now()
);
create table public.social_manager_jobs (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.social_manager_posts(id),
  platform text not null check(platform in ('facebook','bluesky','website')),
  payload jsonb not null,
  run_at timestamptz not null,
  state text not null default 'queued' check(state in ('queued','running','published','failed','uncertain','cancelled')),
  remote_id text,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(post_id,platform)
);
create index social_manager_due_jobs on public.social_manager_jobs(run_at) where state='queued';
create index social_manager_posts_updated on public.social_manager_posts(updated_at desc);
alter table public.social_manager_posts enable row level security;
alter table public.social_manager_connections enable row level security;
alter table public.social_manager_jobs enable row level security;
revoke all on public.social_manager_posts,public.social_manager_connections,public.social_manager_jobs from public,anon,authenticated;
grant all on public.social_manager_posts,public.social_manager_connections,public.social_manager_jobs to service_role;

create function public.social_manager_claim_jobs(batch_size integer default 3, target_post text default null)
returns setof public.social_manager_jobs language sql security invoker set search_path='' as $$
  update public.social_manager_jobs set state='running', started_at=now()
  where id in (
    select id from public.social_manager_jobs
    where state='queued' and run_at <= now() and (target_post is null or post_id=target_post)
    order by run_at for update skip locked limit least(greatest(batch_size,1),3)
  ) returning *;
$$;
revoke all on function public.social_manager_claim_jobs(integer,text) from public,anon,authenticated;
grant execute on function public.social_manager_claim_jobs(integer,text) to service_role;

create function public.social_manager_save_post(post_id text, post_data jsonb, expected_revision integer, actor uuid)
returns public.social_manager_posts language plpgsql security invoker set search_path='' as $$
declare saved public.social_manager_posts;
begin
  if expected_revision=0 then
    insert into public.social_manager_posts(id,data,updated_by) values(post_id,post_data,actor) returning * into saved;
  else
    update public.social_manager_posts set data=post_data,revision=revision+1,updated_at=now(),updated_by=actor
    where id=post_id and revision=expected_revision returning * into saved;
    if not found then raise exception 'Post changed on another device. Refresh before saving.' using errcode='40001'; end if;
  end if;
  return saved;
end;
$$;
revoke all on function public.social_manager_save_post(text,jsonb,integer,uuid) from public,anon,authenticated;
grant execute on function public.social_manager_save_post(text,jsonb,integer,uuid) to service_role;

create function public.social_manager_enqueue(post_id text, expected_revision integer, actor uuid, send_at timestamptz, instant boolean default false)
returns void language plpgsql security invoker set search_path='' as $$
declare stored public.social_manager_posts; channel text;
begin
  select * into stored from public.social_manager_posts where id=post_id for update;
  if not found or stored.revision<>expected_revision then raise exception 'Post changed on another device. Refresh before scheduling.' using errcode='40001'; end if;
  if stored.data->>'status' not in ('approved','scheduled') then raise exception 'Approve this post before publishing or scheduling.'; end if;
  if exists(select 1 from public.social_manager_jobs j where j.post_id=stored.id and j.state in ('running','published','uncertain')) then raise exception 'Delivery has already started. Check delivery results before sending again.'; end if;
  delete from public.social_manager_jobs j where j.post_id=stored.id and j.state in ('queued','cancelled','failed');
  for channel in select jsonb_array_elements_text(stored.data->'platforms') loop
    insert into public.social_manager_jobs(post_id,platform,payload,run_at) values(stored.id,channel,stored.data,send_at);
  end loop;
  update public.social_manager_posts set data=jsonb_set(jsonb_set(stored.data,'{status}',to_jsonb('scheduled'::text)),'{scheduledFor}',to_jsonb(send_at)),revision=revision+1,updated_at=now(),updated_by=actor where id=stored.id;
end;
$$;
revoke all on function public.social_manager_enqueue(text,integer,uuid,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.social_manager_enqueue(text,integer,uuid,timestamptz,boolean) to service_role;
