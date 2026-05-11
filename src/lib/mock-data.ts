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
    id: "11111111-1111-4111-8111-111111111111",
    name: "Dalya",
    slug: "dalya",
    description: "Workflow visibility for Eric's active product work.",
    mission:
      "Make Eric's work visible to David without requiring David-owned telemetry in v0.",
    createdBy: mockProfiles[0].id,
    createdAt: "2026-05-12T06:00:00.000Z",
    updatedAt: now,
    role: "owner",
  },
];

export const mockAgents: Agent[] = [
  {
    id: "22222222-2222-4222-8222-222222222221",
    projectId: mockProjects[0].id,
    name: "Codex",
    provider: "codex",
    kind: "coding-agent",
    createdAt: "2026-05-12T06:10:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    projectId: mockProjects[0].id,
    name: "Claude Code",
    provider: "claude",
    kind: "coding-agent",
    createdAt: "2026-05-12T06:15:00.000Z",
  },
];

export const mockSessions: AgentSession[] = [
  {
    id: "33333333-3333-4333-8333-333333333331",
    projectId: mockProjects[0].id,
    agentId: mockAgents[0].id,
    parentSessionId: null,
    actorUserId: mockProfiles[0].id,
    externalSessionId: "codex-dalya-001",
    sourceProvider: "codex",
    title: "Build command center MVP",
    status: "active",
    summary: "Implementing schema, ingest API, CLI, and dashboard shell.",
    startedAt: "2026-05-12T06:30:00.000Z",
    lastHeartbeatAt: "2026-05-12T07:55:00.000Z",
    completedAt: null,
    metadata: { branch: "main" },
  },
  {
    id: "33333333-3333-4333-8333-333333333332",
    projectId: mockProjects[0].id,
    agentId: mockAgents[1].id,
    parentSessionId: "33333333-3333-4333-8333-333333333331",
    actorUserId: mockProfiles[0].id,
    externalSessionId: "claude-research-001",
    sourceProvider: "claude",
    title: "Review dashboard information architecture",
    status: "completed",
    summary: "Checked dashboard page structure and data model boundaries.",
    startedAt: "2026-05-12T06:45:00.000Z",
    lastHeartbeatAt: "2026-05-12T07:10:00.000Z",
    completedAt: "2026-05-12T07:12:00.000Z",
    metadata: {},
  },
];

export const mockEvents: ActivityEvent[] = [
  {
    id: "44444444-4444-4444-8444-444444444441",
    projectId: mockProjects[0].id,
    sessionId: mockSessions[0].id,
    actorUserId: mockProfiles[0].id,
    actorName: "Eric",
    type: "agent_started",
    title: "Started Codex session",
    body: "Beginning implementation of the Eric-to-David command center.",
    source: "codex",
    sourceProvider: "codex",
    metadata: { checkpoint: "schema" },
    createdAt: "2026-05-12T06:30:00.000Z",
    commentCount: 1,
  },
  {
    id: "44444444-4444-4444-8444-444444444442",
    projectId: mockProjects[0].id,
    sessionId: mockSessions[0].id,
    actorUserId: mockProfiles[0].id,
    actorName: "Eric",
    type: "code_changed",
    title: "Added schema and RLS migration",
    body: "Created project tables, David commenter policies, and ingest token boundaries.",
    source: "codex",
    sourceProvider: "codex",
    metadata: {
      files: ["supabase/migrations/20260512000100_v0_schema_and_rls.sql"],
    },
    createdAt: "2026-05-12T07:05:00.000Z",
    commentCount: 0,
  },
  {
    id: "44444444-4444-4444-8444-444444444443",
    projectId: mockProjects[0].id,
    sessionId: mockSessions[1].id,
    actorUserId: mockProfiles[0].id,
    actorName: "Eric",
    type: "decision_logged",
    title: "Scoped David to dashboard use only",
    body: "David can read and comment, but v0 does not ingest David-owned telemetry.",
    source: "manual",
    sourceProvider: "manual",
    metadata: {},
    createdAt: "2026-05-12T07:20:00.000Z",
    commentCount: 2,
  },
];

