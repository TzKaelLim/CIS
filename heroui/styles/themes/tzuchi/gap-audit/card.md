# card — tc-card ↔ HeroUI Card

**Override file:** `heroui/styles/themes/tzuchi/components/card.css`
(written to `scratchpad/atoms/css/card.css`)

**Closeness: minor gaps.** Box model, background and resting elevation already
line up almost exactly — under `tzuchi` the theme's `--surface-shadow`
(`0px 1px 2px 0px #0000001a`) *is* `--tc-elevation-1`, and `--surface` *is*
`--tc-color-surface-default`. What differs is the corner radius, the internal
rhythm (three gaps) and the type of the two text slots.

## Variant mapping

| tc-card `variant` | HeroUI `Card variant` | Note |
|---|---|---|
| `elevated` (tc default) | `default` (HeroUI default) | bg `--surface` + `shadow-surface`; identical treatment, nothing to change |
| `outlined` | — | HeroUI has no bordered card variant. Not introduced. |
| — | `secondary` | `bg-surface-secondary`; `--surface-secondary` is unmapped in the Tzu Chi theme (NOTICE.md), HeroUI's value shows through. Kept. |
| — | `tertiary` | `bg-surface-tertiary`, same situation. Kept. |
| — | `transparent` | `border-none bg-transparent shadow-none`. Kept. |

Slot mapping used throughout: tc `.body` ↔ HeroUI `.card` (the padded flex
column), tc `.headline` ↔ `.card__title`, tc default slot ↔
`.card__description` / `.card__content`, tc `.footer` ↔ `.card__footer`.
HeroUI's `.card__header` (title + description grouping) has no tc counterpart;
tc's `<slot name="headline">` sits directly in `.body`.

## Gap table

