import { typographyVariants } from "@heroui/styles";
import type { ReactNode } from "react";
import type { ParagraphProps } from "./spec";

/**
 * `body` is the richtext already turned into React: the shared renderer
 * (RichTextContent) on the public page, the inline editor in the editor.
 * Typography's prose slot styles the paragraphs and lists inside it.
 */
export function ParagraphView({
  body,
  align,
}: {
  body: ReactNode;
  align: ParagraphProps["align"];
}) {
  const typography = typographyVariants({ type: "body", align });
  return (
    <div className={`${typography.base()} ${typography.prose()} tcb-paragraph`}>
      {body}
    </div>
  );
}
