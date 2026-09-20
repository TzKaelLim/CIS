/**
 * Generates ./variables.css — the "tzuchi" / "tzuchi-dark" HeroUI themes — from
 * the BUILT @tzuchi/tokens stylesheet, so the design tokens stay the single
 * source of truth and this theme can never drift from them.
 *
 * Why generated instead of `--accent: var(--tc-color-brand-primary)`:
 * tokens.css re-points its SEMANTIC variables under [data-theme="dark"] and,
 * under a dark OS preference, under :root:not([data-theme="light"]). With
 * HeroUI-style theme names neither rule lines up — "tzuchi-dark" would never go
 * dark and "tzuchi" would flip to dark on a dark-mode machine. So each theme
 * block is resolved one level down, to the PRIMITIVE the semantic token points
 * at in that mode (e.g. var(--tc-color-blue-900)). Primitives are never
 * redefined by any theme, so the result is stable. Elevation is the exception
 * (the dark overlay redefines it with literals); those are inlined per mode.
 *
 * Run: pnpm run heroui:theme   (after @tzuchi/tokens has been built)
 */
import {readFileSync, writeFileSync} from "node:fs";

const TOKENS_CSS = new URL("../../../../packages/tokens/dist/tokens.css", import.meta.url);
const OUT = new URL("./variables.css", import.meta.url);

/** HeroUI theme variable → @tzuchi/tokens variable, resolved per mode. */
const THEMED = {
  // Brand → accent. Hover/soft use the explicit Figma tokens instead of
  // HeroUI's color-mix() derivations.
  "--accent": "--tc-color-brand-primary",
  "--accent-foreground": "--tc-color-text-on-brand",
  "--accent-hover": "--tc-color-brand-primary-hover",
  "--accent-soft": "--tc-color-brand-surface",
  "--accent-soft-hover": "--tc-color-brand-surface-hover",
  "--accent-soft-foreground": "--tc-color-brand-primary",

  // Neutral fill (tertiary / ghost buttons, the `secondary` field variants, tab
  // and slider tracks, chips, kbd …) — the neutral twin of the brand tonal pair
  // above. The hover is an explicit token like --accent-soft-hover: HeroUI's own
  // derivation is a 4% mix, a 1.08:1 step nobody can see. --default-soft* stay
  // HeroUI's color-mix() derivations of --default.
  "--default": "--tc-color-neutral-surface",
  "--default-foreground": "--tc-color-text-default",
  "--default-hover": "--tc-color-neutral-surface-hover",

  // Page, surfaces, overlays
  "--background": "--tc-color-surface-subtle",
  "--foreground": "--tc-color-text-default",
  "--surface": "--tc-color-surface-default",
  "--surface-foreground": "--tc-color-text-default",
  "--overlay": "--tc-color-surface-default",
  "--overlay-foreground": "--tc-color-text-default",
  "--muted": "--tc-color-text-muted",

  // Lines, focus, links
  "--border": "--tc-color-border-default",
  "--separator": "--tc-color-border-default",
  "--focus": "--tc-color-border-focus",
  "--link": "--tc-color-brand-primary",

  // Feedback. No on-error / on-success token exists yet, so the on-brand text
  // colour stands in (white in light, blue-900 in dark — readable on both fills).
  "--danger": "--tc-color-feedback-error",
  "--danger-foreground": "--tc-color-text-on-brand",
  "--success": "--tc-color-feedback-success",
  "--success-foreground": "--tc-color-text-on-brand",
  "--warning": "--tc-color-feedback-warning",
  "--warning-foreground": "--tc-color-text-on-brand",

  // Form fields: bordered (tc-input's look)
  "--field-background": "--tc-color-surface-default",
  "--field-foreground": "--tc-color-text-default",
  "--field-placeholder": "--tc-color-text-muted",
  "--field-border": "--tc-color-border-default",
  "--field-border-hover": "--tc-color-border-focus",
  "--field-border-focus": "--tc-color-border-focus",

  // Elevation (inlined literals — see header)
  "--surface-shadow": "--tc-elevation-1",
  "--overlay-shadow": "--tc-elevation-3",

  // Tzu Chi-only variables, consumed by ./components/*.css. HeroUI has no theme
  // variable for these roles, and the component files may not read --tc-color-*
  // themselves (it would yield light values under "tzuchi-dark"), so they are
  // resolved here per mode. Three of them are the same role — "strong border",
  // the resting outline of an unchecked control — which HeroUI has no concept of.
  "--tzuchi-checkbox-border": "--tc-color-border-strong",
  "--tzuchi-radio-ring": "--tc-color-border-strong",
  "--tzuchi-switch-track-bg": "--tc-color-border-strong",
  "--tzuchi-accordion-trigger-hover-bg": "--tc-color-surface-subtle",
  "--tzuchi-modal-shadow": "--tc-elevation-4",
};

/**
 * THEMED entries NOT emitted for the dark theme, so HeroUI's dark default is
 * inherited instead.
 *   --overlay-shadow: HeroUI's dark value is a 1px inset white hairline, and it
 *   is the ONLY edge popovers / menus / tooltips have (they declare no border).
 *   A black drop shadow is invisible on a near-black page, so overlays would
 *   float with no boundary (--overlay on --background is ~1.06:1).
 *   --tzuchi-modal-shadow: same reasoning; modal.css falls back to --overlay-shadow.
 */
const DARK_OMIT = new Set(["--overlay-shadow", "--tzuchi-modal-shadow"]);

