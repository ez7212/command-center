alter table public.agent_sessions
  add column if not exists work_type text not null default 'general',
  add column if not exists work_labels text[] not null default '{}'::text[];

alter table public.events
  add column if not exists work_type text not null default 'general',
  add column if not exists work_labels text[] not null default '{}'::text[];

create index if not exists agent_sessions_project_work_type_idx
  on public.agent_sessions (project_id, work_type);

create index if not exists agent_sessions_work_labels_idx
  on public.agent_sessions using gin (work_labels);

create index if not exists events_project_work_type_idx
  on public.events (project_id, work_type, created_at desc);

create index if not exists events_work_labels_idx
  on public.events using gin (work_labels);
