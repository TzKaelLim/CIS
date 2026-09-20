# radio — Tzu Chi ↔ HeroUI gap report

**Component:** `tc-radio` ↔ HeroUI `radio` (`.radio` / `.radio__content` / `.radio__control` / `.radio__indicator`)
**Override file:** `heroui/styles/themes/tzuchi/components/radio.css`
**Closeness:** major gaps — the control is twice the size, the ring is twice as thick and, above all, the *selection model* is different (Tzu Chi = ring + coloured dot; HeroUI = filled accent disc with a light dot).

## Variant mapping

| Tzu Chi | HeroUI | note |
|---|---|---|
| `tc-radio` (no variants) | `radio-group--primary` (HeroUI default variant) | 1:1 |
| — | `radio-group--secondary` | no tc counterpart. Left on the theme's own `--default` neutral fill for the *unselected* indicator; it inherits the new size / ring / radius / gap / type and keeps working. |
| `[checked]` | `[data-selected]` / `:has(input:checked)` / `[aria-checked="true"]` | restyled to ring+dot |
| `:hover` | `[data-hovered="true"]` | ring → `--accent` |
| `:focus-within` | `[data-focus-visible="true"]` → `status-focused` | offset removed |
| `[disabled]` | `[data-disabled]` → `status-disabled` | already identical |
| — | `[data-pressed="true"]`, `[data-invalid="true"]`, `Radio.Indicator` with custom children (`:not(:empty)`) | no tc counterpart; kept, given values consistent with the same tokens |

## Source lines

- Tzu Chi: `/Users/kaellim/Desktop/Personal/CISwebsite/packages/components/src/radio/tc-radio.styles.ts` (`styles`), `/Users/kaellim/Desktop/Personal/CISwebsite/packages/tokens/src/component/radio.tokens.json`, resolved in `/Users/kaellim/Desktop/Personal/CISwebsite-heroui-spike/packages/tokens/dist/tokens.css`
- HeroUI: `/Users/kaellim/Desktop/Personal/CISwebsite-heroui-spike/heroui/styles/components/radio.css`, `…/radio-group.css`, `…/styles/utilities/index.css`, `…/styles/themes/shared/theme.css`, `…/styles/themes/tzuchi/variables.css`

## Gap table