| property | Tzu Chi (file:line → resolved) | HeroUI (file:line → resolved) | action |
|---|---|---|---|
| **border radius** | `tc-card.styles.ts:8` `--tc-card-radius` → `--tc-radius-lg` = **16px** (both modes; `tokens.css:163`, `:51`) | `styles/components/card.css:7` `min(32px, var(--radius-3xl))`; `--radius-3xl = calc(var(--radius)*3)` (`themes/shared/theme.css:110`) and tzuchi's `--radius = --tc-radius-md = 8px` (`themes/tzuchi/variables.css:19`) → **24px** | **changed** → `var(--tc-card-radius, var(--radius-2xl))` (fallback `--radius-2xl` also resolves to 16px under tzuchi) |
| **padding** | `tc-card.styles.ts:59` `.body` `--tc-card-padding` → `--tc-space-16` = **16px** (`tokens.css:164`, `:41`) | `card.css:5` `p-4` = **16px** | kept — already identical |
| **gap (root column)** | `tc-card.styles.ts:58` `.body { gap: --tc-space-16 }` = **16px** | `card.css:5` `gap-3` = 0.75rem = **12px** | **changed** → `var(--tc-space-16, 1rem)` |
| **gap (header: title↔description)** | no counterpart — tc has no title/description pairing; headline↔body is the 16px `.body` gap | `card.css:12` `.card__header { flex flex-col }`, no gap → **0px** | **changed** → `var(--tc-space-8, .5rem)` = 8px. Judgement call, documented: 0px under a 26px bold title collides; 16px would double the root gap. `--tc-space-8` is the other spacing step tc uses inside a card (its footer). Story-level `className="gap-1"` (Horizontal) still wins — Tailwind utilities layer is after `components`. |
| **gap (content)** | no counterpart | `card.css:27` `.card__content` `gap-1` = **4px** | kept — no tc decision to apply |
| **gap (footer)** | `tc-card.styles.ts:71` `.footer { gap: --tc-space-8 }` = **8px** (`tokens.css:39`) | `card.css:32` `.card__footer { flex flex-row items-center }`, no gap → **0px** | **changed** → `var(--tc-space-8, .5rem)` |
| **title font** | `tc-card.styles.ts:63` `.headline { font: --tc-typography-heading-3 }` = **700 26px/1.4** (→ line-height 36.4px), family `--tc-font-family-base` (`tokens.css:135`, `:81`) | `card.css:18` `text-sm leading-6 font-medium` = **500 14px/24px** | **changed** → `font: var(--tc-typography-heading-3, …)`. Confirmed as the tc card-headline decision by `tc-article-card.styles.ts:114`, which uses the same token. Family is a no-op: tzuchi already sets `--font-sans: --tc-font-family-base` (`themes/tzuchi/variables.css:25`). |
| **title colour** | `tc-card.styles.ts:64` `--tc-card-headline-fg` → `--tc-color-brand-primary` = blue-900 (light) / blue-300 (dark) (`tokens.css:266`, `:113`, dark block `:408+`) | `card.css:18` `text-foreground` → `--foreground` = gray-900 / gray-100 | **changed** → `color: var(--accent)`. `--accent` is exactly blue-900/blue-300 in `tzuchi`/`tzuchi-dark` (`themes/tzuchi/variables.css:30`, `:65`), so this is mode-correct without touching any `--tc-color-*`. |
| **description font** | tc default slot inherits page body type; tc's body step is `--tc-typography-body` = **400 16px/1.6** (→ 25.6px) (`tokens.css:139`). tc has **no 14px step** in its scale at all. | `card.css:22` `text-sm leading-5` = **400 14px/20px** | **changed** → `font: var(--tc-typography-body, …)` |
| **description colour** | tc-card's body copy is `--tc-color-text-default` (host colour, `tc-card.styles.ts:10`) = gray-900 / gray-100; `tc-article-card` agrees (`--tc-article-card-excerpt-fg` → `color.text.default`, `tokens.css:241`) | `card.css:22` `text-muted` → `--muted` = gray-700 `#828282` / gray-400 | **changed** → `color: var(--foreground)`. Also clears the AA failure MAINTAINING.md flags for `--muted` on light (3.84:1). Muted stays available and is still used by story-level `text-muted` spans, so HeroUI's hierarchy is not removed globally. |
| **font family** | `--tc-font-family-base` = `'Noto Sans TC', system-ui, …` | `--font-sans`, which tzuchi already redefines to the same value | kept — theme already handles it |
| **border width / colour / style** | `elevated`: none. `outlined` (`tc-card.styles.ts:37`): `1px solid --tc-card-border` → `--tc-color-border-default` = gray-300 / gray-750 | `.card` declares no border → **0**; `.card--transparent` `border-none` | kept — `elevated` (the mapped variant) has no border either; `outlined` has no HeroUI variant to attach to |
| **background** | `tc-card.styles.ts:9` `--tc-card-bg` → `--tc-color-surface-default` = white / gray-950 | `card.css:42` `.card--default` `bg-surface` → `--surface` = white / gray-950 under tzuchi | kept — identical in both modes |
| **elevation (resting)** | `tc-card.styles.ts:27` `--tc-card-elevation` → `--tc-elevation-1` = `0px 1px 2px 0px #0000001a` (emitted as a **light literal in both modes**, `tokens.css:165`) | `card.css:6` `shadow-surface` → `--surface-shadow` = `0px 1px 2px 0px #0000001a` (light) / `0px 1px 2px 0px #00000059` (dark) (`themes/tzuchi/variables.css:59`, `:94`) | kept — light is byte-identical; dark is *better* via the theme variable, and the tc shadow token is a disallowed light literal anyway |
| **elevation (hover / focus-within)** | `tc-card.styles.ts:29-33`, `:39-43` `--tc-card-elevation-hover` → `--tc-elevation-3` = `0px 6px 16px 0px #0000001f`, only for `[interactive]` / `[href]` | none — HeroUI `Card` renders a plain `dom.div` (`react/src/components/card/card.tsx:51`) with no interactive/href prop and no hover rule | **not transferable** — nothing to scope it to. Adding it to every static card would be wrong. |
| **motion** | `tc-card.styles.ts:21` `transition: box-shadow 150ms cubic-bezier(0.2,0,0,1)` | none | kept (not added) — with no shadow-changing state in HeroUI's Card it would be dead CSS |
| **focus ring** | `tc-card.styles.ts:109-117` `outline: 2px solid --tc-card-focus-ring-color` (→ `color.border.focus` = blue-500 / blue-300), `outline-offset: 2px`, on `:host([interactive]:focus-visible)` / `.link:focus-visible` | none — no focusable root | **not transferable**. (The global equivalents are already themed: `--focus` and `--ring-offset-width: --tc-focus-ring-offset`.) |
| **overflow** | `tc-card.styles.ts:20` `overflow: hidden` — clips the edge-to-edge `media` slot to the rounded corners | `card.css:5` `overflow-visible` | kept — HeroUI has no edge-to-edge media slot (all content sits inside the 16px padding; the With Images / Horizontal stories round their own `<img>`), and `hidden` would clip focus rings of controls inside the card |
| **height / min-height / min-size** | neither sets one (content-sized) | neither | n/a |
| **width** | `--tc-card-width` host property (`tc-card.styles.ts:7`) | story-level `className="w-[400px]"` | n/a — consumer concern, not a theme decision |
| **icon sizes** | tc-card has no icon slot | the Default story passes an `<Icon className="size-6">`; not component CSS | n/a |
| **disabled treatment** | neither has a disabled state | neither | n/a — `--disabled-opacity` is already themed globally |

## Colour-rule compliance

No `--tc-color-*` and no component token that resolves to a colour or a shadow
is referenced. The two colours the override sets come from HeroUI theme
variables that the generated theme flips per mode:

- `--accent` ≡ `--tc-color-brand-primary` (blue-900 → blue-300)
- `--foreground` ≡ `--tc-color-text-default` (gray-900 → gray-100)

No `extraThemeVars` are needed for this component.

Dimension tokens referenced, all mode-independent and all with fallbacks:
`--tc-card-radius` (16px), `--tc-space-16` (16px), `--tc-space-8` (8px),
`--tc-typography-heading-3`, `--tc-typography-body`.

## Verification notes

Assertions target `components-layout-card--default`, which renders
`.card` (variant `default`), `.card__header`, `.card__title`,
`.card__description` and `.card__footer`. Expected computed values under
`data-theme="tzuchi"` (identical under `tzuchi-dark` — all five are colour-free):

- `.card` `border-top-left-radius` → `16px` (was `24px`)
- `.card` `column-gap` → `16px` (was `12px`)
- `.card__title` `font-size` → `26px`, `font-weight` → `700`
- `.card__description` `font-size` → `16px`
- `.card__footer` `column-gap` → `8px` (was `0px`)
