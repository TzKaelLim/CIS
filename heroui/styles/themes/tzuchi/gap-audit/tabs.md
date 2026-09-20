# tabs — Tzu Chi vs HeroUI gap report

**Component:** `tc-tabs` / `tc-tab` ↔ HeroUI `tabs`
**Override CSS:** `/private/tmp/claude-501/-Users-kaellim-Desktop-Personal-CISwebsite/1c74be25-055e-47fb-a92f-f47cfe608bb0/scratchpad/atoms/css/tabs.css`
**Closeness:** minor gaps — the structures line up (HeroUI's `secondary` variant *is* the
tc underline tab: flat container, 1px bottom divider, 2px accent line indicator, and the
divider/indicator colours already resolve to the right tc tokens through `--border` /
`--accent`). The gaps are type, density, hover, focus and two corner decisions.

## Variant mapping

| tc | HeroUI | note |
|---|---|---|
| `tc-tabs[variant="web"]` | `tabs--secondary` (horizontal) | same anatomy; tc adds a 4px gap and hugs its tabs (HeroUI stretches — see "not transferable") |
| `tc-tabs[variant="mobile"]` | `tabs--secondary` (horizontal) | tc stretches tabs with `flex: 1 1 0`; HeroUI's `.tabs__tab` is already `w-full`, so this is HeroUI's default behaviour — nothing to do |
| — | `tabs` primary (segmented pill) | no tc counterpart. Kept as a segmented control, re-tokenised with the tc type ramp, density, 8px corner, hover fill and inset focus ring (per "give the rest values consistent with the same tokens") |
| — | `[data-orientation="vertical"]`, `Tabs.Panel`, `Tabs.Separator`, scroll chevrons | no tc counterpart; left alone (only the shared `.tabs__tab` rules reach the vertical tabs) |

## Gap table