| Property | Tzu Chi (file:line → resolved) | HeroUI (file:line → resolved under `tzuchi`) | Action |
|---|---|---|---|
| Control size | `tc-radio.styles.ts:20-21` `--tc-radio-size` → `{size.icon.md}` → **32px** (`tokens.css:54,202`) | `radio.css:55` `size-4` → **16px** | **Changed** → `inline-size/block-size: var(--tc-radio-size, 32px)` |
| Control radius | `tc-radio.styles.ts:23` `--tc-radius-full` → **9999px** (true circle) | `radio.css:55` `rounded-lg` → `--radius-lg` = `calc(var(--radius)*1)` = `--tc-radius-md` = **8px** (a circle only because the box is 16px) | **Changed** → `border-radius: var(--tc-radius-full, 9999px)`; at 32px an 8px radius would be a squircle |
| Control border width | `tc-radio.styles.ts:25` **2px** (hard-coded; no `--tc-border-width-*` token exists) | `radio.css:55` `[border-width:var(--border-width-field)]` → `--field-border-width` = **1px** (`themes/tzuchi/variables.css:21`; default theme is 0px) | **Changed** → `border-width: 2px` literal, with a comment. Not routed through `--field-border-width`, which is theme-wide (input, select, textarea …) |
| Control border style | solid | solid (Tailwind preflight) | kept — identical |
| Resting ring colour | `tc-radio.styles.ts:25` `--tc-radio-ring` → `color.border.strong` → light **#828282** (gray-700), dark **#95969b** (gray-500) (`tokens.css:124,424`) | `radio.css:55` `border-field-border` → `--field-border` → light **#bdbdbd** (gray-300), dark **#6b6b6e** (gray-750) | **Changed** → `var(--tzuchi-radio-ring, var(--field-border))`. Genuinely different: tc's resting ring is a full step darker, which a 2px ring makes obvious. One extra theme variable (see below). Same decision as `--tc-checkbox-border` (`tokens.css:269`), so the tc form family shares it |
| Control background (unselected) | `tc-radio.styles.ts:26` `--tc-radio-bg` → `color.surface.default` → **#ffffff** / **#1c1c1e** | `radio.css:55` `bg-field` → `--field-background` → **#ffffff** / **#1c1c1e** | kept — resolves to exactly the same colour in both modes |
| Control shadow | none (the Figma "Elevation1" note at `tc-radio.styles.ts:9` is not implemented) | `radio.css:55` `shadow-field` → `--field-shadow` = `0 0 0 0 transparent` (`themes/tzuchi/variables.css:22`) | kept — already invisible under the Tzu Chi theme |
| **Selected: control** | `tc-radio.styles.ts:46-48` background unchanged, `border-color` → `--tc-radio-ring-checked` = `brand.primary` → **#1b2d58** / **#a9c2ea** | `radio.css:100-104` `border-transparent bg-accent` → filled **#1b2d58** / **#a9c2ea**, ring gone | **Changed** → `border-color: var(--accent)` + `background-color: var(--field-background, var(--surface))`. `--accent` already resolves to `brand.primary` per mode |
| **Selected: dot** | `tc-radio.styles.ts:33-52` 50% × 50% of the 28px inner box = **14px**, `--tc-radio-dot` = `brand.primary` → **#1b2d58** / **#a9c2ea**, `scale(0) → scale(1)` | `radio.css:160-165` `bg-accent-foreground` (**#ffffff** / **#1b2d58**), `scale: 0.4286` of the 14px inner box = **6px** | **Changed** → `background-color: var(--accent)`, `scale: 0.5` (= 14px of the 28px inner box, exactly tc's 50%) |
| Dot radius | `tc-radio.styles.ts:39` full | `radio.css:142` `rounded-lg` → 8px on a 28px pre-scale box → **not** round after scaling | **Changed** → `border-radius: var(--tc-radius-full, 9999px)` |
| Unselected dot | not rendered (`scale(0)`) | `radio.css:141-148` `bg-field` at `scale: 1` — fills the interior with the field background, i.e. invisible | kept — visually equivalent, and it is what drives HeroUI's grow/shrink animation |
| Hover ring | `tc-radio.styles.ts:54-56` → `brand.primary` **#1b2d58** / **#a9c2ea** | `radio.css:77-80` `border-field-border-hover` → `--field-border-hover` → **#4f7bbe** (blue-500) / **#a9c2ea** | **Changed** → `border-color: var(--accent)`. The theme's `--field-border-hover` comes from `--tc-input-border-hover` (`border.focus`), which is an *input* decision; tc's radio hover is brand-primary. Dark mode already agreed |
| Hover interior tint | none | `radio.css:83-90` unselected dot → `bg-field-hover` (`color-mix`) | kept — subtle, does not fight the ring model, and it is a HeroUI state |
| Pressed | none (tc has no pressed state) | `radio.css:93-96` `scale-95` on the control; `radio.css:107-111` selected+pressed → `bg-accent-hover`; `radio.css:168-175` dot `scale: 0.5714` (8px) | **Changed** for the selected case only: `border-color: var(--accent-hover)` (the fill it used to darken no longer exists) and dot `scale: 0.6429` — the same 4:3 growth HeroUI uses, here 14px → 18px. `scale-95` on the control kept |
| Focus ring width / colour | `tc-radio.styles.ts:59-62` `box-shadow: 0 0 0 var(--tc-focus-ring-width) var(--tc-radio-focus-ring-color)` → **2px #4f7bbe** (both modes; `--tc-focus-ring-color` is not flipped in dark, `tokens.css:129`) | `radio.css:73` `status-focused` → `focus-ring` (`utilities/index.css:2-6`) → `ring-2 ring-focus` → **2px** `--focus` = **#4f7bbe** / **#a9c2ea** | kept — width identical, colour identical in light. In dark HeroUI uses blue-300, which is the higher-contrast (and correct) choice; tc's unflipped blue-500 is a token bug, not a design decision |
| Focus ring offset | **0** — `box-shadow` sits directly on the border | `focus-ring` sets `--tw-ring-offset-width: var(--ring-offset-width)` = `--tc-focus-ring-offset` = **2px** (`themes/tzuchi/variables.css:24`) | **Changed** → `--ring-offset-width: 0px` on `.radio__control` only. Re-points the variable the utility reads instead of fighting its specificity; the theme-wide 2px offset is untouched for every other component |
| Label typography | `tc-radio.styles.ts:69` `--tc-typography-body` → **400 16px/1.6** Noto Sans TC (`tokens.css:139`) | `radio.css:47` `text-sm font-medium` → **500 14px/20px** | **Changed** → `font-size: var(--tc-font-size-16, 16px)`, `font-weight: var(--tc-font-weight-regular, 400)`, `line-height: var(--tc-line-height-relaxed, 1.6)` (= 25.6px). Family not set: `--font-sans` is already `--tc-font-family-base` theme-wide |
| Label colour | `tc-radio.styles.ts:70` `--tc-radio-label` → `text.default` → **#333333** / **#f2f2f2** | `radio.css:47` `text-foreground` → `--foreground` → **#333333** / **#f2f2f2** | kept — identical in both modes |
| Row gap (control ↔ label) | `tc-radio.styles.ts:7` `--tc-space-8` → **8px** | `radio.css:47` `gap-3` → **12px** | **Changed** → `gap: var(--tc-space-8, 8px)` |
| Field description indent | no counterpart (tc has no description slot) | `radio.css:29` `ps-7` → **28px** = 16px control + 12px gap | **Changed** → `calc(var(--tc-radio-size, 32px) + var(--tc-space-8, 8px))` = **40px**, so the text keeps lining up under the label after the size/gap change |
| Description type / colour | — | `radio.css:29` `text-xs text-muted` → 12px, `--muted` | kept — no tc equivalent; note that `--muted` (gray-700 #828282) is flagged in `NOTICE.md` as 3.84:1 in light |
| Field wrapper gap (row ↔ description) | — | `radio.css:14` `gap-1` → **4px** | kept — no tc equivalent |
| Group spacing | — | `radio-group.css:6-14` vertical `mt-4` (16px) / horizontal `gap-4` | kept — tc has no radio-group; lives in `radio-group.css`, out of scope for this file |
| Disabled | `tc-radio.styles.ts:13-15,64-66` `opacity: 0.38`, `cursor: not-allowed` | `radio.css:33-42` `status-disabled` (`utilities/index.css:61-65`) → `opacity: var(--disabled-opacity)` = `--tc-opacity-disabled` = **0.38**, `cursor: var(--cursor-disabled)`, `pointer-events: none` | kept — the theme already feeds the same 0.38 |
| Invalid | none (tc only has form-level `setValidity`, no visual) | `radio.css:115-126` `status-invalid-field` → 1px `outline-danger`, 2px `ring-danger` when focused | kept — no tc counterpart; it already uses `--danger`, which the theme resolves per mode |
| Elevation | none | none | kept |
| Motion | `tc-radio.styles.ts:27-29,42-43` **150ms** `cubic-bezier(0.2, 0, 0, 1)` on border-color / box-shadow / transform | `radio.css:61-65,153-156` **200ms** `--ease-out` on background-color / border-color, 100ms transform; `motion-reduce:transition-none` after it | kept — a 50ms / curve difference that does not read visually, and re-declaring `transition` at higher specificity would also require re-declaring the `motion-reduce` guard (rule 5). Flagged rather than changed |
| Cursor | `tc-radio.styles.ts:8` `pointer` | `radio.css:16,23,67` `var(--cursor-interactive)` = `pointer` | kept — identical |
| Icon sizes | n/a — tc renders no icon | `Radio.Indicator` accepts custom children; `:empty` guards the default dot so custom content is untouched | kept — the `:empty` guard is preserved; only `:empty::before` is restyled |

## Extra theme variable requested

| Variable | Should resolve from | Why |
|---|---|---|
| `--tzuchi-radio-ring` | `--tc-color-border-strong` (light `--tc-color-gray-700` #828282, dark `--tc-color-gray-500` #95969b) | tc's resting radio ring is `color.border.strong`, one step darker than the theme's `--field-border` (`color.border.default`). At 2px the difference is plainly visible, and the same token backs `--tc-checkbox-border`. Used as `var(--tzuchi-radio-ring, var(--field-border))`, so the file is correct even before the generator learns it. |

## Not transferable

- **Pressed** (`data-pressed`) — tc-radio has no pressed state. Given the accent-hover ring + larger dot, consistent with the ring model.
- **Invalid / field-error** — tc-radio reports validity to the form (`setValidity`) but paints nothing. HeroUI's `status-invalid-field` is kept as is.
- **Field description slot** — no tc counterpart; only its indent was re-derived from the new control size.
- **`radio-group--secondary`** — tc has no second radio variant; left on the theme's `--default` neutral.
- **Custom `Radio.Indicator` children** — no tc counterpart; the `:empty` guard means custom content is never touched by this file.
- **Radio group orientation / spacing** — tc has no group component; `radio-group.css` untouched.
- **Motion curve** — see the table: recorded, deliberately not changed.

## Caveat worth raising with the token owners

`tc-radio`'s docblock and CSS fallbacks say **24px** (`tc-radio.ts:14,15`, `tc-radio.styles.ts:20-21`), but the shipped token resolves `radio.size → {size.icon.md} → 32px` (`tokens.css:54`), and the same is true of `--tc-checkbox-size` (`tokens.css:167`). The token wins wherever `tokens.css` is loaded, so the *rendered* tc-radio is 32px and this file follows the token. If 24px was the Figma intent, `size.icon.md` (or `radio.size`) is the thing to fix, and this file needs no edit — it reads `--tc-radio-size`.
