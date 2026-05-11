# AGENTS.md

## Product

This repo is a workflow command center for Eric and David.

Version 0 is scoped to making Eric's work visible to David.

David can read and comment, but cannot edit core content.

## Current scope

Build v0 only:

- Eric's projects
- Eric's Codex / Claude / manual work events
- Eric's active agent sessions
- Eric's features
- Eric's docs
- Eric's decisions
- Eric's mission statements
- Eric's branding notes
- Eric's distribution plans
- David read/comment access

Do not implement David-owned Codex or Claude session linking yet.

## Future scope

Later, we will allow David to link his own Codex and Claude sessions.

For now, keep the data model lightly future-proofed with actor/source fields, but do not build David machine telemetry.

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

In v0, ingest tokens are for Eric's work only.

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