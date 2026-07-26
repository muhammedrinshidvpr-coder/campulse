-- Moderation gate: a freshly submitted issue is staff-only until a staff
-- member reviews it and moves it off 'submitted' (e.g. acknowledges it).
-- Only then does it appear on the public Transparency Board / stats.

create or replace view public.issues_public as
select
  id, tracking_code, title, category, urgency, location, status,
  escalation_level, resolution_note, verified_by_student,
  created_at, updated_at, closed_at
from public.issues
where status <> 'submitted';

create or replace view public.public_stats as
select
  count(*) as total_issues,
  count(*) filter (where status in ('resolved','verified')) as resolved_issues,
  round(
    100.0 * count(*) filter (where status in ('resolved','verified')) / nullif(count(*), 0), 1
  ) as resolution_rate_pct,
  avg(extract(epoch from (closed_at - created_at)) / 3600.0)
    filter (where closed_at is not null) as avg_resolution_hours
from public.issues
where status <> 'submitted';
