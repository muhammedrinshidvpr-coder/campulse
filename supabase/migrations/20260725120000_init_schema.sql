-- AURA / Campulse — initial schema
-- Paste into Supabase SQL Editor, or run `supabase db push` with the CLI.

create extension if not exists pgcrypto;

-- ============================================================
-- profiles  (1:1 with auth.users — adds role/department/score)
-- ============================================================
create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text,
  role               text not null default 'student'
                       check (role in ('student','faculty','warden','admin','student_affairs')),
  department         text,
  contribution_score integer not null default 0,
  created_at         timestamptz not null default now()
);

-- auto-create a profile row whenever someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- security-definer helper so RLS policies can check role without recursive RLS
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','faculty','warden','student_affairs')
  );
$$;

-- ============================================================
-- issues  (core table — one row per report)
-- ============================================================
create table public.issues (
  id                  uuid primary key default gen_random_uuid(),
  tracking_code       text not null unique default ('AURA-' || upper(substr(md5(random()::text), 1, 6))),
  reporter_id         uuid references public.profiles(id) on delete set null,
  is_anonymous        boolean not null default false,
  title               text not null,
  description         text not null,
  category            text not null
                        check (category in ('facilities','safety','harassment','academics','event','accessibility','suggestion')),
  urgency             text not null default 'medium'
                        check (urgency in ('low','medium','high')),
  location            text,
  status              text not null default 'submitted'
                        check (status in ('submitted','acknowledged','assigned','in_progress','resolved','verified')),
  owner_role          text
                        check (owner_role in ('faculty','warden','admin','student_affairs')),
  owner_id            uuid references public.profiles(id),
  escalation_level    integer not null default 0,
  resolution_note     text,
  verified_by_student boolean not null default false,
  sla_due_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  closed_at           timestamptz
);

create index issues_status_idx on public.issues (status);
create index issues_category_idx on public.issues (category);
create index issues_reporter_idx on public.issues (reporter_id);
create index issues_created_at_idx on public.issues (created_at desc);

-- ============================================================
-- issue_status_history  (audit trail — required by PRD §Functional Requirements)
-- ============================================================
create table public.issue_status_history (
  id          uuid primary key default gen_random_uuid(),
  issue_id    uuid not null references public.issues(id) on delete cascade,
  old_status  text,
  new_status  text not null,
  changed_by  uuid references public.profiles(id),
  note        text,
  changed_at  timestamptz not null default now()
);

create index issue_status_history_issue_idx on public.issue_status_history (issue_id);

create or replace function public.touch_issue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();

  if new.status is distinct from old.status then
    insert into public.issue_status_history (issue_id, old_status, new_status, changed_by, note)
    values (new.id, old.status, new.status, auth.uid(), new.resolution_note);

    if new.status in ('resolved','verified') and old.status not in ('resolved','verified') then
      new.closed_at = now();
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_touch_issue
  before update on public.issues
  for each row execute function public.touch_issue();

-- ============================================================
-- issue_attachments  (Supabase Storage object references)
-- ============================================================
create table public.issue_attachments (
  id            uuid primary key default gen_random_uuid(),
  issue_id      uuid not null references public.issues(id) on delete cascade,
  storage_path  text not null,
  uploaded_at   timestamptz not null default now()
);

-- ============================================================
-- badges / user_badges  (participation rewards)
-- ============================================================
create table public.badges (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  label       text not null,
  description text,
  icon        text
);

create table public.user_badges (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  badge_id   uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ============================================================
-- announcements  (transparent close-the-loop broadcasts)
-- ============================================================
create table public.announcements (
  id           uuid primary key default gen_random_uuid(),
  issue_id     uuid references public.issues(id),
  title        text not null,
  body         text not null,
  published_at timestamptz not null default now()
);

-- ============================================================
-- public views  (Transparency Dashboard — no identity columns exposed)
-- ============================================================
create view public.issues_public as
select
  id, tracking_code, title, category, urgency, location, status,
  escalation_level, resolution_note, verified_by_student,
  created_at, updated_at, closed_at
from public.issues;

create view public.public_stats as
select
  count(*) as total_issues,
  count(*) filter (where status in ('resolved','verified')) as resolved_issues,
  round(
    100.0 * count(*) filter (where status in ('resolved','verified')) / nullif(count(*), 0), 1
  ) as resolution_rate_pct,
  avg(extract(epoch from (closed_at - created_at)) / 3600.0)
    filter (where closed_at is not null) as avg_resolution_hours
from public.issues;

grant select on public.issues_public to anon, authenticated;
grant select on public.public_stats to anon, authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.issues enable row level security;
alter table public.issue_status_history enable row level security;
alter table public.issue_attachments enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.announcements enable row level security;

-- profiles
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_staff_select" on public.profiles
  for select using (public.is_staff());
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- issues: students only ever see/insert their own rows; staff see everything.
-- Anonymity is enforced by keeping reporter_id out of issues_public above —
-- even staff going through the base table always sees who filed a report,
-- which matches "track everything, reveal only what should be visible" (PRD).
create policy "issues_insert_own" on public.issues
  for insert with check (reporter_id = auth.uid());
create policy "issues_select_own" on public.issues
  for select using (reporter_id = auth.uid());
create policy "issues_select_staff" on public.issues
  for select using (public.is_staff());
create policy "issues_update_staff" on public.issues
  for update using (public.is_staff()) with check (public.is_staff());

-- issue_status_history
create policy "history_select" on public.issue_status_history
  for select using (
    public.is_staff()
    or exists (select 1 from public.issues i where i.id = issue_id and i.reporter_id = auth.uid())
  );

-- issue_attachments
create policy "attachments_insert_own" on public.issue_attachments
  for insert with check (
    exists (select 1 from public.issues i where i.id = issue_id and i.reporter_id = auth.uid())
  );
create policy "attachments_select_own_or_staff" on public.issue_attachments
  for select using (
    public.is_staff()
    or exists (select 1 from public.issues i where i.id = issue_id and i.reporter_id = auth.uid())
  );

-- badges
create policy "badges_select_all" on public.badges
  for select using (true);
create policy "user_badges_select" on public.user_badges
  for select using (auth.uid() = user_id or public.is_staff());

-- announcements
create policy "announcements_select_all" on public.announcements
  for select using (true);
create policy "announcements_insert_staff" on public.announcements
  for insert with check (public.is_staff());
