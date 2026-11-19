# progress-bar — Tzu Chi gap report

**tc-progress** (`CISwebsite/packages/components/src/progress/`, `progress.tokens.json`)
↔ **HeroUI ProgressBar** (`heroui/styles/components/progress-bar.css`,
`heroui/react/src/components/progress-bar/`).

Output: `heroui/styles/themes/tzuchi/components/progress-bar.css` (new file).
Closeness: **minor gaps** — structure, density and the fill colour already line
up; four things differ (corner radius, readout typography, readout colour,
motion timing).

## Resolution baseline

Under `data-theme^="tzuchi"` the radius scale is *unchanged* from HeroUI's
default: `themes/tzuchi/variables.css:19` sets `--radius: var(--tc-radius-md)`
= 8px, and `themes/default/variables.css:33` already had `--radius: 0.5rem`
= 8px. So `themes/shared/theme.css:104-107` resolves to
`--radius-xs` 2px · `--radius-sm` 4px · `--radius-md` 6px · `--radius-lg` 8px.
`--spacing` is `0.25rem` (`themes/default/variables.css:18`), so `h-1/2/3` =
4/8/12px and `gap-1` = 4px. `--text-sm` = 0.875rem with line-height
`calc(1.25 / .875)` → **14px / 20px**; `--font-weight-medium` = 500;
`--ease-out` = `cubic-bezier(0, 0, .2, 1)`.

