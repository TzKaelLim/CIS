# Accordion — Tzu Chi ↔ HeroUI gap inventory

- **Override CSS**: `/private/tmp/claude-501/-Users-kaellim-Desktop-Personal-CISwebsite/1c74be25-055e-47fb-a92f-f47cfe608bb0/scratchpad/atoms/css/accordion.css`
  (destination `heroui/styles/themes/tzuchi/components/accordion.css`)
- **Closeness**: minor gaps. Structure, separator model, disabled treatment, focus-ring
  width/colour and panel timing already line up; what differs is type scale/weight,
  icon size, panel padding + text colour, and the surface variant's container shape.

## Sources

| side | files |
|---|---|
| Tzu Chi | `/Users/kaellim/Desktop/Personal/CISwebsite/packages/components/src/accordion/tc-accordion.styles.ts`, `tc-accordion-item.styles.ts`, `tc-accordion-item.ts`; `/Users/kaellim/Desktop/Personal/CISwebsite/packages/tokens/src/component/accordion.tokens.json` |
| resolved token values | `/Users/kaellim/Desktop/Personal/CISwebsite-heroui-spike/packages/tokens/dist/tokens.css` |
| HeroUI | `/Users/kaellim/Desktop/Personal/CISwebsite-heroui-spike/heroui/styles/components/accordion.css`, `heroui/styles/src/components/accordion/accordion.styles.ts`, `heroui/react/src/components/accordion/accordion.tsx`, `heroui/styles/utilities/index.css`, `heroui/styles/themes/shared/theme.css`, `heroui/styles/themes/default/variables.css`, `heroui/styles/themes/tzuchi/variables.css` |

## Variant mapping

`tc-accordion` ships exactly one look: a `1px solid border.default` box, `8px` radius,
`overflow: hidden`, filled with `surface.default`, items separated by a `1px`
`border.default` hairline (`tc-accordion.styles.ts:8-15`, `tc-accordion-item.styles.ts:4-20`).

| tc | HeroUI | decision |
|---|---|---|
| `tc-accordion` (the only look) | `variant="surface"` (`.accordion--surface`) — the only HeroUI variant with a container (bg + radius) | **mapped**: gets the tc 1px border, the tc 8px radius and a full-bleed `--separator` hairline |
| — | `variant="default"` (`.accordion`) — borderless, transparent, separator-only list | **kept unboxed.** Boxing it would make the two HeroUI variants pixel-identical, i.e. silently delete `surface`. It inherits only the shared tc density/type/icon/motion. |
| `multiple` | `allowsMultipleExpanded` | behaviour only, untouched |
| `disabled` (item) | `isDisabled` / `[aria-disabled]` | already matches (see table) |
| — | `hideSeparator` | HeroUI-only, untouched |

## Gap table

Values are light / dark where they differ. Tzu Chi dark values come from the
`[data-theme="dark"]` block of `tokens.css`; HeroUI dark values come from the
`[data-theme="tzuchi-dark"]` block of `themes/tzuchi/variables.css`.

### Shape

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| container radius | `tc-accordion.styles.ts:12` → `--tc-accordion-radius` → `--tc-radius-md` = **8px** (both modes) | `accordion.css:127` `.accordion--surface` `min(32px, var(--radius-3xl))`; `--radius-3xl = calc(var(--radius)*3)`, `--radius` = `--tc-radius-md` = 8px → **24px** | **changed** — `.accordion--surface { border-radius: var(--tc-accordion-radius, var(--radius)) }` = 8px |
| first/last trigger corner radius (surface) | implied 8px by the container's `overflow: hidden` (`tc-accordion.styles.ts:13`) | `accordion.css:151-158` **24px** | **changed** — re-pointed at `--tc-accordion-radius` = 8px |
| container border | `tc-accordion.styles.ts:11` `1px solid --tc-accordion-border` → `border.default` = **#bdbdbd / #6b6b6e** | none on either variant (`accordion.css:2-7`, `:125-128`) = **0px** | **changed (surface only)** — `border: 1px solid var(--border)`; `--border` under tzuchi = gray-300 / gray-750, i.e. the same two values |
| container border (default variant) | — | 0px | **kept** — deliberately, so `default` stays distinct from `surface` |
| container fill | `tc-accordion.styles.ts:14` `surface.default` = **#ffffff / #1c1c1e** | `.accordion--surface` `bg-surface` (`accordion.css:126`) → `--surface` = #ffffff / #1c1c1e | **kept — identical** (default variant stays transparent) |
| container overflow | `overflow: hidden` | none; HeroUI rounds the first/last trigger instead | **kept — HeroUI's approach**; clipping the root would also clip the trigger's focus ring |
| item border | `tc-accordion-item.styles.ts:6` `border-bottom: 1px solid border.default`, dropped on `:last-of-type` (`:17`) | `accordion.css:37` `border-none` + a 1px `::after` hairline, `content: none` on `:last-child` (`:47`) | **kept — same model, same 1px** |
| separator colour (default variant) | `border.default` = **#bdbdbd / #6b6b6e** | `accordion.css:43` `bg-separator` → `--separator` (tzuchi) = **#bdbdbd / #6b6b6e** | **kept — identical** (the theme generator already maps `--separator` to `border.default`) |
| separator colour (surface variant) | same `border.default`, opaque | `accordion.css:139` `bg-surface-foreground/6` → #333333 @6% / #f2f2f2 @6% ≈ **#f0f0f0 / #262628** | **changed** — `background-color: var(--separator)` |
| separator inset / width (surface) | full bleed, 100% | `accordion.css:146` `start-[3%] w-[94%]` = **inset-inline-start 3%, width 94%** | **changed** — `inset-inline-start: 0; inline-size: 100%` |
| separator height | 1px (border-bottom) | `accordion.css:43` `h-px` = **1px** | **kept — identical** |
| trigger radius | 0 except first/last (inherited from the clipped container) | 0 except first/last in surface | **kept** |

