# Command Center

Co-work command center v0 for Eric and David to share progress across projects.

North star: build a shared read/comment observability dashboard where Eric and
David can track progress across projects, including agent sessions, activity,
features, docs, and decisions, without giving commenter roles edit access to
core content.

This version is intentionally narrow:

- V0 has one configured telemetry source: Eric's local machine.
- David is a dashboard user with read and comment access.
- Additional user Codex or Claude Code session linking is not implemented yet.
- The app uses mock multi-project data when Supabase environment variables are absent.

See [docs/BACKLOG.md](docs/BACKLOG.md) for the product backlog, including
multi-project local directory sync, non-coding work tracking, and the agentic
view roadmap.

See [docs/SUPABASE_CREDENTIALS.md](docs/SUPABASE_CREDENTIALS.md) for the
database credential setup checklist.

See [PROJECT_BRIEF.md](PROJECT_BRIEF.md) for the living 5-minute product brief.

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
  'Local Codex',
  encode(digest('plain-token-value', 'sha256'), 'hex')
from public.projects p
join public.profiles pr on pr.email = 'ericzhu0702@gmail.com'
where p.slug = 'dalya';
```

Use the plaintext token only in the local environment:

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
  --body "Verifying local telemetry ingest."
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
10. Create an ingest token for the project.
11. Store the hashed token in `ingest_tokens`.
12. Put the raw token in the local `.env.local` as `COMMAND_CENTER_INGEST_TOKEN`.

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
  'Build a shared read/comment observability dashboard where Eric and David can track progress across projects, including agent sessions, activity, features, docs, and decisions, without giving commenter roles edit access to core content.',
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
  'Local Codex',
  encode(digest('RAW_TOKEN_VALUE', 'sha256'), 'hex')
);
```

The local `.env.local` should contain the raw value:

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
the dashboard renders mock multi-project data. This is useful for local review
and build verification before Supabase is configured.

## Agent Log CLI

The `agent-log` script posts local work telemetry to `/api/ingest`. In v0 this
is configured for Eric's machine only.
Configure it with environment variables:

```bash
export COMMAND_CENTER_INGEST_URL="http://localhost:3000/api/ingest"
export COMMAND_CENTER_INGEST_TOKEN="your-project-ingest-token"
export COMMAND_CENTER_PROJECT_SLUG="dalya"
export COMMAND_CENTER_SOURCE="codex"
export COMMAND_CENTER_SOURCE_PROVIDER="codex"
```

### Work Labels

Each session or event can be tagged with a `workType` plus optional labels so
the dashboard can filter coding, research, marketing, distribution, and other
work.

Owner/editor roles can also log manual activity directly from the project's
`Activity` page in the dashboard. In mock mode this is available as a preview
composer.

```bash
npm run agent-log -- \
  --type search_run \
  --work-type research \
  --labels brokerage,positioning \
  --title "Reviewed brokerage onboarding flow"
```

```bash
npm run agent-log -- \
  --type manual_note \
  --work-type marketing \
  --labels distribution,landing-page \
  --title "Updated channel messaging"
```

### Local Project Registry

`agent-log` can infer the dashboard project from the current local directory.
The registry lives at `~/.command-center/projects.json` by default. Override it
with `COMMAND_CENTER_PROJECT_REGISTRY` or `--registry`.

Current local project mappings:

| Project | Slug | Local path | Providers |
| --- | --- | --- | --- |
| Command Center | `command-center` | `/Users/eric/command-center` | Codex, Claude Code |
| Dalya | `dalya` | `/Users/eric/dalya-ai` | Codex, Claude Code |
| Buriza | `buriza` | `/Users/eric/buriza-website` | Codex, Claude Code |
| Zaya Life | `zaya-life` | `/Users/eric/surrogacy-site` | Codex, Claude Code |
| Zaya Life | `zaya-life` | `/Users/eric/surrogacy-website-research` | Codex, Claude Code |

Register a project directory:

