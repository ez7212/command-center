import "server-only";

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";

import type {
  ProjectSourceDirectory,
  ProjectSourceProviderHealth,
  ProjectSourceSetup,
  ProjectWorkspace,
} from "@/lib/types";

type ProviderConfig = {
  source?: string;
  sourceProvider?: string;
  tokenEnv?: string;
};

type RegistryEntry = {
  name?: string;
  projectSlug?: string;
  defaultProvider?: string;
  providers?: Record<string, ProviderConfig>;
};

type ProjectRegistry = {
  projects?: Record<string, RegistryEntry>;
};

export function defaultRegistryPath() {
  return (
    process.env.COMMAND_CENTER_PROJECT_REGISTRY ??
    resolve(homedir(), ".command-center/projects.json")
  );
}

async function readRegistry(path = defaultRegistryPath()) {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as ProjectRegistry;
    return parsed.projects ?? {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    console.error("Failed to read project registry", error);
    return null;
  }
}

export async function getProjectSourceSetup(
  projectSlug: string,
  workspace: ProjectWorkspace,
): Promise<ProjectSourceSetup> {
  const registryPath = defaultRegistryPath();
  const projects = await readRegistry(registryPath);
  const directories: ProjectSourceDirectory[] = [];

  if (projects) {
    for (const [path, entry] of Object.entries(projects)) {
      if (entry.projectSlug !== projectSlug) {
        continue;
      }

      const providers = Object.entries(entry.providers ?? {}).map(
        ([key, provider]) => ({
          key,
          source: provider.source ?? key,
          sourceProvider: provider.sourceProvider ?? key,
          tokenEnv: provider.tokenEnv ?? null,
          tokenConfigured: provider.tokenEnv
            ? Boolean(process.env[provider.tokenEnv])
            : false,
        }),
      );

      directories.push({
        path,
        name: entry.name ?? projectSlug,
        defaultProvider: entry.defaultProvider ?? "codex",
        providers,
      });
    }
  }

  const providerMap = new Map<string, ProjectSourceProviderHealth>();

  for (const directory of directories) {
    for (const provider of directory.providers) {
      if (!providerMap.has(provider.key)) {
        providerMap.set(provider.key, {
          key: provider.key,
          source: provider.source,
          sourceProvider: provider.sourceProvider,
          defaultProvider: directory.defaultProvider === provider.key,
          mappedDirectories: 0,
          tokenEnv: provider.tokenEnv,
          tokenConfigured: provider.tokenConfigured,
          lastEventAt: null,
          lastHeartbeatAt: null,
          activeSessions: 0,
        });
      }

      const current = providerMap.get(provider.key);

      if (!current) {
        continue;
      }

      current.mappedDirectories += 1;
      current.defaultProvider ||= directory.defaultProvider === provider.key;
      current.tokenConfigured ||= provider.tokenConfigured;
      current.tokenEnv ??= provider.tokenEnv;
    }
  }

  for (const session of workspace.sessions) {
    const key = session.sourceProvider;

    if (!providerMap.has(key)) {
      providerMap.set(key, {
        key,
        source: key,
        sourceProvider: key,
        defaultProvider: false,
        mappedDirectories: 0,
        tokenEnv: null,
        tokenConfigured: false,
        lastEventAt: null,
        lastHeartbeatAt: null,
        activeSessions: 0,
      });
    }

    const health = providerMap.get(key);

    if (!health) {
      continue;
    }

    if (session.status === "active") {
      health.activeSessions += 1;
    }

    if (
      session.lastHeartbeatAt &&
      (!health.lastHeartbeatAt ||
        session.lastHeartbeatAt > health.lastHeartbeatAt)
    ) {
      health.lastHeartbeatAt = session.lastHeartbeatAt;
    }
  }

  for (const event of workspace.events) {
    const key = event.sourceProvider;

    if (!providerMap.has(key)) {
      providerMap.set(key, {
        key,
        source: event.source,
        sourceProvider: key,
        defaultProvider: false,
        mappedDirectories: 0,
        tokenEnv: null,
        tokenConfigured: false,
        lastEventAt: null,
        lastHeartbeatAt: null,
        activeSessions: 0,
      });
    }

    const health = providerMap.get(key);

    if (!health) {
      continue;
    }

    if (!health.lastEventAt || event.createdAt > health.lastEventAt) {
      health.lastEventAt = event.createdAt;
    }
  }

  return {
    projectSlug,
    directories,
    providers: Array.from(providerMap.values()).sort((left, right) =>
      left.key.localeCompare(right.key),
    ),
    registryPath: projects ? registryPath : null,
  };
}
