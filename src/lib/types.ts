export type MemberRole = "owner" | "editor" | "commenter" | "viewer";

export type EventType =
  | "agent_started"
  | "agent_heartbeat"
  | "agent_completed"
  | "search_run"
  | "code_changed"
  | "feature_started"
  | "feature_shipped"
  | "decision_logged"
  | "doc_created"
  | "doc_updated"
  | "deployment_shipped"
  | "manual_note";

export type FeatureStatus = "planned" | "in_progress" | "review" | "shipped";

export type JsonRecord = Record<string, unknown>;
export type WorkType = string;

export type Profile = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl?: string | null;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  mission: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  role?: MemberRole;
};

export type Agent = {
  id: string;
  projectId: string;
  name: string;
  provider: string;
  kind: string | null;
  createdAt: string;
};

export type AgentSession = {
  id: string;
  projectId: string;
  agentId: string | null;
  parentSessionId: string | null;
  actorUserId: string | null;
  externalSessionId: string | null;
  sourceProvider: string;
  title: string;
  status: string;
  workType: WorkType;
  workLabels: string[];
  summary: string | null;
  startedAt: string;
  lastHeartbeatAt: string | null;
  completedAt: string | null;
  metadata: JsonRecord;
};

export type ActivityEvent = {
  id: string;
  projectId: string;
  sessionId: string | null;
  actorUserId: string | null;
  actorName: string | null;
  type: EventType;
  title: string;
  body: string | null;
  source: string;
  sourceProvider: string;
  workType: WorkType;
  workLabels: string[];
  metadata: JsonRecord;
  createdAt: string;
  commentCount?: number;
};

export type Comment = {
  id: string;
  projectId: string;
  targetType: string;
  targetId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string | null;
};

export type Feature = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: FeatureStatus;
  labels?: string[];
  owner: string | null;
  shippedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Document = {
  id: string;
  projectId: string;
  title: string;
  kind: string;
  bodyMd: string | null;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Decision = {
  id: string;
  projectId: string;
  title: string;
  decision: string;
  rationale: string | null;
  status: string;
  createdAt: string;
};

export type ProjectWorkspace = {
  project: Project;
  agents: Agent[];
  sessions: AgentSession[];
  events: ActivityEvent[];
  comments: Comment[];
  features: Feature[];
  documents: Document[];
  decisions: Decision[];
};

export type ProjectSourceDirectory = {
  path: string;
  name: string;
  defaultProvider: string;
  providers: Array<{
    key: string;
    source: string;
    sourceProvider: string;
    tokenEnv: string | null;
    tokenConfigured: boolean;
  }>;
};

export type ProjectSourceProviderHealth = {
  key: string;
  source: string;
  sourceProvider: string;
  defaultProvider: boolean;
  mappedDirectories: number;
  tokenEnv: string | null;
  tokenConfigured: boolean;
  lastEventAt: string | null;
  lastHeartbeatAt: string | null;
  activeSessions: number;
};

export type ProjectSourceSetup = {
  projectSlug: string;
  directories: ProjectSourceDirectory[];
  providers: ProjectSourceProviderHealth[];
  registryPath: string | null;
};
