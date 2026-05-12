# Command Center Project Brief

## Mission

Build a shared read/comment observability dashboard where Eric and David can track progress across projects, including agent sessions, activity, features, docs, decisions, task boards, and non-coding work, without giving commenter roles edit access to core content.

## Current Product

Command Center is a Next.js dashboard backed by Supabase. It gives each project a command-center view of work in progress, historical activity, agent sessions, backlog tasks, documents, decisions, and comments.

Version 0 starts with Eric's local telemetry and David as a dashboard collaborator with read/comment access. The product direction is broader: a co-work dashboard where both people can share progress across coding, research, strategy, marketing, distribution, ads, and operations.

## Features Built

- Supabase schema, RLS policies, auth utilities, and mock fallback mode.
- Secure `/api/ingest` route for local telemetry events.
- `agent-log` CLI for posting live events from local project folders.
- `activity-log` CLI for appending structured historical/project activity records.
- Multi-project local directory registry for Command Center, Dalya, Buriza, and Zaya Life.
- Project dashboard pages for overview, activity, sessions, features, documents, decisions, setup, and tasks.
- Trello-style task boards with Completed, Ongoing, and Backlog lanes.
- Task detail pages with comments, using feature records as task objects.
- Comment threads across major project objects.
- Work type and label support for filtering coding and non-coding activity.
- Historical activity backfill split by project under `docs/historical-activity/`.
- External project instruction files so future Codex/Claude work logs back into Command Center.
- Living `PROJECT_BRIEF.md` files for each tracked project, with agent instructions to keep them current.

## Ongoing Work

- Configure production Supabase credentials, migrations, users, project membership, and ingest tokens.
- Keep project briefs, backlog files, and dashboard task boards aligned.
- Improve automatic capture for repetitive workflows that should not depend on manual logging.
- Expand task board data beyond mock/local state into Supabase-backed project task management.

## Backlog

- Owner/editor UI for creating projects, members, and ingest tokens.
- Server-side source validation for `agent-log doctor`.
- Detail pages and linkages between tasks, sessions, events, docs, and decisions.
- Project health and next-best-action panels.
- Periodic summary sync for Codex app, ChatGPT web, and Claude web conversations.
- Search across projects, events, sessions, tasks, documents, decisions, and comments.
- Integration candidates later: GitHub, Slack, Linear, Notion, analytics, and ad platforms.

## Users And Permissions

- Eric: owner/editor in v0, telemetry source, can manage core content.
- David: dashboard collaborator, can read and comment, cannot edit/delete core project content or manage ingest tokens.
- Future: additional users should be able to connect their own telemetry sources, but that is out of scope for v0.

## Marketing And Distribution

Command Center is currently an internal co-work operating system, not a public product. The useful distribution insight is internal adoption: every active project should have project instructions, a project brief, a backlog, activity logging, and source setup so the dashboard becomes the shared operating view by default.

## Key Decisions

- Use Supabase RLS as the primary permission boundary.
- Keep `AGENTS.md` and `CLAUDE.md` as agent instruction files, not product briefs.
- Use `PROJECT_BRIEF.md` as the human-readable 5-minute project context.
- Use existing `features` records as task cards for the first task-board implementation.
- Keep David-owned machine/session linking out of v0.
- Prefer automation for recurring activity capture.

## Important Files

- `AGENTS.md`
- `PROJECT_BRIEF.md`
- `README.md`
- `docs/BACKLOG.md`
- `docs/SUPABASE_CREDENTIALS.md`
- `docs/historical-activity/`
- `scripts/agent-log.ts`
- `scripts/activity-log.ts`
- `scripts/import-historical-activity.ts`
- `src/app/api/ingest/route.ts`
- `src/app/dashboard/[projectSlug]/`
- `supabase/migrations/`

## Open Questions

- When should project briefs sync into Supabase `documents` records automatically?
- Should task boards get their own table, or should `features` remain the task model for v0?
- Which repetitive workflows should become hooks or scheduled jobs first?
- What level of chat summarization is useful without storing raw transcripts?
