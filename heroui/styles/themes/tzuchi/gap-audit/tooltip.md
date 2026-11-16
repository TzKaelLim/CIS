# Tooltip — Tzu Chi vs HeroUI gap inventory

**Component:** tc-tooltip ↔ HeroUI Tooltip
**Override file:** `heroui/styles/themes/tzuchi/components/tooltip.css`
**Closeness:** major gaps — the two are the same *object* but a different *species*:
tc's tooltip is an inverted high-contrast bubble (dark on light, light on dark),
HeroUI's is a light popover surface. Everything else (radius, density, type) differs too.

## Sources read

| side | file |
|---|---|
| tc | `packages/components/src/tooltip/tc-tooltip.styles.ts` |
| tc | `packages/components/src/tooltip/tc-tooltip.ts` |
| tc | `packages/tokens/src/component/tooltip.tokens.json` |
| tc (resolved) | `packages/tokens/dist/tokens.css` |
| heroui | `heroui/styles/components/tooltip.css` |
| heroui | `heroui/styles/src/components/tooltip/tooltip.styles.ts` |
| heroui | `heroui/react/src/components/tooltip/tooltip.tsx` |
| heroui | `heroui/react/src/components/tooltip/tooltip.stories.tsx` |
| heroui | `heroui/styles/themes/{default,shared,tzuchi}/…` |

## Structural / variant mapping

`tooltipVariants` (tooltip.styles.ts:5-12) has **no variants and no sizes** — only two
slots, `base → .tooltip` and `trigger → .tooltip__trigger`. tc-tooltip likewise has no
variant axis; its `placement` attribute is the same axis as HeroUI's `data-placement`,
and `open` / `disabled` are state, not variants.

| tc | HeroUI | note |
|---|---|---|
| `part="bubble"` / `.bubble` (tc-tooltip.ts:127) | `.tooltip` (the portalled popover) | 1:1 |
| `part="arrow"` / `.arrow` (tc-tooltip.ts:134) | `[data-slot="overlay-arrow"]` svg inside `[data-slot="tooltip-arrow"]` (tooltip.tsx:137-168) | 1:1, different geometry |
| default slot = trigger (tc-tooltip.ts:125) | `.tooltip__trigger` (tooltip.tsx:180-208) — optional; the `Default` story passes a `<Button>` straight through instead | tc never styles the trigger |
| `[placement=top\|bottom\|left\|right]` | `data-placement` + 20 more alignments | HeroUI is a superset |
| `[open]` | React Aria `data-entering` / `data-exiting` + conditional mount | |
| `[disabled]` | `isDisabled` on the trigger | behaviour only, no CSS on either side |

**Nothing is lost** — the override touches only `.tooltip` and its arrow; every
placement, state and the trigger slot keep their upstream rules.

## Gap table

