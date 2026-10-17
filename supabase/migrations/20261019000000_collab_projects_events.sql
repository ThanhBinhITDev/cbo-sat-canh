-- 20261019000000_collab_projects_events.sql
-- Phase 3: Projects & Events

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('planning','active','on_hold','completed','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_member_role') THEN
    CREATE TYPE project_member_role AS ENUM ('lead','member','support');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_member_status') THEN
    CREATE TYPE project_member_status AS ENUM ('active','inactive');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE event_status AS ENUM ('draft','published','cancelled','completed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM ('meeting','workshop','outreach','training','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_attendee_status') THEN
    CREATE TYPE event_attendee_status AS ENUM ('invited','confirmed','declined','attended','no_show');
  END IF;
END$$;

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  status project_status NOT NULL DEFAULT 'planning',
  start_date date,
  end_date date,
  leader_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  cover_url text,
  description text,
  internal_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PROJECT MEMBERS
CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role project_member_role NOT NULL DEFAULT 'member',
  status project_member_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_members_unique UNIQUE (project_id, profile_id)
);

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  status event_status NOT NULL DEFAULT 'draft',
  type event_type NOT NULL DEFAULT 'other',
  start_at timestamptz,
  end_at timestamptz,
  location text,
  capacity int CHECK (capacity IS NULL OR capacity >= 0),
  cover_url text,
  description text,
  internal_note text,
  organizer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- EVENT ATTENDEES (internal)
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status event_attendee_status NOT NULL DEFAULT 'invited',
  checked_in_at timestamptz,
  note text,
  CONSTRAINT event_attendees_unique UNIQUE (event_id, profile_id)
);

-- EVENT REGISTRATIONS (public form optional, internal tracking)
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','confirmed','attended','declined','cancelled')),
  note text,
  registered_at timestamptz NOT NULL DEFAULT now()
);

-- Updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at_projects ON public.projects;
CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_events ON public.events;
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FK tasks.project_id -> projects(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tasks_project_id_fkey'
      AND table_schema='public' AND table_name='tasks'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_leader_id ON public.projects(leader_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_profile_id ON public.project_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_events_project_id ON public.events(project_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON public.events(start_at);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_profile_id ON public.event_attendees(profile_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- policies...
DROP POLICY IF EXISTS "projects_read_staff" ON public.projects;
CREATE POLICY "projects_read_staff" ON public.projects FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS "projects_write_manager" ON public.projects;
CREATE POLICY "projects_write_manager" ON public.projects FOR ALL USING (public.can_manage_collab()) WITH CHECK (public.can_manage_collab());

DROP POLICY IF EXISTS "pm_read_staff" ON public.project_members;
CREATE POLICY "pm_read_staff" ON public.project_members FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS "pm_write_manager" ON public.project_members;
CREATE POLICY "pm_write_manager" ON public.project_members FOR ALL USING (public.can_manage_collab()) WITH CHECK (public.can_manage_collab());

DROP POLICY IF EXISTS "events_read_staff" ON public.events;
CREATE POLICY "events_read_staff" ON public.events FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS "events_write_manager" ON public.events;
CREATE POLICY "events_write_manager" ON public.events FOR ALL USING (public.can_manage_collab()) WITH CHECK (public.can_manage_collab());

DROP POLICY IF EXISTS "ea_read_staff" ON public.event_attendees;
CREATE POLICY "ea_read_staff" ON public.event_attendees FOR SELECT USING (public.is_staff());
DROP POLICY IF EXISTS "ea_write_manager" ON public.event_attendees;
CREATE POLICY "ea_write_manager" ON public.event_attendees FOR ALL USING (public.can_manage_collab()) WITH CHECK (public.can_manage_collab());

DROP POLICY IF EXISTS "er_read_manager" ON public.event_registrations;
CREATE POLICY "er_read_manager" ON public.event_registrations FOR SELECT USING (public.can_manage_collab());
DROP POLICY IF EXISTS "er_write_manager" ON public.event_registrations;
CREATE POLICY "er_write_manager" ON public.event_registrations FOR ALL USING (public.can_manage_collab()) WITH CHECK (public.can_manage_collab());

-- Helpers
CREATE OR REPLACE FUNCTION public.is_project_member(p_project uuid, p_profile uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id=p_project AND pm.profile_id=p_profile AND pm.status='active');
$$;

CREATE OR REPLACE FUNCTION public.is_project_lead(p_project uuid, p_profile uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id=p_project AND pm.profile_id=p_profile AND pm.role='lead' AND pm.status='active');
$$;

REVOKE ALL ON FUNCTION public.is_project_member(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid,uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.is_project_lead(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_project_lead(uuid,uuid) TO authenticated;
