# Vendored HeroUI v3 source

This directory is a one-time import of HeroUI v3, taken as a starting point for an
in-house component library. It is **not** tracked against upstream: updates are
never pulled automatically.

| | |
|---|---|
| Upstream | https://github.com/heroui-inc/heroui |
| Pinned release | `v3.2.6` |
| Commit | `e385ac202b2cdb94b1bf6fa76d32c31c8259cc5e` (2026-09-17) |
| Imported | 2026-09-19 |
| Imported paths | upstream `packages/{react,styles,storybook,standard,testing}` → `heroui/` |
| Left behind | `apps/` (docs site), release tooling, CI, agent skills/prompts |

## License

Upstream's repository `LICENSE` is Apache-2.0 and is kept verbatim as
`heroui/LICENSE`. Note that the published `@heroui/*` npm packages declare `MIT`
in their `package.json`; the two disagree upstream. Keep the `LICENSE` file and
this notice with the code, and list local modifications below (Apache-2.0 §4).

## Layout

The five packages keep upstream's relative layout on purpose:
`storybook/.storybook/main.ts` finds stories through the relative glob
`../../react/src/**/*.stories.@(ts|tsx)`, and the packages reference each other
as `workspace:*`. Upstream needs Node ≥ 22.

## Looking at upstream later

A reference clone pinned to the same tag lives next to this repository at
`../heroui-upstream`. To review what upstream changed since the import:

```bash
git -C ../heroui-upstream fetch --tags
git -C ../heroui-upstream diff v3.2.6 <newer-tag> -- packages/react packages/styles
```

Cherry-pick by hand; never overwrite this directory wholesale.

## Local modifications

Everything not listed here is byte-identical to upstream `v3.2.6`.

Every edit to an upstream file carries a `LOCAL CHANGE` comment at the site.

**Tzu Chi theme** — a first-class HeroUI theme, shaped like `styles/themes/default/`
and selected the documented HeroUI way: `data-theme="tzuchi"` / `"tzuchi-dark"`.

- **Added** `styles/themes/tzuchi/index.css` — entry: variables + component customizations.
- **Added** `styles/themes/tzuchi/generate.mjs` — generates `variables.css` from the
  built `@tzuchi/tokens` stylesheet (`pnpm run heroui:theme`). Each theme block is
  resolved down to token _primitives_, because `tokens.css` keys its own dark
  switch off `[data-theme="dark"]` / the OS preference, which HeroUI-style theme
  names do not line up with. The mapping table and the list of HeroUI variables
  that have no token equivalent yet live in this file.
