import type { Document, Feature, Project } from "@/lib/types";

function syntheticDocument({
  bodyMd,
  kind,
  project,
  title,
}: {
  bodyMd: string;
  kind: string;
  project: Project;
  title: string;
}): Document {
  return {
    id: `${project.id}-${kind}`,
    projectId: project.id,
    title,
    kind,
    bodyMd,
    externalUrl: null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function featureList(features: Feature[], status: Feature["status"]) {
  const items = features.filter((feature) => feature.status === status);

  if (items.length === 0) {
    return "- None yet.";
  }

  return items
    .map((feature) => {
      const owner = feature.owner ? ` Owner: ${feature.owner}.` : "";
      return `- ${feature.title}: ${feature.description ?? "No description."}${owner}`;
    })
    .join("\n");
}

export function projectBriefDocuments(project: Project, documents: Document[]) {
  const briefDocs = documents.filter(
    (document) =>
      document.kind === "project_brief" ||
      document.title.toLowerCase().includes("project brief"),
  );

  if (briefDocs.length > 0) {
    return briefDocs;
  }

  return [
    syntheticDocument({
      bodyMd: [
        `# ${project.name} Project Brief`,
        "",
        "## Mission",
        project.mission ?? "No mission has been written yet.",
        "",
        "## Description",
        project.description ?? "No description has been written yet.",
      ].join("\n"),
      kind: "project_brief",
      project,
      title: `${project.name} Project Brief`,
    }),
  ];
}

export function backlogDocuments(
  project: Project,
  documents: Document[],
  features: Feature[],
) {
  const backlogDocs = documents.filter(
    (document) =>
      document.kind === "backlog" ||
      document.title.toLowerCase().includes("backlog"),
  );

  if (backlogDocs.length > 0) {
    return backlogDocs;
  }

  return [
    syntheticDocument({
      bodyMd: [
        `# ${project.name} Backlog`,
        "",
        "## Completed",
        featureList(features, "shipped"),
        "",
        "## Ongoing",
        featureList(features, "in_progress"),
        "",
        "## Review",
        featureList(features, "review"),
        "",
        "## Backlog",
        featureList(features, "planned"),
      ].join("\n"),
      kind: "backlog",
      project,
      title: `${project.name} Backlog`,
    }),
  ];
}

export function generalDocuments(documents: Document[]) {
  return documents.filter(
    (document) =>
      document.kind !== "project_brief" && document.kind !== "backlog",
  );
}
