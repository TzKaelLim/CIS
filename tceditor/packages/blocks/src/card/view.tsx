import { cardVariants } from "@heroui/styles";
import type { ReactNode } from "react";
import type { CardProps } from "./spec";

/** The title becomes a link when `href` is set; the summary shows only when it is not empty. */
export function CardView({
  title,
  summary,
  href,
  variant,
  content,
}: {
  title: ReactNode;
  summary: string;
  href: string;
  variant: CardProps["variant"];
  content: ReactNode;
}) {
  const card = cardVariants({ variant });
  return (
    <article className={card.base()}>
      <header className={card.header()}>
        <h3 className={card.title()}>
          {href === "" ? (
            title
          ) : (
            <a href={href} className="tcb-card-link">
              {title}
            </a>
          )}
        </h3>
        {summary === "" ? null : (
          <p className={card.description()}>{summary}</p>
        )}
      </header>
      <div className={card.content()}>{content}</div>
    </article>
  );
}
