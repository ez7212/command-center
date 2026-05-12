import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";

type Flags = Record<string, string | boolean>;

type ProviderConfig = {
  source: string;
  sourceProvider: string;
  tokenEnv?: string;
};

type RegistryEntry = {
  name: string;
  projectSlug: string;
  defaultProvider: string;
  providers: Record<string, ProviderConfig>;
};

type ProjectRegistry = {
  projects: Record<string, RegistryEntry>;
};

const flagMap: Record<string, string> = {
  "--project": "project",
  "--name": "name",
  "--cwd": "cwd",
  "--registry": "registry",
  "--source": "source",
  "--source-provider": "sourceProvider",
  "--provider": "provider",
  "--token-env": "tokenEnv",
  "--codex-token-env": "codexTokenEnv",
  "--claude-token-env": "claudeTokenEnv",
  "--session-id": "sessionId",
  "--session-title": "sessionTitle",
  "--session-status": "sessionStatus",
  "--session-summary": "sessionSummary",
  "--type": "type",
  "--title": "title",
  "--body": "body",
  "--metadata": "metadata",
  "--work-type": "workType",
  "--labels": "labels",
};

function defaultRegistryPath() {
  return (
    process.env.COMMAND_CENTER_PROJECT_REGISTRY ??
    resolve(homedir(), ".command-center/projects.json")
  );
}

function defaultWorkingDir() {
  return (
    process.env.COMMAND_CENTER_WORKING_DIR ??
    process.env.INIT_CWD ??
    process.cwd()
  );
}

function parseArgs(args: string[]) {
  const command = args[0] && !args[0].startsWith("--") ? args[0] : "log";
  const flagArgs = command === "log" ? args : args.slice(1);
  return { command, flags: parseFlags(flagArgs) };
}

function parseFlags(args: string[]) {
  const flags: Flags = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const key = flagMap[arg];

    if (!key) {
      throw new Error(`Unknown flag: ${arg}`);
    }

    const next = args[index + 1];

    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }

    flags[key] = next;
    index += 1;
  }

  return flags;
}

function stringValue(flags: Flags, key: string, fallback?: string) {
  const value = flags[key];

  if (typeof value === "string") {
    return value;
  }

  return fallback;
}

function requireValue(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }

  return value;
}

function parseMetadata(value: string | undefined) {
  if (!value) {
    return {};
  }

  const parsed: unknown = JSON.parse(value);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("--metadata must be a JSON object");
  }

  return parsed as Record<string, unknown>;
}

function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseLabels(value: string | undefined) {
  if (!value) {
    return [];
  }

  const values = value.trim().startsWith("[")
    ? (() => {
        const parsed: unknown = JSON.parse(value);

        if (!Array.isArray(parsed)) {
          throw new Error("--labels JSON must be an array of strings");
        }

        return parsed.map((entry) => {
          if (typeof entry !== "string") {
            throw new Error("--labels JSON array must contain only strings");
          }

          return entry;
        });
      })()
    : value.split(",");

  return Array.from(
    new Set(values.map((entry) => normalizeLabel(entry)).filter(Boolean)),
  );
}

function hasSessionFlags(flags: Flags) {
  return Boolean(
    flags.sessionId ||
      flags.sessionTitle ||
      flags.sessionStatus ||
      flags.sessionSummary,
  );
}

function emptyRegistry(): ProjectRegistry {
  return { projects: {} };
}

async function readRegistry(path = defaultRegistryPath()) {
  try {
    const raw = await readFile(path, "utf8");
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || !("projects" in parsed)) {
      throw new Error(`Invalid project registry: ${path}`);
    }

    return parsed as ProjectRegistry;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyRegistry();
    }

    throw error;
  }
}

async function writeRegistry(registry: ProjectRegistry, path = defaultRegistryPath()) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(`${path}.tmp`, `${JSON.stringify(registry, null, 2)}\n`);
  await rename(`${path}.tmp`, path);
}

function normalizePath(path: string) {
  return resolve(path);
}

