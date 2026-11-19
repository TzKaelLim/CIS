# Switch — Tzu Chi ↔ HeroUI gap inventory

- **Tzu Chi side**: `packages/components/src/switch/tc-switch.{ts,styles.ts}`, `packages/tokens/src/component/switch.tokens.json`, resolved in `packages/tokens/dist/tokens.css`.
- **HeroUI side**: `heroui/styles/components/switch.css`, `heroui/react/src/components/switch/switch.tsx`, `heroui/styles/src/components/switch/switch.styles.ts`, compiled check in `heroui/storybook/storybook-static/assets/iframe--2qJGi4C.css`.
- **Override written to**: `heroui/styles/themes/tzuchi/components/switch.css` (staged at `…/scratchpad/atoms/css/switch.css`).
- **Theme context**: in `themes/tzuchi/variables.css` `--radius: var(--tc-radius-md)` = **8px**, so HeroUI's radius scale resolves to `rounded-lg` 8px, `rounded-xl` 12px, `rounded-md` 6px. `--disabled-opacity` = `--tc-opacity-disabled` = **0.38**. `--ring-offset-width` = **2px**. Root font-size is the browser default 16px (Storybook's `:root { font-size }` override is commented out), so `1rem = 16px` throughout.

## Structure / variant mapping

| tc | HeroUI | note |
|---|---|---|
| `tc-switch` (one size, 44 × 24) | `size="md"` — the default | 1:1 |
| — | `size="sm"` (32 × 16), `size="lg"` (48 × 24) | no tc equivalent; rescaled from the same geometry, see below |
| `part="track"` | `.switch__control` | |
| `part="thumb"` | `.switch__thumb` | |
| `part="label"` (default slot) | `.switch__content` text (+ `[data-slot="label"]`) | tc puts the label inside the host; HeroUI wraps control + label in `Switch.Content` |
| — | `[data-slot="description"]`, `[data-slot="field-error"]`, `Switch.Icon`, `SwitchGroup` | HeroUI-only; not restyled beyond keeping the description indent aligned |
| `[checked]` | `[data-selected="true"]` / `[aria-checked="true"]` | |
| `[disabled]` | `[data-disabled="true"]` | |
| — | hover / pressed / focus-visible / invalid / pending | tc has no hover or pressed treatment at all |

## Gap table

