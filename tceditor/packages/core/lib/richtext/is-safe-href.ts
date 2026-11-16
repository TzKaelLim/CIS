const ALLOWED_SCHEMES = ["http", "https", "mailto", "tel"];

// C0 controls, DEL and C1 controls. Browsers drop some of these while parsing
// a URL, so "java\tscript:" would still run as javascript:.
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/;

// Numeric (&#106; &#x6A; &#106) and named (&colon;) character references.
// React escapes "&", so they never decode in our own output, but they would in
// any other HTML serializer that receives this value.
const CHARACTER_REFERENCE = /&(#|[a-z][a-z0-9]*;)/i;

// Everything before the first ":" that comes before any "/", "?" or "#".
const SCHEME = /^([^/?#]*):/;

/**
 * Returns true for http, https, mailto and tel URLs and for relative URLs.
 * Anything else, including javascript:, data: and vbscript: in any spelling,
 * returns false.
 */
export function isSafeHref(href: unknown): href is string {
  if (typeof href !== "string") return false;

  const trimmed = href.trim();

  if (trimmed === "") return false;

  if (CONTROL_CHARACTERS.test(trimmed) || CHARACTER_REFERENCE.test(trimmed)) {
    return false;
  }

  const scheme = SCHEME.exec(trimmed.replace(/\s/g, ""));

  if (!scheme) return true;

  return ALLOWED_SCHEMES.indexOf(scheme[1].toLowerCase()) !== -1;
}
