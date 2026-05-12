import type {
  ActivityEvent,
  Agent,
  AgentSession,
  Comment,
  Decision,
  Document,
  Feature,
  Profile,
  Project,
  ProjectWorkspace,
} from "@/lib/types";

const sharedMission =
  "Build a shared read/comment observability dashboard where Eric and David can track progress across projects, including agent sessions, activity, features, docs, and decisions, without giving commenter roles edit access to core content.";

export const mockProfiles: Profile[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    email: "ericzhu0702@gmail.com",
    fullName: "Eric Zhu",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    email: "zzdd3125@gmail.com",
    fullName: "David",
  },
];

const now = "2026-05-12T08:00:00.000Z";

export const mockProjects: Project[] = [
  {
    id: "11111111-1111-4111-8111-111111111110",
    name: "Command Center",
    slug: "command-center",
    description: "Shared progress observability dashboard for our work.",
    mission: sharedMission,
    createdBy: mockProfiles[0].id,
    createdAt: "2026-05-12T06:00:00.000Z",
    updatedAt: now,
    role: "commenter",
  },
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Dalya",
    slug: "dalya",
    description:
      "Build AI software that helps real estate brokerages operate with better speed, visibility, and client follow-through.",
    mission:
      "Build AI software that helps real estate brokerages operate with better speed, visibility, and client follow-through.",
    createdBy: mockProfiles[0].id,
    createdAt: "2026-05-12T06:05:00.000Z",
    updatedAt: now,
    role: "commenter",
  },
  {
    id: "11111111-1111-4111-8111-111111111112",
    name: "Buriza",
    slug: "buriza",
    description: "Liquidity management for UAE businesses.",
    mission:
      "Help UAE businesses manage liquidity, cash timing, and working capital decisions with clearer operating visibility.",
    createdBy: mockProfiles[0].id,
    createdAt: "2026-05-12T06:10:00.000Z",
    updatedAt: now,
    role: "commenter",
  },
  {
    id: "11111111-1111-4111-8111-111111111113",
    name: "Zaya Life",
    slug: "zaya-life",
    description: "UAE-licensed surrogacy clinic.",
    mission:
      "Build a trusted UAE-licensed surrogacy clinic experience across research, patient education, operations, and distribution.",
    createdBy: mockProfiles[0].id,
    createdAt: "2026-05-12T06:15:00.000Z",
    updatedAt: now,
    role: "commenter",
  },
];

const providerNames = {
  codex: "Codex",
  claude: "Claude Code",
} as const;

export const mockAgents: Agent[] = mockProjects.flatMap((project, projectIndex) =>
  (["codex", "claude"] as const).map((provider, providerIndex) => ({
    id: `22222222-2222-4222-8222-22222222${projectIndex}${providerIndex}00`,
    projectId: project.id,
    name: providerNames[provider],
    provider,
    kind: "coding-agent",
    createdAt: "2026-05-12T06:10:00.000Z",
  })),
);

function agentFor(project: Project, provider: "codex" | "claude") {
  const agent = mockAgents.find(
    (candidate) =>
      candidate.projectId === project.id && candidate.provider === provider,
  );

  if (!agent) {
    throw new Error(`Missing mock agent for ${project.slug}:${provider}`);
  }

  return agent;
}

export const mockSessions: AgentSession[] = mockProjects.flatMap(
  (project, projectIndex) => {
    const codexSessionId = `33333333-3333-4333-8333-33333333${projectIndex}100`;
    return [
      {
        id: codexSessionId,
        projectId: project.id,
        agentId: agentFor(project, "codex").id,
        parentSessionId: null,
        actorUserId: mockProfiles[0].id,
        externalSessionId: `codex-${project.slug}-001`,
        sourceProvider: "codex",
        title: `Work on ${project.name}`,
        status: project.slug === "command-center" ? "active" : "completed",
        workType: project.slug === "command-center" ? "coding" : "product",
        workLabels:
          project.slug === "command-center"
            ? ["dashboard", "observability"]
            : project.slug === "dalya"
              ? ["brokerage", "ai-workflow"]
              : project.slug === "buriza"
                ? ["website", "liquidity"]
                : ["website", "patient-education"],
        summary: `Codex session tracking implementation progress for ${project.name}.`,
        startedAt: "2026-05-12T06:30:00.000Z",
        lastHeartbeatAt: project.slug === "command-center" ? now : "2026-05-12T07:10:00.000Z",
        completedAt: project.slug === "command-center" ? null : "2026-05-12T07:15:00.000Z",
        metadata: {
          localProject:
            project.slug === "command-center"
              ? "/Users/eric/command-center"
              : null,
        },
      },
      {
        id: `33333333-3333-4333-8333-33333333${projectIndex}200`,
        projectId: project.id,
        agentId: agentFor(project, "claude").id,
        parentSessionId: codexSessionId,
        actorUserId: mockProfiles[0].id,
        externalSessionId: `claude-${project.slug}-001`,
        sourceProvider: "claude",
        title: `Research and review ${project.name}`,
        status: "completed",
        workType:
          project.slug === "buriza"
            ? "marketing"
            : project.slug === "zaya-life"
              ? "research"
              : "research",
        workLabels:
          project.slug === "command-center"
            ? ["backlog", "workflow"]
            : project.slug === "dalya"
              ? ["positioning", "brokerage"]
              : project.slug === "buriza"
                ? ["messaging", "distribution"]
                : ["research", "trust"],
        summary: `Claude Code session for research, review, and project context on ${project.name}.`,
        startedAt: "2026-05-12T06:45:00.000Z",
        lastHeartbeatAt: "2026-05-12T07:10:00.000Z",
        completedAt: "2026-05-12T07:12:00.000Z",
        metadata: {},
      },
    ];
  },
);