`radius-xl` under the Tzu Chi theme = `calc(var(--radius) * 1.5)` where
`--radius = --tc-radius-md = 8px` → **12px**, so `min(32px, var(--radius-xl))` → **12px**.
Tailwind v4 defaults apply for `p-2` (`--spacing 0.25rem × 2 = 8px`), `text-xs`
(`0.75rem` + `--text-xs--line-height: calc(1/0.75)` → 12px/16px) and `max-w-xs` (20rem).

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| **border-radius** | `tc-tooltip.styles.ts:23` → `--tc-tooltip-radius` = `--tc-radius-sm` = **4px** (tokens.css:219, :49) — same both modes | `tooltip.css:6` `min(32px, var(--radius-xl))` = **12px** | **changed** → `var(--tc-tooltip-radius, var(--tc-radius-sm, 4px))` |
| **background** | `:22` `--tc-tooltip-bg` = `{color.text.default}` → light `#333333` (gray-900) / dark `#f2f2f2` (gray-100) — *inverted on purpose* (tooltip.tokens.json:3-7) | `:5` `bg-overlay` = `var(--overlay)` → tzuchi `#ffffff` / tzuchi-dark `#1c1c1e` — same colour as a popover | **changed** → `background-color: var(--foreground)`. `--foreground` resolves to `--tc-color-gray-900` / `--tc-color-gray-100` (themes/tzuchi/variables.css:37, :72) — byte-identical to what `--tc-color-text-default` resolves to per mode, without the forbidden token |
| **text colour** | `:21` `--tc-tooltip-fg` = `{color.surface.default}` → light `#ffffff` / dark `#1c1c1e` | not declared — inherits `--foreground` from `body` (storybook/.storybook/globals.css:25 + base cascade) | **changed** → `color: var(--surface)` (variables.css:38, :73 → `--tc-color-white` / `--tc-color-gray-950`). Contrast: 12.6:1 light, 14.9:1 dark |
| **padding (block)** | `:16` `--tc-tooltip-padding-block` = **4px** (tokens.css:111) | `:5` `p-2` → **8px** | **changed** → `padding-block: var(--tc-tooltip-padding-block, 4px)` |
| **padding (inline)** | `:17` `--tc-tooltip-padding-inline` = `--tc-space-8` = **8px** (tokens.css:220, :39) | `:5` `p-2` → **8px** | **changed** in form only — same 8px, but written as the logical longhand so it survives the block override; no visual change |
| **max width** | `:14` `--tc-tooltip-max-width` = **240px** (tokens.css:112) | `:5` `max-w-xs` = 20rem = **320px** | **changed** → `max-inline-size: var(--tc-tooltip-max-width, 240px)` |
| **height / min-size** | none — content-sized (4+24+4 = **32px** at one line) | none — content-sized (8+16+8 = **32px** at one line) | **kept** — neither sets one; the line box does the work |
| **font-family** | `:18` `--tc-font-family-base` = `'Noto Sans TC', system-ui, …` (tokens.css:81) | inherited `--font-sans` | **kept** — the theme already maps `--font-sans: var(--tc-font-family-base)` (variables.css:25) and Storybook's unlayered override is reverted for `tzuchi*` (globals.css:41-43) |
| **font-size** | `:19` `--tc-tooltip-font-size` = `--tc-font-size-16` = **16px** (tokens.css:221, :85) | `:5` `text-xs` = **12px** | **changed** → `var(--tc-tooltip-font-size, var(--tc-font-size-16, 16px))`. Deliberately large; it is the recorded Figma value |
| **line-height** | `:20` `--tc-line-height-normal` = **1.5** → 24px at 16px (tokens.css:93) | `text-xs` → `calc(1/0.75)` → **16px** at 12px | **changed** → `var(--tc-line-height-normal, 1.5)` = 24px |
| **font-weight** | not set → 400 | not set → 400 | **kept** — identical |
| **word breaking** | `:28` `white-space: normal`, no `word-break` → **normal** | `:5` `break-all` | **changed** → `word-break: normal` + `overflow-wrap: anywhere`. `break-all` chops Latin words mid-word; the `overflow-wrap` keeps upstream's protection for a single unbreakable token inside the 240px cap |
| **border (bubble)** | none | none | **kept** |
| **border (arrow)** | `:45-51` none — the arrow is the bubble background only | `:45` `stroke-border/40` = `color-mix(in oklab, var(--border) 40%, transparent)` hairline | **changed** → `stroke: var(--foreground)`, i.e. folded into the fill so the arrow reads as one shape with the bubble, as on the tc side. Stroke is kept (not `none`) so the path's antialiased edge stays smooth |
| **arrow fill** | `:49` = bubble bg (inverted) | `:46` `fill: var(--overlay)` | **changed** → `fill: var(--foreground)` — follows the inverted bubble |
| **arrow geometry** | `:45-51` 8×8 square rotated 45° → visible ≈ 11.3 × 5.7px | `tooltip.tsx:139-149` 12×12 svg, curved path `M0 0C5.48 8 6.5 8 12 0Z` → ≈ 12 × 8px, and `:50-60` rotates per placement | **kept** — HeroUI's arrow is a nicer shape, within 1px of tc's footprint, and its rotation table is placement-complete. Not a Figma decision on the tc side |
| **gap trigger → bubble** | `:58,:71,:84,:97` `margin-*: var(--tc-space-8)` = **8px** | `tooltip.tsx:117` `offset = showArrow ? 7 : 3` (React Aria prop, px) | **not transferable from CSS** — it is a JS prop on `<Tooltip.Content>`, not a declaration. 7px vs 8px; left alone |
| **elevation** | `:24-27` `--tc-tooltip-shadow` = `elevation.2` = `0px 2px 6px 0px #0000001a` light / `#00000066` dark (tokens.css:222, :35, :410) | `:7` `box-shadow: var(--overlay-shadow)` → tzuchi light `0px 6px 16px 0px #0000001f` (variables.css:60); tzuchi-dark inherits default's `0 0 1px 0 rgba(255,255,255,.3) inset` (default/variables.css:260) | **kept** — `--tc-tooltip-shadow` is emitted as a light-mode literal and is forbidden under rule 3. `--overlay-shadow` is the theme's own per-mode overlay elevation and is in the same ballpark. Note for the owner: under `tzuchi-dark` the inherited inset hairline is invisible on the near-white bubble, so the dark tooltip has effectively no shadow — a theme-variable question, not a component one |
| **focus ring** | none — tc-tooltip does not style its slotted trigger (`tc-tooltip.styles.ts` has no `:focus-visible` rule) | `:77-80` `.tooltip__trigger:focus-visible → status-focused`; `--ring-offset-width` already Tzu Chi's (`--tc-focus-ring-offset`, variables.css:24) | **kept** — nothing on the tc side to transfer, and removing it would break keyboard affordance (rule 5) |
| **disabled treatment** | `tc-tooltip.ts:71` `disabled` → never opens; no CSS | `isDisabled` on the trigger; no CSS on `.tooltip` | **kept** — identical (behavioural, not visual) on both sides |
| **pointer-events** | `:29` `pointer-events: none` on the bubble always | `:35` `pointer-events-none` only while `data-exiting` | **kept** — HeroUI's is deliberate (`Stays non-interactive while closing`) and lets a hoverable tooltip work; tc's blanket `none` is a limitation of its CSS-only positioning, not a design decision |
| **motion (enter)** | `:33-35` opacity + visibility, `--tc-motion-duration-fast` **150ms**, `--tc-motion-easing-standard` `cubic-bezier(0.2,0,0,1)` (tokens.css:62, :64) | `:11` `animate-in duration-150 ease-smooth fade-in-0 zoom-in-90` + `slide-in-from-*-1` per placement; `--ease-smooth: ease` (shared/theme.css:114) | **kept** — same 150ms; HeroUI adds a 90% zoom and a 4px directional slide that tc's CSS-only bubble simply could not do. Easing differs (`ease` vs `cubic-bezier(.2,0,0,1)`) but that is a theme-wide variable, not a tooltip decision |
| **motion (exit)** | same 150ms fade | `:33` `animate-out duration-100 zoom-out-95 fade-out` | **kept** — same reasoning |
| **reduced motion** | `:106-110` `transition: none` | `:75` on the trigger only; the popover's keyframes are not `motion-reduce`-guarded | **kept** — an upstream gap, not a Tzu Chi theming matter. Flagged for the owner |
| **open / close delay** | none — `tc-tooltip.ts:49` shows on `pointerenter` immediately | `default/variables.css:50-51` `--tooltip-delay: 1500ms`, `--tooltip-close-delay: 500ms`, read via `useCSSVariable` (tooltip.tsx:77-81) | **kept** — there is no Tzu Chi token for it, so setting one would be inventing a decision. Worth a conscious call: 1500ms is a very different feel from tc's instant reveal, and it *is* settable from the theme if the owner wants it |
| **z-index / stacking** | `:12` `--tc-tooltip-z` = `--tc-z-popover` = **1400** | React Aria hard-codes `z-index: 100000` on the portal; `base/base.css:37` documents `--z-index-overlay: 100000` | **kept** — HeroUI's whole overlay stack is coordinated at 100000; re-basing the tooltip alone to 1400 would put it under every other overlay |
| **transform-origin** | n/a (CSS-positioned, `translateX(-50%)`) | `:5` `origin-(--trigger-anchor-point)` | **kept** — part of the anchor-positioning machinery |

