
CREATE TYPE public.app_role AS ENUM ('candidate','employer','admin');
CREATE TYPE public.employment_type AS ENUM ('full_time','part_time','contract','freelance','internship');
CREATE TYPE public.application_status AS ENUM ('new','reviewing','interview','offer','rejected');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  headline text,
  location text,
  bio text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'role','candidate') = 'employer'
      THEN 'employer'::public.app_role ELSE 'candidate'::public.app_role END
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  tagline text,
  location text,
  website text,
  description text,
  brand_color text NOT NULL DEFAULT '#F25C05',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_public_read" ON public.companies FOR SELECT USING (true);
CREATE POLICY "companies_owner_insert" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_owner_update" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_owner_delete" ON public.companies FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  posted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  location text NOT NULL DEFAULT 'Remote',
  is_remote boolean NOT NULL DEFAULT false,
  salary_min integer,
  salary_max integer,
  salary_period text NOT NULL DEFAULT 'year',
  description text NOT NULL DEFAULT '',
  requirements text,
  tags text[] NOT NULL DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_public_read" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "jobs_owner_insert" ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_id = auth.uid()));
CREATE POLICY "jobs_owner_update" ON public.jobs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_id = auth.uid()));
CREATE POLICY "jobs_owner_delete" ON public.jobs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_id = auth.uid()));

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_note text,
  portfolio_url text,
  status public.application_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, candidate_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_candidate_read" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = candidate_id);
CREATE POLICY "applications_employer_read" ON public.applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j JOIN public.companies c ON c.id = j.company_id WHERE j.id = job_id AND c.owner_id = auth.uid()));
CREATE POLICY "applications_candidate_insert" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = candidate_id);
CREATE POLICY "applications_candidate_delete" ON public.applications FOR DELETE TO authenticated USING (auth.uid() = candidate_id);
CREATE POLICY "applications_employer_update" ON public.applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j JOIN public.companies c ON c.id = j.company_id WHERE j.id = job_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j JOIN public.companies c ON c.id = j.company_id WHERE j.id = job_id AND c.owner_id = auth.uid()));

CREATE TABLE public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_jobs_own_all" ON public.saved_jobs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.companies (id, name, tagline, location, website, description, brand_color) VALUES
 ('11111111-1111-1111-1111-111111111101','Vinyl Grove Records','Independent label for bold new sound','Nashville, TN','https://vinylgrove.example','A fiercely independent label building careers for artists across soul, indie and alt-country.','#F25C05'),
 ('11111111-1111-1111-1111-111111111102','Northline Touring','Live production, done right','Austin, TX','https://northline.example','Touring and live production company running arena and club runs across North America.','#111111'),
 ('11111111-1111-1111-1111-111111111103','Echo Chamber Studios','World-class tracking and mixing','Los Angeles, CA','https://echochamber.example','A four-room studio complex serving major and independent artists since 2004.','#F25C05'),
 ('11111111-1111-1111-1111-111111111104','Loopwork Audio','Tools for modern producers','Remote','https://loopwork.example','We build plugins and sample instruments used by hundreds of thousands of producers.','#111111'),
 ('11111111-1111-1111-1111-111111111105','Crescendo Agency','Artist booking and management','New York, NY','https://crescendo.example','Boutique booking agency representing 40+ touring acts worldwide.','#F25C05');

INSERT INTO public.jobs (company_id, title, category, employment_type, location, is_remote, salary_min, salary_max, salary_period, description, requirements, tags, featured) VALUES
 ('11111111-1111-1111-1111-111111111103','Senior Mixing Engineer','Production','full_time','Los Angeles, CA',false,95000,130000,'year','Lead mix sessions across our A and B rooms for label and independent clients. You will own the mix from first pass through final delivery and mentor two assistant engineers.','7+ years mixing credits, deep Pro Tools expertise, strong analog console instincts.','{"Pro Tools","Mixing","Analog"}',true),
 ('11111111-1111-1111-1111-111111111102','Tour Production Manager','Live','full_time','Austin, TX',false,80000,105000,'year','Own advance, routing logistics, crew scheduling and on-site production for two touring acts per cycle.','5+ years tour management, comfortable with 100+ show years, clean driving record and passport.','{"Touring","Logistics","Crew"}',true),
 ('11111111-1111-1111-1111-111111111104','Audio DSP Engineer','Engineering','full_time','Remote',true,120000,165000,'year','Design and ship real-time audio algorithms for our next generation of instruments and effects.','C++, real-time DSP, JUCE experience, shipped at least one audio product.','{"C++","DSP","JUCE"}',true),
 ('11111111-1111-1111-1111-111111111101','A&R Coordinator','A&R','full_time','Nashville, TN',false,55000,70000,'year','Scout emerging artists, manage the demo pipeline and support signings from first listen to contract.','2+ years label or management experience, obsessive listening habits, strong writing.','{"A&R","Scouting"}',false),
 ('11111111-1111-1111-1111-111111111105','Booking Assistant','Booking','full_time','New York, NY',false,48000,58000,'year','Support three agents with offer tracking, routing holds, contracts and settlement follow-up.','Highly organised, spreadsheet fluent, ideally one year in live music.','{"Booking","Contracts"}',false),
 ('11111111-1111-1111-1111-111111111102','Front of House Engineer','Live','contract','Remote',true,450,650,'day','Mix FOH for a 34-date club and theatre run this autumn. Digico and Avid consoles supplied.','Touring FOH credits, own IEM/measurement rig a plus.','{"FOH","Live Sound"}',false),
 ('11111111-1111-1111-1111-111111111101','Session Bassist','Performance','freelance','Nashville, TN',false,600,900,'day','Rotating session work across label projects. Country, soul and indie sessions, two to eight days a month.','Great time, strong reading, own touring-grade gear.','{"Bass","Session"}',false),
 ('11111111-1111-1111-1111-111111111104','Sound Designer, Sample Packs','Creative','part_time','Remote',true,40,70,'hour','Produce original sample content for our instrument releases, from field capture to final edit.','Portfolio of released sample content, strong editing chops.','{"Sound Design","Sampling"}',false),
 ('11111111-1111-1111-1111-111111111103','Studio Assistant Engineer','Production','internship','Los Angeles, CA',false,22,26,'hour','Support sessions across four rooms, patching, tracking prep, and session file management.','Audio school grad or equivalent, reliable, calm under pressure.','{"Assistant","Studio"}',false),
 ('11111111-1111-1111-1111-111111111105','Music Marketing Manager','Marketing','full_time','Remote',true,72000,92000,'year','Build and run release campaigns across DSPs, social and press for our roster.','4+ years music marketing, fluent in DSP pitching and paid social.','{"Marketing","DSP","Campaigns"}',true);