Resolved under `data-theme="tzuchi*"`: `--radius` = `--tc-radius-md` = **8px**, `--spacing` = 0.25rem,
`--text-sm` = 0.875rem, `--ring-offset-width` = `--tc-focus-ring-offset` = 2px,
`--disabled-opacity` = `--tc-opacity-disabled` = 0.38.

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| **font-family** | `tc-tab.styles.ts:12` `--tc-typography-tab-sm` → `'Noto Sans TC', system-ui, …` | `tabs.css:124` inherits `--font-sans` | **kept** — the theme already sets `--font-sans: var(--tc-font-family-base)` (`themes/tzuchi/variables.css:25`) |
| **font-size** | `tc-tab.styles.ts:12` → **20px** | `tabs.css:124` `text-sm` → **14px** | **changed** — `font: var(--tc-typography-tab-sm)` on `.tabs__tab` |
| **font-weight (idle)** | `tc-tab.styles.ts:12` → **500** | `tabs.css:124` `font-medium` → **500** | **kept** — identical (arrives via the same `font` shorthand) |
| **font-weight (selected)** | `tc-tab.styles.ts:30` `--tc-font-weight-bold` → **700** | `tabs.css:141` — no weight change (**500**) | **changed** — `font-weight: var(--tc-font-weight-bold)` on `[data-selected="true"]` |
| **line-height** | `tc-tab.styles.ts:12` → **1.5** (= 30px) | `tabs.css:124` `text-sm` → 1.25/0.875 = **20px** | **changed** — part of the `font` shorthand |
| **tab height** | `tc-tab.styles.ts:11` none — content + 12px block padding → **54px** | `tabs.css:124` `h-8` → **32px** fixed | **changed** — `block-size: auto` |
| **tab padding-block** | `tc-tab.styles.ts:11` `--tc-space-12` → **12px** | `tabs.css:124` none (**0**) | **changed** — `padding-block: var(--tc-space-12)` |
| **tab padding-inline** | `tc-tab.styles.ts:11` `--tc-space-16` → **16px** | `tabs.css:124` `px-4` → **16px** | **kept** — already identical |
| **icon ↔ label gap** | `tc-tab.styles.ts:10` `--tc-space-8` → **8px** | `tabs.css:124` none (**0**) | **changed** — `gap: var(--tc-space-8)`. Safe: `Tabs.Indicator`/`Tabs.Separator` are absolutely positioned, so they are out of flow |
| **icon size** | `tc-tab.styles.ts:62-65` `--tc-size-icon-md` → **32px** | not styled — an icon is an ordinary child | **kept** — HeroUI tabs do not own icon sizing; a bare `svg {}` rule would fight the per-story utilities (`WithCustomStyle`, `Showcase1`). Consumers size their own icon |
| **tab radius (primary)** | tc tab has **no** radius (`tc-tab.styles.ts:5-22`); tc's corner language is 8px (`--tc-radius-md`, same as `.button`) | `tabs.css:124` `rounded-3xl` = `calc(--radius*3)` → **24px** | **changed** — `var(--tc-radius-md)` → **8px**, matching the `.button` precedent in `themes/tzuchi/components/index.css:11` |
| **tab radius (secondary)** | none | `tabs.css:264` `rounded-none` → **0** | **kept** — already identical |
| **list-container radius (primary)** | n/a (tc has no segmented control) | `tabs.css:19` `calc(--radius*2.5)` → **20px** | **changed** — `calc(--tc-radius-md + --tc-space-4)` → **12px**, concentric with the new 8px tab inside the list's 4px inset |
| **list-container radius (secondary)** | n/a | `tabs.css:250` `rounded-none` → **0** | **kept** — my primary rule is scoped `:not(.tabs--secondary)` so it cannot leak here |
| **list padding** | n/a (tc has no list wrapper) | `tabs.css:105` `p-1` → **4px**; `:254` `p-0` in secondary | **kept** |
| **gap between tabs (horizontal)** | `tc-tabs.styles.ts:13` `--tc-space-4` → **4px** (web); **0** (mobile, `:22`) | `tabs.css:108` none (**0**) | **changed** for `secondary` only — `column-gap: var(--tc-space-4)` → 4px. Left at 0 in `primary`, where segments sit flush inside one pill |
| **gap between tabs (vertical)** | n/a | `tabs.css:114` `gap-1` → **4px** | **kept** — already equals `--tc-space-4` |
| **divider (border width/style/colour)** | `tc-tabs.styles.ts:14,23` `1px solid var(--tc-tabs-divider)` → `color.border.default` = **#bdbdbd** light / **#6b6b6e** dark | `tabs.css:280` `border-b border-border` → `1px solid var(--border)` = **#bdbdbd** light / **#6b6b6e** dark | **kept** — exact match, both width and colour, in both modes |
| **tab colour (idle)** | `tc-tab.styles.ts:13` `color.text.muted` → **#828282** light / **#b3b3b3** dark | `tabs.css:124` `text-muted` → `var(--muted)` = **#828282** / **#b3b3b3** | **kept** — exact match |
| **tab colour (selected, secondary)** | `tc-tab.styles.ts:29` `color.brand.primary` → **#1b2d58** light / **#a9c2ea** dark | `tabs.css:267` `text-foreground` → gray-900 light / gray-100 dark | **changed** — `color: var(--accent)` (resolves to exactly the two tc values) |
| **tab colour (selected, primary)** | — | `tabs.css:142` `text-segment-foreground` on the `--segment` pill | **kept** — `--segment` is an unmapped HeroUI surface (`themes/tzuchi/variables.css:14`); painting `--accent` on it would fall to ~3:1 in dark (`--segment` = oklch(0.396) vs blue-300) |
| **hover** | `tc-tab.styles.ts:24-26` background `color.brand.surface` = **#e8eefe** light / **#1b2d58** dark, label colour unchanged | `tabs.css:159-163` `opacity-70` (whole tab fades) | **changed** — `background-color: var(--accent-soft)` (= exactly those two values) + `opacity: 1`. Both upstream selectors (`:hover` and `[data-hovered="true"]`) and the `@media (hover: hover)` guard are mirrored |
| **focus ring** | `tc-tab.styles.ts:49-53` `outline: 2px solid color.border.focus` (**#4f7bbe** light / **#a9c2ea** dark), `outline-offset: -2px` (inset) | `tabs.css:167-170` `status-focused` → `utilities/index.css:2-6` 2px ring in `--focus` + 2px offset ring in `--background`, drawn **outside** via box-shadow | **changed** — inset `outline` in `var(--focus)` (same two colours), `box-shadow: none`. Also stops the ring being clipped by the `ScrollShadow` scroller |
| **focus radius** | `tc-tab.styles.ts:53` `--tc-radius-sm` → 4px (tc's tab is otherwise square) | follows the tab's own radius | **kept** — an `outline` already follows `border-radius`; forcing 4px would make the 8px primary tab jump on focus |
| **disabled** | `tc-tab.styles.ts:44-47` `opacity: 0.38`, `cursor: not-allowed` | `tabs.css:152-156` `status-disabled` → `opacity: var(--disabled-opacity)` = **0.38**, `cursor: var(--cursor-disabled)` = **not-allowed**, `pointer-events: none` | **kept** — identical (`pointer-events: none` is a HeroUI extra, harmless) |
| **indicator colour** | `tc-tab.styles.ts:40` `color.brand.primary` → **#1b2d58** / **#a9c2ea** | `tabs.css:274` `bg-accent` → `var(--accent)` = **#1b2d58** / **#a9c2ea** | **kept** — exact match |
| **indicator thickness** | `tc-tab.styles.ts:39` `--tc-focus-ring-width` → **2px** | `tabs.css:283` `h-0.5` → **2px** (`:292` `w-0.5` vertical) | **kept** |
| **indicator inset + ends** | `tc-tab.styles.ts:37,41` `inset-inline: 8px`, `border-radius: 9999px` | `tabs.css:228,274` full width, `rounded-none` | **changed** — `padding-inline: var(--tc-space-8)` + `background-clip: content-box` + `border-radius: var(--tc-radius-full)`. Padding (not `inset-inline`/`width`) because React Aria's `SharedElement` FLIP writes inline `translate`/`width`/`height` during the 250ms move (`react-aria-components/dist/private/SharedElementTransition.mjs:46-53`). Split per orientation so the vertical 2px bar gets block padding instead |
| **indicator (primary)** | n/a | `tabs.css:228` `rounded-3xl bg-segment shadow-surface` → 24px, `--segment`, `--surface-shadow` | radius **changed** to 8px (with the tab); colour and shadow **kept** — `--surface-shadow` is already the themed tc elevation-1 |
| **elevation** | tc tabs have no shadow anywhere | only the primary indicator (`shadow-surface` = `var(--surface-shadow)`) | **kept** — theme-resolved (`0px 1px 2px 0px #0000001a` light, `…#00000059` dark) and part of the segmented look |
| **motion** | `tc-tab.styles.ts:19-21` `color`/`background-color` **150ms** `cubic-bezier(0.2,0,0,1)` | `tabs.css:133-137` `color`/`background-color`/`box-shadow`/`opacity` **150ms** `var(--ease-smooth)` = `ease` (indicator: 250ms `--ease-out-fluid`) | **kept** — the duration already matches; overriding `transition-timing-function` would also retime `box-shadow` (deliberately `--ease-out` upstream) for a difference nobody can see in 150ms. `motion-reduce` handling is upstream's and untouched |
| **panel** | tc-tabs renders no panel | `tabs.css:208-223` `p-2`, `mt-4` / `ms-4` | **kept** — nothing to compare against |
| **separator** | tc uses gaps, no separator element | `tabs.css:186-204` 1px `bg-muted/25` | **kept** — `--muted` is themed, so it already follows tc colour |
| **scroll chevrons** | none | `tabs.css:28-48` `size-4`, `text-foreground`, `opacity-70` hover | **kept** — HeroUI-only affordance, already on themed colours |

## Not transferable

- **tc web hugs, HeroUI stretches.** `tc-tab` is `inline-flex` (content width) in the
  `web` variant; `.tabs__tab` is `w-full` inside a `w-max min-w-full` list, so HeroUI's
  tabs always share the row. That is exactly tc's `mobile` variant (`flex: 1 1 0`), so
  HeroUI already matches one of the two tc layouts — changing it would break the
  segmented `primary` variant and the `align-start/end` modifiers, which only have a
  visible effect on a stretched tab. A consumer gets the web layout with
  `<Tabs.List className="*:w-fit">` (utilities sit in a later layer than this file).
- **`tc-tabs` has no panel, no separator, no scroll affordance, no vertical
  orientation, no segmented variant** — nothing in the Figma record constrains them.
- **HeroUI `primary`'s `--segment` / `--default` surfaces** have no tc token
  (`themes/tzuchi/variables.css:13-14`), so the segmented pill's fill and its selected
  label still come from stock HeroUI. If the segmented control is ever adopted for
  real, those two variables are the thing to map — not this file.
- **tc's 32px tab icon** — HeroUI has no icon slot in tabs (see the table).

## Extra theme variables

None. All four tc colour decisions map one-to-one onto existing HeroUI theme variables
in both modes: `tabs.tab-fg` → `--muted`, `tabs.tab-fg-selected` / `tabs.indicator` →
`--accent`, `tabs.tab-bg-hover` → `--accent-soft`, `tabs.divider` → `--border`,
`tabs.focus-ring-color` → `--focus`.

## Caveat

Every rule here is `[data-theme^="tzuchi"] …`, i.e. two selectors deep, so it outranks
HeroUI's own single-class base rules — intended. It does **not** outrank per-story or
per-consumer Tailwind utilities (`*:text-xs`, `*:h-8`, `rounded-full`), because
`styles/index.css:1` orders the layers `theme, base, components, utilities` and this
file lands in `components`. The `WithCustomStyle` and `Showcase1` stories therefore
keep their own look.

## Machine-checkable expectations (story `components-navigation-tabs--default`)

| selector | property | expected |
|---|---|---|
| `.tabs__tab` | `font-size` | `20px` |
| `.tabs__tab` | `padding-block-start` | `12px` |
| `.tabs__tab` | `height` | `54px` (12 + 20×1.5 + 12) |
| `.tabs__tab` | `border-top-left-radius` | `8px` |
| `.tabs__tab[data-selected="true"]` | `font-weight` | `700` |
| `.tabs__list-container` | `border-top-left-radius` | `12px` |