## Colour-rule compliance

No `--tc-color-*` and no component token that resolves to a colour is referenced, and
there is no hex/rgb literal. The two colours used are `--foreground` and `--surface`,
which the generated theme already redefines under `[data-theme="tzuchi-dark"]`
(variables.css:72-73), and which land on exactly the same primitives that
`--tc-tooltip-bg` / `--tc-tooltip-fg` resolve to in each mode:

| | tc token chain | HeroUI variable chain |
|---|---|---|
| light bg | `--tc-tooltip-bg → --tc-color-text-default → --tc-color-gray-900` = `#333333` | `--foreground → --tc-color-gray-900` = `#333333` |
| dark bg | `… → --tc-color-gray-100` = `#f2f2f2` | `--foreground → --tc-color-gray-100` = `#f2f2f2` |
| light fg | `--tc-tooltip-fg → --tc-color-surface-default → --tc-color-white` = `#ffffff` | `--surface → --tc-color-white` = `#ffffff` |
| dark fg | `… → --tc-color-gray-950` = `#1c1c1e` | `--surface → --tc-color-gray-950` = `#1c1c1e` |

So **no extra theme variables are needed** for this component.

All the dimension tokens used (`--tc-tooltip-radius`, `-padding-block`,
`-padding-inline`, `-font-size`, `-max-width`, `--tc-radius-sm`, `--tc-space-8`,
`--tc-font-size-16`, `--tc-line-height-normal`) live in the single `:root` block of
`tokens.css` (lines 5–402) and are never re-declared under `[data-theme="dark"]`
(lines 408-429) or the media query (431-454) — mode-independent, as rule 3 requires.
Each is written with a literal fallback so the file still works if `tokens.css` is absent.

## Notes on the CSS itself

- `max-inline-size` beats the base rule's `max-width` on specificity
  (`[data-theme^="tzuchi"] .tooltip` = 0,2,0 vs `.tooltip` = 0,1,0); logical and
  physical properties cascade together, the winning declaration deciding the used value.
- `padding-block` / `padding-inline` similarly beat the `p-2` shorthand per longhand.
- The nested `& [data-slot="overlay-arrow"]` expands to 0,3,0, above the base's 0,2,0.
- No `!important` anywhere; the base rules use none.

## Verification caveat for the browser assertions

`.tooltip` is portalled and **conditionally mounted** — it does not exist in the DOM
until the trigger is hovered or focused. The `Default` story sets `delay={0}`
(tooltip.stories.tsx:57), so a hover on the `.button` inside the story opens it with no
wait, but a checker that merely loads the story and queries `.tooltip` will find nothing.
Nothing else in the story is touched by this file, so there is no hover-free alternative.