### Density

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| trigger padding | `tc-accordion-item.styles.ts:35` `--tc-accordion-header-padding` → `--tc-space-16` = **16px** all sides | `accordion.css:60` `px-4 py-4` = **16px** all sides | **kept — identical** |
| trigger gap (label ↔ chevron) | `tc-accordion-item.styles.ts:31` `--tc-space-8` = **8px** | none; `justify-between` + `ms-auto` on the indicator = **0px** minimum | **changed** — `gap: var(--tc-space-8, 8px)` |
| trigger height | 16 + 16 padding + 24px line-height = **56px** | 16 + 16 + 20px (`text-sm`) = **52px** | **changed implicitly** by the type change → 56px |
| trigger min-height | not set | not set | **kept — neither constrains it** |
| panel padding | `tc-accordion-item.styles.ts:110` `--tc-accordion-panel-padding` → `--tc-space-16` = **16px all sides** | `accordion.css:15` `px-4 pt-0 pb-4` = **16px inline / 0 block-start / 16px block-end** | **changed** — `padding: var(--tc-accordion-panel-padding, …)` = 16px all round |
| root layout | `display: flex; flex-direction: column` | `w-full` (block) + `contain: layout style` | **kept** — HeroUI's block stacking is visually equivalent and `contain` is a perf win |

### Typography

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| trigger font family | `--tc-typography-subtitle` → `'Noto Sans TC', system-ui, -apple-system, 'PingFang TC', 'Microsoft JhengHei', sans-serif` | inherits `--font-sans`, which `themes/tzuchi/variables.css:25` already sets to `--tc-font-family-base` (same stack) | **already matched**; the `font:` shorthand restates it |
| trigger font size | `tc-accordion-item.styles.ts:36` = **16px** | `accordion.css:60` `text-sm` = **14px** | **changed** → 16px |
| trigger font weight | **700** | `font-medium` = **500** | **changed** → 700 |
| trigger line-height | **1.5** = 24px | `text-sm` = 1.25rem = **20px** | **changed** → 1.5 (24px) |
| trigger text-align | `text-align: start` | `text-start` | **kept — identical** |
| body font size | `tc-accordion-item.styles.ts:112` `--tc-typography-body` = **16px** | `accordion.css:11` `text-sm` = **14px** | **changed** → 16px |
| body font weight | **400** | inherits 400 | **kept — identical** |
| body line-height | **1.6** = 25.6px | **20px** | **changed** → 1.6 |