function firstSession(project: Project) {
  const session = mockSessions.find((candidate) => candidate.projectId === project.id);

  if (!session) {
    throw new Error(`Missing mock session for ${project.slug}`);
  }

  return session;
}

const eventByProject: Record<
  string,
  Pick<
    ActivityEvent,
    "type" | "title" | "body" | "metadata" | "workType" | "workLabels"
  >[]
> = {
  "command-center": [
    {
      type: "code_changed",
      title: "Added local project registry backlog",
      body: "Captured multi-directory project sync and agentic dashboard roadmap.",
      workType: "coding",
      workLabels: ["dashboard", "registry"],
      metadata: { files: ["docs/BACKLOG.md", "scripts/agent-log.ts"] },
    },
    {
      type: "decision_logged",
      title: "Frame dashboard as shared progress",
      body: "Updated product language away from one-way visibility toward co-work progress.",
      workType: "strategy",
      workLabels: ["messaging", "workflow"],
      metadata: {},
    },
  ],
  dalya: [
    {
      type: "manual_note",
      title: "Defined brokerage AI positioning",
      body: "Dalya is focused on AI software for real estate brokerages.",
      workType: "marketing",
      workLabels: ["positioning", "brokerage"],
      metadata: { localPath: "/Users/eric/dalya-ai" },
    },
    {
      type: "search_run",
      title: "Reviewed brokerage workflow opportunities",
      body: "Mapped candidate workflows for agents, managers, and client follow-up.",
      workType: "research",
      workLabels: ["workflow", "brokerage"],
      metadata: { workstream: "product" },
    },
  ],
  buriza: [
    {
      type: "manual_note",
      title: "Clarified UAE liquidity management angle",
      body: "Buriza is focused on cash timing and liquidity management for UAE businesses.",
      workType: "strategy",
      workLabels: ["liquidity", "uae"],
      metadata: { localPath: "/Users/eric/buriza-website" },
    },
    {
      type: "doc_created",
      title: "Started liquidity messaging notes",
      body: "Created initial notes for business pain points, positioning, and distribution.",
      workType: "marketing",
      workLabels: ["distribution", "messaging"],
      metadata: { workstream: "marketing" },
    },
  ],
  "zaya-life": [
    {
      type: "manual_note",
      title: "Connected clinic site and research work",
      body: "Zaya Life spans surrogacy-site and surrogacy-website-research local directories.",
      workType: "operations",
      workLabels: ["site", "research"],
      metadata: {
        localPaths: [
          "/Users/eric/surrogacy-site",
          "/Users/eric/surrogacy-website-research",
        ],
      },
    },
    {
      type: "doc_updated",
      title: "Expanded research and patient education notes",
      body: "Tracked clinic research alongside public-facing site work.",
      workType: "research",
      workLabels: ["patient-education", "trust"],
      metadata: { workstream: "research" },
    },
  ],
};