export const mockComments: Comment[] = [
  {
    id: "55555555-5555-4555-8555-555555555551",
    projectId: mockProjects[0].id,
    targetType: "event",
    targetId: mockEvents[0].id,
    authorId: mockProfiles[1].id,
    authorName: "David",
    body: "This is the right level of visibility for v0.",
    createdAt: "2026-05-12T06:40:00.000Z",
    updatedAt: null,
  },
  {
    id: "55555555-5555-4555-8555-555555555552",
    projectId: mockProjects[0].id,
    targetType: "decision",
    targetId: "88888888-8888-4888-8888-888888888881",
    authorId: mockProfiles[1].id,
    authorName: "David",
    body: "Keeping this read/comment-only makes the dashboard easy to trust.",
    createdAt: "2026-05-12T07:35:00.000Z",
    updatedAt: null,
  },
];

export const mockFeatures: Feature[] = [
  {
    id: "66666666-6666-4666-8666-666666666661",
    projectId: mockProjects[0].id,
    title: "David commenter RLS",
    description: "David can read project content and add comments without editing core records.",
    status: "shipped",
    owner: "Eric",
    shippedAt: "2026-05-12T07:08:00.000Z",
    createdAt: "2026-05-12T06:00:00.000Z",
    updatedAt: "2026-05-12T07:08:00.000Z",
  },
  {
    id: "66666666-6666-4666-8666-666666666662",
    projectId: mockProjects[0].id,
    title: "Eric telemetry ingest",
    description: "Accept Codex and Claude Code events through a project token.",
    status: "in_progress",
    owner: "Eric",
    shippedAt: null,
    createdAt: "2026-05-12T06:05:00.000Z",
    updatedAt: "2026-05-12T07:40:00.000Z",
  },
  {
    id: "66666666-6666-4666-8666-666666666663",
    projectId: mockProjects[0].id,
    title: "Command center dashboard",
    description: "Project overview, activity, sessions, features, documents, and decisions.",
    status: "planned",
    owner: "Eric",
    shippedAt: null,
    createdAt: "2026-05-12T06:10:00.000Z",
    updatedAt: "2026-05-12T07:30:00.000Z",
  },
];

export const mockDocuments: Document[] = [
  {
    id: "77777777-7777-4777-8777-777777777771",
    projectId: mockProjects[0].id,
    title: "Dalya Mission",
    kind: "mission",
    bodyMd: "Make Eric's work visible to David with a low-friction command center.",
    externalUrl: null,
    createdAt: "2026-05-12T06:05:00.000Z",
    updatedAt: "2026-05-12T06:05:00.000Z",
  },
  {
    id: "77777777-7777-4777-8777-777777777772",
    projectId: mockProjects[0].id,
    title: "v0 Scope Notes",
    kind: "strategy",
    bodyMd: "Eric is the only telemetry source. David is dashboard read/comment-only.",
    externalUrl: null,
    createdAt: "2026-05-12T06:20:00.000Z",
    updatedAt: "2026-05-12T06:20:00.000Z",
  },
];

export const mockDecisions: Decision[] = [
  {
    id: "88888888-8888-4888-8888-888888888881",
    projectId: mockProjects[0].id,
    title: "No David-owned telemetry in v0",
    decision:
      "David can use the dashboard but cannot link Codex or Claude Code sessions yet.",
    rationale:
      "The first version should prove visibility and commenting before adding multi-source telemetry.",
    status: "active",
    createdAt: "2026-05-12T06:25:00.000Z",
  },
  {
    id: "88888888-8888-4888-8888-888888888882",
    projectId: mockProjects[0].id,
    title: "Use Supabase RLS as permission boundary",
    decision:
      "Browser-side data access is acceptable when table policies enforce membership and role boundaries.",
    rationale:
      "This keeps the app simple while preserving David's read/comment-only access.",
    status: "active",
    createdAt: "2026-05-12T06:35:00.000Z",
  },
];

export const mockWorkspace: ProjectWorkspace = {
  project: mockProjects[0],
  agents: mockAgents,
  sessions: mockSessions,
  events: mockEvents,
  comments: mockComments,
  features: mockFeatures,
  documents: mockDocuments,
  decisions: mockDecisions,
};

export function getMockWorkspace(projectSlug = "dalya") {
  if (projectSlug !== mockWorkspace.project.slug) {
    return null;
  }

  return mockWorkspace;
}
