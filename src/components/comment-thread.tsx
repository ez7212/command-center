import { MessageSquareText } from "lucide-react";

import { relativeTime } from "@/lib/format";
import type { Comment } from "@/lib/types";

export function CommentThread({
  comments,
  targetType,
  targetId,
}: {
  comments: Comment[];
  targetType: string;
  targetId: string;
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
        <p className="mt-3 text-sm text-stone-500">No comments yet.</p>
      )}
    </section>
  );
}
