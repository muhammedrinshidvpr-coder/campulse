-- Demo data for local dev / hackathon judging. Run after the init migration.

insert into public.badges (code, label, description, icon) values
  ('first_report',   'First Voice',        'Submitted your first issue',                 'megaphone'),
  ('verified_reporter', 'Verified Reporter', 'Had a report confirmed resolved',            'badge-check'),
  ('streak_5',        'Consistent Contributor', 'Reported or engaged 5 weeks in a row',   'flame'),
  ('community_builder', 'Community Builder', 'Contributed a suggestion that was adopted',  'sparkles')
on conflict (code) do nothing;
