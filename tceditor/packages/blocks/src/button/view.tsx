import { buttonVariants } from "@heroui/styles";
import type { ReactNode } from "react";
import type { ButtonProps } from "./spec";

/**
 * A link styled as a button (spec §7.1): uikit's Button is a <button> for
 * actions, which cannot navigate. An empty href (a new block in the editor)
 * renders an <a> without href rather than a link to the current page.
 */
export function ButtonView({
  label,
  href,
  variant,
  size,
  fullWidth,
}: {
  label: ReactNode;
  href: string;
  variant: ButtonProps["variant"];
  size: ButtonProps["size"];
  fullWidth: boolean;
}) {
  return (
    <a
      href={href === "" ? undefined : href}
      className={buttonVariants({ variant, size, fullWidth })}
    >
      {label}
    </a>
  );
}
