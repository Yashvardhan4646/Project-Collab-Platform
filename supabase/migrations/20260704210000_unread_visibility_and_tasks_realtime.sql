-- =============================================================================
-- Two fixes surfaced during review:
--
-- 1) unread_summary counted messages in EVERY channel of a space you belong to,
--    ignoring channel visibility. Once cubicles became restricted, other members'
--    cubicle messages (which you can never open, so never mark read) counted
--    toward your unread forever — a permanent, unclearable dot. Restrict the
--    count to channels you can actually view.
--
-- 2) The Tasks board subscribes to realtime on the tasks table, but tasks was
--    never added to the realtime publication, so cross-member task updates never
--    streamed. Publish it.
-- =============================================================================

create or replace function public.unread_summary()
returns table (space_id uuid, unread bigint, last_message_at timestamptz)
language sql security definer set search_path = public stable as $$
  with visible as (
    select c.id, c.space_id
    from public.channels c
    join public.space_members sm on sm.space_id = c.space_id and sm.user_id = auth.uid()
    where public.can_view_channel(c.id, auth.uid())
  )
  select v.space_id,
         count(m.id) filter (
           where m.author_id <> auth.uid()
             and m.created_at > coalesce(rs.last_read_at, 'epoch'::timestamptz)
         ) as unread,
         max(m.created_at) as last_message_at
  from visible v
  left join public.messages m on m.channel_id = v.id
  left join public.read_state rs on rs.channel_id = v.id and rs.user_id = auth.uid()
  group by v.space_id;
$$;

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks') then
    alter publication supabase_realtime add table public.tasks;
  end if;
end $$;
