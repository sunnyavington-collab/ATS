ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_house boolean NOT NULL DEFAULT false;

INSERT INTO public.companies (name, tagline, location, website, description, brand_color, is_house)
SELECT 'Musicosy', 'Music culture, made in public', 'Remote / Chicago', 'https://musicosy.com',
  'Musicosy builds music culture across social, content and live. We hire creators, editors, producers and community people directly — no agencies, no middlemen.',
  '#F25C05', true
WHERE NOT EXISTS (SELECT 1 FROM public.companies WHERE is_house);

INSERT INTO public.jobs (company_id, title, category, employment_type, location, is_remote, salary_min, salary_max, salary_period, description, requirements, tags, featured, is_open)
SELECT c.id, v.title, v.category, v.etype::employment_type, v.location, v.remote, v.smin, v.smax, v.period, v.descr, v.reqs, v.tags, v.featured, true
FROM public.companies c
CROSS JOIN (VALUES
  ('Social Media Manager', 'Marketing', 'full_time', 'Remote', true, 62000, 78000, 'year',
   'Own the Musicosy voice across TikTok, Instagram and YouTube. You set the weekly content calendar, brief the editors, publish daily and report on what actually moved.',
   E'3+ years running a music or culture brand account\nNative with short-form formats and trends\nComfortable reading analytics and adjusting fast', ARRAY['Social','Content','Strategy'], true),
  ('Short-Form Video Editor', 'Creative', 'contract', 'Remote', true, 350, 550, 'day',
   'Cut session footage, live clips and artist interviews into short-form built for feed. High volume, fast turnaround, strong sense of rhythm.',
   E'Premiere or CapCut at speed\nPortfolio of vertical edits with real reach\nAvailable for same-week turnarounds', ARRAY['Editing','Video','Short-form'], true),
  ('Community & Artist Support', 'A&R', 'part_time', 'Chicago, IL', false, 26, 34, 'hour',
   'First point of contact for artists in the Musicosy orbit. Answer DMs, onboard new talent, keep the roster informed and flag what the team should know.',
   E'Excellent written communication\nOrganised, responsive, unbothered by volume\nGenuine interest in emerging artists', ARRAY['Community','Support','Artists'], false),
  ('Content Producer', 'Production', 'full_time', 'Chicago, IL', false, 70000, 90000, 'year',
   'Plan and run Musicosy shoots end to end: sessions, live capture, brand collabs. You book the room, the crew and the artist, and you deliver on schedule.',
   E'Proven production credits in music or brand content\nBudget and schedule ownership\nOn-set leadership', ARRAY['Production','Shoots','Live'], false)
) AS v(title, category, etype, location, remote, smin, smax, period, descr, reqs, tags, featured)
WHERE c.is_house
  AND NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.company_id = c.id AND j.title = v.title);