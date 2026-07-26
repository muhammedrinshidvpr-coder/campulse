-- "Hype" upvotes: students boost visibility of open issues they also care
-- about, so staff can prioritize by how many people are affected, not just
-- self-reported urgency.
create table public.issue_votes (
  issue_id    uuid not null references public.issues(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (issue_id, user_id)
);

alter table public.issue_votes enable row level security;

create policy "votes_select_all" on public.issue_votes
  for select using (true);
create policy "votes_insert_own" on public.issue_votes
  for insert with check (user_id = auth.uid());
create policy "votes_delete_own" on public.issue_votes
  for delete using (user_id = auth.uid());

grant select on public.issue_votes to anon, authenticated;
grant insert, delete on public.issue_votes to authenticated;

-- Toggle a vote atomically: insert if absent, remove if present. Mirrors the
-- verify_issue() RPC (security definer, single-purpose, auth.uid()-scoped) so
-- the client never issues raw insert/delete against issue_votes directly.
create or replace function public.toggle_issue_vote(p_issue_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  already_voted boolean;
begin
  select exists(
    select 1 from public.issue_votes where issue_id = p_issue_id and user_id = auth.uid()
  ) into already_voted;

  if already_voted then
    delete from public.issue_votes where issue_id = p_issue_id and user_id = auth.uid();
    return false;
  else
    insert into public.issue_votes (issue_id, user_id) values (p_issue_id, auth.uid());
    return true;
  end if;
end;
$$;

grant execute on function public.toggle_issue_vote(uuid) to authenticated;

-- Fold vote_count / has_voted into the two read views the app already uses,
-- so no query-function signatures need to change (lib/queries.ts:127, :89).
create or replace view public.issues_public as
select
  i.id, i.tracking_code, i.title, i.category, i.urgency, i.location, i.status,
  i.escalation_level, i.resolution_note, i.verified_by_student,
  i.created_at, i.updated_at, i.closed_at,
  coalesce(v.vote_count, 0) as vote_count,
  exists(
    select 1 from public.issue_votes mv
    where mv.issue_id = i.id and mv.user_id = auth.uid()
  ) as has_voted
from public.issues i
left join (
  select issue_id, count(*) as vote_count from public.issue_votes group by issue_id
) v on v.issue_id = i.id
where i.status <> 'submitted';

create or replace view public.issues_staff as
select
  i.id, i.tracking_code,
  case when i.is_anonymous then null else i.reporter_id end as reporter_id,
  i.is_anonymous, i.title, i.description, i.category, i.urgency, i.location, i.status,
  i.owner_role, i.owner_id, i.escalation_level, i.resolution_note, i.verified_by_student,
  i.sla_due_at, i.created_at, i.updated_at, i.closed_at,
  coalesce(v.vote_count, 0) as vote_count,
  exists(
    select 1 from public.issue_votes mv
    where mv.issue_id = i.id and mv.user_id = auth.uid()
  ) as has_voted
from public.issues i
left join (
  select issue_id, count(*) as vote_count from public.issue_votes group by issue_id
) v on v.issue_id = i.id
where public.is_staff();

grant select on public.issues_public to anon, authenticated;
grant select on public.issues_staff to authenticated;
