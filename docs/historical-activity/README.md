# Historical Activity Logs

These files are the per-project source of truth for reconstructed dashboard activity.

- `command-center.json`
- `dalya.json`
- `buriza.json`
- `zaya-life.json`

Use this directory as the default import source:

```bash
npm run import-historical-activity -- --dry-run
```

Import or validate one project at a time:

```bash
npm run import-historical-activity -- --project dalya --dry-run
```

Every meaningful feature, fix, bug, review, strategy change, non-coding workstream, and key event should be summarized in the relevant project file before it is imported to the dashboard.

For recurring or continuous workflows, add automation instead of relying on manual edits. Use `npm run activity-log` for structured local capture today, and prefer hooks, watchers, or scheduled sync jobs for patterns that repeat.

For Command Center development, run `npm run activity-log` before closing any meaningful task so the new work is captured in `command-center.json`. Add `--sync` when Supabase env vars are configured and the event should be imported immediately.
