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
