import { ExternalLink } from "lucide-react";

import { CommentThread } from "@/components/comment-thread";
import { EmptyState } from "@/components/empty-state";
import { shortDate } from "@/lib/format";
import type { Comment, Document, Project } from "@/lib/types";

export function DocumentList({
  documents,
  comments,
  project,
  path,
}: {
  documents: Document[];
  comments: Comment[];
  project: Project;
  path: string;
}) {
  if (documents.length === 0) {
    return <EmptyState title="No documents yet" />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {documents.map((document) => (
        <div className="space-y-3" key={document.id}>
          <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-medium capitalize text-stone-600">
                {document.kind}
              </span>
              {document.externalUrl ? (
                <a
                  className="text-stone-500 hover:text-stone-950"
                  href={document.externalUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink size={16} />
                </a>
              ) : null}
            </div>
            <h2 className="mt-3 text-base font-semibold">{document.title}</h2>
            {document.bodyMd ? (
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">
                {document.bodyMd}
              </p>
            ) : null}
            <p className="mt-4 text-xs text-stone-500">
              Updated {shortDate(document.updatedAt)}
            </p>
          </article>
          <CommentThread
            comments={comments}
            path={path}
            project={project}
            targetId={document.id}
            targetType="document"
          />
        </div>
      ))}
    </div>
  );
}