### Colour (per state / variant)

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| trigger text | `--tc-accordion-header-fg` → `text.default` = **#333333 / #f2f2f2** | inherits `--foreground` = #333333 / #f2f2f2 | **kept — identical** |
| trigger background (rest) | `--tc-accordion-header-bg` → `surface.default` = **#ffffff / #1c1c1e** | transparent; the surface variant paints `--surface` (same values) on the root | **kept** |
| trigger background (hover), default variant | `surface.subtle` = **#f8f8f8 / #161618** (a ~3% shift off white) | `accordion.css:83` `color-mix(in oklab, var(--foreground) 3%, transparent 90%)` ≈ a **3.2% foreground overlay** | **kept — same magnitude**, and it works on any page background |
| trigger background (hover), surface variant | `surface.subtle` = **#f8f8f8 / #161618** | `accordion.css:133` `bg-default` → `--default`, **not mapped by the tzuchi theme** (NOTICE.md) → HeroUI `oklch(94% …)` ≈ #ededee / `oklch(27.4% …)` ≈ #3a3a3d | **changed** — `var(--tzuchi-accordion-trigger-hover-bg, var(--surface-hover))`. `--surface-hover` = `color-mix(--surface 92%, --surface-foreground 8%)`, a theme-derived tint instead of an unmapped neutral. In dark mode tc shifts *darker* (gray-980) while `--surface-hover` shifts *lighter* — hence the escape-hatch variable (see "Extra theme variables") |
| trigger background (pressed) | not styled | `accordion.css:88-89` empty rule | **kept — neither paints a pressed fill** |
| trigger background (expanded) | not styled | hover fill suppressed via `:not([aria-expanded="true"])` | **kept** |
| chevron colour | `--tc-accordion-chevron` → `text.muted` = **#828282 / #b3b3b3** | `accordion.css:23` `text-muted` → `--muted` (tzuchi) = **#828282 / #b3b3b3** | **kept — identical** |
| panel text | `--tc-accordion-panel-fg` → `text.default` = **#333333 / #f2f2f2** | `accordion.css:15` `text-muted` = **#828282 / #b3b3b3** | **changed** — `color: var(--foreground)`. Also clears the AA problem MAINTAINING.md flags for `--muted` on white (3.84:1) |
| panel background | `surface.default` (`tc-accordion-item.styles.ts:87`) | transparent; inherits the root's fill | **kept — visually identical** |
| elevation / shadow | none anywhere | none anywhere | **kept — neither uses one** |

### States

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| focus ring width | `tc-accordion-item.styles.ts:51` `--tc-focus-ring-width` = **2px** | `utilities/index.css:3` `ring-2` = **2px** | **kept — identical** |
| focus ring colour | `--tc-accordion-focus-ring-color` → `--tc-focus-ring-color` = `blue-500` **#4f7bbe in both modes** | `ring-focus` → `--focus`; `themes/tzuchi/variables.css:45,80` = **#4f7bbe / #a9c2ea** | **kept — the theme's per-mode resolution is the better value**; tc's fixed blue-500 on a near-black surface is the weaker of the two |
| focus ring offset | `outline-offset: calc(-1 * 2px)` = **-2px (inset)** | `--ring-offset-width` = `--tc-focus-ring-offset` = **+2px (outset)** | **changed** — `--ring-offset-width: 0px` on the trigger. A negative ring offset is not expressible with Tailwind's box-shadow ring; 0 keeps the ring hugging the trigger (tc's intent) and stops it spilling past the surface variant's new border |
| focus trigger | `:focus-visible` | `:focus-visible:not([data-focused])` / `[data-focus-visible="true"]` | **kept** |
| disabled opacity | `--tc-accordion-disabled-opacity` → `--tc-opacity-disabled` = **0.38** | `status-disabled` → `--disabled-opacity`, which `themes/tzuchi/variables.css:23` already sets to `--tc-opacity-disabled` = **0.38** | **kept — identical** |
| disabled cursor | `not-allowed` | `--cursor-disabled` = `not-allowed` (`themes/default/variables.css:30`) | **kept — identical** |
| disabled pointer-events | not set (`:disabled` on a real `<button>`) | `pointer-events: none` | **kept — HeroUI's is stricter, tc's `<button disabled>` behaves the same** |
| interactive cursor | `cursor: pointer` | `--cursor-interactive` = `pointer` | **kept — identical** |
| indicator expanded | `:host([open]) .chevron { rotate(180deg) }` | `[data-expanded="true"] { -rotate-180 }` | **kept — identical** |

### Motion

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| trigger transition property | `background-color` (`tc-accordion-item.styles.ts:42`) | `opacity`, `box-shadow` (`accordion.css:66-68`) — the hover fill **snaps** | **changed** — `transition-property: opacity, box-shadow, background-color` |
| trigger transition duration | `--tc-motion-duration-fast` = **150ms** | **150ms** | **kept — identical** |
| trigger easing | `--tc-motion-easing-standard` = `cubic-bezier(0.2, 0, 0, 1)` | `--ease-out` = `cubic-bezier(0, 0, 0.2, 1)` | **changed** — set to the tc standard easing alongside the property change |
| panel transition | `grid-template-rows` **200ms** standard easing | `height` **200ms** `--ease-out-quad` + `opacity` 200ms `--ease-out` (`accordion.css:113-116`) | **kept** — same duration, different (and structurally necessary) technique; re-declaring would break HeroUI's `--disclosure-panel-height` animation |
| indicator rotation duration | `--tc-motion-duration-base` = **200ms** | `duration-250` = **250ms** | **changed** → 200ms |
| indicator rotation easing | `cubic-bezier(0.2, 0, 0, 1)` | Tailwind default `ease` | **changed** → tc standard easing |
| reduced motion | `@media (prefers-reduced-motion: reduce) { transition: none }` on panel/inner/chevron/trigger | `motion-reduce:transition-none` on trigger, indicator and panel | **kept**. The trigger override is wrapped in `@media (prefers-reduced-motion: no-preference)` so HeroUI's lower-specificity `transition-none` still wins; the indicator override uses longhands only, which `transition-property: none` still beats |

