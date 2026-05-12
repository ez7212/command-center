import { CommentThread } from "@/components/comment-thread";
import { EmptyState } from "@/components/empty-state";
import { shortDate } from "@/lib/format";
import type { Comment, Document, Project } from "@/lib/types";

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; text: string };

function flushParagraph(lines: string[], blocks: MarkdownBlock[]) {
  if (lines.length === 0) {
    return;
  }

  blocks.push({ type: "paragraph", text: lines.join(" ") });
  lines.length = 0;
}

function parseMarkdown(markdown: string) {
  const blocks: MarkdownBlock[] = [];
  const paragraph: string[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph(paragraph, blocks);
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph(paragraph, blocks);
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);

    if (heading) {
      flushParagraph(paragraph, blocks);
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2].trim(),
      });
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)$/);

    if (unordered) {
      flushParagraph(paragraph, blocks);
      const items = [unordered[1].trim()];

      while (index + 1 < lines.length) {
        const next = lines[index + 1].trim().match(/^[-*]\s+(.+)$/);

        if (!next) {
          break;
        }

        items.push(next[1].trim());
        index += 1;
      }

      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);

    if (ordered) {
      flushParagraph(paragraph, blocks);
      const items = [ordered[1].trim()];

      while (index + 1 < lines.length) {
        const next = lines[index + 1].trim().match(/^\d+[.)]\s+(.+)$/);

        if (!next) {
          break;
        }

        items.push(next[1].trim());
        index += 1;
      }

      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph(paragraph, blocks);
  return blocks;
}

function normalizeHeading(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function MarkdownReader({
  markdown,
  title,
}: {
  markdown: string;
  title: string;
}) {
  const parsedBlocks = parseMarkdown(markdown);
  const blocks =
    parsedBlocks[0]?.type === "heading" &&
    normalizeHeading(parsedBlocks[0].text) === normalizeHeading(title)
      ? parsedBlocks.slice(1)
      : parsedBlocks;

  return (
    <div className="space-y-5 text-stone-700">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "heading") {
          const className =
            block.level === 1
              ? "text-3xl font-semibold tracking-tight text-stone-950"
              : block.level === 2
                ? "border-t border-stone-200 pt-6 text-xl font-semibold tracking-tight text-stone-950"
                : "text-base font-semibold text-stone-950";

          const HeadingTag = `h${Math.min(block.level + 1, 4)}` as
            | "h2"
            | "h3"
            | "h4";

          return (
            <HeadingTag className={className} key={key}>
              {block.text}
            </HeadingTag>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          const listClassName = block.ordered
            ? "list-decimal space-y-2 pl-5 text-sm leading-7"
            : "list-disc space-y-2 pl-5 text-sm leading-7";

          return (
            <ListTag className={listClassName} key={key}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              className="overflow-auto rounded-md border border-stone-200 bg-stone-950 p-4 text-xs leading-6 text-stone-100"
              key={key}
            >
              {block.text}
            </pre>
          );
        }

        return (
          <p className="text-sm leading-7 text-stone-700" key={key}>
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

export function DocumentReader({
  comments,
  documents,
  emptyTitle,
  path,
  project,
}: {
  comments: Comment[];
  documents: Document[];
  emptyTitle: string;
  path: string;
  project: Project;
}) {
  if (documents.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }

  return (
    <div className="space-y-5">
      {documents.map((document) => (
        <article
          className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:p-7"
          key={document.id}
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                {document.kind.replace(/_/g, " ")}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {document.title}
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Updated {shortDate(document.updatedAt)}
            </p>
          </div>

          {document.bodyMd ? (
            <MarkdownReader markdown={document.bodyMd} title={document.title} />
          ) : (
            <EmptyState title="This document is empty" />
          )}

          <div className="mt-6 border-t border-stone-100 pt-4">
            <CommentThread
              comments={comments}
              path={path}
              project={project}
              targetId={document.id}
              targetType="document"
            />
          </div>
        </article>
      ))}
    </div>
  );
}
