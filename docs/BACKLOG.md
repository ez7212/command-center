# Product Backlog

North star: build a shared read/comment observability dashboard where Eric and
David can track progress across projects, including agent sessions, activity,
features, docs, decisions, and non-coding work, without giving commenter roles
edit access to core content.

The dashboard should become an agentic view of the work: it should show what is
happening, why it matters, what changed, what is blocked, what decisions were
made, and what should happen next.

## P0: Multi-Project Local Directory Sync

Goal: each local project folder can route agent and manual events to the right
dashboard project with minimal friction.

Baseline implemented:

- `agent-log` can read `~/.command-center/projects.json`.
- `agent-log init-project` writes directory mappings.
- `agent-log projects` lists registered mappings.
- `agent-log doctor` checks local mapping, provider, ingest URL, and token env
  presence.
- `agent-log` can infer `projectSlug`, `source`, `sourceProvider`, and token
  env from the current directory.
- `activity-log` appends structured future/history records to the right
  per-project JSON file and can trigger a project import with `--sync`.
- The dashboard shows a per-project `Setup` page with mapped local directories,
  provider health, recent events, and token-env status.

Remaining work:

### Project Registry

- Add dashboard-visible source health for registry mappings.
- Support a `manual` provider alongside `codex` and `claude`.
- Validate token/project match without writing real events.
- Support multiple source providers per project beyond `codex`, `claude`,
  and future integrations.
- Example:

```json
{
  "/Users/eric/dalya-ai": {
    "name": "Dalya",
    "projectSlug": "dalya",
    "defaultProvider": "codex",
    "providers": {
      "codex": {
        "source": "codex",
        "sourceProvider": "codex",
        "tokenEnv": "COMMAND_CENTER_DALYA_CODEX_TOKEN"
      },
      "claude": {
        "source": "claude",
        "sourceProvider": "claude",
        "tokenEnv": "COMMAND_CENTER_DALYA_CLAUDE_TOKEN"
      }
    }
  }
}
```

### CLI Improvements

- Add local hooks or scheduled jobs for repeated event patterns that should be
  captured automatically instead of manually appended.
- Make `agent-log doctor` verify server-side state:
  - dashboard URL is reachable
  - project slug exists
  - token matches the project
  - source provider is valid
- Add `agent-log remove-project`.
- Add `agent-log set-provider-token`.
- Add optional shell completion for project/provider names.

### Dashboard Support

- Add a `project_sources` or `project_directories` table later if local mappings
  should be visible in the dashboard.
- Show source health per project:
  - last event
  - last heartbeat
  - token last used
  - configured providers
- Add a project setup page for owners/editors to copy CLI env setup commands.

### Acceptance Criteria

- From any registered local repo, `npm run agent-log` can route to the correct
  dashboard project without manually passing `--project`.
- Incorrect token/project pairs fail safely.
- David can see which projects are actively reporting progress.

## P0: Non-Coding Work Tracking

Goal: support marketing, distribution, ads, research, partnerships, operations,
and strategy work as first-class activity, not just code events.

### Event Types To Add

- `marketing_plan_created`
- `marketing_plan_updated`
- `distribution_experiment_started`
- `distribution_experiment_completed`
- `ad_campaign_started`
- `ad_campaign_updated`
- `ad_campaign_completed`
- `research_note_added`
- `customer_call_logged`
- `partnership_outreach_logged`
- `ops_task_completed`
- `metric_snapshot_logged`

### Content Models To Consider

- `workstreams`: product, engineering, marketing, distribution, ads, research,
  operations, partnerships.
- `campaigns`: ad campaigns, launch campaigns, email campaigns.
- `experiments`: hypothesis, channel, audience, budget, result, conclusion.
- `research_notes`: source, summary, insight, confidence.
- `metrics`: name, value, period, source, notes.

### UI Additions

- Add work-type and label filters to activity feed and sessions.
- Add session and event labeling through `/api/ingest` and `agent-log`.
- Add a non-coding event composer for manual updates.
- Add pages or tabs for:
  - Campaigns
  - Experiments
  - Research
  - Metrics
- Add badges for workstream and confidence level.

### Acceptance Criteria

- Eric can log marketing/distribution/ad work without pretending it is a code
  event.
- David can read and comment on non-coding progress.
- Overview shows product and go-to-market progress together.

## P1: Agentic Overview

Goal: transform the dashboard from a feed into an operational view of what the
work means.

### Project Health

- Add a project health panel:
  - active sessions
  - stale sessions
  - shipped this week
  - open decisions
  - unanswered comments
  - blocked work
- Add trend indicators for the last 7 and 30 days.
- Surface stale projects where no event has landed recently.

### Work Narrative

- Generate or curate a timeline grouped by outcome:
  - "Built"
  - "Decided"
  - "Learned"
  - "Blocked"
  - "Next"
