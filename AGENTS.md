# AGENTS.md

## Product

This repo is a co-work command center for Eric and David.

Version 0 starts with Eric's telemetry, but the product direction is a shared progress dashboard for Eric and David.

David can read and comment, but cannot edit core content.

## Current scope

Build v0 only:

- shared project dashboard
- Eric's Codex / Claude / manual work events
- Eric's active agent sessions
- project features
- project docs
- project decisions
- project mission statements
- project branding notes
- project distribution plans
- David read/comment access

Do not implement second-user Codex or Claude session linking yet.

## Future scope

Later, we will allow additional users, including David, to link their own Codex and Claude sessions.

For now, keep the data model lightly future-proofed with actor/source fields, but do not build second-machine telemetry.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Supabase Realtime
- Server-side ingestion API
- Local `agent-log` CLI

## Roles

Roles:

- owner
- editor
- commenter
- viewer

Eric should be owner/editor.

David should be commenter.

David can:

- read project content
- read events
- read sessions
- read features
- read documents
- read decisions
- create comments

David cannot:

- create, update, or delete projects
- create, update, or delete events
- create, update, or delete sessions
- create, update, or delete features
- create, update, or delete documents
- create, update, or delete decisions
- create, update, or delete ingest tokens
- change permissions

## Architecture

Everything important should become an event.

Event examples:

- agent_started
- agent_heartbeat
- agent_completed
- search_run
- code_changed
- feature_started
- feature_shipped
- decision_logged
- doc_created
- doc_updated
- deployment_shipped
- manual_note

## Activity Logging Standard

Going forward, every meaningful feature, fix, bug, review, strategy change, non-coding workstream, and key event should be recorded, summarized, and displayed in the dashboard.

If an event pattern is repetitive or continuously contributes to the agentic workflow, design an automatic capture path for it instead of relying on manual JSON edits. Prefer scripts, local hooks, watchers, or scheduled sync jobs when the same kind of activity will recur.

Historical and reconstructed activity records live by project under:

- `docs/historical-activity/<projectSlug>.json`

For meaningful Command Center work, run `npm run activity-log` before the final
response so the completed feature, fix, review, or strategy change is captured.
Use `--sync` only when Supabase env vars are configured and the event should be
imported immediately.

Each record should explain:

- the purpose of the task
- the process or investigation
- known issues before the work
- issues identified during the work
- fixes or decisions made
- the outcome
- evidence files, logs, commits, or artifacts

Use this as the standard for Command Center, Dalya, Buriza, Zaya Life, and future projects.

## Project Brief Standard

Keep `PROJECT_BRIEF.md` as the living 5-minute overview of this product. It is
for a smart outside reader who needs to understand the project quickly.

Update `PROJECT_BRIEF.md` whenever meaningful work changes or clarifies:

- mission
- current product scope
- features built
- ongoing work
- backlog
- users/customers
- positioning
- marketing or distribution plan
- key decisions
- important links or artifacts
- open questions

Do not overload `AGENTS.md` with project brief content. `AGENTS.md` is for agent
operating instructions; `PROJECT_BRIEF.md` is for product/business context.

## Ingestion

Create a secure `/api/ingest` endpoint.

It should:

- accept project ingest token
- validate request body with zod
- map token to project
- insert or update agent session
- insert event
- use server-side Supabase credentials only
- never expose service role keys to browser

In v0, ingest tokens are provisioned for Eric's local telemetry only.

## UI

The UI should feel like a neutral command center, not branded to any one project.

Layout:

- left project rail
- top project header
- activity feed
- live sessions
- features board
- docs
- decisions
- comments

## Mock data fallback

The app should still build and render useful mock data if Supabase environment variables are missing.

This is important for local development and for Codex verification.

## Verification

After each milestone, run:

```bash
npm run lint
npm run build
