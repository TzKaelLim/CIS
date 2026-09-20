# Button / icon-only — Tzu Chi ↔ HeroUI gap report (pass 2)

- **Tzu Chi source**: `/Users/kaellim/Desktop/Personal/CISwebsite/packages/components/src/icon-button/tc-icon-button.styles.ts`,
  `tc-icon-button.ts`,
  `/Users/kaellim/Desktop/Personal/CISwebsite/packages/tokens/src/component/icon-button.tokens.json`
- **Resolved token values**: `/Users/kaellim/Desktop/Personal/CISwebsite-heroui-spike/packages/tokens/dist/tokens.css`
- **HeroUI source**: `heroui/styles/components/button.css`, `heroui/styles/components/button-group.css`,
  `heroui/styles/src/components/button/button.styles.ts`, `heroui/react/src/components/button/button.tsx`,
  `heroui/react/src/components/button/button.stories.tsx`,
  `heroui/react/src/components/button-group/button-group.{tsx,stories.tsx}`,
  `heroui/styles/utilities/index.css`, `heroui/styles/themes/shared/theme.css`,
  `heroui/styles/themes/tzuchi/variables.css`
- **Pass 1 file this extends**: `heroui/styles/themes/tzuchi/components/button.css` (+ `gap-audit/button.md`)
- **Override written to**: `heroui/styles/themes/tzuchi/components/button.css`
  — **append-to-existing**, target `button.css`. Nothing above the appended block changes.
- **Closeness**: minor gaps. Colour is already correct with zero new declarations: tc-icon-button's
  `tonal` / `filled` recipes are byte-identical to tc-button's, which pass 1 already mapped onto
  `.button--secondary` / `.button--primary`. What genuinely differs is **shape** (8px square →
  full circle), **box size** (42/50 → 48/64) and **icon size** (20/16 → 32/40).

## Correction to pass 1

`gap-audit/button.md:60` records *"icon-only — no counterpart (tc has no icon-only mode)"*. That is
wrong at the system level: Tzu Chi ships a separate component, **`tc-icon-button`**, which is the
counterpart of HeroUI's `isIconOnly` modifier. Pass 1's two icon-only rules (`padding-inline: 0`,
`width: var(--tzuchi-button-block-size)`) are still correct as written and are **not** removed — they
are superseded for `width`/`height` only, by one-class-more-specific selectors, and `padding-inline: 0`
is left untouched because tc agrees with it (`tc-icon-button.styles.ts:13` `padding: 0`).

## Variant / size mapping

| tc-icon-button | HeroUI | Basis | Work needed |
|---|---|---|---|
| `tonal` (default) | `.button--secondary` | `icon-button.tokens.json:6-10` bg `brand.surface`, hover `brand.surface-hover`, fg `brand.primary` = the `--accent-soft` trio | **none** — pass 1 (`button.css:144-148`) already points `.button--secondary` there |
| `filled` | `.button--primary` | `icon-button.tokens.json:11-15` bg `brand.primary`, hover `brand.primary-hover`, fg `text.on-brand` = `--accent` / `--accent-hover` / `--accent-foreground` | **none** — already identical out of the box |
| `size="md"` (default) | `.button--icon-only` (md) | `tc-icon-button.styles.ts:11-12` 48px | **changed** |
| `size="lg"` | `.button--icon-only.button--lg` | `tc-icon-button.styles.ts:37-40` 64px | **changed** |
| — | `.button--icon-only.button--sm` | no tc counterpart | extrapolated on the same 8px icon ring as md |
| — | `.button--tertiary`, `--ghost`, `--outline`, `--danger`, `--danger-soft` | no tc counterpart | untouched, exactly as pass 1 |

## Gap table

Light / dark values are identical for every row below — every Tzu Chi value transferred here is a
mode-independent dimension token (verified: the `[data-theme="dark"]` block of `tokens.css` declares
no `--tc-size-*`, `--tc-space-*`, `--tc-radius-*` or `--tc-icon-button-*`). Colour rows are colour
only, and none of them is touched by this fragment.

