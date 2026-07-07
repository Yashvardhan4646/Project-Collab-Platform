-- =============================================================================
-- Collab platform — all schema updates in one file. Idempotent: safe to run
-- once on any database, and safe to re-run. Paste into the Supabase SQL editor
-- (or `supabase db push`). Covers: cubicle wall + DM read-state + admin
-- promotion RPCs, invite preview, default feature channels, and the personal
-- Private-space channels.
-- =============================================================================


-- ####################################################################
-- from 20260707200000_cubicle_wall_and_read_sync.sql
-- ####################################################################

-- =============================================================================
-- Cubicle wall + read-state / membership RPC re-sync (one migration).
--
-- Three things in one file so a behind live DB catches up in a single run:
--
--  1. Cubicle model change. A cubicle is no longer a locked personal space.
--     It's a member-visible personal wall: everyone in the server can VIEW it,
--     only the owner can EDIT its notes, and anyone can POST to a small message
--     window on it. So: un-restrict cubicles (everyone can view + post messages),
--     but gate the cubicle's note document to the owner alone.
--
--  2. Re-assert the read-state RPCs (mark_channel_read / unread_summary) so DM
--     and channel unread actually clears on read even if the original migration
--     never reached this database.
--
--  3. Re-assert the membership RPCs (set_member_role / remove_member) so an owner
--     can promote a teammate to admin (who can then manage channels).
--
-- Everything here is idempotent — safe to run on a fresh or partial database.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CUBICLE = MEMBER-VISIBLE WALL
-- ---------------------------------------------------------------------------

