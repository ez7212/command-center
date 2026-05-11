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
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <MessageSquareText size={16} />
        <h2 className="text-sm font-semibold">Comments</h2>
        <span className="text-xs text-stone-500">{scopedComments.length}</span>
      </div>
      {scopedComments.length > 0 ? (
        <div className="mt-3 space-y-3">
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
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-stone-300 bg-stone-50 p-3 text-sm text-stone-500">
          No comments yet.
        </div>
      )}
      <form action={createComment} className="mt-4 space-y-2">
        <input name="projectId" type="hidden" value={project.id} />
        <input name="projectSlug" type="hidden" value={project.slug} />
        <input name="targetType" type="hidden" value={targetType} />
        <input name="targetId" type="hidden" value={targetId} />
        <input name="path" type="hidden" value={path} />
        <label className="block text-sm font-medium text-stone-700">
          Add comment
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900"
            maxLength={2000}
            name="body"
            placeholder="Write a comment for Eric..."
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
    </section>
  );
}
