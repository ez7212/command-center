This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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
