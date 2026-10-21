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

## Local modifications

Everything not listed here is byte-identical to upstream `v3.2.6`.

Every edit to an upstream file carries a `LOCAL CHANGE` comment at the site.

**Repository notes**

- **Added** `MAINTAINING.md` — notes for the maintainers of this directory.

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
  reference for anything built on top of this layer.
- **Added** `styles/themes/tzuchi/gap-audit/` — the audit behind those overrides:
  `README.md` (summary and design decisions; passes 2 and 3 at the end), one
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

**Packages**

- **Changed** `react/package.json`, `styles/package.json` — `"private": true` and no
  `publishConfig.access: public`, so `changeset publish` cannot push them to npmjs.org. JSON has
  no comments, so this entry is the LOCAL CHANGE record.

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
- **Changed** `storybook/.storybook/welcome.mdx` — rewritten as the Tzu Chi gallery's
  welcome page (what the gallery is, the default theme, the licence and this notice). The
  links to heroui.com, GitHub and Discord, the HeroUI logo and the build date are gone.
- **Changed** `storybook/.storybook/globals.css` — `revert-layer` for the Tzu Chi
  themes, so upstream's unlayered `--background` / `--foreground` / `--font-sans`
  overrides stop beating the (layered) theme.
- **Changed** `storybook/.storybook/addons/theme/constants.ts`, `storybook/.storybook/preview.tsx`
  — the Tzu Chi themes come first in the Theme toolbar and the gallery opens in `tzuchi`
  (`initialGlobals` sets the theme).
- **Removed** `storybook/.storybook/addons/react-scan/`, the `react-scan` dependency, its
  decorator and toolbar item in `preview.tsx`, its `<script>` in `preview-head.html` and the
  `staticDirs` of `main.ts` — React Scan forced itself on in production builds and loaded
  from an absolute path.
- **Changed** `storybook/.storybook/preview-head.html`, `storybook/.storybook/globals.css` — no
  Google Fonts: the Inter `<link>`s are gone and the font stacks start with the system font,
  so the gallery makes no third-party font requests.
- **Changed** `storybook/.storybook/styles/theme.ts` — the manager's `brandTitle` is the text
  「慈濟元件樣品室」 instead of HeroUI's logo image (an absolute `/logo-*.svg` path).
- **Removed** `storybook/public/` — HeroUI's logos and favicon; Storybook shows its built-in
  favicon.
- **Changed** `storybook/styles/globals.css` — imports `@tzuchi/tokens/tokens.css`
  and the theme.
- **Changed** `storybook/package.json` — adds the `@tzuchi/tokens` workspace dependency;
  `vite` 7.3.7 (GHSA-587h-7wmj-h5pm, GHSA-r825-w8mm-5pxw); no `react-scan`.

**Stories**

- **Removed** `AsynchronousFiltering` from `react/src/components/autocomplete/autocomplete.stories.tsx`
  and `AsynchronousLoading` from `react/src/components/combo-box/combo-box.stories.tsx` (both
  fetched swapi.py4e.com) and from `react/src/components/select/select.stories.tsx` (fetched
  pokeapi.co): they sent what a reader typed to a third-party API. The imports only they used
  went with them.

**Tokens** — the theme reads these `@tzuchi/tokens` values (`packages/tokens/src/`): the
component token files, `feedback.warning` / `feedback.info`, the amber primitives, and two
neutral semantic tokens, `color.neutral.surface` (gray.100 / dark gray.900) and
`color.neutral.surface-hover` (gray.200 / dark gray.800), in `src/semantic/color.tokens.json`
and `src/themes/dark/color.tokens.json`. The two neutral tokens are the twin of
`color.brand.surface` / `-hover` and feed HeroUI's `--default` / `--default-hover` (tertiary
and ghost buttons, the `secondary` field variants, tab and slider tracks, tags, kbd …); the
contrast numbers behind their values are in `gap-audit/neutral-token-impact.md`.
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
- The `lint` scripts of `react`, `styles` and `storybook` (`eslint . --max-warnings=0`)
  cannot run: their configs in `standard/eslint/*.mjs` import `@typescript-eslint/parser`,
  `globals` and the ESLint plugins, which `standard/package.json` does not declare
  and this repository does not install. ESLint stops with `ERR_MODULE_NOT_FOUND`.
  These packages are checked with their `typecheck` scripts instead.
- Theme variables reach colour, the radius scale and shadows only. Anything a
  component hard-codes in `styles/components/*.css` (shape, density, type) has to
  be overridden per component in `styles/themes/tzuchi/components/`.
- The "Color System" story prints each swatch's value once, during render, and
  never re-reads it: after a theme switch the swatches repaint but the printed
  values stay from the previous theme. Same for upstream's own light ↔ dark.
- `Dropdown.Trigger` (likewise the AlertDialog / Drawer / Modal / Popover / Tooltip
  wrappers) is react-aria's unstyled Button wearing an `inline-block` wrapper
  class. `dropdown --with-sections` styles it with `.button` classes, and the
  wrapper's `inline-block` beats `.button`'s `inline-flex`, so the icon sits at
  the start of the box in upstream's own themes too. The Tzu Chi theme restores
  `inline-flex` for that combination (`themes/tzuchi/components/button.css`);
  upstream light / dark are left as shipped.
