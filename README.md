# Command Center

Workflow command center v0 for making Eric's work visible to David.

North star: build a read/comment observability dashboard where David can see
Eric's work across projects, including agent sessions, activity, features,
docs, and decisions, without giving David edit access to core content.

This version is intentionally narrow:

- Eric is the only telemetry source.
- David is a dashboard user with read and comment access.
- David-owned Codex or Claude Code session linking is not implemented.
- The app uses mock Dalya data when Supabase environment variables are absent.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment variables:

```bash
cp .env.example .env.local
```

3. Configure Supabase values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is used only by server-side code for `/api/ingest`.
Never expose it to browser components.

4. Run migrations:

```bash
supabase db push
```

If you are not using the Supabase CLI, apply the SQL in `supabase/migrations`
through your Supabase SQL editor.

5. Create auth users:

- Eric: `ericzhu0702@gmail.com`
- David: `zzdd3125@gmail.com`

6. Add Eric as owner and David as commenter.

The migration includes commented sample SQL at the bottom showing the expected
profile, project, membership, and ingest-token setup. Use `dalya` as the first
project slug:

```sql
insert into public.project_members (project_id, user_id, role)
select p.id, pr.id, 'owner'
from public.projects p
join public.profiles pr on pr.email = 'ericzhu0702@gmail.com'
where p.slug = 'dalya';

insert into public.project_members (project_id, user_id, role)
select p.id, pr.id, 'commenter'
from public.projects p
join public.profiles pr on pr.email = 'zzdd3125@gmail.com'
where p.slug = 'dalya';
```

7. Create an ingest token for Eric.

Store only a SHA-256 hex hash in `public.ingest_tokens.token_hash`. Example SQL:

```sql
insert into public.ingest_tokens (
  project_id,
  owner_user_id,
  source_provider,
  name,
  token_hash
)
select
  p.id,
  pr.id,
  'codex',
  'Eric local Codex',
  encode(digest('plain-token-value', 'sha256'), 'hex')
from public.projects p
join public.profiles pr on pr.email = 'ericzhu0702@gmail.com'
where p.slug = 'dalya';
```

Use the plaintext token only in Eric's local environment:

```bash
COMMAND_CENTER_INGEST_TOKEN=plain-token-value
```

8. Run the local dev server:

```bash
npm run dev
```

Open `http://localhost:3000/dashboard/dalya`.

9. Send a test event with `agent-log`:

```bash
npm run agent-log -- \
  --type manual_note \
  --title "Test ingest" \
  --body "Verifying Eric telemetry ingest."
```

10. Deploy.

Set the same Supabase environment variables in the deployment environment. Keep
`SUPABASE_SERVICE_ROLE_KEY` server-only.

## Manual Supabase Setup

Use this sequence for a fresh Supabase project:

1. Create a Supabase project.
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Run migrations from `supabase/migrations`.
4. Create Eric through Supabase Auth.
5. Create David through Supabase Auth.
6. Add both users to `profiles`.
7. Create the first project.
8. Add Eric to `project_members` as `owner`.
9. Add David to `project_members` as `commenter`.
10. Create an ingest token for Eric's project.
11. Store the hashed token in `ingest_tokens`.
12. Put the raw token in Eric's local `.env.local` as `COMMAND_CENTER_INGEST_TOKEN`.

Suggested seed shape:

```sql
-- Replace these UUIDs with actual auth.users IDs.

insert into public.profiles (id, email, full_name)
values
  ('ERIC_AUTH_USER_ID', 'ericzhu0702@gmail.com', 'Eric Zhu'),
  ('DAVID_AUTH_USER_ID', 'zzdd3125@gmail.com', 'David')
on conflict (id) do nothing;

insert into public.projects (name, slug, description, mission, created_by)
values (
  'Command Center',
  'command-center',
  'Workflow observability dashboard for Eric and David.',
  'Build a read/comment observability dashboard where David can see Eric''s work across projects, including agent sessions, activity, features, docs, and decisions, without giving David edit access to core content.',
  'ERIC_AUTH_USER_ID'
)
returning id;

insert into public.project_members (project_id, user_id, role)
values
  ('PROJECT_ID', 'ERIC_AUTH_USER_ID', 'owner'),
  ('PROJECT_ID', 'DAVID_AUTH_USER_ID', 'commenter');
```

To create an Eric ingest token, generate a raw token locally, hash it, and store
only the hash:

