import { ProjectHeader } from "@/components/project-header";
import { ProjectRail } from "@/components/project-rail";
import {
  getCurrentUserProjects,
  getProjectWorkspace,
} from "@/lib/projects";

type ProjectLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { projectSlug } = await params;
  const [projects, workspace] = await Promise.all([
    getCurrentUserProjects(),
    getProjectWorkspace(projectSlug),
  ]);
  const currentProject =
    projects.find((project) => project.id === workspace.project.id) ??
    workspace.project;

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col md:flex-row">
      <ProjectRail currentProject={currentProject} projects={projects} />
      <div className="min-w-0 flex-1">
        <ProjectHeader project={workspace.project} role={currentProject.role} />
        {children}
      </div>
    </div>
  );
}