- **Added** `styles/themes/tzuchi/variables.css` — generated; do not edit by hand.
- **Added** `styles/themes/tzuchi/components/` — `index.css` plus one override file per
  component, in upstream's order and grouping: shape, density, typography, borders,
  variant mapping. Every rule is scoped by `[data-theme^="tzuchi"]`; colours come only
  from HeroUI theme variables or generator-emitted `--tzuchi-*` variables (rules in
  `index.css`).
  - Pass 1 — the 18 base components whose names match the in-house `tc-*` set
    (accordion, alert, badge, button, card, checkbox, chip, dropdown, input, link,
    modal, pagination, radio, spinner, switch, tabs, textarea, tooltip).
  - Pass 2 — counterparts with a different name: breadcrumbs ← `tc-breadcrumb`,
    separator ← `tc-divider`, progress-bar ← `tc-progress`, search-field ←
    `tc-search-bar`'s text field, the icon-only section of button ← `tc-icon-button`,
    select + list-box + list-box-item ← `tc-dropdown`, tag ← `tc-chip`'s interactive
    half. `list-box*` is shared by Select, ComboBox, Autocomplete and ListBox.
  - Pass 3 — the remaining 58 base components, which have NO Tzu Chi counterpart: 42
    override files derived from `DESIGN-LANGUAGE.md` (field family, pickers, calendars,
    menus, form scaffolding, toggle buttons, dialogs, popover / toast, tracks, sliders,
    colour pickers, table, avatar / kbd / typography, disclosure); 16 components were
    confirmed to need none. All 84 upstream component style files are now accounted for:
    68 overridden, 16 deliberately not.
  - Passes 4–5 — polish, no new files: a completeness sweep (all 583 stories × both
    themes: sub-16px text, off-ladder radii, low-contrast text) and a screenshot-based
    visual QA of the ten component families (1,523 screenshots incl. keyboard focus,
    hover, open, invalid, disabled) found 69 defects; the triaged fixes went into 37 of the
    override files — clipped focus rings on edge-to-edge option rows, one focus style for
    every field shell (Tzu Chi's border + 3px halo), text on a fill taking that fill's
    foreground, constant-white switch / slider thumbs, InputGroup affix overflow and
    dividers, bare-list row inset, table row states, the today marker, and more. What was
    deliberately NOT changed, and why, is in `gap-audit/README.md`.
- **Added** `styles/themes/tzuchi/DESIGN-LANGUAGE.md` — the Tzu Chi design language as
  154 traceable rules (type scale, radius by role, control metrics, borders and focus,
  state colour grammar, overlay shells, tracks, motion, spacing, a do-not-touch list),
  synthesised from the pass-1/2 overrides and fact-checked against the tokens. It is the
  reference for anything built on top of this layer. Its open questions are design
  decisions nobody has signed off yet.
- **Added** `styles/themes/tzuchi/gap-audit/` — the audit behind those overrides:
  `README.md` (summary and decisions needed; passes 2 and 3 at the end), one
  property-by-property report per component, `neutral-token-impact.md`, and `pass3/`
  (one report per component family plus `_consistency.md`). Verified in a real browser:
  upstream `light`/`dark` computed styles byte-identical before/after (pass 3: all 77
  default stories, clock pinned — calendars mark "today"); 188 + 90 + 254 expected values
  met across both Tzu Chi themes.

**Upstream gap closed** — upstream only treats the literal `"dark"` as dark, so a
custom `"<name>-dark"` theme neither inherited the dark defaults nor triggered
`dark:` utilities:

- **Changed** `styles/themes/default/variables.css` — dark block also matches
  `[data-theme$="-dark"]`.
- **Changed** `styles/variants/index.css` — `dark` custom variant also matches
  `[data-theme$="-dark"]`.

**Storybook**

- **Changed** `storybook/.storybook/addons/theme/{constants.ts,decorator.tsx,manager.ts}` —
  adds the two themes to the Theme toolbar; clears every theme class on switch;
  manager chrome follows darkness.
- **Changed** `storybook/.storybook/components/docs-container.tsx` — three fixes:
  (1) the docs chrome picks its light/dark skin by darkness (upstream's
  `themes[themeKey]` lookup fell back to light under `tzuchi-dark`); (2) the current
  theme is read from the channel's cached `GLOBALS_UPDATED` / `SET_GLOBALS` payload
  and followed via `GLOBALS_UPDATED` — upstream read `context.globals`, which does
  not exist on `DocsContextProps`, so every docs page started as "light" and only
  pages with stories recovered; (3) the container applies `data-theme` itself, so
  docs-only MDX pages (Welcome) are themed too. Fixes Welcome for upstream's own
  `dark` theme as well.
- **Changed** `storybook/.storybook/addons/theme/decorator.tsx` — also exports
  `updatePreviewTheme` for the docs container.
- **Changed** `storybook/.storybook/welcome.mdx` — the primary button's forced
  `text-white!` became `text-accent-foreground!` (white was ~1.8:1 on the light-blue
  `tzuchi-dark` accent); the hard-coded `/logo-dark.svg` became the `currentColor`
  `<HeroUILogo>` so it is visible on every theme.
- **Changed** `storybook/.storybook/globals.css` — `revert-layer` for the Tzu Chi
  themes, so upstream's unlayered `--background` / `--foreground` / `--font-sans`
  overrides stop beating the (layered) theme.
- **Changed** `storybook/styles/globals.css` — imports `@tzuchi/tokens/tokens.css`
  and the theme.
- **Changed** `storybook/package.json` — adds the `@tzuchi/tokens` workspace dependency.

**Tokens** — `packages/tokens/src/` in this worktree was synced from the main
checkout's uncommitted work (11 new component token files, `feedback.warning` /
`feedback.info`, amber primitives), which the overrides and the `--warning` mapping
depend on. Reconcile with `main` when that work is committed there.