export const mockEvents: ActivityEvent[] = mockProjects.flatMap((project, projectIndex) =>
  eventByProject[project.slug].map((event, eventIndex) => ({
    id: `44444444-4444-4444-8444-44444444${projectIndex}${eventIndex}00`,
    projectId: project.id,
    sessionId: firstSession(project).id,
    actorUserId: mockProfiles[0].id,
    actorName: "Eric",
    type: event.type,
    title: event.title,
    body: event.body,
    source: eventIndex === 0 ? "manual" : "codex",
    sourceProvider: eventIndex === 0 ? "manual" : "codex",
    workType: event.workType,
    workLabels: event.workLabels,
    metadata: event.metadata,
    createdAt:
      eventIndex === 0 ? "2026-05-12T07:05:00.000Z" : "2026-05-12T07:25:00.000Z",
    commentCount: project.slug === "command-center" && eventIndex === 0 ? 1 : 0,
  })),
);

export const mockComments: Comment[] = [
  {
    id: "55555555-5555-4555-8555-555555555551",
    projectId: mockProjects[0].id,
    targetType: "event",
    targetId: mockEvents[0].id,
    authorId: mockProfiles[1].id,
    authorName: "David",
    body: "This is the right level of shared visibility for v0.",
    createdAt: "2026-05-12T07:35:00.000Z",
    updatedAt: null,
  },
];

const featureByProject: Record<
  string,
  Pick<Feature, "title" | "description" | "status" | "labels">[]
> = {
  "command-center": [
    {
      title: "Activity logging automation",
      description:
        "Use per-project instruction files and activity-log to capture meaningful future work.",
      status: "shipped",
      labels: ["automation", "logging"],
    },
    {
      title: "Supabase production setup",
      description:
        "Configure database credentials, run migrations, seed users/projects, and create ingest tokens.",
      status: "in_progress",
      labels: ["database", "setup"],
    },
    {
      title: "Project task boards",
      description:
        "Create Trello-style project task views with details and comments.",
      status: "review",
      labels: ["dashboard", "workflow"],
    },
    {
      title: "Agentic overview",
      description:
        "Surface health, stale work, open review, and next actions across projects.",
      status: "planned",
      labels: ["agentic-view", "review"],
    },
    {
      title: "Recurring workflow automation",
      description:
        "Promote repeated event patterns into hooks, watchers, or scheduled sync jobs.",
      status: "planned",
      labels: ["automation", "backlog"],
    },
  ],
  dalya: [
    {
      title: "Brokerage workflow map",
      description: "Identify the highest-value AI workflow for real estate brokerages.",
      status: "in_progress",
      labels: ["research", "brokerage"],
    },
    {
      title: "Chatbot QA history reconstruction",
      description:
        "Maintain detailed run-level history for persona tests, fixes, failures, and outcomes.",
      status: "shipped",
      labels: ["testing", "chatbot"],
    },
    {
      title: "CRM and dashboard workflow",
      description:
        "Clarify operator CRM flows, lead visibility, and brokerage follow-up tasks.",
      status: "planned",
      labels: ["crm", "operations"],
    },
    {
      title: "Website and positioning refresh",
      description:
        "Turn brokerage AI positioning into public-facing site copy and product narrative.",
      status: "planned",
      labels: ["marketing", "website"],
    },
    {
      title: "Distribution plan",
      description:
        "Build a repeatable go-to-market plan for brokerage outreach and pilot customers.",
      status: "planned",
      labels: ["distribution", "sales"],
    },
  ],
  buriza: [
    {
      title: "Liquidity landing page",
      description: "Explain liquidity management for UAE business operators.",
      status: "shipped",
      labels: ["website", "messaging"],
    },
    {
      title: "Executive brief refinement",
      description:
        "Translate the executive brief into sharper buyer pains, outcomes, and proof points.",
      status: "in_progress",
      labels: ["strategy", "copy"],
    },
    {
      title: "Distribution channels",
      description:
        "Identify UAE business audiences, outreach channels, and first test campaigns.",
      status: "planned",
      labels: ["distribution", "marketing"],
    },
    {
      title: "Liquidity workflow model",
      description:
        "Define the operational workflows Buriza should track beyond the website.",
      status: "planned",
      labels: ["product", "operations"],
    },
  ],
  "zaya-life": [
    {
      title: "Clinic trust narrative",
      description: "Connect UAE licensing, patient education, and research-backed positioning.",
      status: "in_progress",
      labels: ["trust", "positioning"],
    },
    {
      title: "Website responsiveness fixes",
      description:
        "Keep the public site mobile-friendly and aligned with clinic credibility.",
      status: "shipped",
      labels: ["website", "mobile"],
    },
    {
      title: "Research evidence base",
      description:
        "Maintain surrogacy market research, references, and patient education inputs.",
      status: "in_progress",
      labels: ["research", "education"],
    },
    {
      title: "Patient intake workflow",
      description:
        "Define the intake flow, questions, triage logic, and follow-up operations.",
      status: "planned",
      labels: ["operations", "intake"],
    },
    {
      title: "Distribution and ads plan",
      description:
        "Plan ethical distribution, search intent, paid channels, and clinic referral paths.",
      status: "planned",
      labels: ["distribution", "ads"],
    },
  ],
};

