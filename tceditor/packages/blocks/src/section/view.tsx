import { surfaceVariants } from "@heroui/styles";
import type { ReactNode } from "react";
import { tokenClass } from "../token-classes";
import type { SectionProps } from "./spec";

/** A section with a background gets side padding; a transparent one lines up with the page. */
export function SectionView({
  background,
  paddingY,
  content,
}: {
  background: SectionProps["background"];
  paddingY: SectionProps["paddingY"];
  content: ReactNode;
}) {
  const classes = [
    surfaceVariants({ variant: background }),
    tokenClass("space", "padding-y", paddingY),
    "tcb-section",
    background === "transparent" ? "" : "tcb-section--inset",
  ];
  return (
    <section className={classes.filter(Boolean).join(" ")}>{content}</section>
  );
}