Variant defaults: `progress-bar.styles.ts:6-9` → `color: "accent"`,
`size: "md"`, i.e. the story's initial state is `.progress-bar--accent
.progress-bar--md`.

## Gap table

| Property | Tzu Chi (file:line → resolved) | HeroUI (file:line → resolved) | Action |
|---|---|---|---|
| **Track radius** | `tc-progress.styles.ts:14` `--tc-progress-radius` → `tokens.css:201` → `--tc-radius-full` = **9999px** (pill) | `progress-bar.css:29` `rounded-sm` → **4px** (`--sm`: `rounded-xs` 2px, `:90-92`; `--lg`: `rounded-md` 6px, `:104-106`) | **Changed** → `--tc-progress-radius` on the root scope, so all three sizes become pills |
| **Fill radius** | `tc-progress.styles.ts:22` `border-radius: inherit` → **9999px** | `progress-bar.css:38` `rounded-sm` → **4px** (`--sm` 2px `:95-97`, `--lg` 6px `:109-111`) | **Changed** → same token; the leading edge rounds exactly as tc's does |
| **Track height** | `tc-progress.styles.ts:12` `--tc-progress-height` → `tokens.css:104` = **8px** | `progress-bar.css:34` `h-2` = **8px** at `md` (`sm` `h-1` 4px `:91`, `lg` `h-3` 12px `:105`) | **Kept — identical.** tc has one size; it *is* HeroUI `md`. `sm`/`lg` have no tc counterpart and keep HeroUI's heights |
| **Track fill** | `tc-progress.styles.ts:13` `--tc-progress-track-bg` → `tokens.css:351` → `color.surface.subtle` → light `#f8f8f8` / dark `#161618` | `progress-bar.css:29` `bg-default` → `--default` → light `#f2f2f2` / dark `#333333` | **Kept — deliberate.** The theme maps `color.surface.subtle`'s primitive onto `--background` in *both* modes (`variables.css:38,80`), i.e. the page colour: a `--background` track would be invisible. `--default` is itself a Tzu Chi token now, one ramp step from tc's intent in light and the only readable choice in dark |
| **Fill colour (default)** | `tc-progress.styles.ts:21` → `tokens.css:352` → `color.brand.primary` → light `#1b2d58` / dark `#a9c2ea` | `progress-bar.css:14,123` `--progress-bar-fill: var(--accent)` → same primitives (`variables.css:30,72`) | **Kept — already identical** in both modes |
| **Row gap** | `tc-progress.styles.ts:45` `.value { margin-block-start: --tc-space-4 }` = **4px** | `progress-bar.css:7` `gap-1` = **4px** | **Kept — identical** |
| **Readout font-size** | `tc-progress.styles.ts:46` `--tc-progress-font-size` → `tokens.css:202` → `--tc-font-size-16` = **16px** | `progress-bar.css:23` `text-sm` = **14px** | **Changed** → `--tc-progress-font-size` |
| **Readout line-height** | inherited body type = `--tc-line-height-relaxed` **1.6** (25.6px) | `text-sm` pairing = **1.4286** (20px) | **Changed** → 1.6, matching pass 1 (`input.css:56`, `checkbox.css:133`, `switch.css`) |
| **Readout font-weight** | `.value` sets none → body **400** | `progress-bar.css:23` `font-medium` = **500** | **Changed** → `--tc-font-weight-regular` |
| **Readout colour** | `tc-progress.styles.ts:47` `--tc-progress-label-fg` → `tokens.css:353` → `color.text.muted` → light gray-700 `#828282` / dark gray-400 `#b3b3b3` | not set → inherits `--foreground` (near-black / near-white) | **Changed** → `var(--muted)`, which the theme resolves to exactly those two primitives (`variables.css:44,86`). *Contrast caveat below.* |
| **Readout numerals** | none | `progress-bar.css:23` `tabular-nums` | **Kept** — a strict improvement, nothing in tc contradicts it |
| **Label font-size / line-height** | *no counterpart* — tc-progress has no label slot, only `aria-label` (`tc-progress.ts:55`) | `progress-bar.css:17` `text-sm` = **14px / 20px** | **Changed** → 16px / 1.6. Rule-5 "consistent with the same tokens": the label shares the grid row with the readout, and at 14/20 vs 16/25.6 the two stop sharing a baseline |
| **Label font-weight / colour** | *no counterpart* | `progress-bar.css:17` `font-medium` 500; `label.css:4` `text-foreground` | **Kept** — no tc record to contradict HeroUI's label-over-readout hierarchy |
| **Label `w-fit`, grid areas, `--required`/`--invalid`/`--disabled`** | *no counterpart* | `progress-bar.css:16-20`, `label.css:9-27` | **Kept** — structure and other components' concern |
| **Fill transition** | `tc-progress.styles.ts:23-24` `inline-size 200ms cubic-bezier(0.2, 0, 0, 1)` (`tokens.css:63-64`) | `progress-bar.css:46` `width 300ms cubic-bezier(0, 0, .2, 1)` | **Changed** → `transition-duration` + `transition-timing-function` longhands only, so `transition-property: width` (which is what `ProgressBar.Fill` sets inline, `progress-bar.tsx:138`) and the `motion-reduce` guard both survive |
| **Indeterminate width** | `tc-progress.styles.ts:29` `inline-size: 40%` | `progress-bar.css:53` `w-2/5` = **40%** | **Kept — identical** |
| **Indeterminate easing** | `tc-progress.styles.ts:31` `linear` | `progress-bar.css:55` `cubic-bezier(.65, 0, .35, 1)` (ease-in-out) | **Changed** → `animation-timing-function: linear`, the one part of tc's glide that is independent of the keyframes |
| **Indeterminate duration** | `tc-progress.styles.ts:31` **1.2s** | `progress-bar.css:55` **1.5s** | **Kept — deliberate.** HeroUI's keyframes travel further (`translateX(-100%)` → `translateX(350%)` = 450% of the bar's own width, vs tc's `margin-inline-start: -40%` → `100%` = 350%). At 1.5s that is 300 %bar/s against tc's 291.7 %bar/s — within 3%. Matching the raw duration would have made it 25% *faster* than tc |
| **Indeterminate keyframes** | `tc-progress.styles.ts:34-41` margin-based | `progress-bar.css:77-84` transform-based | **Kept** — base-file keyframes, not reachable from a theme file. See notTransferable |
| **Reduced motion** | `tc-progress.styles.ts:51-59` drops both the transition and the slide | `progress-bar.css:47,57` `motion-reduce:transition-none` → `transition-property: none`; `motion-reduce:animate-none` → `animation: none` | **Kept — equivalent, and provably unbroken.** This file never declares `transition-property` or `animation-name`, so both guards still win where it matters |
| **Disabled** | *no counterpart* — tc-progress has no disabled state | `progress-bar.css:62-70` `status-disabled` (`opacity: var(--disabled-opacity)`, `cursor`, `pointer-events: none`) with the label forced back to `opacity: 1` | **Kept** — and already tc-correct: `variables.css:23` maps `--disabled-opacity` to `--tc-opacity-disabled` = **0.38** (`tokens.css:58`) |
| **Colour variants `default` / `success` / `warning` / `danger`** | *no counterpart* — tc-progress has one fill | `progress-bar.css:118-136` → `--default-foreground` / `--success` / `--warning` / `--danger` | **Kept untouched** — all four already resolve through theme variables this theme maps per mode (`variables.css:36-37,51-54,78-79,93-96`) |
| **Border (width / colour / style)** | none on `.track` or `.fill` | none | **Kept** — neither side draws one |
| **Padding** | none (`.track` has no padding; the fill fills it) | none | **Kept** |
| **Font family** | `--tc-font-family-base` | `--font-sans`, which `variables.css:25` already maps to `--tc-font-family-base` | **Kept — already themed** |
| **Icon sizes** | no icons | no icons | n/a |
| **Focus ring** | none — `role="progressbar"`, never focusable (`tc-progress.ts:49`) | none — react-aria `ProgressBar` renders a non-focusable `div` | n/a |
| **Elevation / shadow** | none | none | n/a |