export const mockFeatures: Feature[] = mockProjects.flatMap((project, projectIndex) =>
  featureByProject[project.slug].map((feature, featureIndex) => ({
    id: `66666666-6666-4666-8666-66666666${projectIndex}${featureIndex}00`,
    projectId: project.id,
    title: feature.title,
    description: feature.description,
    status: feature.status,
    labels: feature.labels,
    owner: "Eric",
    shippedAt: feature.status === "shipped" ? "2026-05-12T07:08:00.000Z" : null,
    createdAt: "2026-05-12T06:05:00.000Z",
    updatedAt: now,
  })),
);

export const mockDocuments: Document[] = mockProjects.flatMap((project, projectIndex) => [
  {
    id: `77777777-7777-4777-8777-77777777${projectIndex}100`,
    projectId: project.id,
    title: `${project.name} Mission`,
    kind: "mission",
    bodyMd: project.mission,
    externalUrl: null,
    createdAt: "2026-05-12T06:05:00.000Z",
    updatedAt: "2026-05-12T06:05:00.000Z",
  },
  {
    id: `77777777-7777-4777-8777-77777777${projectIndex}200`,
    projectId: project.id,
    title: `${project.name} Local Setup`,
    kind: "strategy",
    bodyMd:
      project.slug === "zaya-life"
        ? "Track both /Users/eric/surrogacy-site and /Users/eric/surrogacy-website-research under Zaya Life."
        : `Track local work for ${project.name} through Codex and Claude Code events.`,
    externalUrl: null,
    createdAt: "2026-05-12T06:20:00.000Z",
    updatedAt: "2026-05-12T06:20:00.000Z",
  },
]);

export const mockDecisions: Decision[] = mockProjects.map((project, projectIndex) => ({
  id: `88888888-8888-4888-8888-88888888${projectIndex}100`,
  projectId: project.id,
  title: `${project.name} tracking scope`,
  decision:
    project.slug === "command-center"
      ? "Use Command Center as the shared observability layer for all active projects."
      : `Track ${project.name} as a first-class project with Codex and Claude Code sources.`,
  rationale:
    "Project-specific routing makes the dashboard useful across parallel workstreams without mixing context.",
  status: "active",
  createdAt: "2026-05-12T06:25:00.000Z",
}));

export function getMockWorkspace(projectSlug = "command-center") {
  const project = mockProjects.find((candidate) => candidate.slug === projectSlug);

  if (!project) {
    return null;
  }

  return {
    project,
    agents: mockAgents.filter((agent) => agent.projectId === project.id),
    sessions: mockSessions.filter((session) => session.projectId === project.id),
    events: mockEvents.filter((event) => event.projectId === project.id),
    comments: mockComments.filter((comment) => comment.projectId === project.id),
    features: mockFeatures.filter((feature) => feature.projectId === project.id),
    documents: mockDocuments.filter((document) => document.projectId === project.id),
    decisions: mockDecisions.filter((decision) => decision.projectId === project.id),
  } satisfies ProjectWorkspace;
}

export const mockWorkspace = getMockWorkspace("command-center") as ProjectWorkspace;

export function addMockComment(input: {
  projectId: string;
  targetType: string;
  targetId: string;
  authorId: string;
  authorName: string;
  body: string;
}) {
  mockComments.unshift({
    id: crypto.randomUUID(),
    projectId: input.projectId,
    targetType: input.targetType,
    targetId: input.targetId,
    authorId: input.authorId,
    authorName: input.authorName,
    body: input.body,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  });
}

export function addMockEvent(input: {
  projectId: string;
  sessionId?: string | null;
  actorUserId: string;
  actorName: string;
  type: ActivityEvent["type"];
  title: string;
  body?: string | null;
  source?: string;
  sourceProvider?: string;
  workType: string;
  workLabels: string[];
  metadata?: Record<string, unknown>;
}) {
  mockEvents.unshift({
    id: crypto.randomUUID(),
    projectId: input.projectId,
    sessionId: input.sessionId ?? null,
    actorUserId: input.actorUserId,
    actorName: input.actorName,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    source: input.source ?? "manual",
    sourceProvider: input.sourceProvider ?? "manual",
    workType: input.workType,
    workLabels: input.workLabels,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
    commentCount: 0,
  });
}
