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
