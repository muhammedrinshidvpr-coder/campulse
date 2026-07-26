-- Fix: any authenticated user could grant themselves staff/admin privileges by
-- updating their own profiles.role (and inflate contribution_score), because
-- profiles_self_update only checked row ownership, not which columns changed.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- current_user differs from session_user only inside a SECURITY DEFINER
  -- function (e.g. the badge/XP triggers in 20260725130000_gamification.sql).
  -- Direct client writes via PostgREST always have current_user = session_user,
  -- so this blocks self-escalation without blocking those trusted internal paths.
  if new.role is distinct from old.role and current_user = session_user then
    raise exception 'permission denied: role cannot be changed directly';
  end if;

  if new.contribution_score is distinct from old.contribution_score and current_user = session_user then
    raise exception 'permission denied: contribution_score cannot be changed directly';
  end if;

  return new;
end;
$$;

create trigger trg_protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Fix: "anonymous" issues still exposed reporter_id to every staff role via
-- issues_select_staff, contradicting the anonymity promise in the report form.
-- Staff-facing reads now go through this view, which nulls reporter_id when
-- the reporter asked to stay anonymous. issues_select_own / issues_update_staff
-- on the base table are untouched (a reporter still sees their own row; staff
-- can still update any issue's status/owner/notes).
create view public.issues_staff as
select
  id, tracking_code,
  case when is_anonymous then null else reporter_id end as reporter_id,
  is_anonymous, title, description, category, urgency, location, status,
  owner_role, owner_id, escalation_level, resolution_note, verified_by_student,
  sla_due_at, created_at, updated_at, closed_at
from public.issues
where public.is_staff();

grant select on public.issues_staff to authenticated;