| property | Tzu Chi | HeroUI (incl. pass 1) | action |
|---|---|---|---|
| **border-radius** | `tc-icon-button.styles.ts:15` `--tc-icon-button-radius` → `--tc-radius-full` = **9999px** (full circle) | base `button.css:5` `rounded-3xl` = `calc(var(--radius) * 3)`; under tzuchi `--radius` = 8px → **24px**. Pass 1 `button.css:80` makes it **8px** | **changed** — `border-radius: var(--tc-icon-button-radius, var(--tc-radius-full, 9999px))` at `(0,2,0)`. The single most visible difference. |
| **width / height (md)** | `tc-icon-button.styles.ts:11-12` `--tc-size-control-md` = **48px** square (border-box: `box-sizing` inherited from preflight, tc's own `border: 1px solid transparent` is inside it) | base `button.css:5,144-146` `h-10`/`w-10` = **40px**, `md:h-9`/`md:w-9` = **36px** at ≥768px. Pass 1 `button.css:95-99,126-132` → **42px** square at every width | **changed** — `--tzuchi-icon-button-size: var(--tc-size-control-md, 48px)`, consumed by `height` `(0,3,0)` and `width` `(0,4,0)`. |
| **width / height (lg)** | `tc-icon-button.styles.ts:37-40` `--tc-size-control-lg` = **64px** square | base `button.css:87,152-154` `h-11`/`w-11` = 44px, `md:` 40px. Pass 1 `button.css:112-118` → **50px** | **changed** — `var(--tc-size-control-lg, 64px)`. |
| **width / height (sm)** | — (tc has no `sm`) | base `button.css:69,148-150` `h-9`/`w-9` = 36px, `md:` 32px. Pass 1 → **34px** | **changed** — **36px** via `calc(var(--tc-size-icon-sm, 20px) + var(--tc-space-8, 8px) * 2)`, i.e. the same 8px ring md has around its icon. Not a Figma decision; an extrapolation, stated as such. |
| **responsive densification** | none — tc has one size per `size` attribute | `md:h-9` / `md:w-9` etc. at ≥768px | **changed (dropped)** — the fixed `--tzuchi-icon-button-size` out-specifies the `md:` rules, consistent with pass 1's decision to drop `md:` densification for heights. |
| **padding** | `tc-icon-button.styles.ts:13` `padding: 0` | base `button.css:145` `p-0`; pass 1 `button.css:126-128` `padding-inline: 0` | **kept — already matches.** Deliberately **not** re-declared (pass 1 owns that selector). |
| **gap** | n/a — exactly one slotted child | `button.css:5` `gap-2` = 8px | **kept** — inert with a single child. |
| **border-width** | `tc-icon-button.styles.ts:14` **1px** `solid transparent` on every variant | none on the base; `button.css:125` 1px only on `.button--outline` | **kept** — same reasoning as pass 1 (`gap-audit/button.md:43`): tc's transparent border is a layout-shift guard that a fixed-size border-box element does not need. It does mean tc's 48px contains 2 × 1px of border while HeroUI's 48px does not — a 2px inner-content difference, invisible with a centred icon. |
| **border-colour / style** | transparent | per variant; untouched | **kept.** |
| **icon size (md)** | `tc-icon-button.styles.ts:22-26` `--tc-size-icon-md` = **32px** (the `24px` fallback in that file is stale — `tokens.css:54` resolves it to 32px) | `button.css:63-65` `size-5` = **20px**, `sm:size-4` = **16px** at ≥640px | **changed** — 32px, one flat value (tc has no ≥640px icon step). |
| **icon size (lg)** | `tc-icon-button.styles.ts:41-44` `--tc-size-icon-lg` = **40px** | same as md (HeroUI's `lg` does not enlarge the icon) | **changed** — 40px. |
| **icon size (sm)** | — | `button.css:72-74` `size-4` = **16px** | **changed** — 20px (`--tc-size-icon-sm`), keeping the 8px ring. |
| **icon margins** | none | `button.css:64` `-mx-0.5` = −2px, `my-0.5` = 2px, `sm:my-1` = 4px | **kept** — symmetric margins on a flex-centred single child in a fixed-size box move nothing. One fewer declaration. |
| **Spinner / link-icon SVGs** | n/a | excluded by `:not([data-slot="spinner"] svg, [data-slot="link-icon"] svg)` | **kept** — the override mirrors the same exclusion list, so `isPending` spinners keep their own size. |
| **font-family / size / weight / line-height** | n/a — no text in an icon button | pass 1 sets 16px / 700 / 1.5 on `.button` | **kept** — inert with no text node; re-declaring it would be dead weight. |
| **focus ring width** | `tc-icon-button.styles.ts:28` `--tc-focus-ring-width` = **2px** | `utilities/index.css:2-6` `focus-ring` → `ring-2` = **2px** | **kept — already matches.** |
| **focus ring offset** | `tc-icon-button.styles.ts:30` `--tc-focus-ring-offset` = **2px** | `--ring-offset-width`, set to `--tc-focus-ring-offset` by `themes/tzuchi/variables.css:24` = **2px** | **kept — already matches.** |
| **focus ring colour** | `tc-icon-button.styles.ts:29` `--tc-icon-button-focus-ring-color` → `--tc-color-border-focus` = blue-500 light / blue-300 dark | `ring-focus` → `--focus`, which `themes/tzuchi/variables.css:47,89` already sets to **the same two values** | **kept — already matches.** tc paints an `outline`, HeroUI a ring (`box-shadow`); the ring follows `border-radius`, so the circle gets a circular ring for free. |
| **disabled opacity** | `tc-icon-button.styles.ts:33` `--tc-icon-button-disabled-opacity` → `--tc-opacity-disabled` = **0.38** | `status-disabled` → `--disabled-opacity`, set to `--tc-opacity-disabled` by `variables.css:23` = **0.38** | **kept — already matches.** |
| **disabled cursor** | `tc-icon-button.styles.ts:34` `not-allowed` | `utilities/index.css:63` `--cursor-disabled` = `not-allowed` (+ `pointer-events: none`) | **kept — already matches**, HeroUI's is strictly stronger. |
| **hover** | `tc-icon-button.styles.ts:50-52,58-60` variant bg swap only | `button.css:55-60` `--button-bg-hover` inside `@media (hover: hover)` | **kept** — pass 1 already routes the hover fills to `--accent-soft-hover` / `--accent-hover`. |
| **pressed** | none | `button.css:47-52` `transform: scale(0.97)` (sm 0.98, lg 0.96) + `--button-bg-pressed` | **kept** — pass 1's decision (`gap-audit/button.md:56`); tc neither specifies nor contradicts it. |
| **elevation** | none | none (only the focus ring travels through `box-shadow`) | **kept — already matches.** |
| **motion** | `tc-icon-button.styles.ts:19-20` `background-color 150ms cubic-bezier(0.2, 0, 0, 1)` | `button.css:11-14` `transform 250ms`, `background-color 100ms`, `box-shadow 100ms` | **kept** — pass 1's decision (`gap-audit/button.md:57`): overriding means re-declaring the whole shorthand, including the press and focus-ring legs. |
| **tonal / filled colours** | `icon-button.tokens.json:6-15` — identical to `button.tokens.json`'s `tonal` / `filled` | `--accent-soft*` / `--accent*` after pass 1 | **kept — already matches**, zero colour declarations added. |
| **default variant** | `tc-icon-button.ts:24` default `tonal` | `button.styles.ts:11` default `primary`; the icon-only stories pass `tertiary` | **kept** — changing a component's default prop value is a markup/props change, forbidden by the brief. |
| **full-width** | n/a | `button.css:157` `.button--full-width` `w-full` | **kept** — the width rule carries pass 1's `:not(.button--full-width)` guard, so an icon-only + full-width button still stretches (its height still becomes 48px, which is the intended Tzu Chi control height). |
| **ButtonGroup corners** | n/a — Tzu Chi has no ButtonGroup | pass 1 `button.css:167-194` sets 0 / 8px corners at `(0,3,0)`–`(0,4,0)` | **kept working** — the new radius rule is `(0,2,0)` on purpose, so every group corner rule still out-specifies it. Verified by hand and by assertion #8 below. |
| **ButtonGroup cell height** | n/a | `button-group.stories.tsx:434-446` and `:307-313` mix text and icon-only cells in ONE group | **changed (guard added)** — inside `.button-group`, `--tzuchi-icon-button-size` is re-pointed at pass 1's own `--tzuchi-button-block-size`, so a group cell stays 34 / 42 / 50px and the joined control keeps one height. No value is restated, so it cannot drift from pass 1. |

## Cascade check (done by hand against the live files)

| new selector | specificity | must beat | must lose to |
|---|---|---|---|
| `[data-theme^="tzuchi"] .button--icon-only` (radius) | (0,2,0), later in file | pass 1 `[data-theme^="tzuchi"] .button` (0,2,0) ✓ (order) | pass 1 `… .button-group .button` (0,3,0) and `… .button-group--*  .button:first/last-child` (0,4,0) ✓ |
| `… .button--icon-only.button--sm` / `.button--lg` (vars) | (0,3,0) | `… .button--icon-only` (0,2,0) ✓ | the group rule below (0,3,0, later) ✓ |
| `… .button-group .button--icon-only` (vars) | (0,3,0), later | the two size rules (0,3,0) ✓ (order) | — |
| `… .button.button--icon-only { height }` | (0,3,0) | pass 1 `… .button { height }` (0,2,0) ✓; base `.button{h-10}`, `.button--sm/--lg`, all `md:` variants (0,1,0) ✓ | — |
| `… .button.button--icon-only:not(.button--full-width) { width }` | (0,4,0) | pass 1 `… .button--icon-only:not(.button--full-width)` (0,3,0) ✓; base `.button--icon-only{w-10}` etc. (0,1,0)/(0,2,0) ✓ | HeroUI `.button--full-width{w-full}` — excluded by the `:not()`, same as pass 1 ✓ |
| `… .button--icon-only svg:not(…)` | (0,3,2) | base `.button svg:not(…)` and `.button--sm svg:not(…)`, both (0,2,2) ✓ | — |

`:not([data-slot="spinner"] svg, [data-slot="link-icon"] svg)` contributes (0,1,1) — the highest
specificity among its arguments — in every row above.

## Not transferable

1. **HeroUI's `sm` size** has no tc counterpart. 36px / 20px is an extrapolation from md's 8px icon
   ring, not a Figma decision.
2. **HeroUI's `md:` responsive densification** (`md:w-9` / `md:h-9` …) — Tzu Chi has no responsive
   control sizing at all, so it is dropped for icon-only, consistent with pass 1's heights.
3. **HeroUI's `sm:size-4` icon step at ≥640px** — dropped for icon-only for the same reason. It is
   still kept for text buttons (pass 1's decision), which is why an icon-only cell inside a
   ButtonGroup is pinned to a flat 20px: at ≥640px that is 4px larger than the 16px icons of the
   text cells beside it. Accepted as the smaller of two evils (the alternative is a hard-coded
   `1rem` inside a media query, which is not a token).
4. **ButtonGroup** has no Tzu Chi counterpart. Its cells therefore do **not** get the Tzu Chi
   circle or the 48/64px control size — they keep pass 1's joined-control shape and rhythm. A round
   48px cell inside a 42px joined control would be wrong on both counts.
5. **CloseButton** (`styles/components/close-button.css`, `.close-button`, 24px, `rounded-xl`) is a
   separate HeroUI component with no Tzu Chi counterpart. No selector in this fragment can reach it
   — it does not carry `.button` or `.button--icon-only`. Left entirely alone.
6. **ToggleButton / ToggleButtonGroup** (`components-buttons-togglebutton--icon-only`) are separate
   components with their own classes; out of scope for this fragment and untouched.
7. **tc's `border: 1px solid transparent` on every variant** — a layout-shift guard HeroUI does not
   need (border-box + fixed size). Same call as pass 1.
8. **tc's `outline`-based focus ring** vs HeroUI's `box-shadow` ring — same width, offset and
   colour, different mechanism. Left as HeroUI's; it follows `border-radius`, so the circle gets a
   circular ring.
9. **tc's default variant (`tonal`)** cannot be transferred: HeroUI's default is `primary` and
   changing it is a props change, not a theme change.

## Extra theme variables needed

**None.** No colour is declared by this fragment. `--tzuchi-icon-button-size` and
`--tzuchi-icon-button-icon-size` are **local calc helpers** — exactly like pass 1's
`--tzuchi-button-block-size` — resolving only from mode-independent `--tc-size-*` / `--tc-space-*`
dimension tokens. They must **not** be added to `generate.mjs`.

## Browser assertions (headless, `data-theme="tzuchi"` or `"tzuchi-dark"`, identical in both)

All initial-state, no reveal step. Every asserted element is a `tertiary` variant, i.e. zero border
and zero padding, so the border-box and content-box readings coincide.

| # | story id | selector | property | expected |
|---|---|---|---|---|
| 1 | `components-buttons-button--with-icon-only` | `.button--icon-only` | `border-top-left-radius` | `9999px` |
| 2 | `components-buttons-button--with-icon-only` | `.button--icon-only` | `height` | `48px` |
| 3 | `components-buttons-button--with-icon-only` | `.button--icon-only` | `width` | `48px` |
| 4 | `components-buttons-button--with-icon-only` | `.button--icon-only svg` | `width` | `32px` |
| 5 | `components-buttons-button--sizes` | `.button--icon-only.button--sm` | `height` | `36px` |
| 6 | `components-buttons-button--sizes` | `.button--icon-only.button--lg` | `height` | `64px` |
| 7 | `components-buttons-buttongroup--with-icons` | `.button-group .button--icon-only` | `height` | `42px` (group guard — would be 48px without it) |
| 8 | `components-buttons-buttongroup--with-icons` | `.button-group--horizontal .button--icon-only:first-child` | `border-top-left-radius` | `8px` (pass 1's group corner still wins) |
