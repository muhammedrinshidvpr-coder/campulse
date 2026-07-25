-- Public bucket for issue photos. Public read keeps the demo simple (facility
-- photos aren't sensitive); uploads are restricted to the reporter's own folder.

insert into storage.buckets (id, name, public)
values ('issue-attachments', 'issue-attachments', true)
on conflict (id) do nothing;

create policy "issue_attachments_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'issue-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "issue_attachments_read_public"
  on storage.objects for select
  using (bucket_id = 'issue-attachments');