| Property | Tzu Chi (file:line → resolved) | HeroUI (file:line → resolved) | Action |
|---|---|---|---|
| Track radius | `tc-switch.styles.ts:23` `--tc-switch-radius` → `radius.full` = **9999px** (pill) | `styles/components/switch.css:83` `rounded-xl` = `calc(var(--radius) * 1.5)` = **12px** | **Changed** — `border-radius: var(--tc-switch-radius, var(--tc-radius-full, 9999px))`. sm/lg inherit it (base gave sm 8px, lg 12px). |
| Track width | `tc-switch.styles.ts:21` → **44px** (`--tc-switch-width`) | `switch.css:85` `2.5rem` = **40px**; sm `:153` 32px, lg `:163` 48px | **Changed** — md 44px from the token; sm **36px**, lg **52px** invented to keep one family (−8/+8 on the md width). |
| Track height | `tc-switch.styles.ts:22` → **24px** (`--tc-switch-height`) | `switch.css:84` `1.25rem` = **20px**; sm `:154` 16px, lg `:162` 24px | **Changed** — md 24px from the token; sm **20px**, lg **28px** (−4/+4). Note lg had collided with the new md height at 24px, hence the rescale. |
| Track border | none (`tc-switch.styles.ts:17-27`) | none (`switch.css:81-87`) | kept — both 0. |
| Track fill, off | `switch.tokens.json` `track-bg` → `color.border.strong` → light `#828282` (gray-700), dark `#95969b` (gray-500) | `switch.css:9` `--switch-control-bg: var(--default)`; `--default` is *not* mapped by the Tzu Chi theme (`themes/tzuchi/variables.css:13-14`) → light `oklch(94% …)` ≈ **#eeeef0**, dark `oklch(27.4% …)` ≈ **#3f3f46** | **Changed** — `--switch-control-bg: var(--tzuchi-switch-track-bg, var(--muted))`. New theme var (see below); HeroUI's near-white light value left the off state nearly invisible. |
| Track fill, off + hover / pressed | no hover or pressed state | `switch.css:10-11` `color-mix(… , transparent 20%)` of the off fill | kept — derives automatically from the new `--switch-control-bg`. |
| Track fill, on | `switch.tokens.json` `track-bg-checked` → `color.brand.primary` → light `#1b2d58`, dark `#a9c2ea` | `switch.css:12` `--switch-control-bg-checked: var(--accent)` → light `#1b2d58`, dark `#a9c2ea` | kept — identical; the theme already maps `--accent` to `brand.primary`. |
| Track fill, on + hover / pressed | no hover state | `switch.css:13` `var(--accent-hover)` → light `#30559f`, dark `#c2d4f2` | kept — consistent with `brand.primary-hover`. |
| Thumb size | `tc-switch.styles.ts:35-36` → **18 × 18** (circle) | `switch.css:170-171` **22 × 16** (wider than tall); sm `:200-201` 16.5 × 12, lg `:212-213` 27.5 × 20 | **Changed** — square from `--tc-switch-thumb-size` (18px); sm **14px**, lg **22px** = track height − 2 × 3px inset. |
| Thumb radius | `tc-switch.styles.ts:37` `radius.full` = **9999px** | `switch.css:169` `rounded-lg` = **8px**; sm `:199` `rounded-md` 6px, lg `:211` `rounded-xl` 12px | **Changed** — `9999px` at every size, so the thumb is a true circle. |
| Thumb inset (off) | `tc-switch.styles.ts:34` `inset-inline-start: 3px` | `switch.css:169` `ms-0.5` = **2px** | **Changed** — `margin-inline-start: 3px` (HeroUI's margin-driven positioning kept; tc's `position:absolute` + `transform` is not transferable to this markup). |
| Thumb travel (on) | `tc-switch.styles.ts:50-53` `44 − 18 − 3 − 3` = **20px** | `switch.css:185` `ms-[calc(100% - 1.5rem)]` → 40 − 24 = **16px**; sm `:206` 13.5px, lg `:218` 18.5px | **Changed** — `calc(100% - var(--switch-thumb-size) - var(--switch-thumb-inset))` → md 23px margin (20px travel), sm 19px, lg 27px; symmetric 3px inset on both ends. |
| Thumb fill, off | `switch.tokens.json` `thumb-bg` → `color.white` = **#ffffff** in both modes (comment at `tc-switch.styles.ts:29-30`: intentionally constant) | `switch.css:169` `bg-white` = **#ffffff** in both modes | kept — already identical. |
| Thumb fill, on | same `#ffffff` in both modes | `switch.css:185` `bg-accent-foreground` → light **#ffffff**, dark **#1b2d58** | **kept — deliberate deviation.** Identical in light. In dark the tc rule would put white on the `#a9c2ea` on-track (≈1.6:1); HeroUI's navy thumb is the readable one, and it is the same call `NOTICE.md` already made for the welcome button. |
| Thumb elevation | `tc-switch.styles.ts:39` `--tc-elevation-1` → light `0 1px 2px #0000001a`, dark `0 1px 2px #00000059`; same in both states | off: `switch.css:169` `shadow-field` → `--field-shadow` is `0 0 0 0 transparent` in this theme (`themes/tzuchi/variables.css:22`) = **no shadow**; on: `switch.css:186-189` a hard-coded 3-layer black glow (light-mode only) | **Changed** — `box-shadow: var(--surface-shadow)` in both states. The theme's `--surface-shadow` is byte-identical to `--tc-elevation-1` in light and darkens correctly in dark; component shadow tokens are light-only literals, so they are not referenced. |
| Thumb fill, disabled | none — tc only fades the host | `switch.css:25-26` `bg-default-foreground/20`, plus `switch.css:61-63` an extra `opacity: .4` when disabled + selected | kept — a different but self-consistent HeroUI treatment; changing it would need a hard-coded white, which the colour rule forbids. Worth a look in dark mode later. |
| Disabled opacity | `tc-switch.styles.ts:14` `--tc-switch-disabled-opacity` → `opacity.disabled` = **0.38** | `switch.css:17` `status-disabled` → `var(--disabled-opacity)` → **0.38** in this theme | kept — the theme already feeds it the same token. |
| Disabled cursor | `tc-switch.styles.ts:13` `not-allowed` | `utilities/index.css:61-65` `var(--cursor-disabled)` + `pointer-events: none` | kept. |
| Focus ring | `tc-switch.styles.ts:56-61` box-shadow on the track: 2px offset in `surface.default` then 2px in `focus-ring.color` **#4f7bbe** (not flipped in dark) | `switch.css:102` `status-focused` → `focus-ring` = `ring-2` + `--ring-offset-width: 2px` + offset colour `var(--background)`, ring colour `var(--focus)` → light **#4f7bbe**, dark **#a9c2ea** | kept — same 2px ring / 2px offset geometry, same light colour. Dark uses the theme's `--focus` (blue-300), which reads better on the dark background than tc's fixed blue-500. |
| Label font family | `tc-switch.styles.ts:64` `--tc-typography-body` → `'Noto Sans TC', system-ui, …` | `.switch__content` inherits `--font-sans`, which the theme sets to `--tc-font-family-base` (`themes/tzuchi/variables.css:25`) | kept — already the same stack. |
| Label font size | **16px** (`--tc-typography-body`) | `switch.css:147` `text-sm` = **14px** | **Changed** — `var(--tc-font-size-16, 16px)`. |
| Label font weight | **400** | `switch.css:147` `font-medium` = **500** | **Changed** — `var(--tc-font-weight-regular, 400)`. |
| Label line-height | **1.6** (= 25.6px at 16px) | `text-sm` line-height = `1.25rem` = **20px** | **Changed** — `var(--tc-line-height-relaxed, 1.6)`. |
| Label colour | `tc-switch.styles.ts:65` `--tc-switch-label` → `color.text.default` → light `#333333`, dark `#f2f2f2` | `switch.css:147` `text-foreground` → light `#333333`, dark `#f2f2f2` | kept — identical. |
| Gap, control ↔ label | `tc-switch.styles.ts:7` `--tc-space-8` = **8px** | `switch.css:147` `gap-3` = **12px** | **Changed** — `gap: var(--tc-space-8, 8px)`. |
| Gap, content ↔ description | no description slot | `switch.css:3` `gap-1` = **4px** | kept — HeroUI-only slot. |
| Description / field-error indent | n/a | `switch.css:31,35,39-52` `ps-[calc(2.5rem + 0.75rem)]` = **52px** (sm 44px, lg 60px) | **Re-derived, same value** — `calc(var(--switch-control-width) + 8px)` = 52 / 44 / 60px, identical today but follows `--tc-switch-width` if that token is retuned. |
| Padding | none on track or thumb in either library | none | kept. |
| Icon size | tc has no icon slot | `switch.css:224` `.switch__thumb > *` is `size-full`; stories size their own icons (`size-3` = 12px, `size-4` = 16px) | not transferable — left alone. A 16px icon in the new 18px md circle is tight, but the icon stories use `size="lg"` (22px thumb). |
| Motion — track | `tc-switch.styles.ts:25-26` `background-color 200ms cubic-bezier(0.2, 0, 0, 1)` | `switch.css:93-95` `background-color 250ms var(--ease-smooth)` (= `ease`) + `box-shadow 150ms ease-out` | **Changed** — 200ms + `--tc-motion-easing-standard`; the `box-shadow 150ms` leg is kept so the focus ring still animates. |
| Motion — thumb | `tc-switch.styles.ts:41-42` `transform 200ms cubic-bezier(0.2, 0, 0, 1)` | `switch.css:177-179` `margin 300ms var(--ease-out-fluid)` + `background-color 200ms ease-out` | **Changed** — both legs to 200ms + standard easing, still on `margin` (HeroUI's mechanism). |
| Reduced motion | `tc-switch.styles.ts:83-88` `@media (prefers-reduced-motion: reduce)` → `transition: none` | `switch.css:96,180` `motion-reduce:transition-none`, which also honours `data-reduce-motion="true"` on the element or an ancestor (`styles/variants/index.css:21-42`) | **Restated** — the overrides out-specify the base guard, so the override file repeats both arms (explicit attribute + media query) with the same semantics. |
| Cursor | `tc-switch.styles.ts:8` `pointer` | `switch.css:6` `var(--cursor-interactive)` | kept. |

## Not transferable

- tc's `position: absolute` + `transform: translateX()` thumb — HeroUI animates `margin-inline-start` on a flex child, and the task is to keep HeroUI's structure. Same visual result, different mechanism.
- tc's focus ring as a hand-written double `box-shadow` — HeroUI's `ring-*` utilities already produce the same 2px ring + 2px offset, so its mechanism stays.
- tc's `:host` / `::part` shadow-DOM surface, the `formAssociated` internals and the `tc-change` event — behavioural, no CSS counterpart.
- The Icon slot, Description, FieldError, invalid/pending states, hover and pressed treatments, and SwitchGroup are HeroUI-only; tc has no design record for them, so they keep HeroUI's values derived from the same theme variables.
- tc's "thumb is always white" rule in dark mode (see the *Thumb fill, on* row).
- tc's `--tc-elevation-1` / any component shadow token: emitted as light-mode literals only, so `--surface-shadow` is used instead.

## New theme variable requested

| name | should resolve from | why |
|---|---|---|
| `--tzuchi-switch-track-bg` | `color.border.strong` (light `gray-700` `#828282`, dark `gray-500` `#95969b`) | The off-track fill. No HeroUI theme variable carries a "strong border / strong neutral" value: `--border` is `gray-300` (too light), `--default` is an unmapped near-white, `--muted` happens to equal `gray-700` in light but is `gray-400` in dark and is meant for text. Used as `var(--tzuchi-switch-track-bg, var(--muted))`, so it renders correctly even before the generator learns the name. |

## Self-checks

- Every rule is scoped by `[data-theme^="tzuchi"]`; upstream light/dark are untouched.
- No `--tc-color-*` / colour-valued component token, no hex or `rgb()` literal, no `!important`.
- Only logical properties (`inline-size`, `block-size`, `margin-inline-start`, `padding-inline-start`).
- Specificity: the overrides are `(0,3,0)`–`(0,4,0)` against the base's `(0,1,0)`–`(0,4,0)`; the two rules that tie (`.switch[aria-checked] :is(.switch--sm .switch__thumb)` and `.switch.switch--sm > [data-slot=description]`) are beaten by source order, which holds because the file is imported after the base in the same `components` layer.
- `--switch-control-width/-height/-thumb-size/-thumb-inset/-content-gap` are set on `.switch` and inherited, so the size modifiers need one declaration block each instead of per-slot rules.