```sql
insert into public.ingest_tokens (
  project_id,
  owner_user_id,
  source_provider,
  name,
  token_hash
)
values (
  'PROJECT_ID',
  'ERIC_AUTH_USER_ID',
  'codex',
  'Eric local Codex',
  encode(digest('RAW_TOKEN_VALUE', 'sha256'), 'hex')
);
```

Eric's local `.env.local` should contain the raw value:

```bash
COMMAND_CENTER_INGEST_TOKEN=RAW_TOKEN_VALUE
```

## Supabase Model

The migration creates:

- `profiles`
- `projects`
- `project_members`
- `agents`
- `agent_sessions`
- `events`
- `comments`
- `features`
- `documents`
- `decisions`
- `ingest_tokens`

RLS is enabled on every public table. Project members can read project content.
Owners/editors can manage core content. Commenters can insert comments. In v0
strict mode, commenters cannot update or delete comments after posting.

## Local Mock Mode

If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing,
the dashboard renders mock Dalya data. This is useful for local review and
build verification before Supabase is configured.

## Agent Log CLI

The `agent-log` script posts Eric's local work telemetry to `/api/ingest`.
Configure it with environment variables:

```bash
export COMMAND_CENTER_INGEST_URL="http://localhost:3000/api/ingest"
export COMMAND_CENTER_INGEST_TOKEN="your-project-ingest-token"
export COMMAND_CENTER_PROJECT_SLUG="dalya"
export COMMAND_CENTER_SOURCE="codex"
export COMMAND_CENTER_SOURCE_PROVIDER="codex"
```

Session start:

```bash
npm run agent-log -- \
  --type agent_started \
  --session-id "codex-$(date +%s)" \
  --session-title "Build command center MVP" \
  --session-status active \
  --title "Started Codex session" \
  --body "Beginning implementation of Eric-to-David command center."
```

Research/web event:

```bash
npm run agent-log -- \
  --type search_run \
  --title "Researched Supabase RLS and Next.js Route Handlers" \
  --body "Checked current docs for RLS policies and App Router API endpoints." \
  --metadata '{"queries":["Supabase RLS policies","Next.js App Router Route Handlers"]}'
```

Code change:

```bash
npm run agent-log -- \
  --type code_changed \
  --title "Built activity feed shell" \
  --body "Added initial activity feed components and project-aware layout." \
  --metadata '{"files":["src/components/activity-feed.tsx","src/app/dashboard/[projectSlug]/activity/page.tsx"]}'
```

Feature shipped:

```bash
npm run agent-log -- \
  --type feature_shipped \
  --title "Shipped comments MVP" \
  --body "David can now comment on events, sessions, features, documents, decisions, and projects."
```

Session completed:

```bash
npm run agent-log -- \
  --type agent_completed \
  --session-status completed \
  --title "Codex session completed" \
  --body "Completed schema, ingest API, CLI, and initial dashboard MVP."
```

## Verification

```bash
npm run lint
npm run build
```

Recommended checkpoint workflow:

1. Use one Codex session per milestone.
2. Run the same verification after every session:

```bash
npm run lint
npm run build
git status
git add .
git commit -m "<checkpoint message>"
```

Suggested session order:

- Session 1: `AGENTS.md` and repo inspection
- Session 2: schema and RLS
- Session 3: auth and Supabase utilities
- Session 4: ingest API
- Session 5: `agent-log` CLI
- Session 6: dashboard UI
- Session 7: comments
- Session 8: realtime/polling
- Session 9: deployment readiness

Final readiness checklist:

- Project dashboard, rail, activity feed, sessions, features, documents,
  decisions, and comments exist.
- David can read and comment on project content where he is a member.
- David cannot edit/delete core content or manage ingest tokens.
- `/api/ingest` validates zod payloads, hashes tokens, maps telemetry to Eric,
  upserts sessions, and inserts events.
- `scripts/agent-log.ts` reads env defaults, accepts overrides, validates
  metadata JSON, and does not print tokens.
- Mock data fallback works without Supabase env vars.
- Service role key is only used in server-side modules.

## Out Of Scope For v0

- David's Codex hook setup
- David's Claude hook setup
- David-owned ingest tokens
- David source-provider onboarding
- Per-user telemetry settings
- Transcript parsing
- Organization-level source management
- Complex analytics
- AI daily summary generation
- Weekly executive briefings
- Semantic search
- Billing
- Public sharing
- Slack integration
- Linear integration
- Notion sync
- GitHub webhook ingestion