### Contrast caveat (inherited, not introduced here)

`--muted` in the light theme is gray-700 `#828282`, which is **3.62:1** on the
`--background` page — below WCAG AA 4.5:1. This is the exact issue already
recorded in `heroui/MAINTAINING.md` under "Design decisions for the token owners"
(it hits descriptions, breadcrumbs and every placeholder). Painting the readout
`--muted` is faithful to `progress.tokens.json:7`; fixing the primitive is a
token-owner decision, not a theme one.

### Meter (`styles/components/meter.css`)

Not styled, per the brief. For the record: `meter.css` is a line-for-line twin
of `progress-bar.css` — same grid, same `gap-1`, same `h-2` / `rounded-sm`
track, same `bg-default`, same `text-sm font-medium` label and
`text-sm font-medium tabular-nums` output, same `width 300ms var(--ease-out)`
fill transition, same five colour variants and same `status-disabled` block.
**The same override would apply verbatim**, with the class prefix swapped
(`.meter`, `.meter__track/__fill/__output`) and rule 4b dropped: Meter has no
indeterminate state (`meter.css` has no `:not([aria-valuenow])` block). If it
is ever themed, it must be its own `meter.css` override file — nothing in the
progress-bar file may be widened to cover it.

## notTransferable

1. **Readout placement.** tc renders the percentage as a block *below* the
   track (`tc-progress.styles.ts:43-48`, `margin-block-start: 4px`). HeroUI
   uses a two-row grid (`grid-template-areas: "label output" / "track track"`,
   `progress-bar.css:8-11`) that puts the readout top-right, above the track.
   Changing it means changing HeroUI's layout contract and its `Label` slot —
   out of scope.
2. **Label slot.** tc-progress has none; its accessible name comes from
   `aria-label` (`tc-progress.ts:55`, defaulting to "進度"). HeroUI expects a
   `<Label>` child. The label's *weight* and *colour* therefore have no Tzu Chi
   source and stay HeroUI's.
3. **Indeterminate keyframes.** tc slides via `margin-inline-start` (-40% →
   100% of the track); HeroUI via `transform: translateX()` (-100% → 350% of
   the bar). `@keyframes progress-bar-indeterminate` lives in the base file and
   a theme file cannot redefine it without shadowing an upstream at-rule, so
   only the easing is matched and the duration is left where it reproduces tc's
   velocity.
4. **`show-value` / `formatOptions`.** tc renders `Math.round(percent) + "%"`
   itself and gates it behind a `show-value` attribute
   (`tc-progress.ts:35,76-78`). HeroUI delegates formatting to react-aria's
   `valueText` and gates visibility by whether `<ProgressBar.Output>` is
   rendered. Behaviour/markup, not CSS.
5. **`aria-busy`.** tc sets `aria-busy="true"` while indeterminate
   (`tc-progress.ts:59`); react-aria does not. Not a styling concern, but worth
   noting if the two are ever meant to be behaviourally interchangeable.
6. **Extra HeroUI surface with no tc counterpart:** the `sm`/`lg` sizes, the
   four non-accent colour variants and the whole disabled state. All kept and
   given tc-consistent values (pill radius) rather than removed.

## extraThemeVars

None. Every colour this file needs already exists as a HeroUI theme variable
that the generated Tzu Chi theme resolves per mode (`--muted` for the readout,
`--accent` and `--default` untouched for fill and track).
