import { chipVariants } from "@heroui/styles";
import type { TagListProps } from "./spec";

export function TagListView({
  tags,
  color,
  variant,
}: {
  tags: { label: string }[];
  color: TagListProps["color"];
  variant: TagListProps["variant"];
}) {
  const chip = chipVariants({ color, variant });
  return (
    <ul className="tcb-tag-list">
      {tags.map((tag, index) => (
        <li key={index} className={chip.base()}>
          <span className={chip.label()}>{tag.label}</span>
        </li>
      ))}
    </ul>
  );
}
