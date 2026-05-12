import { MessageSquareText } from "lucide-react";

import { createComment } from "@/lib/comments";
import { relativeTime } from "@/lib/format";
import type { Comment, Project } from "@/lib/types";

export function CommentThread({
  comments,
  project,
  targetType,
  targetId,
  path,
}: {
  comments: Comment[];
  project: Project;
  targetType: string;
  targetId: string;
  path: string;
}) {
  const scopedComments = comments.filter(
    (comment) =>
      comment.targetType === targetType && comment.targetId === targetId,
  );

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {scopedComments.length > 0 ? (
          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:border-stone-300 hover:text-stone-950 [&::-webkit-details-marker]:hidden">
              <MessageSquareText aria-hidden="true" size={14} />
              {scopedComments.length}
            </summary>
            <div className="mt-2 w-full min-w-72 space-y-2 rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
              {scopedComments.map((comment) => (
                <article className="rounded-md bg-stone-50 p-3" key={comment.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{comment.authorName}</p>
                    <p className="text-xs text-stone-500">
                      {relativeTime(comment.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {comment.body}
                  </p>
                </article>
              ))}
            </div>
          </details>
        ) : null}

        <details className="group">
          <summary className="inline-flex cursor-pointer list-none items-center rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:border-stone-300 hover:text-stone-950 [&::-webkit-details-marker]:hidden">
            Add comment
          </summary>
          <form
            action={createComment}
            className="mt-2 w-full min-w-72 space-y-2 rounded-lg border border-stone-200 bg-white p-3 shadow-sm"
          >
            <input name="projectId" type="hidden" value={project.id} />
            <input name="projectSlug" type="hidden" value={project.slug} />
            <input name="targetType" type="hidden" value={targetType} />
            <input name="targetId" type="hidden" value={targetId} />
            <input name="path" type="hidden" value={path} />
            <label className="block text-sm font-medium text-stone-700">
              Comment
              <textarea
                className="mt-2 min-h-24 w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900"
                maxLength={2000}
                name="body"
                placeholder="Write a comment..."
                required
              />
            </label>
            <button
              className="rounded-md bg-stone-950 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800"
              type="submit"
            >
              Post comment
            </button>
          </form>
        </details>
      </div>
    </section>
  );
}