-- New server member -> cubicle that everyone can see (is_restricted = false).
create or replace function public.handle_new_server_member()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_type public.space_type; v_name text;
begin
  select type into v_type from public.spaces where id = new.space_id;
  if v_type = 'server' then
    select coalesce(display_name, 'Member') into v_name from public.profiles where id = new.user_id;
    insert into public.channels (space_id, type, name, position, owner_id, is_restricted)
      values (new.space_id, 'cubicle', v_name || '''s cubicle', 1000, new.user_id, false);
  end if;
  return new;
end;
$$;

-- Backfill: open every existing cubicle back up to the whole server.
update public.channels set is_restricted = false where type = 'cubicle' and is_restricted = true;

-- The cubicle's note document is owner-editable only; every other channel type
-- keeps the shared can_edit_channel rule. Notes stay viewable by anyone who can
-- view the channel (unchanged), so members can read a cubicle's notes.
drop policy if exists notes_insert on public.channel_notes;
drop policy if exists notes_update on public.channel_notes;

create policy notes_insert on public.channel_notes for insert to authenticated
  with check (
    case
      when (select c.type from public.channels c where c.id = channel_id) = 'cubicle'
        then (select c.owner_id from public.channels c where c.id = channel_id) = auth.uid()
      else public.can_edit_channel(channel_id, auth.uid())
    end
  );

create policy notes_update on public.channel_notes for update to authenticated
  using (
    case
      when (select c.type from public.channels c where c.id = channel_id) = 'cubicle'
        then (select c.owner_id from public.channels c where c.id = channel_id) = auth.uid()
      else public.can_edit_channel(channel_id, auth.uid())
    end
  )
  with check (
    case
      when (select c.type from public.channels c where c.id = channel_id) = 'cubicle'
        then (select c.owner_id from public.channels c where c.id = channel_id) = auth.uid()
      else public.can_edit_channel(channel_id, auth.uid())
    end
  );

-- ---------------------------------------------------------------------------
-- 2. READ STATE (re-assert)
-- ---------------------------------------------------------------------------

create table if not exists public.read_state (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  channel_id   uuid not null references public.channels(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);
create index if not exists idx_read_state_user on public.read_state(user_id);
alter table public.read_state enable row level security;

drop policy if exists read_state_select on public.read_state;
drop policy if exists read_state_insert on public.read_state;
drop policy if exists read_state_update on public.read_state;
drop policy if exists read_state_delete on public.read_state;
create policy read_state_select on public.read_state for select to authenticated using (user_id = auth.uid());
create policy read_state_insert on public.read_state for insert to authenticated with check (user_id = auth.uid());
create policy read_state_update on public.read_state for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy read_state_delete on public.read_state for delete to authenticated using (user_id = auth.uid());

create or replace function public.mark_channel_read(p_channel_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.read_state (user_id, channel_id, last_read_at)
    values (auth.uid(), p_channel_id, now())
    on conflict (user_id, channel_id) do update set last_read_at = now();
end;
$$;

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

-- ---------------------------------------------------------------------------
-- 3. MEMBERSHIP RPCs (re-assert, so promotion to admin works)
-- ---------------------------------------------------------------------------

create or replace function public.set_member_role(p_space_id uuid, p_user_id uuid, p_role public.member_role)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_target public.member_role;
begin
  if not public.has_space_role(p_space_id, v_uid, array['owner','admin']::public.member_role[]) then
    raise exception 'not allowed';
  end if;
  if p_user_id = v_uid then raise exception 'cannot change your own role'; end if;
  if p_role = 'owner' then raise exception 'cannot assign owner'; end if;
  select role into v_target from public.space_members where space_id = p_space_id and user_id = p_user_id;
  if v_target is null then raise exception 'not a member'; end if;
  if v_target = 'owner' then raise exception 'cannot change the owner'; end if;
  update public.space_members set role = p_role where space_id = p_space_id and user_id = p_user_id;
end;
$$;

create or replace function public.remove_member(p_space_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_target public.member_role;
begin
  if not public.has_space_role(p_space_id, v_uid, array['owner','admin']::public.member_role[]) then
    raise exception 'not allowed';
  end if;
  if p_user_id = v_uid then raise exception 'use leave, not remove, on yourself'; end if;
  select role into v_target from public.space_members where space_id = p_space_id and user_id = p_user_id;
  if v_target = 'owner' then raise exception 'cannot remove the owner'; end if;
  delete from public.space_members where space_id = p_space_id and user_id = p_user_id;
end;
$$;

grant execute on function public.set_member_role(uuid, uuid, public.member_role) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;

-- ####################################################################
-- from 20260707220000_invite_preview.sql
-- ####################################################################

-- =============================================================================
-- invite_preview: look up a team behind an invite code without joining, so the
-- /join page can show the team name + member count (Discord-style invite card)
-- before the person accepts. SECURITY DEFINER so a non-member can read it.
-- =============================================================================

create or replace function public.invite_preview(p_code text)
returns table (space_id uuid, space_name text, member_count int, status text)
language plpgsql security definer set search_path = public stable as $$
declare v_invite public.invites; v_name text; v_count int;
begin
  select * into v_invite from public.invites where code = p_code;
  if not found then
    return query select null::uuid, null::text, 0, 'invalid';
    return;
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    return query select v_invite.space_id, null::text, 0, 'expired';
    return;
  end if;
  if v_invite.max_uses is not null and v_invite.uses_count >= v_invite.max_uses then
    return query select v_invite.space_id, null::text, 0, 'exhausted';
    return;
  end if;
  select name into v_name from public.spaces where id = v_invite.space_id;
  select count(*)::int into v_count from public.space_members where space_id = v_invite.space_id;
  return query select v_invite.space_id, coalesce(v_name, 'a team'), v_count, 'ok';
end;
$$;

grant execute on function public.invite_preview(text) to authenticated;

-- ####################################################################
-- from 20260707230000_default_feature_channels.sql
-- ####################################################################

-- =============================================================================
-- Make the product's features discoverable. A new team only shipped with
-- general / announcements / Shared Docs / Tasks, so the whiteboard, notes,
-- reminders, and voice channels never appeared — you couldn't launch a
-- whiteboard without first knowing to add one (and members can't add channels).
--
-- 1. New teams now come with a channel for every feature.
-- 2. Backfill existing teams with any feature channel they're missing.
-- =============================================================================

create or replace function public.create_server_with_template(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_space_id uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  insert into public.spaces (type, name, created_by)
    values ('server', p_name, v_uid) returning id into v_space_id;

  insert into public.space_members (space_id, user_id, role)   -- fires the cubicle trigger for the owner
    values (v_space_id, v_uid, 'owner');

  insert into public.channels (space_id, type, name, position) values
    (v_space_id, 'text',        'general',       0),
    (v_space_id, 'text',        'announcements', 1),
    (v_space_id, 'whiteboard',  'Whiteboard',    2),
    (v_space_id, 'todo',        'Tasks',         3),
    (v_space_id, 'notes',       'Notes',         4),
    (v_space_id, 'reminders',   'Reminders',     5),
    (v_space_id, 'voice_video', 'Voice',         6),
    (v_space_id, 'docs_sheet',  'Shared Docs',   7);

  return v_space_id;
end;
$$;

grant execute on function public.create_server_with_template(text) to authenticated;

-- Backfill: give every existing server any feature channel it doesn't have yet.
insert into public.channels (space_id, type, name, position)
select s.id, v.type, v.name, v.position
from public.spaces s
cross join (values
  ('whiteboard',  'Whiteboard', 20),
  ('todo',        'Tasks',      21),
  ('notes',       'Notes',      22),
  ('reminders',   'Reminders',  23),
  ('voice_video', 'Voice',      24)
) as v(type, name, position)
where s.type = 'server'
  and not exists (
    select 1 from public.channels c where c.space_id = s.id and c.type = v.type
  );

-- ####################################################################
-- from 20260707240000_private_space_channels.sql
-- ####################################################################

-- =============================================================================
-- Make the Private space actually useful. It shipped empty with only an
-- "add channel" prompt, so it read as broken. Now it's a real personal
-- workspace: every account's Private space comes with Notes, Tasks, and
-- Reminders, visible only to that person.
--
-- 1. New signups get the default private channels.
-- 2. Backfill existing Private spaces with any of these they're missing.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_space_id uuid;
begin
  insert into public.profiles (id) values (new.id);
  insert into public.spaces (type, name, created_by)
    values ('private', 'Private', new.id) returning id into v_space_id;
  insert into public.space_members (space_id, user_id, role)
    values (v_space_id, new.id, 'owner');
  insert into public.channels (space_id, type, name, position) values
    (v_space_id, 'notes',     'Notes',     0),
    (v_space_id, 'todo',      'Tasks',     1),
    (v_space_id, 'reminders', 'Reminders', 2);
  return new;
end;
$$;

-- Backfill: give every existing Private space the personal channels it lacks.
insert into public.channels (space_id, type, name, position)
select s.id, v.type, v.name, v.position
from public.spaces s
cross join (values
  ('notes',     'Notes',     0),
  ('todo',      'Tasks',     1),
  ('reminders', 'Reminders', 2)
) as v(type, name, position)
where s.type = 'private'
  and not exists (
    select 1 from public.channels c where c.space_id = s.id and c.type = v.type
  );