function findRegistryEntry(registry: ProjectRegistry, cwd: string) {
  const normalizedCwd = normalizePath(cwd);

  return Object.entries(registry.projects)
    .map(([registeredPath, entry]) => ({
      registeredPath: normalizePath(registeredPath),
      entry,
    }))
    .filter(
      ({ registeredPath }) =>
        normalizedCwd === registeredPath ||
        normalizedCwd.startsWith(`${registeredPath}/`),
    )
    .sort((a, b) => b.registeredPath.length - a.registeredPath.length)[0];
}

function providerFromEntry(
  entry: RegistryEntry | undefined,
  flags: Flags,
): ProviderConfig | undefined {
  const providerKey =
    stringValue(flags, "provider") ??
    stringValue(flags, "sourceProvider") ??
    process.env.COMMAND_CENTER_SOURCE_PROVIDER ??
    entry?.defaultProvider;

  if (!providerKey) {
    return undefined;
  }

  return entry?.providers[providerKey];
}

function tokenFromProvider(provider: ProviderConfig | undefined) {
  if (process.env.COMMAND_CENTER_INGEST_TOKEN) {
    return process.env.COMMAND_CENTER_INGEST_TOKEN;
  }

  if (provider?.tokenEnv) {
    return process.env[provider.tokenEnv];
  }

  return undefined;
}

async function initProject(flags: Flags) {
  const registryPath = stringValue(flags, "registry", defaultRegistryPath());
  const registry = await readRegistry(registryPath);
  const cwd = normalizePath(stringValue(flags, "cwd", defaultWorkingDir()) ?? defaultWorkingDir());
  const projectSlug = requireValue("--project", stringValue(flags, "project"));
  const name = stringValue(flags, "name", projectSlug);
  const defaultProvider = stringValue(flags, "provider", "codex") ?? "codex";
  const codexTokenEnv = stringValue(flags, "codexTokenEnv");
  const claudeTokenEnv = stringValue(flags, "claudeTokenEnv");
  const tokenEnv = stringValue(flags, "tokenEnv");

  registry.projects[cwd] = {
    name: name ?? projectSlug,
    projectSlug,
    defaultProvider,
    providers: {
      codex: {
        source: "codex",
        sourceProvider: "codex",
        tokenEnv: codexTokenEnv ?? tokenEnv,
      },
      claude: {
        source: "claude",
        sourceProvider: "claude",
        tokenEnv: claudeTokenEnv,
      },
    },
  };

  await writeRegistry(registry, registryPath);
  console.log(`agent-log registry updated path=${cwd} project=${projectSlug}`);
}

async function listProjects(flags: Flags) {
  const registryPath = stringValue(flags, "registry", defaultRegistryPath());
  const registry = await readRegistry(registryPath);
  const entries = Object.entries(registry.projects);

  if (entries.length === 0) {
    console.log(`No projects registered at ${registryPath}`);
    return;
  }

  for (const [path, entry] of entries) {
    const providers = Object.entries(entry.providers)
      .map(([key, provider]) =>
        provider.tokenEnv ? `${key}:${provider.tokenEnv}` : `${key}:no-token-env`,
      )
      .join(",");
    console.log(
      `${entry.projectSlug}\t${entry.name}\t${path}\tdefault=${entry.defaultProvider}\tproviders=${providers}`,
    );
  }
}

async function doctor(flags: Flags) {
  const registryPath = stringValue(flags, "registry", defaultRegistryPath());
  const registry = await readRegistry(registryPath);
  const cwd = normalizePath(stringValue(flags, "cwd", defaultWorkingDir()) ?? defaultWorkingDir());
  const match = findRegistryEntry(registry, cwd);
  const provider = providerFromEntry(match?.entry, flags);
  const ingestUrl = process.env.COMMAND_CENTER_INGEST_URL;
  const token = tokenFromProvider(provider);

  console.log(`registry=${registryPath}`);
  console.log(`cwd=${cwd}`);

  if (!match) {
    throw new Error("No project registry entry matched this directory.");
  }

  console.log(`project=${match.entry.projectSlug}`);
  console.log(`matchedPath=${match.registeredPath}`);
  console.log(`provider=${provider?.sourceProvider ?? "missing"}`);
  console.log(`ingestUrl=${ingestUrl ? "configured" : "missing"}`);
  console.log(`token=${token ? "configured" : "missing"}`);

  if (!provider) {
    throw new Error("No provider config matched this directory.");
  }

  if (!ingestUrl || !token) {
    throw new Error("Missing ingest URL or provider token.");
  }
}

