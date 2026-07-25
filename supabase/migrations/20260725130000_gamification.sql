-- Leaderboard, XP/badge awarding, and the student-facing "verify resolution" action.

create view public.leaderboard as
select
  coalesce(nullif(full_name, ''), 'Campus Voice') as display_name,
  contribution_score
from public.profiles
where contribution_score > 0
order by contribution_score desc
limit 50;

grant select on public.leaderboard to authenticated;

-- +15 XP and a "first_report" badge the first time a student reports an issue
create or replace function public.award_first_report_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
  target_badge_id uuid;
begin
  if new.reporter_id is null then
    return new;
  end if;

  update public.profiles
  set contribution_score = contribution_score + 15
  where id = new.reporter_id;

  select count(*) = 1 into is_first
  from public.issues
  where reporter_id = new.reporter_id;

  if is_first then
    select id into target_badge_id from public.badges where code = 'first_report';
    if target_badge_id is not null then
      insert into public.user_badges (user_id, badge_id)
      values (new.reporter_id, target_badge_id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_award_first_report
  after insert on public.issues
  for each row execute function public.award_first_report_badge();

-- +25 XP and a "verified_reporter" badge when a student confirms a fix
create or replace function public.award_verified_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_badge_id uuid;
begin
  if new.verified_by_student and not old.verified_by_student and new.reporter_id is not null then
    update public.profiles
    set contribution_score = contribution_score + 25
    where id = new.reporter_id;

    select id into target_badge_id from public.badges where code = 'verified_reporter';
    if target_badge_id is not null then
      insert into public.user_badges (user_id, badge_id)
      values (new.reporter_id, target_badge_id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_award_verified
  after update on public.issues
  for each row execute function public.award_verified_badge();

-- Lets a student close the loop on their own resolved issue without granting
-- them a general UPDATE policy on public.issues (staff-only, see init migration).
create or replace function public.verify_issue(p_issue_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.issues
  set verified_by_student = true,
      status = 'verified'
  where id = p_issue_id
    and reporter_id = auth.uid()
    and status = 'resolved';
end;
$$;

grant execute on function public.verify_issue(uuid) to authenticated;