```bash
npm run agent-log -- init-project \
  --name "Dalya" \
  --project dalya \
  --cwd /Users/eric/dalya-ai \
  --codex-token-env COMMAND_CENTER_DALYA_CODEX_TOKEN \
  --claude-token-env COMMAND_CENTER_DALYA_CLAUDE_TOKEN
```

List registered projects:

```bash
npm run agent-log -- projects
```

Check the mapping for the current directory:

```bash
npm run agent-log -- doctor
```

Each project now also exposes a `Setup` page in the dashboard that shows mapped
directories, provider health, recent events, and token-env status.

After registration, a local event can omit `--project`:

```bash
npm --prefix /Users/eric/command-center run agent-log -- \
  --provider codex \
  --type code_changed \
  --title "Updated project page" \
  --body "Changed copy and layout for the current project."
```

Use `--provider claude` from the same directory to route Claude Code events
through the Claude provider token.

## Activity Log CLI

`activity-log` is the local automation layer for durable project history. It
appends a structured record to the right per-project file under
`docs/historical-activity/`, using the same directory registry as `agent-log`
when possible.

Use it when a feature, fix, bug, review, strategy change, or non-coding
workstream should become part of the long-term dashboard history:

```bash
npm run activity-log -- \
  --project dalya \
  --title "Hardened chatbot test flow" \
  --work-type testing \
  --labels chatbot,qa \
  --purpose "Verify the chatbot after fixing response fallback behavior." \
  --process "Ran persona tests, reviewed failures, adjusted fallback copy, and reran the suite." \
  --prior-issues "Fallback answers were too generic; Test logs did not explain failure context" \
  --issues "One persona still triggered an incomplete answer" \
  --fixes "Tightened fallback prompt; Added clearer verification notes" \
  --outcome "The suite passed with clearer traceability for the next review." \
  --evidence "/Users/eric/dalya-ai/reports/chatbot_progress.log"
```

Useful flags:

- `--project`: dashboard project slug. If omitted, the CLI tries the local
  directory registry, then `COMMAND_CENTER_PROJECT_SLUG`.
- `--project-name`: display name when creating a new project log file.
- `--started-at` and `--ended-at`: ISO timestamps. `startedAt` defaults to now.
- `--time-precision`: defaults to `exact`.
- `--confidence`: `high`, `medium`, or `low`. Defaults to `medium`.
- `--prior-issues`, `--issues`, `--fixes`, and `--evidence`: semicolon-separated
  strings or JSON arrays.
- `--test-run`: JSON object for test metadata.
- `--replace`: update an existing record with the same id.
- `--dry-run`: print the record without writing.
- `--sync`: after writing, run `import-historical-activity` for that project.

For new projects, create the dashboard/Supabase project first, register the
local directory with `agent-log init-project`, then run `activity-log`. If the
project JSON file does not exist yet, the CLI creates it.

Automation rule: if a repeated event pattern continuously adds value to the
agentic workflow, build a capture path for it instead of relying on manual JSON
edits. Start with `activity-log`; graduate recurring patterns to local hooks,
watchers, or scheduled sync jobs.

## Project Content Sync

After Supabase is configured, sync local project briefs, backlog docs, task-board
cards, decisions, and agent rows into the database:

```bash
npm run sync-project-content -- --dry-run
npm run sync-project-content
```

Historical activity events are imported separately:

```bash
npm run import-historical-activity -- --actor-email ez7212@gmail.com --actor-name "Eric Zhu"
```

Session start:

```bash
npm run agent-log -- \
  --type agent_started \
  --session-id "codex-$(date +%s)" \
  --session-title "Build command center MVP" \
  --session-status active \
  --title "Started Codex session" \
  --body "Beginning implementation of the shared co-work command center."
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
  --body "Comments are now available on events, sessions, features, documents, decisions, and projects."
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

- Second-user Codex hook setup
- Second-user Claude hook setup
- Second-user ingest tokens
- Second-user source-provider onboarding
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
