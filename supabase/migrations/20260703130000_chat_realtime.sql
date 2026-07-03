-- Storage bucket for message images (public read; any signed-in user may upload).
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

create policy "chat images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'chat-images');

create policy "signed-in users upload chat images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-images');

-- Enable realtime (postgres_changes) for live messages and reactions.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reactions') then
    alter publication supabase_realtime add table public.reactions;
  end if;
end $$;
