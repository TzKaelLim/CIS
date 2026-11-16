import { typographyVariants } from "@heroui/styles";
import type { ReactNode } from "react";
import type { HeadingProps } from "./spec";

/**
 * The HTML tag of each level. A fixed table, so page data never chooses the
 * element: data that skipped the validator (a level of "script") renders as
 * h2, the spec's default.
 */
const TAGS = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
} as const satisfies Record<HeadingProps["level"], HeadingProps["level"]>;

function headingTag(level: unknown): HeadingProps["level"] {
  return typeof level === "string" &&
    Object.prototype.hasOwnProperty.call(TAGS, level)
    ? TAGS[level as HeadingProps["level"]]
    : "h2";
}

/** `level` is also the HTML tag (h1–h4). `text` is a ReactNode: inline editing in the editor. */
export function HeadingView({
  text,
  level,
  align,
}: {
  text: ReactNode;
  level: HeadingProps["level"];
  align: HeadingProps["align"];
}) {
  const Tag = headingTag(level);
  return (
    <Tag className={typographyVariants({ type: Tag, align }).base()}>
      {text}
    </Tag>
  );
}
