-- =============================================================================
-- Read state — per-user, per-channel "last seen" marker so the app can compute
-- unread counts for the rail DM dot, the desk DM list, and team activity.
-- =============================================================================

create table public.read_state (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  channel_id   uuid not null references public.channels(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);

create index idx_read_state_user on public.read_state(user_id);

alter table public.read_state enable row level security;

-- You only ever see or touch your own read markers.
create policy read_state_select on public.read_state for select to authenticated
  using (user_id = auth.uid());
create policy read_state_insert on public.read_state for insert to authenticated
  with check (user_id = auth.uid());
create policy read_state_update on public.read_state for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy read_state_delete on public.read_state for delete to authenticated
  using (user_id = auth.uid());

-- Stamp a channel as read up to "now" for the current user.
create or replace function public.mark_channel_read(p_channel_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.read_state (user_id, channel_id, last_read_at)
    values (auth.uid(), p_channel_id, now())
    on conflict (user_id, channel_id) do update set last_read_at = now();
end;
$$;

-- Per-space unread summary for the current user: how many messages (from other
-- people) landed after their last read, plus the space's most recent activity.
-- DEFINER + the membership join keep it scoped to the caller's own spaces.
create or replace function public.unread_summary()
returns table (space_id uuid, unread bigint, last_message_at timestamptz)
language sql security definer set search_path = public stable as $$
  select c.space_id,
         count(m.id) filter (
           where m.author_id <> auth.uid()
             and m.created_at > coalesce(rs.last_read_at, 'epoch'::timestamptz)
         ) as unread,
         max(m.created_at) as last_message_at
  from public.channels c
  join public.space_members sm
    on sm.space_id = c.space_id and sm.user_id = auth.uid()
  left join public.messages m
    on m.channel_id = c.id
  left join public.read_state rs
    on rs.channel_id = c.id and rs.user_id = auth.uid()
  group by c.space_id;
$$;

grant select, insert, update, delete on public.read_state to authenticated;
grant execute on function public.mark_channel_read(uuid) to authenticated;
grant execute on function public.unread_summary() to authenticated;
