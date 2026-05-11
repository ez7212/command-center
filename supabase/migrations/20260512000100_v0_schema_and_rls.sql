create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'editor', 'commenter', 'viewer');

create type public.event_type as enum (
  'agent_started',
  'agent_heartbeat',
  'agent_completed',
  'search_run',
  'code_changed',
  'feature_started',
  'feature_shipped',
  'decision_logged',
  'doc_created',
  'doc_updated',
  'deployment_shipped',
  'manual_note'
);

create type public.feature_status as enum (
  'planned',
  'in_progress',
  'review',
  'shipped'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  mission text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  provider text not null default 'manual',
  kind text,
  created_at timestamptz not null default now()
);

create table public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  parent_session_id uuid references public.agent_sessions(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  external_session_id text,
  source_provider text not null default 'manual',
  title text not null,
  status text not null default 'active',
  summary text,
  started_at timestamptz not null default now(),
  last_heartbeat_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (project_id, source_provider, external_session_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  session_id uuid references public.agent_sessions(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  type public.event_type not null,
  title text not null,
  body text,
  source text not null default 'manual',
  source_provider text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.features (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status public.feature_status not null default 'planned',
  owner text,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  kind text not null default 'doc',
  body_md text,
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  decision text not null,
  rationale text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.ingest_tokens (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_user_id uuid references public.profiles(id) on delete set null,
  source_provider text not null default 'manual',
  name text not null,
  token_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index project_members_user_id_idx on public.project_members (user_id);
create index agents_project_id_idx on public.agents (project_id);
create index agent_sessions_project_id_idx on public.agent_sessions (project_id);
create index agent_sessions_parent_session_id_idx on public.agent_sessions (parent_session_id);
create index agent_sessions_external_idx on public.agent_sessions (project_id, source_provider, external_session_id);
create index events_project_created_idx on public.events (project_id, created_at desc);
create index events_session_id_idx on public.events (session_id);
create index comments_project_target_idx on public.comments (project_id, target_type, target_id);
create index features_project_status_idx on public.features (project_id, status);
create index documents_project_id_idx on public.documents (project_id);
create index decisions_project_id_idx on public.decisions (project_id);
create index ingest_tokens_token_hash_idx on public.ingest_tokens (token_hash) where revoked_at is null;
create index ingest_tokens_project_id_idx on public.ingest_tokens (project_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger features_set_updated_at
before update on public.features
for each row execute function public.set_updated_at();

create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create or replace function public.is_project_member(project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = $1
      and pm.user_id = auth.uid()
  );
$$;

create or replace function public.project_role(project_id uuid)
returns public.member_role
language sql
stable
security definer
set search_path = public
as $$
  select pm.role
  from public.project_members pm
  where pm.project_id = $1
    and pm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_read_project(project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_project_member($1);
$$;

create or replace function public.can_manage_project(project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.project_role($1) in ('owner', 'editor'), false);
$$;

create or replace function public.can_comment_project(project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.project_role($1) in ('owner', 'editor', 'commenter'), false);
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.agents enable row level security;
alter table public.agent_sessions enable row level security;
alter table public.events enable row level security;
alter table public.comments enable row level security;
alter table public.features enable row level security;
alter table public.documents enable row level security;
alter table public.decisions enable row level security;
alter table public.ingest_tokens enable row level security;

create policy "profiles can read self and project peers"
on public.profiles for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.project_members mine
    join public.project_members theirs on theirs.project_id = mine.project_id
    where mine.user_id = auth.uid()
      and theirs.user_id = profiles.id
  )
);

create policy "users can insert own profile"
on public.profiles for insert
with check (id = auth.uid());

create policy "users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "project members can read projects"
on public.projects for select
using (public.can_read_project(id));

create policy "owner editor can update projects"
on public.projects for update
using (public.can_manage_project(id))
with check (public.can_manage_project(id));

create policy "owner editor can delete projects"
on public.projects for delete
using (public.can_manage_project(id));

create policy "project members can read memberships"
on public.project_members for select
using (public.can_read_project(project_id));

create policy "project managers can insert memberships"
on public.project_members for insert
with check (public.can_manage_project(project_id));

create policy "project managers can update memberships"
on public.project_members for update
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy "project managers can delete memberships"
on public.project_members for delete
using (public.can_manage_project(project_id));

create policy "project members can read agents"
on public.agents for select
using (public.can_read_project(project_id));

create policy "project managers can insert agents"
on public.agents for insert
with check (public.can_manage_project(project_id));

create policy "project managers can update agents"
on public.agents for update
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy "project managers can delete agents"
on public.agents for delete
using (public.can_manage_project(project_id));

create policy "project members can read agent sessions"
on public.agent_sessions for select
using (public.can_read_project(project_id));

create policy "project managers can insert agent sessions"
on public.agent_sessions for insert
with check (public.can_manage_project(project_id));

create policy "project managers can update agent sessions"
on public.agent_sessions for update
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy "project managers can delete agent sessions"
on public.agent_sessions for delete
using (public.can_manage_project(project_id));

create policy "project members can read events"
on public.events for select
using (public.can_read_project(project_id));

create policy "project managers can insert events"
on public.events for insert
with check (public.can_manage_project(project_id));

create policy "project managers can update events"
on public.events for update
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy "project managers can delete events"
on public.events for delete
using (public.can_manage_project(project_id));

create policy "project members can read comments"
on public.comments for select
using (public.can_read_project(project_id));

create policy "project commenters can insert comments"
on public.comments for insert
with check (
  public.can_comment_project(project_id)
  and author_id = auth.uid()
);

create policy "project managers can update comments"
on public.comments for update
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy "project managers can delete comments"
on public.comments for delete
using (public.can_manage_project(project_id));

create policy "project members can read features"
on public.features for select
using (public.can_read_project(project_id));

create policy "project managers can insert features"
on public.features for insert
with check (public.can_manage_project(project_id));

create policy "project managers can update features"
on public.features for update
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy "project managers can delete features"
on public.features for delete
using (public.can_manage_project(project_id));

create policy "project members can read documents"
on public.documents for select
using (public.can_read_project(project_id));

create policy "project managers can insert documents"
on public.documents for insert
with check (public.can_manage_project(project_id));

create policy "project managers can update documents"
on public.documents for update
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy "project managers can delete documents"
on public.documents for delete
using (public.can_manage_project(project_id));

create policy "project members can read decisions"
on public.decisions for select
using (public.can_read_project(project_id));

create policy "project managers can insert decisions"
on public.decisions for insert
with check (public.can_manage_project(project_id));

create policy "project managers can update decisions"
on public.decisions for update
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy "project managers can delete decisions"
on public.decisions for delete
using (public.can_manage_project(project_id));

create policy "project managers can read ingest tokens"
on public.ingest_tokens for select
using (public.can_manage_project(project_id));

create policy "project managers can insert ingest tokens"
on public.ingest_tokens for insert
with check (public.can_manage_project(project_id));

create policy "project managers can update ingest tokens"
on public.ingest_tokens for update
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy "project managers can delete ingest tokens"
on public.ingest_tokens for delete
using (public.can_manage_project(project_id));

-- Sample seed outline for local Supabase after Eric and David auth users exist.
-- Replace the subqueries with concrete auth.users ids if preferred.
--
-- insert into public.profiles (id, email, full_name)
-- select id, email, 'Eric Zhu' from auth.users where email = 'ericzhu0702@gmail.com'
-- on conflict (id) do update set email = excluded.email, full_name = excluded.full_name;
--
-- insert into public.profiles (id, email, full_name)
-- select id, email, 'David' from auth.users where email = 'zzdd3125@gmail.com'
-- on conflict (id) do update set email = excluded.email, full_name = excluded.full_name;
--
-- insert into public.projects (name, slug, description, mission, created_by)
-- select 'Dalya', 'dalya', 'Shared progress command center.',
--   'Build a shared read/comment observability dashboard where Eric and David can track progress across projects, including agent sessions, activity, features, docs, and decisions, without giving commenter roles edit access to core content.',
--   id
-- from public.profiles
-- where email = 'ericzhu0702@gmail.com'
-- on conflict (slug) do update set name = excluded.name, description = excluded.description, mission = excluded.mission;
--
-- insert into public.project_members (project_id, user_id, role)
-- select p.id, pr.id, 'owner'
-- from public.projects p
-- join public.profiles pr on pr.email = 'ericzhu0702@gmail.com'
-- where p.slug = 'dalya'
-- on conflict (project_id, user_id) do update set role = excluded.role;
--
-- insert into public.project_members (project_id, user_id, role)
-- select p.id, pr.id, 'commenter'
-- from public.projects p
-- join public.profiles pr on pr.email = 'zzdd3125@gmail.com'
-- where p.slug = 'dalya'
-- on conflict (project_id, user_id) do update set role = excluded.role;
--
-- Store only a SHA-256 hex token hash. Example:
-- insert into public.ingest_tokens (project_id, owner_user_id, source_provider, name, token_hash)
-- select p.id, pr.id, 'codex', 'Local Codex', encode(digest('plain-token-value', 'sha256'), 'hex')
-- from public.projects p
-- join public.profiles pr on pr.email = 'ericzhu0702@gmail.com'
-- where p.slug = 'dalya';
