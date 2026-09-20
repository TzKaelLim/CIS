# Input — Tzu Chi vs HeroUI gap inventory

**tc-input** (Lit, `packages/components/src/input/tc-input.styles.ts`) ↔ **HeroUI `.input`**
(`styles/components/input.css`, React `react/src/components/input/input.tsx`).

Override file: `heroui/styles/themes/tzuchi/components/input.css`
(draft at `scratchpad/atoms/css/input.css`).

**Verdict: minor gaps.** Colour, radius, border width, field shadow, disabled opacity and
font family already land correctly through `themes/tzuchi/variables.css` — this component was
almost fully themed already. Only **density (inline padding)** and **type (font-size /
line-height)** were still HeroUI's, plus one invalid-state border colour. Four declarations.

## Variant mapping

| Tzu Chi | HeroUI | note |
|---|---|---|
| `tc-input` — one single look (bordered field on surface) | `.input` / `.input--primary` | 1:1 |
| — none — | `.input--secondary` (neutral filled) | kept; inherits the new density/type |
| host width / `style="width:…"` | `.input--full-width` | untouched, equivalent |

`tc-input` is a *composed* control: it renders its own `<label>`, required `*`,
helper/error `<p>` and `prefix`/`suffix` slots. HeroUI splits those into `label.css`,
`description.css`, `field-error.css` and `input-group.css` — see "Not transferable".

## Gap table

