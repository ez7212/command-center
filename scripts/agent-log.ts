type Flags = Record<string, string | boolean>;

const flagMap: Record<string, string> = {
  "--project": "project",
  "--source": "source",
  "--source-provider": "sourceProvider",
  "--session-id": "sessionId",
  "--session-title": "sessionTitle",
  "--session-status": "sessionStatus",
  "--session-summary": "sessionSummary",
  "--type": "type",
  "--title": "title",
  "--body": "body",
  "--metadata": "metadata",
};

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

function hasSessionFlags(flags: Flags) {
  return Boolean(
    flags.sessionId ||
      flags.sessionTitle ||
      flags.sessionStatus ||
      flags.sessionSummary,
  );
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const ingestUrl = requireValue(
    "COMMAND_CENTER_INGEST_URL",
    process.env.COMMAND_CENTER_INGEST_URL,
  );
  const token = requireValue(
    "COMMAND_CENTER_INGEST_TOKEN",
    process.env.COMMAND_CENTER_INGEST_TOKEN,
  );
  const projectSlug = requireValue(
    "--project or COMMAND_CENTER_PROJECT_SLUG",
    stringValue(flags, "project", process.env.COMMAND_CENTER_PROJECT_SLUG),
  );
  const source = requireValue(
    "--source or COMMAND_CENTER_SOURCE",
    stringValue(flags, "source", process.env.COMMAND_CENTER_SOURCE),
  );
  const sourceProvider = requireValue(
    "--source-provider or COMMAND_CENTER_SOURCE_PROVIDER",
    stringValue(
      flags,
      "sourceProvider",
      process.env.COMMAND_CENTER_SOURCE_PROVIDER,
    ),
  );
  const eventType = requireValue("--type", stringValue(flags, "type"));
  const title = requireValue("--title", stringValue(flags, "title"));
  const body = stringValue(flags, "body");
  const metadata = parseMetadata(stringValue(flags, "metadata"));

  const payload: Record<string, unknown> = {
    token,
    projectSlug,
    source,
    sourceProvider,
    event: {
      type: eventType,
      title,
      body,
      metadata,
    },
  };

  if (hasSessionFlags(flags)) {
    payload.session = {
      externalSessionId: stringValue(flags, "sessionId"),
      title: stringValue(flags, "sessionTitle", title),
      status: stringValue(flags, "sessionStatus", "active"),
      summary: stringValue(flags, "sessionSummary"),
      metadata: {},
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
      `event=${responseBody.eventId}`,
      responseBody.sessionId ? `session=${responseBody.sessionId}` : null,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`agent-log error: ${message}`);
  process.exitCode = 1;
});
