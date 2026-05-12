# Supabase Database Credentials

## Local environment

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Fill these values from the Supabase project dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Where to find them in Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`: Project Settings -> API -> Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings -> API -> anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Project Settings -> API -> service_role key

The service role key must stay server-side. Do not put it in browser components,
client-side code, or public deployment variables.

## Ingest CLI environment

For local telemetry, also add:

```bash
COMMAND_CENTER_INGEST_URL=http://localhost:3000/api/ingest
COMMAND_CENTER_PROJECT_SLUG=dalya
COMMAND_CENTER_SOURCE=codex
COMMAND_CENTER_SOURCE_PROVIDER=codex
COMMAND_CENTER_INGEST_TOKEN=RAW_PROJECT_TOKEN
```

Store only the SHA-256 hash of the raw token in Supabase
`public.ingest_tokens.token_hash`. Keep the raw token only in local env files or
a secret manager.

## After credentials are set

Run:

```bash
npm run lint
npm run build
```

Then start local dev:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/dashboard
```