Resolved values are given light / dark where they differ. HeroUI values are resolved **under
`data-theme="tzuchi"` / `"tzuchi-dark"`** (i.e. after `themes/tzuchi/variables.css`), with the
stock HeroUI value in parentheses when the theme already changed it.

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| **radius** | `tc-input.styles.ts:30` `--tc-input-radius` → `--tc-radius-md` = **8px** (both modes) | `input.css:2` `rounded-field` → `--radius-field` → `--field-radius`; `themes/tzuchi/variables.css:20` = **8px** (stock: `calc(0.5rem*1.5)` = 12px) | kept — theme already resolves to 8px |
| **height / min-size** | not declared; derived = 1 + 8 + 25.6 + 8 + 1 = **43.6px** | not declared; derived = 1 + 8 + 20 + 8 + 1 = **38px** at ≥640px, **42px** below | kept as derived — no explicit height on either side; the type change below lands it on 43.6px at every width |
| **padding-block** | `tc-input.styles.ts:31` `var(--tc-space-8)` = **8px** | `input.css:2` `py-2` = **8px** | kept — identical |
| **padding-inline** | `tc-input.styles.ts:31` `var(--tc-space-20)` = **20px** | `input.css:2` `px-3` = **12px** | **changed → `padding-inline: var(--tc-space-20, 20px)`** |
| **gap (prefix/input/suffix)** | `tc-input.styles.ts:27` `.control` `gap: var(--tc-space-8)` = **8px** | `.input` is a bare `<input>` with no children; the counterpart is `input-group.css:114/140` `.input-group__prefix/__suffix` | not transferable — belongs to InputGroup |
| **border-width** | `tc-input.styles.ts:29` **1px** | `input.css:4` `var(--border-width-field)` → `--field-border-width`; `variables.css:21` = **1px** (stock: 0px) | kept — theme already 1px |
| **border-style** | `solid` | `solid` (Tailwind preflight) | kept |
| **border-color (rest)** | `:29` `--tc-input-border` → `color.border.default` = **#bdbdbd** / **#6b6b6e** | `input.css:5` `var(--field-border)`; `variables.css:56` / `:91` = **#bdbdbd** / **#6b6b6e** | kept — identical |
| **background** | `:28` `--tc-input-bg` → `color.surface.default` = **#ffffff** / **#1c1c1e** | `input.css:2` `bg-field` → `--field-background`; `variables.css:53` / `:88` = **#ffffff** / **#1c1c1e** | kept — identical |
| **text colour** | `:55` `--tc-input-text` → `color.text.default` = **#333333** / **#f2f2f2** | `input.css:2` `text-field-foreground` → `--field-foreground`; `variables.css:54` / `:89` = **#333333** / **#f2f2f2** | kept — identical |
| **placeholder colour** | `:60-62` `--tc-input-placeholder` → `color.text.muted` = **#828282** / **#b3b3b3**, `opacity: 1` | `input.css:2` `placeholder:text-field-placeholder` → `--field-placeholder`; `variables.css:55` / `:90` = **#828282** / **#b3b3b3**; preflight sets placeholder `opacity: 1` | kept — identical |
| **font-family** | `:54` `--tc-typography-body` → `'Noto Sans TC', system-ui, -apple-system, 'PingFang TC', 'Microsoft JhengHei', sans-serif` | `.input` sets none; Tailwind preflight `font: inherit` → `html, body { font-family: var(--font-sans) }` (`storybook/.storybook/globals.css`), and `variables.css:25` `--font-sans: var(--tc-font-family-base)` = same stack | kept — identical |
| **font-size** | `:54` **16px** at every width | `input.css:2` `text-base sm:text-sm` = **16px** below 640px, **14px** from 640px up | **changed → `var(--tc-font-size-16, 16px)`** (kills the `sm:` step-down) |
| **font-weight** | `:54` `--tc-typography-body` = **400** | not set → inherited `normal` = **400** | kept — identical |
| **line-height** | `:54` **1.6** → 25.6px | `text-base` = **1.5** (24px); `sm:text-sm` = **1.4286** (20px) | **changed → `var(--tc-line-height-relaxed, 1.6)`** |
| **icon sizes** | `:95-101` slots are `inline-flex` in `--tc-color-text-muted`; no size imposed | none on `.input`; `input-group.css` sizes the affixes | not transferable — InputGroup |
| **hover** | `:37-39` border → `color.border.focus` = **#4f7bbe** / **#a9c2ea**; background unchanged | `input.css:17-23` `border-color: var(--field-border-hover)`; `variables.css:57` / `:92` = **#4f7bbe** / **#a9c2ea** — identical. Also `bg-field-hover` → `--field-hover` = `color-mix(field-background 90%, field-foreground 2%)` (`themes/default/variables.css:135`) ≈ a **2%** tint | kept — border identical; the ~2% background tint is below the noticing threshold and removing it would require a colour declaration for no gain |
| **focus — border** | `:42-43` `--tc-input-border-focused` → `color.border.focus` = **#4f7bbe** / **#a9c2ea** | `input.css:29` `var(--field-border-focus)`; `variables.css:58` / `:93` = **#4f7bbe** / **#a9c2ea** | kept — identical |
| **focus — ring** | `:44` `box-shadow: 0 0 0 3px` in `--tc-input-focus-ring` → `color.brand.surface-hover` = **#d1deff** (blue-200) / **#30559f** (blue-700) | `input.css:27-28` `status-focused-field` → `utilities/index.css:53` → `focus-field-ring:8-12` = `ring-2 ring-focus`, `--tw-ring-offset-width: 0px` → **2px solid `--focus`** = **#4f7bbe** / **#a9c2ea** (`variables.css:45` / `:80`) | **kept, deliberate** — same hue family, higher contrast, and it is the ring machinery the whole library shares. Overriding it means re-declaring `box-shadow`, which fights Tailwind's `--tw-ring-shadow` composition and would break the `shadow-field` stack. Cosmetic delta: 2px solid vs 3px pale halo |
| **focus — background** | unchanged | `input.css:30` `var(--field-focus)` = `var(--field-background)` → **no visible change** | kept — no-op |
| **invalid — border** | `:65-69` `--tc-input-border-invalid` → `color.feedback.error` = **#d4494f** / **#f08a8e** | `input.css:34-37` keeps the **neutral** `--field-border`; only adds `outline: 1px solid var(--danger)` (`utilities/index.css:57` → `invalid-field-ring:15-17`). `--danger` under tzuchi = **#d4494f** / **#f08a8e** (`variables.css:47` / `:82`) — same colour, different element | **changed → `border-color: var(--danger)`** on `[data-invalid="true"]`; the outline is kept (survives forced-colors and is what the focused state thickens into a ring) |
| **invalid — focus ring** | `:71-73` `box-shadow: 0 0 0 3px` in the error colour | `invalid-field-ring:20-28` `ring-2 ring-danger`, offset 0 | kept — same intent, 2px vs 3px |
| **invalid — background** | unchanged | `input.css:36` `var(--field-focus)` = `var(--field-background)` → no-op | kept |
| **disabled** | `:75-82` `opacity: var(--tc-input-disabled-opacity)` = **0.38**; `cursor: not-allowed` | `input.css:40-44` `status-disabled` → `utilities/index.css:61-65` = `opacity: var(--disabled-opacity)` = **0.38** (`variables.css:23`), `cursor: var(--cursor-disabled)` = **not-allowed** (`themes/default/variables.css:30`), plus `pointer-events: none` | kept — identical, and HeroUI's extra `pointer-events: none` is strictly better |
| **elevation** | none on `.control` | `input.css:2` `shadow-field` → `--field-shadow`; `variables.css:22` = **`0 0 0 0 transparent`** (stock: a 3-layer field shadow) | kept — theme already flattened it |
| **motion** | `:32-34` `border-color`, `box-shadow` — **150ms** `cubic-bezier(0.2, 0, 0, 1)` (`--tc-motion-duration-fast` / `--tc-motion-easing-standard`) | `input.css:11-15` `background-color 150ms ease`, `border-color 150ms ease`, `box-shadow 150ms var(--ease-out)`, then `motion-reduce:transition-none` | kept — same 150ms; only the curve differs, which is imperceptible on a 150ms colour fade, and re-declaring the shorthand would silently drop any property upstream adds later and sit ahead of the `motion-reduce` guard |
| **variant `--secondary`** | no tc equivalent | `input.css:52-77` `--input-bg: var(--default)` (+ `--default-hover`), `shadow-none` | kept — inherits the new density/type; see the `--default` note below |
| **variant `--full-width`** | host-level width in tc | `input.css:80-82` `w-full` | kept — equivalent |

