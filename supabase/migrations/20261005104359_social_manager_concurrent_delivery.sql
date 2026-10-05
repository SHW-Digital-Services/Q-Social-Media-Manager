create or replace function public.social_manager_claim_jobs(batch_size integer default 3, target_post text default null)
returns setof public.social_manager_jobs language plpgsql security invoker set search_path='' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('q-social-manager-claim'));
  return query update public.social_manager_jobs set state='running',started_at=now()
  where id in (
    select candidates.id from (
      select distinct on (j.platform) j.id,j.run_at
      from public.social_manager_jobs j
      where j.state='queued' and j.run_at<=now() and (target_post is null or j.post_id=target_post)
      and not exists(select 1 from public.social_manager_jobs active where active.platform=j.platform and active.state='running')
      order by j.platform,j.run_at,j.id
    ) candidates order by candidates.run_at limit least(greatest(batch_size,1),3)
  ) returning *;
end;$$;
create index social_manager_posts_updated_by_idx on public.social_manager_posts(updated_by);

create or replace function public.social_manager_enqueue(post_id text, expected_revision integer, actor uuid, send_at timestamptz, instant boolean default false)
returns void language plpgsql security invoker set search_path='' as $$
declare stored public.social_manager_posts; channel text;
begin
  select * into stored from public.social_manager_posts where id=post_id for update;
  if not found or stored.revision<>expected_revision then raise exception 'Post changed on another device. Refresh before scheduling.' using errcode='40001'; end if;
  if stored.data->>'status' not in ('approved','scheduled') then raise exception 'Approve this post before publishing or scheduling.'; end if;
  perform 1 from public.social_manager_jobs j where j.post_id=stored.id for update;
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

create or replace function public.social_manager_finish_job(job_id uuid,result_state text,result_remote_id text,result_error text)
returns void language plpgsql security invoker set search_path='' as $$
declare target text;
begin
  if result_state not in ('published','failed','uncertain') then raise exception 'Invalid delivery result.'; end if;
  select post_id into target from public.social_manager_jobs where id=job_id;
  perform 1 from public.social_manager_posts where id=target for update;
  update public.social_manager_jobs set state=result_state,remote_id=result_remote_id,error=result_error,completed_at=now() where id=job_id and state='running' returning post_id into target;
  if target is null then raise exception 'Delivery is no longer active.'; end if;
  if not exists(select 1 from public.social_manager_jobs where post_id=target and state<>'published') then
    update public.social_manager_posts set data=jsonb_set(jsonb_set(data,'{status}',to_jsonb('published'::text)),'{publishedAt}',to_jsonb(now())),revision=revision+1,updated_at=now() where id=target;
  end if;
end;$$;
revoke all on function public.social_manager_finish_job(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.social_manager_finish_job(uuid,text,text,text) to service_role;
