create function public.social_manager_cancel(post_id text,expected_revision integer,actor uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare stored public.social_manager_posts;
begin
  select * into stored from public.social_manager_posts where id=post_id for update;
  if not found or stored.revision<>expected_revision then raise exception 'Post changed on another device. Refresh before cancelling.' using errcode='40001'; end if;
  perform 1 from public.social_manager_jobs j where j.post_id=stored.id for update;
  if exists(select 1 from public.social_manager_jobs j where j.post_id=stored.id and j.state in ('running','published','uncertain')) then raise exception 'Delivery has already started. Check the platform before changing this schedule.'; end if;
  update public.social_manager_jobs j set state='cancelled' where j.post_id=stored.id and j.state in ('queued','failed');
  update public.social_manager_posts set data=jsonb_set(stored.data,'{status}',to_jsonb('approved'::text)),revision=revision+1,updated_at=now(),updated_by=actor where id=stored.id;
end;$$;
revoke all on function public.social_manager_cancel(text,integer,uuid) from public,anon,authenticated;
grant execute on function public.social_manager_cancel(text,integer,uuid) to service_role;

create function public.social_manager_finish_job(job_id uuid,result_state text,result_remote_id text,result_error text)
returns void language plpgsql security invoker set search_path='' as $$
declare target text;
begin
  if result_state not in ('published','failed','uncertain') then raise exception 'Invalid delivery result.'; end if;
  update public.social_manager_jobs set state=result_state,remote_id=result_remote_id,error=result_error,completed_at=now() where id=job_id and state='running' returning post_id into target;
  if target is null then raise exception 'Delivery is no longer active.'; end if;
  if not exists(select 1 from public.social_manager_jobs where post_id=target and state<>'published') then
    update public.social_manager_posts set data=jsonb_set(jsonb_set(data,'{status}',to_jsonb('published'::text)),'{publishedAt}',to_jsonb(now())),revision=revision+1,updated_at=now() where id=target;
  end if;
end;$$;
revoke all on function public.social_manager_finish_job(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.social_manager_finish_job(uuid,text,text,text) to service_role;
