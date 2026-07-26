-- In-app notifications: issue status changes + issue-linked announcements.
-- See ARCHITECTURE.md's "Notification Service" (Realtime, in-app only for now).

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('issue_status','announcement')),
  issue_id    uuid references public.issues(id) on delete cascade,
  title       text not null,
  body        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where read_at is null;

-- Notify the reporter whenever their issue's status changes.
create or replace function public.notify_on_issue_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.reporter_id is not null then
    insert into public.notifications (user_id, type, issue_id, title, body)
    values (
      new.reporter_id,
      'issue_status',
      new.id,
      'Report ' || new.tracking_code,
      'Status updated to ' || replace(new.status, '_', ' ') || '.'
    );
  end if;

  return new;
end;
$$;

create trigger trg_notify_issue_status_change
  after update on public.issues
  for each row execute function public.notify_on_issue_status_change();

-- Notify the reporter when an announcement is linked to their issue.
-- General announcements (issue_id is null) are out of scope — they stay on
-- the Feed screen rather than fanning out to every student.
create or replace function public.notify_on_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_reporter uuid;
begin
  if new.issue_id is not null then
    select reporter_id into target_reporter from public.issues where id = new.issue_id;

    if target_reporter is not null then
      insert into public.notifications (user_id, type, issue_id, title, body)
      values (target_reporter, 'announcement', new.issue_id, new.title, new.body);
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_notify_announcement
  after insert on public.announcements
  for each row execute function public.notify_on_announcement();

-- Row Level Security
alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Realtime: required for postgres_changes subscriptions on this table.
alter publication supabase_realtime add table public.notifications;
