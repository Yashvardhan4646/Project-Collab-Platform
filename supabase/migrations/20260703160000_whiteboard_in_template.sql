-- Add a Whiteboard channel to the default server template, so every new server
-- ships with the embedded collaborative canvas alongside chat, docs, and tasks.
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
    (v_space_id, 'text',       'general',       0),
    (v_space_id, 'text',       'announcements', 1),
    (v_space_id, 'docs_sheet', 'Shared Docs',   2),
    (v_space_id, 'whiteboard', 'Whiteboard',    3),
    (v_space_id, 'todo',       'Tasks',         4);

  return v_space_id;
end;
$$;