## Theme-level gap found (not fixed here)

`--default` / `--default-foreground` are **unmapped** by the Tzu Chi theme —
`themes/tzuchi/variables.css:13-14` says so in its own header. `.input--secondary` therefore
fills with HeroUI's stock neutral (`oklch(94% 0.001 286.375)` light /
`oklch(27.4% 0.006 286.033)` dark). This is a **generator** gap, not an input-shape gap: the
same variable feeds secondary/tertiary buttons, chips and every other neutral fill. It belongs
in `generate.mjs`'s mapping table (candidates: `color.surface.subtle` / `color.text.default`),
not in a per-component override — so no `--tzuchi-input-*` variable was invented for it.

One consequence worth knowing: because the Tzu Chi theme sets `--field-border-width: 1px`
globally (stock HeroUI is `0px`), `.input--secondary` now carries a visible 1px border it was
not designed to have. That reads as correct for Tzu Chi — every tc field is bordered — so it
was left alone.

## Not transferable

- **`<label>` + required `*`** — `tc-input.styles.ts:14-22` (`--tc-typography-subtitle` =
  `700 16px/1.5`, `margin-inline-start: 4px` on the `*`, error colour). HeroUI's Label is a
  separate component (`styles/components/label.css`), used through TextField.
- **helper / error `<p>`** — `tc-input.styles.ts:84-93` (16px, muted, error colour when
  invalid). HeroUI: `description.css` + `field-error.css`.
- **field gap 4px** — `tc-input.styles.ts:11` `.field { gap: var(--tc-space-4) }` is the
  label→control→helper stack; in HeroUI that stack lives in `textfield.css`.
- **`prefix` / `suffix` slots + their 8px gap** — `tc-input.styles.ts:27, 95-101`. HeroUI puts
  affixes in **InputGroup** (`input-group.css`), a sibling component with its own override file.
- **`.control` wrapper** — tc wraps the native input in a bordered flex box and styles *that*;
  HeroUI styles the `<input>` element itself. All border/padding/radius decisions were moved
  onto `.input` accordingly.
- **`:host(:focus-within)`** — tc's focus lives on the wrapper via `delegatesFocus`; HeroUI
  uses `:focus` / `[data-focused="true"]` on the input. Same states, different plumbing.

## Assertions (headless, story `components-forms-input--default`, selector `.input`)

| property | expected | why |
|---|---|---|
| `padding-inline-start` | `20px` | was `12px` (`px-3`) |
| `font-size` | `16px` | was `14px` at ≥640px viewport (`sm:text-sm`) |
| `line-height` | `25.6px` | was `20px` at ≥640px (1.6 × 16px) |

Not asserted because this file does not change them: `border-top-left-radius` (8px) and
`border-top-width` (1px) already come from `themes/tzuchi/variables.css`.