async function logEvent(flags: Flags) {
  const registry = await readRegistry(stringValue(flags, "registry"));
  const cwd = normalizePath(stringValue(flags, "cwd", defaultWorkingDir()) ?? defaultWorkingDir());
  const match = findRegistryEntry(registry, cwd);
  const entry = match?.entry;
  const provider = providerFromEntry(entry, flags);
  const ingestUrl = requireValue(
    "COMMAND_CENTER_INGEST_URL",
    process.env.COMMAND_CENTER_INGEST_URL,
  );
  const token = requireValue(
    "COMMAND_CENTER_INGEST_TOKEN or provider token env",
    tokenFromProvider(provider),
  );
  const projectSlug = requireValue(
    "--project, COMMAND_CENTER_PROJECT_SLUG, or registry mapping",
    stringValue(flags, "project", process.env.COMMAND_CENTER_PROJECT_SLUG) ??
      entry?.projectSlug,
  );
  const source = requireValue(
    "--source, COMMAND_CENTER_SOURCE, or registry provider source",
    stringValue(flags, "source", process.env.COMMAND_CENTER_SOURCE) ??
      provider?.source,
  );
  const sourceProvider = requireValue(
    "--source-provider, COMMAND_CENTER_SOURCE_PROVIDER, or registry provider",
    stringValue(
      flags,
      "sourceProvider",
      process.env.COMMAND_CENTER_SOURCE_PROVIDER,
    ) ?? provider?.sourceProvider,
  );
  const eventType = requireValue("--type", stringValue(flags, "type"));
  const title = requireValue("--title", stringValue(flags, "title"));
  const body = stringValue(flags, "body");
  const metadata = {
    cwd,
    ...(match ? { registeredPath: match.registeredPath } : {}),
    ...parseMetadata(stringValue(flags, "metadata")),
  };
  const workType = stringValue(flags, "workType", "general") ?? "general";
  const workLabels = parseLabels(stringValue(flags, "labels"));

  const payload: Record<string, unknown> = {
    token,
    projectSlug,
    source,
    sourceProvider,
    event: {
      type: eventType,
      title,
      body,
      workType,
      workLabels,
      metadata,
    },
  };

  if (hasSessionFlags(flags)) {
    payload.session = {
      externalSessionId: stringValue(flags, "sessionId"),
      title: stringValue(flags, "sessionTitle", title),
      status: stringValue(flags, "sessionStatus", "active"),
      workType,
      workLabels,
      summary: stringValue(flags, "sessionSummary"),
      metadata: { cwd },
    };
  }

  const response = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = (await response.json().catch(() => null)) as {
    ok?: boolean;
    eventId?: string;
    sessionId?: string | null;
    error?: string;
  } | null;

  if (!response.ok || !responseBody?.ok) {
    const error = responseBody?.error ?? response.statusText;
    throw new Error(`Ingest failed (${response.status}): ${error}`);
  }

  console.log(
    [
      "agent-log ok",
      `project=${projectSlug}`,
      `provider=${sourceProvider}`,
      `event=${responseBody.eventId}`,
      responseBody.sessionId ? `session=${responseBody.sessionId}` : null,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));

  if (command === "init-project") {
    await initProject(flags);
    return;
  }

  if (command === "projects") {
    await listProjects(flags);
    return;
  }

  if (command === "doctor") {
    await doctor(flags);
    return;
  }

  if (command !== "log") {
    throw new Error(`Unknown command: ${command}`);
  }

  await logEvent(flags);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`agent-log error: ${message}`);
  process.exitCode = 1;
});
