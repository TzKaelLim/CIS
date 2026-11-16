import {
  renderJSONContentToReactElement,
  type MarkProps,
  type NodeProps,
} from "@tiptap/static-renderer/json/react";
import { createElement, type ReactNode } from "react";
import { isSafeHref } from "./is-safe-href";
import { extractText, isTextAlign, normalizeRichText } from "./normalize";
import type { RichTextMark, RichTextNode } from "./types";

type NodeRenderer = (
  props: NodeProps<RichTextNode, ReactNode | ReactNode[]>
) => ReactNode;

type MarkRenderer = (
  props: MarkProps<RichTextMark, ReactNode | ReactNode[], RichTextNode>
) => ReactNode;

// Holds one mark around a run of inline nodes. Created by groupMarks after
// normalization, so stored content can never contain it.
const MARK_GROUP = "markGroup";

const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

const stringAttr = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const alignStyle = (node: RichTextNode) => {
  const textAlign = node.attrs?.textAlign;

  return isTextAlign(textAlign)
    ? { textAlign: textAlign as "left" | "center" | "right" | "justify" }
    : undefined;
};

const ORDERED_LIST_TYPES = new Set(["a", "A", "i", "I"]);

/**
 * Renderers for the PuckRichText schema. The objects have no prototype, so a
 * type such as "constructor" can never resolve to an inherited member.
 */
export const nodeMapping: Record<string, NodeRenderer> = Object.assign(
  Object.create(null),
  {
    doc: ({ children }) => <>{children}</>,
    [MARK_GROUP]: ({ children }) => <>{children}</>,
    text: ({ node }) => node.text ?? null,
    paragraph: ({ node, children }) => (
      <p style={alignStyle(node)}>{children}</p>
    ),
    heading: ({ node, children }) => {
      const level = node.attrs?.level;
      const tag =
        typeof level === "number" ? HEADING_TAGS[level - 1] ?? "h1" : "h1";

      return createElement(tag, { style: alignStyle(node) }, children);
    },
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
    bulletList: ({ children }) => <ul>{children}</ul>,
    orderedList: ({ node, children }) => {
      const { start, type } = node.attrs ?? {};

      return (
        <ol
          start={typeof start === "number" && start !== 1 ? start : undefined}
          type={
            typeof type === "string" && ORDERED_LIST_TYPES.has(type)
              ? (type as "a" | "A" | "i" | "I")
              : undefined
          }
        >
          {children}
        </ol>
      );
    },
    listItem: ({ children }) => <li>{children}</li>,
    codeBlock: ({ node, children }) => {
      const language = stringAttr(node.attrs?.language);

      return (
        <pre>
          <code className={language ? `language-${language}` : undefined}>
            {children}
          </code>
        </pre>
      );
    },
    hardBreak: () => <br />,
    horizontalRule: () => <hr />,
  } satisfies Record<string, NodeRenderer>
);

export const markMapping: Record<string, MarkRenderer> = Object.assign(
  Object.create(null),
  {
    bold: ({ children }) => <strong>{children}</strong>,
    italic: ({ children }) => <em>{children}</em>,
    underline: ({ children }) => <u>{children}</u>,
    strike: ({ children }) => <s>{children}</s>,
    code: ({ children }) => <code>{children}</code>,
    link: ({ mark, children }) => {
      const attrs = mark.attrs ?? {};

      // normalizeRichText already removed unsafe links; check again here
      if (!isSafeHref(attrs.href)) return <>{children}</>;

      return (
        <a
          href={attrs.href}
          target={stringAttr(attrs.target)}
          rel={stringAttr(attrs.rel)}
          title={stringAttr(attrs.title)}
        >
          {children}
        </a>
      );
    },
  } satisfies Record<string, MarkRenderer>
);

// Never reached after normalization; output text only, just in case
const unhandledNode: NodeRenderer = ({ node }) => extractText(node);
const unhandledMark: MarkRenderer = ({ children }) => <>{children}</>;

const sameMark = (a: RichTextMark, b: RichTextMark) => {
  if (a.type !== b.type) return false;

  const aAttrs = a.attrs ?? {};
  const bAttrs = b.attrs ?? {};
  const keys = Object.keys(aAttrs);

  return (
    keys.length === Object.keys(bAttrs).length &&
    keys.every((key) => aAttrs[key] === bAttrs[key])
  );
};

/**
 * Lifts the marks of inline nodes into MARK_GROUP nodes the same way
 * ProseMirror's DOMSerializer does: marks that adjacent nodes share stay open,
 * so "**a _b_**" renders as <strong>a <em>b</em></strong> and not as two
 * separate <strong> elements.
 */
const groupMarks = (content: RichTextNode[]): RichTextNode[] => {
  const root: RichTextNode[] = [];
  const open: { mark: RichTextMark; content: RichTextNode[] }[] = [];

  for (const node of content) {
    const { marks = [], ...rest } = node;
    let keep = 0;

    while (
      keep < open.length &&
      keep < marks.length &&
      sameMark(open[keep].mark, marks[keep])
    ) {
      keep++;
    }

    open.length = keep;

    for (const mark of marks.slice(keep)) {
      const group: RichTextNode = {
        type: MARK_GROUP,
        marks: [mark],
        content: [],
      };

      (open.length ? open[open.length - 1].content : root).push(group);
      open.push({ mark, content: group.content! });
    }

    (open.length ? open[open.length - 1].content : root).push(rest);
  }

  return root;
};

const toRenderTree = (node: RichTextNode): RichTextNode => {
  if (!node.content) return node;

  return {
    ...node,
    content:
      node.type === "paragraph" || node.type === "heading"
        ? groupMarks(node.content)
        : node.content.map(toRenderTree),
  };
};

/**
 * Renders rich text (Tiptap JSON, or a legacy string shown as plain text) to
 * React elements. The value is normalized first, so only the PuckRichText
 * schema can reach the output. Uses no hooks and no DOM, so it runs in React
 * Server Components, during SSR and on the client alike.
 */
export function renderRichText(value: unknown): ReactNode {
  const render = renderJSONContentToReactElement<RichTextMark, RichTextNode>({
    nodeMapping,
    markMapping,
    unhandledNode,
    unhandledMark,
  });

  return render({ content: toRenderTree(normalizeRichText(value)) });
}