- Let events roll up into daily progress notes.
- Add a human-editable summary field per day or per project.

### Next-Best Actions

- Detect events that imply follow-up:
  - failed build
  - unanswered comment
  - stale heartbeat
  - feature in review too long
  - decision without linked feature/doc
- Show suggested next actions with owner and reason.
- Keep suggestions read-only for commenters.

## P1: Activity Feed Improvements

- Add filters by source, actor, event type, workstream, session, and date.
- Add saved views: "Today", "This week", "Needs review", "Decisions", "Go-to-market".
- Add compact and expanded display modes.
- Add event grouping by session or feature.
- Add permalink pages for individual events.
- Add comment count and unread indicators.
- Add metadata rendering for common structures:
  - files changed
  - commands run
  - links
  - metrics
  - campaign ids

## P1: Session View Improvements

- Extend session detail pages.
- Show session lifecycle: started, heartbeats, code changes, decisions, completed.
- Show child sessions and delegated tasks more clearly.
- Add stale/abandoned session detection.
- Add session outcome fields:
  - objective
  - result
  - blockers
  - next steps
- Link sessions to features, documents, and decisions.

## P1: Feature Board Improvements

- Add feature detail pages.
- Add priority, target date, owner, reviewer, and blocked reason.
- Add linked events, sessions, documents, decisions, and comments.
- Add "recent movement" indicators.
- Add review queue for David/commenters.
- Add feature templates for product, engineering, marketing, and distribution.

## P1: Documents Improvements

- Add document detail pages with comments anchored to sections.
- Add document kinds beyond `doc`:
  - mission
  - strategy
  - branding
  - distribution
  - marketing
  - ads
  - research
  - launch
  - memo
- Add document status: draft, review, approved, archived.
- Add external source sync later for Google Docs/Notion if needed.

## P1: Decisions Improvements

- Add decision detail pages.
- Add decision types: product, technical, marketing, distribution, operational.
- Add decision status transitions:
  - proposed
  - active
  - superseded
  - reversed
- Add linked rationale, evidence, alternatives, and follow-up tasks.
- Add "decisions needing review" view.

## P1: Comments and Review Workflow

- Add unread comment tracking per user.
- Add comment resolution status.
- Add mention support later.
- Add comment notifications later.
- Add "needs Eric response" and "needs David response" views.
- Add moderation UI for owner/editor if RLS supports it.

## P2: Project Administration

- Add owner/editor UI to create projects.
- Add owner/editor UI to invite members and assign roles.
- Add owner/editor UI to create/revoke ingest tokens.
- Add setup wizard for local project directory sync.
- Add project archive and rename flows.
- Keep commenter role read/comment-only.

## P2: Search and Knowledge

- Add global search across projects, events, sessions, features, docs,
  decisions, and comments.
- Add filters for source, workstream, date, and status.
- Add semantic search later after the operational model is stable.
- Add "why did this happen?" context view linking events to decisions and docs.

## P2: Periodic Chat Summaries

Goal: periodically summarize ongoing chats and session context inside each
project and sync those summaries to the dashboard without depending on raw
transcript dumps.

Target sources:

- Codex app chats within each project folder
- ChatGPT webpage chats related to a project
- Claude webpage chats related to a project

Planned behavior:

- Capture or export project-scoped chat sessions from each source.
- Periodically summarize them into structured artifacts:
  - objective
  - summary
  - decisions
  - blockers
  - next steps
  - linked files, docs, features, and decisions
- Sync those summaries to the dashboard as session artifacts or derived events.
- Keep transcript parsing and raw transcript storage out of the first version.

Constraints:

- Do not build this until the ingestion and agentic dashboard model are more stable.
- Prefer summary-first sync, not full transcript-first sync.
- Keep project routing aligned with the local directory registry.

## P2: Integrations

Do not build these until the core workflow is stable:

- GitHub webhook ingestion
- Slack integration
- Linear integration
- Notion sync
- Google Docs sync
- ad platform imports
- analytics imports

## Data Model Backlog

Potential additions:

- `workstreams`
- `project_sources`
- `project_directories`
- `campaigns`
- `experiments`
- `research_notes`
- `metrics`
- `review_states`
- `event_links`
- `daily_summaries`

Future-proofing principles:

- Keep `actor_user_id`, `actor_name`, `source`, and `source_provider`.
- Add workstream/channel fields without coupling them to coding agents.
- Keep permissions role-based through RLS.
- Keep service role usage server-only.
- Do not give commenters edit access to core content.

## Suggested Build Order

1. Local directory registry and `agent-log` project inference.
2. Project source health panel.
3. Manual non-coding event composer.
4. Workstream field and activity filters.
5. Event/session/feature/detail pages.
6. Agentic overview: health, stale work, open review, next actions.
7. Owner/editor project administration.
8. Search and integrations.
