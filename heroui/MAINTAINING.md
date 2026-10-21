# Maintaining the vendored HeroUI (internal)

Notes for the people who maintain `heroui/`. Unlike `heroui/NOTICE.md`, which the CI
copies into the public component gallery, this file is never published.

The licence, the import record and the list of local modifications stay in
`heroui/NOTICE.md`; every edit to an upstream file still carries a `LOCAL CHANGE`
comment and an entry there.

## Looking at upstream later

A reference clone pinned to the same tag lives next to this repository at
`../heroui-upstream`. To review what upstream changed since the import:

```bash
git -C ../heroui-upstream fetch --tags
git -C ../heroui-upstream diff v3.2.6 <newer-tag> -- packages/react packages/styles
```

Cherry-pick by hand; never overwrite this directory wholesale.

## Open design questions

`styles/themes/tzuchi/DESIGN-LANGUAGE.md` §12 lists the questions the evidence could
not settle. They are design decisions nobody has signed off yet.

## Open items found by the theme audit (2026-09-19), not yet addressed

Until 2026-10-22 these items were kept in `heroui/NOTICE.md`. The component reports in
`styles/themes/tzuchi/gap-audit/` that say "NOTICE.md flags" the `--muted` contrast, or
cite "Design decisions for the token owners", mean this section.

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
