# Historical Activity Backfill

This is the first high-signal backfill pass for the projects currently mapped
into Command Center:

- Command Center
- Dalya
- Buriza
- Zaya Life

The goal is not to recreate every tiny edit. The goal is to capture the major
historical events that explain:

- what task was being worked on
- why it mattered
- what the process was
- what the end result became

The machine-readable event files are split by project:

- [historical-activity/command-center.json](./historical-activity/command-center.json)
- [historical-activity/dalya.json](./historical-activity/dalya.json)
- [historical-activity/buriza.json](./historical-activity/buriza.json)
- [historical-activity/zaya-life.json](./historical-activity/zaya-life.json)

This keeps each project history reviewable without loading one consolidated
file. The importer still accepts a single JSON file via `--file`, but the
directory above is the default source of truth.

## Ongoing logging standard

Going forward, every meaningful feature, fix, bug, review, new strategy,
non-coding workstream, or key event should become a dashboard activity record.

If the same kind of event will happen repeatedly or continuously add to the
agentic workflow, do not leave it as a manual JSON habit. Build an automatic
capture path for it, such as a CLI helper, local hook, watcher, or scheduled
sync job.

For each record, capture:

- purpose
- process summary
- prior issues or context
- issues identified
- fixes, decisions, or work completed
- outcome
- evidence files, logs, commits, or artifacts

This applies across Command Center, Dalya, Buriza, Zaya Life, and future
projects. The goal is an agentic view of our work, including coding,
marketing, distribution, ads, research, operations, and strategy.

## Source quality

The evidence quality differs by project:

- **Command Center**: very high confidence
  - Codex history
  - local git history
  - current repo state
- **Dalya**: high confidence
  - Claude project/session logs
  - local test progress logs
  - shipped `FEATURES.md` and `BACKLOG.md`
- **Buriza**: high confidence
  - Claude project log
  - current Next.js site and design/copy artifacts
- **Zaya Life**: mixed but still useful
  - site-side Claude history is strong
  - research repo has artifacts and timestamps
  - the separate research repo does not show rich local chat/session logs

## What I found

### Command Center

Command Center has a clean and recent development history.

The major phases were:

1. v0 foundation
   - schema
   - RLS
   - auth
   - ingest API
   - `agent-log`
2. dashboard productization
   - UI
   - comments
   - realtime/polling
   - deployment/setup docs
3. agentic expansion
   - multi-project local routing
   - labeled work
   - source setup/health
   - manual non-coding capture

This project is the easiest one to backfill automatically because both the
git history and Codex history are explicit.

### Dalya

Dalya has the richest historical operational record.

The main themes visible from logs and artifacts:

1. research and knowledge-base assembly for Oasis / community intelligence
2. SPA parser and listing registration proof of concept
3. MVP hardening sprint across platform internals
4. seller portal + CRM + operations layer
5. repeated persona-based chatbot test runs, now reconstructed as individual
   run-level events
6. knowledge-base audits and fact correction work
7. marketing website, brand, and positioning work
8. multilingual SEO/content strategy and publishing plan
9. community research pipeline and KB scaling infrastructure
10. operational hardening for summary workers, queues, bridge APIs, and DB
    resilience

The repeated `_progress.log` files in `reports/` are especially valuable
because they show real test cadence and timestamps from May 5 through May 11.
The companion `VERIFICATION.md` and `_aggregate.json` files provide the reason
for each run, the known issue list going in, the fixes being verified, and the
outcome.

Dalya is now the highest-resolution project in the backfill. The JSON contains
separate records for the website/frontend system, auth/app shell, seller
dashboard, CRM, listing-detail pages, community research pipeline, multilingual
content strategy, payment fact modeling, parser/data-model hardening, docs, and
operational service hardening in addition to the chatbot test runs.

### Buriza

Buriza looks like a focused single-session site build:

1. read the executive brief
2. derive brand/copy direction
3. derive design system
4. scaffold Next.js app
5. build and verify a single-page site

There is no deep multi-week history visible yet, but there is enough to backfill
the strategic setup and the site build itself.

### Zaya Life

Zaya Life splits into two streams:

1. research repo
   - competitor/reference capture
   - synthesized surrogacy market report
2. website repo
   - copy and brand refinement
   - intake productionization
   - responsiveness and layout fixes

The site-side Claude history is detailed enough to reconstruct the main phases.
The research repo is more artifact-driven than chat-log-driven, so those entries
are anchored mostly by file timestamps and report contents.

## Gaps and limits

This backfill pass is useful, but not complete.

The main gaps are:

- no rich local Codex session logs inside each project repo
- uneven git history outside Command Center
- research artifacts without explicit conversation history in some folders
- long Dalya Claude history that contains many small edits and design questions
  that should be collapsed rather than imported raw
- this pass creates project-level historical activity events, not reconstructed
  agent session trees
- Claude web, ChatGPT web, and Codex app conversations are not represented
  unless they were visible in local project/history files
- Buriza has a focused website-build record, but not a deep multi-week operating
  history yet
- Dalya now has feature-level records for most visible product areas, but some
  April work is still reconstructed from file timestamps and shipped-feature
  docs rather than exact commit history because the local Dalya folder is not a
  git repository
- Zaya Life research entries are artifact-timestamp based rather than
  conversation-log based
- no production Supabase activity has been reconciled against this import yet

## Recommended next step

The importer now treats the per-project JSON directory as the source of truth
and inserts each item as an idempotent `manual_note` event with `source_provider =
historical_backfill`.

Before importing:

1. Review the per-project JSON files and prune/rename any event titles that feel off.
2. Make sure Supabase has matching project slugs:
   - `command-center`
   - `dalya`
   - `buriza`
   - `zaya-life`
3. Run a dry run:
   - `npm run import-historical-activity -- --dry-run`
4. Optionally dry-run one project:
   - `npm run import-historical-activity -- --project dalya --dry-run`
5. Import one project after review:
   - `npm run import-historical-activity -- --project dalya`
6. Import all projects after review:
   - `npm run import-historical-activity`
7. Preserve the per-project JSON files as the backfill source of truth so they
   can be revised without scraping everything again.

## Suggested import shape

For dashboard backfill, each JSON item is already close to what we need:

- `projectSlug`
- `title`
- `startedAt`
- `endedAt`
- `workType`
- `workLabels`
- `purpose`
- `processSummary`
- `priorIssues`
- `issuesIdentified`
- `fixesMade`
- `testRun`
- `outcome`

The most likely next implementation is:

- one event for the kickoff / major milestone
- optional document or decision records for the highest-value historical moments
- session summary artifacts later, once we build structured import support
