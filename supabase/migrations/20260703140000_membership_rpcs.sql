-- Generate an invite code for a space (owner/admin only).
create or replace function public.generate_invite(p_space_id uuid, p_max_uses int default null, p_expires_at timestamptz default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_code text;
begin
  if not public.has_space_role(p_space_id, v_uid, array['owner','admin']::public.member_role[]) then
    raise exception 'not allowed';
  end if;
  v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  insert into public.invites (space_id, code, created_by, max_uses, expires_at)
    values (p_space_id, v_code, v_uid, p_max_uses, p_expires_at);
  return v_code;
end;
$$;

-- Change a member's role (owner/admin only; never the owner, never yourself, never to owner).
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

-- Remove a member (owner/admin only; never the owner, never yourself).
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

grant execute on function public.generate_invite(uuid, int, timestamptz) to authenticated;
grant execute on function public.set_member_role(uuid, uuid, public.member_role) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
