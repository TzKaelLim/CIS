import { typographyVariants } from "@heroui/styles";
import type { ReactNode } from "react";
import type { HeadingProps } from "./spec";

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
  const Tag = level;
  return (
    <Tag className={typographyVariants({ type: level, align }).base()}>
      {text}
    </Tag>
  );
}