/**
 * Extra dark-only declarations that are formulas, not token lookups.
 *   HeroUI derives --danger-hover / --success-hover by mixing the fill toward its
 *   *-foreground. Here that foreground is blue-900 in dark, so the inherited
 *   formula DARKENS on hover while every other dark hover brightens. Mix toward
 *   white instead, as --accent-hover (blue-300 → blue-250) already does.
 *
 *   --segment (the selected pill of segmented Tabs) sits on the --default track.
 *   That track is gray-900 here, lighter than HeroUI's, which cut the pill's
 *   separation from 1.59:1 to 1.35:1 — and dark has no shadow to help. gray-800
 *   restores it (1.54:1; label on it 7.32:1). A primitive, so it is mode-stable.
 *   Light needs nothing: HeroUI's white pill is Tzu Chi's white.
 */
const DARK_EXTRA = {
  "--danger-hover": "color-mix(in oklab, var(--danger) 88%, var(--tc-color-white) 12%)",
  "--success-hover": "color-mix(in oklab, var(--success) 88%, var(--tc-color-white) 12%)",
  "--segment": "var(--tc-color-gray-800)",
};

/** Mode-independent values, shared by both themes. */
const SHARED = {
  "--radius": "var(--tc-radius-md)",
  "--field-radius": "var(--tc-radius-md)",
  "--field-border-width": "1px",
  "--field-shadow": "0 0 0 0 transparent",
  "--disabled-opacity": "var(--tc-opacity-disabled)",
  "--ring-offset-width": "var(--tc-focus-ring-offset)",
  "--font-sans": "var(--tc-font-family-base)",
};

/** HeroUI variables with no @tzuchi/tokens equivalent yet (HeroUI's value shows through). */
const UNMAPPED = [
  "--surface-secondary, --surface-tertiary  (tokens have two surface steps only; HeroUI's values",
  "  already sit between --surface and --default in both modes), --backdrop",
];

const css = readFileSync(TOKENS_CSS, "utf8");

/** `--name: value;` pairs of the first rule block that starts at `fromIndex`. */
function declarations(fromIndex) {
  const open = css.indexOf("{", fromIndex);
  const close = css.indexOf("}", open);
  const map = new Map();

  for (const m of css.slice(open + 1, close).matchAll(/(--tc-[\w-]+):\s*([^;]+);/g)) {
    map.set(m[1], m[2].trim());
  }

  return map;
}

const darkAt = css.indexOf('[data-theme="dark"]');

if (darkAt === -1) throw new Error("tokens.css has no [data-theme=\"dark\"] block — rebuild @tzuchi/tokens");

const light = declarations(css.indexOf(":root"));
const dark = declarations(darkAt);

const singleRef = (value) => value.match(/^var\((--tc-[\w-]+)\)$/)?.[1];

function resolve(tcVar, mode) {
  if (!light.has(tcVar)) throw new Error(`${tcVar} is not defined in tokens.css`);

  // A themed token must say what it is in dark. Falling back to the light value
  // would silently put a light colour into the dark theme — the very bug this
  // generator exists to prevent. Mode-independent values belong in SHARED.
  if (mode === "dark" && !dark.has(tcVar)) {
    throw new Error(
      `${tcVar} has no dark override in tokens.css — add one under themes/dark, ` +
        `or move the mapping to SHARED if it is intentionally the same in both modes`,
    );
  }

  const value = mode === "dark" ? dark.get(tcVar) : light.get(tcVar);

  if (!singleRef(value) && value.includes("var(")) {
    throw new Error(`${tcVar} = "${value}" is neither a literal nor a single primitive reference`);
  }

  // The emitted reference must be stable: follow the whole chain and make sure no
  // hop is something the dark overlay redefines (it would flip under
  // [data-theme="dark"] / the OS preference, which these theme names don't match).
  for (let ref = singleRef(value), hops = 0; ref; ref = singleRef(light.get(ref) ?? ""), hops++) {
    if (dark.has(ref)) {
      throw new Error(`${tcVar} (${mode}) reaches ${ref}, which the dark overlay redefines — not stable`);
    }
    if (!light.has(ref)) throw new Error(`${tcVar} (${mode}) references ${ref}, which tokens.css does not define`);
    if (hops > 10) throw new Error(`${tcVar}: reference chain too deep (cycle?)`);
  }

  return value;
}

const lines = (pairs) => pairs.map(([name, value]) => `  ${name}: ${value};`).join("\n");
const themed = (mode) =>
  lines([
    ...Object.entries(THEMED)
      .filter(([hv]) => !(mode === "dark" && DARK_OMIT.has(hv)))
      .map(([hv, tc]) => [hv, resolve(tc, mode)]),
    ...(mode === "dark" ? Object.entries(DARK_EXTRA) : []),
  ]);

const out = `/**
 * Tzu Chi theme variables — light ("tzuchi") and dark ("tzuchi-dark").
 * AUTO-GENERATED by ./generate.mjs from @tzuchi/tokens — do not edit by hand.
 * Change a colour in packages/tokens, or the mapping table in generate.mjs,
 * then run: pnpm run heroui:theme
 *
 * Only what differs from HeroUI's defaults is declared. Everything else —
 * including the color-mix() "calculated colours", which re-derive from the
 * values below — is inherited from themes/default/variables.css (light via
 * :root, dark via its [data-theme$="-dark"] selector).
 *
 * Not mapped (no @tzuchi/tokens equivalent yet; HeroUI's value shows through):
${UNMAPPED.map((u) => ` *   ${u}`).join("\n")}
 */

[data-theme="tzuchi"],
[data-theme="tzuchi-dark"] {
${lines(Object.entries(SHARED))}
}

[data-theme="tzuchi"] {
  color-scheme: light;
${themed("light")}
}

[data-theme="tzuchi-dark"] {
  color-scheme: dark;
${themed("dark")}
}
`;

writeFileSync(OUT, out);
console.log(
  `tzuchi theme generated: ${Object.keys(THEMED).length} themed + ${Object.keys(SHARED).length} shared variables`,
);