### Icons

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| chevron size | `tc-accordion-item.styles.ts:68-69` `--tc-size-icon-sm` = **20px** | `accordion.css:23` `size-4` = **16px** | **changed** → 20px via `inline-size` / `block-size` |
| chevron stroke | inline SVG, `stroke-width: 2`, `viewBox 0 0 20 20` | consumer-supplied (`IconChevronDown` or an Iconify icon) | **not transferable** — the glyph comes from the app, not the theme |
| chevron shrink | `flex: 0 0 auto` | `shrink-0` | **kept — identical** |

## Not transferable

- **tc's shadow-DOM structure.** `tc-accordion-item` renders `.header > .trigger > (.header-text, svg.chevron)` and `.panel > .panel-inner > .panel-content`; HeroUI renders RAC `Disclosure > Heading > Button` and `DisclosurePanel > body > body-inner`. The extra `.panel-inner` visibility gate (`tc-accordion-item.styles.ts:96-107`) exists only because tc animates `grid-template-rows`; HeroUI's `--disclosure-panel-height` + `overflow: clip` achieves the same and needs no such element.
- **`overflow: hidden` on the container.** tc clips items to the radius; HeroUI rounds the first/last trigger instead. Adding the clip under HeroUI would also clip the trigger's focus ring, so it stays HeroUI's way.
- **The `grid-template-rows: 0fr → 1fr` open/close technique** and the `visibility` transition-delay trick — structural, and replaced by HeroUI's measured-height animation.
- **`--tc-accordion-focus-ring-color` as a fixed blue-500.** It has no dark override in `tokens.css`, so honouring it literally would give a 1-value focus ring across both modes; the tzuchi theme's `--focus` is already per-mode and is used instead.
- **tc's keyboard model** (`tc-accordion.ts:56-86`, roving Arrow/Home/End across headers) — behaviour, not CSS. RAC's `DisclosureGroup` has its own; nothing to port in a stylesheet.
- **HeroUI-only surface API**: `hideSeparator`, `SurfaceContext`, `contain: layout style`, `data-pressed` / `data-focus-visible` hooks — no tc counterpart, left intact.
- **tc's own `--tc-accordion-*` colour props** (`header-bg`, `header-bg-hover`, `border`, `chevron`, `panel-fg`, `focus-ring-color`) — all resolve to `--tc-color-*` semantics that `tokens.css` only flips under `[data-theme="dark"]`, so they would yield light values under `tzuchi-dark`. Every colour in the override therefore comes from a HeroUI theme variable.

## Extra theme variables

| name | should resolve from | why |
|---|---|---|
| `--tzuchi-accordion-trigger-hover-bg` | `--tc-color-surface-subtle` (`#f8f8f8` light / `#161618` dark) | tc's surface-variant hover fill shifts *away* from the surface in opposite directions per mode (lighter in light, darker in dark). `--surface-hover` (`color-mix(--surface 92%, --surface-foreground 8%)`) always shifts *toward* the foreground, so it cannot express the dark value. Used as `var(--tzuchi-accordion-trigger-hover-bg, var(--surface-hover))`, so the file is correct today and exact once the generator emits it. |

## Suggested browser assertions

Story `components-navigation-accordion--default` unless noted.

| selector | property | expected |
|---|---|---|
| `.accordion__trigger` | `font-size` | `16px` |
| `.accordion__trigger` | `font-weight` | `700` |
| `.accordion__trigger` | `line-height` | `24px` |
| `.accordion__trigger` | `column-gap` | `8px` |
| `.accordion__body-inner` | `padding-block-start` | `16px` |
| `.accordion--surface` (story `…--surface-variant`) | `border-top-left-radius` | `8px` |

The 20px indicator is deliberately **not** asserted: the stories feed
`Accordion.Indicator` an Iconify `<Icon>`, which renders an inline placeholder
until the icon resolves, and `getComputedStyle().height` on an inline box is not
a reliable check.
