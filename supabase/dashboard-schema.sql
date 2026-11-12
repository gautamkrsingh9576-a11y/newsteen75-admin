-- OPTIONAL, MANUALLY REVIEWED SCRIPT. Never executed by this project.
-- Creates one security-invoker reporting function. It does not modify the
-- analytics table, policies, permissions, or data. Existing RLS applies.
-- Day boundaries are UTC. RLS can hide records and make results appear empty.
create or replace function public.dashboard_analytics_summary(p_start timestamptz,p_end timestamptz)
returns jsonb language sql stable security invoker set search_path=public as $$
with events as (
 select created_at,event_name,source_name,category,session_id,
 coalesce('u:'||user_id::text,'a:'||nullif(anonymous_id::text,'')) as ident
 from public.analytics_events
 where created_at >= least(p_start,now()-interval '90 days') and created_at < p_end
), selected as (select * from events where created_at>=p_start),
counts as (select event_name,count(*)::bigint n from selected group by event_name),
daily as (select (created_at at time zone 'UTC')::date day,count(distinct ident) active_users,count(*) filter(where event_name='app_open') app_opens from selected group by 1),
sources as (select source_name source,count(*) filter(where event_name='article_view') views,count(*) filter(where event_name='read_full_story') full_story_clicks,count(*) filter(where event_name='source_click') source_clicks,count(*) filter(where event_name in ('article_share','video_share')) shares from selected where nullif(source_name,'') is not null group by source_name order by views desc limit 10),
categories as (select category,count(*) filter(where event_name in ('article_view','video_start')) views from selected where nullif(category,'') is not null group by category order by views desc limit 10)
select jsonb_build_object(
 'total_events',(select count(*) from selected),
 'metrics',coalesce((select jsonb_object_agg(event_name,n) from counts),'{}'::jsonb)||jsonb_build_object(
 'unique_users',(select count(distinct ident) from selected),
 'sessions',(select count(distinct session_id) from selected),
 'sessions_per_user',(select round(count(distinct session_id)::numeric/nullif(count(distinct ident),0),2) from selected),
 'app_opens',coalesce((select n from counts where event_name='app_open'),0),
 'saves',coalesce((select sum(n) from counts where event_name in ('article_save','video_save')),0),
 'shares',coalesce((select sum(n) from counts where event_name in ('article_share','video_share')),0),
 'dau',(select count(distinct ident) from events where created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'),
 'wau',(select count(distinct ident) from events where created_at>=now()-interval '7 days'),
 'mau',(select count(distinct ident) from events where created_at>=now()-interval '30 days'),
 'app_opens_today',(select count(*) from events where event_name='app_open' and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'),
 'article_view_today',(select count(*) from events where event_name='article_view' and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'),
 'video_start_today',(select count(*) from events where event_name='video_start' and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')),
 'daily',coalesce((select jsonb_agg(jsonb_build_object('date',day,'active_users',active_users,'app_opens',app_opens) order by day) from daily),'[]'::jsonb),
 'sources',coalesce((select jsonb_agg(to_jsonb(sources)) from sources),'[]'::jsonb),
 'categories',coalesce((select jsonb_agg(to_jsonb(categories)) from categories),'[]'::jsonb));
$$;
-- No CMS tables or policies are included; these require a separate security design.
