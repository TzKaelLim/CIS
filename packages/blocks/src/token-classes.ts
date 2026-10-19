/**
 * Token values in block props become CSS classes, never inline styles, so the
 * public page can run under a strict CSP. Every class is defined in
 * blocks.css; a test checks every value of every x-token field.
 */
const PREFIX = { "padding-y": "py", gap: "gap" } as const;

/** Token values are token names such as "16" or "48" (--tc-space-48). */
const TOKEN_VALUE = /^[0-9]{1,3}$/;

/**
 * tokenClass("space", "padding-y", "48") → "tcb-py-48" (padding-block: var(--tc-space-48)).
 * A value that is not a token name gives "" rather than an arbitrary class.
 */
export function tokenClass(
  group: "space",
  purpose: "padding-y" | "gap",
  value: string
): string {
  if (group !== "space" || !TOKEN_VALUE.test(value)) return "";
  return `tcb-${PREFIX[purpose]}-${value}`;
}