Two semantic tokens were then **added here and exist nowhere else yet** — carry them
over to `main` with the rest: `color.neutral.surface` (gray.100 / dark gray.900) and
`color.neutral.surface-hover` (gray.200 / dark gray.800), in
`src/semantic/color.tokens.json` and `src/themes/dark/color.tokens.json`. They are the
neutral twin of `color.brand.surface` / `-hover` and feed HeroUI's `--default` /
`--default-hover` (tertiary and ghost buttons, the `secondary` field variants, tab and
slider tracks, tags, kbd …). The values are a proposal backed by contrast numbers
(`gap-audit/neutral-token-impact.md`), not a Figma decision — designers should confirm.
The generator also sets a few values in the dark theme only, where no semantic token has
the right pair (each documented at `DARK_EXTRA` in `generate.mjs`): `--segment` (gray.800),
the three status foregrounds `--danger/-success/-warning-foreground` (gray.980 — text.on-brand
is the navy brand ink in dark), the accordion hover fill (gray.900 — tc's token is the page
colour there, darker than the card) and the Slider track (`--border`; light uses
`color.border.strong`).

## Known state inherited from upstream

- `storybook`'s `typecheck` script only checks `vite.config.ts`: TypeScript does
  not expand the dot-directory in `"include": [".storybook"]`. Checking
  `.storybook/**/*` for real reports 22 errors in 9 upstream files (none in the
  files added here). They do not affect the build — Vite strips types.
- Theme variables reach colour, the radius scale and shadows only. Anything a
  component hard-codes in `styles/components/*.css` (shape, density, type) has to
  be overridden per component in `styles/themes/tzuchi/components/`.
- The "Color System" story prints each swatch's value once, during render, and
  never re-reads it: after a theme switch the swatches repaint but the printed
  values stay from the previous theme. Same for upstream's own light ↔ dark.

## Open items found by the theme audit (2026-09-19), not yet addressed

**Before building a real app on this** — `react/src/hooks/use-theme.ts` (the
package's public theme hook, not used by Storybook):

- Its default `"system"` intent resolves only to the literals `"light"` / `"dark"`
  and then _overwrites_ `data-theme`; an app shipping `<html data-theme="tzuchi">`
  would flash Tzu Chi and fall back to stock HeroUI. Needs a way to map
  system-light/dark onto a theme pair (e.g. an optional
  `systemThemes: {light, dark}` argument).
- It adds the theme name as a class (`tzuchi-dark`) but never the bare `dark`
  class, so third-party code checking `classList.contains("dark")` stays light.
- An app's CSS entry needs, in this order: `@tzuchi/tokens/tokens.css`,
  `@heroui/styles`, then `themes/tzuchi/index.css` **unlayered**. `styles/package.json`
  has no bare `./themes/tzuchi` export yet (the default theme has one).

**Design decisions for the token owners** — contrast in the _light_ Tzu Chi theme,
all inherited from `@tzuchi/tokens` (the Lit components share them):

- `color.text.muted` (gray-700 `#828282`) is 3.84:1 on white and 3.62:1 on
  `surface-subtle` — below WCAG AA 4.5:1. It feeds `--muted` and
  `--field-placeholder` (descriptions, breadcrumbs, every placeholder).
- White on `feedback.error` (`#d4494f`) is 4.32:1 and on `feedback.success`
  (`#168967`) 4.37:1 — just below AA for filled danger/success labels.
  Both primitives are also used directly by `tc-badge`, so changing them is a
  brand-colour decision, not a theme tweak.

**Minor**

- `themes/tzuchi/variables.css` has no `:host([data-theme=…])` selectors, which
  `themes/default/variables.css` pairs with every theme selector for shadow-DOM hosts.
- `react/src/hooks/use-css-variable.ts` caches by variable name only, so a value
  read under one theme is reused after switching (Skeleton, Toast).
- `react/src/components/color-slider` paints its alpha checkerboard in fixed
  near-white, which glares on any dark theme.
- `generate.mjs` reads the first `{…}` after `:root` textually; a token
  `$description` containing `}` would truncate the parse.
