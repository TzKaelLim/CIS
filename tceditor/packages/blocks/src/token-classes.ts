/**
 * Token values in block props become CSS classes, never inline styles, so the
 * public page can run under a strict CSP. Every class is defined in
 * blocks.css; a test checks every value of every x-token field.
 */

/** Each tokenClass purpose: its class prefix and the CSS property its classes set in blocks.css. */
export const TOKEN_CLASS_PURPOSES = {
  "padding-y": { prefix: "py", property: "padding-block" },
  gap: { prefix: "gap", property: "gap" },
} as const;

export type TokenPurpose = keyof typeof TOKEN_CLASS_PURPOSES;

/**
 * The purpose each token() field's view passes to tokenClass, by field name.
 * A token field with another name needs its purpose here, and every value its
 * class in blocks.css (styles.spec.ts checks both).
 */
export const TOKEN_PURPOSES: Readonly<Record<string, TokenPurpose>> = {
  paddingY: "padding-y",
  gap: "gap",
};

/** Token values are token names such as "16" or "48" (--tc-space-48). */
const TOKEN_VALUE = /^[0-9]{1,3}$/;

/**
 * tokenClass("space", "padding-y", "48") → "tcb-py-48" (padding-block: var(--tc-space-48)).
 * A value that is not a token name gives "" rather than an arbitrary class.
 */
export function tokenClass(
  group: "space",
  purpose: TokenPurpose,
  value: string
): string {
  if (group !== "space" || !TOKEN_VALUE.test(value)) return "";
  return `tcb-${TOKEN_CLASS_PURPOSES[purpose].prefix}-${value}`;
}
