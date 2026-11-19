# chip — Tzu Chi ↔ HeroUI gap inventory

**Override file:** `heroui/styles/themes/tzuchi/components/chip.css`
(drafted at `scratchpad/atoms/css/chip.css`)

**Closeness: major gaps.** The two chips agree on exactly one thing — `font-weight: 500`. Radius,
box model, density and type size all differ, and the difference in type is large (12px → 20px),
because the Tzu Chi chip is a 資訊網2.0 *filter pill* built on `typography.tab-sm`, not a tiny
inline label. Colours, by contrast, need **zero** work: the theme already lands them.

---

## Variant / size mapping

| tc | HeroUI | note |
|---|---|---|
| `tc-chip` (the single tonal look) | `<Chip color="accent" variant="soft">` | **exact already** — see the colour rows |
| `tc-chip variant="assist"` | same as above | tc's two variants are visually identical (`tc-chip.ts:27` + the styles file has no `[variant]` selector at all) |
| `tc-chip variant="filter"` | same as above | ditto; "filter" only changes behaviour (`selected`), not paint |
| `tc-chip` (one size only) | `.chip` / `.chip--md` — HeroUI's sizeless default | anchored here: the Default story is sizeless, and it is what `<Chip>` renders with no props |
| — | `.chip--sm` | no tc counterpart → one step down the *same* Tzu Chi type scale (`--tc-font-size-16`) |
| — | `.chip--lg` | no tc counterpart → one density step up (`--tc-space-8` / `--tc-space-16`); lands on 48px = `--tc-size-control-md` |
| — | `color` = `default` / `success` / `warning` / `danger`; `variant` = `primary` / `secondary` / `tertiary` | no tc counterpart — they inherit the new shape, their colours are untouched |

Resolved heights after the override: **sm 34px · md 40px · lg 48px** (was 20 / 24 / 28).

---

## Gap table

`tc` = `packages/components/src/chip/tc-chip.styles.ts` (values resolved through
`packages/tokens/dist/tokens.css`).
`hero` = `heroui/styles/components/chip.css`, resolved with this theme's `--radius: 8px`
(`themes/tzuchi/variables.css:19`) and root font-size 16px.

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| **border-radius** | `tc:27` `--tc-chip-radius` → `--tc-radius-full` → **9999px** (`tokens.css:170`, `:52`) | `hero:3` `rounded-2xl` = `calc(--radius * 2)` = **16px** | **changed** → `border-radius: var(--tc-chip-radius, 9999px)` |
| **border width / style / colour** | `tc:26` **1px solid transparent** (selected flips the colour, see below) | none (`0px`) | **changed** → `border: 1px solid transparent`. It is part of tc's box (2px of the 40px) and is the hook a future selectable chip needs; `transparent` is a keyword, not a colour token |
| **height (rendered)** | 1+1 border + 4+4 padding + 30px line = **40px** | 2+2 padding + 20px line = **24px** | **changed** as a consequence of padding + type + border |
| **min-block-size** | `tc:21` `31px` — *non-binding*, the comment predates the 20px type | none | **kept** — copying a dead 31px floor would be noise |
| **padding-block** | `tc:22` `--tc-space-4` = **4px** | `hero:3` `py-0.5` = **2px** | **changed** → `var(--tc-space-4, 4px)` |
| **padding-inline** | `tc:22` `--tc-space-12` = **12px** | `hero:3` `px-2` = **8px** (+ `hero:14` label `px-0.5` 2px → 10px text inset) | **changed** → `var(--tc-space-12, 12px)`, and `.chip__label { padding-inline: 0 }` so the text inset is exactly 12px like tc |
| **gap** | `tc:19` `--tc-space-4` = **4px** | `hero:3` `gap-0.5` = **2px** (+2px label padding → 4px effective) | **changed** → `4px`. Net icon↔label spacing is unchanged (4px before and after); the move exists only so the chip's own padding is the single source of the inset |
| **font-family** | `tc:23` `--tc-typography-tab-sm` → `'Noto Sans TC', system-ui, …` (`tokens.css:141`) | inherits `--font-sans` | **kept** — `variables.css:25` already sets `--font-sans: var(--tc-font-family-base)`, same stack |
| **font-size** | **20px** (`tab-sm`) | `hero:3` `text-xs` = **12px** (`--lg` 14px, `--sm` 12px) | **changed** → base/md **20px**, sm **16px** (`--tc-font-size-16`), lg stays 20px (tc has one chip type; lg is a density step) |
| **font-weight** | **500** | `hero:3` `font-medium` = **500** | **already matched** — restated in the file only so the size modifiers can't reintroduce drift |
| **line-height** | `1.5` → **30px** at 20px | `hero:3` `leading-5` = **20px** | **changed** → `var(--tc-line-height-normal, 1.5)` |
| **leading-icon size** | `tc:74-77` `--tc-size-icon-sm` = **20px** (`tokens.css:53`) | no rule; the stories pass Iconify `<Icon>`, default `1em` | **no rule needed** — `1em` × the new 20px font = 20px, i.e. `--tc-size-icon-sm` exactly. (The `Statuses` story's explicit `width={6}` dot is untouched by design.) |
| **background — tonal default** | `tc:25` `--tc-chip-bg` → `color.brand.surface` = **#e8eefe** light / **#1b2d58** dark (`tokens.css:277`, `:415`) | `.chip--accent.chip--soft` (`hero:89-92`) → `--accent-soft` = **#e8eefe** light / **#1b2d58** dark (`themes/tzuchi/variables.css:33`, `:68`) | **kept — identical.** The tzuchi theme maps `--accent-soft` to the primitive directly (no `color-mix`), so HeroUI's own soft/accent chip *is* the tc chip |
| **foreground — tonal default** | `tc:24` `--tc-chip-fg` → `color.brand.primary` = **#1b2d58** light / **#a9c2ea** dark | `--accent-soft-foreground` = **#1b2d58** light / **#a9c2ea** dark (`variables.css:35`, `:70`) | **kept — identical** |
| **hover background** | `tc:41-43` `--tc-chip-bg-hover` → `brand.surface-hover` = **#d1deff** / **#30559f** | none — HeroUI Chip is a static `<span>` (`react/src/components/chip/chip.tsx:60`) | **not transferable.** The value exists as `--accent-soft-hover` (`variables.css:34`, `:69`) for whoever styles TagGroup |
| **selected state** | `tc:46-49` bg → hover tone, `border-color` → `--tc-chip-fg` | no selected state, no `data-selected` | **not transferable** — HeroUI Chip is a label; `TagGroup` is the selectable one |
| **removable / close button** | `tc:85-121` 20px round button, `margin-inline-start: 4px`, hover bg `brand.surface` | no remove affordance in the component or its `chipVariants` slots (`styles/src/components/chip/chip.styles.ts:10-13` — only `base` + `label`) | **not transferable** — belongs to TagGroup |
| **focus ring** | `tc:56-60` `outline: 2px solid --tc-chip-focus-ring-color` (= `focus-ring.color` = **#4f7bbe**, *not* flipped in dark — see note), offset `2px` | none — the span is not focusable | **not transferable.** `variables.css:24` already routes `--ring-offset-width` from `--tc-focus-ring-offset` for everything that *is* focusable |
| **disabled** | `tc:62-65` `opacity: 0.38` (`--tc-opacity-disabled`), `cursor: not-allowed` | no disabled state | **not transferable.** `variables.css:23` already sets `--disabled-opacity: var(--tc-opacity-disabled)` theme-wide |
| **cursor** | `tc:28` `pointer` (`default` when `[static]`, `tc:37-39`) | default (`span`) | **kept** — HeroUI's Chip is always the static case |
| **elevation** | none | none | **kept** — nothing to do |
| **motion** | `tc:31-33` `background-color, border-color 150ms cubic-bezier(0.2,0,0,1)` | none | **kept** — the only thing it animates (hover/selected) does not exist here; a transition on a never-changing property is dead weight |
| **`.chip--tertiary`** | — | `hero:47` `--chip-bg: transparent` | **kept** — gets the pill + new density, stays a bare label |
| **`color="default"` fill** | — | `hero:26-28`, `hero:6` → `--default` / `--default-foreground` | **noted, not fixed here.** `themes/tzuchi/variables.css:13` lists `--default` as unmapped, so HeroUI's `oklch(94% …)` / `oklch(27.4% …)` shows through on the *default-coloured* chip (which is also `chipVariants`' default colour). That is a theme-generator mapping decision (`generate.mjs`), not a per-component override — putting a colour on `.chip--default` here would fork it from every other component that reads `--default` |

### Note on `--tc-focus-ring-color`

`tokens.css:129` keeps `--tc-focus-ring-color: var(--tc-color-blue-500)` in **both** modes while
`--tc-color-border-focus` flips to `blue-300` under `[data-theme="dark"]` (`tokens.css:426`). tc-chip
falls back from the former to the latter (`tc-chip.styles.ts:58`), so the tc chip's dark focus ring is
`#4f7bbe`, not `#a9c2ea`. Irrelevant to this override (no focus state to port) but worth a token-side
look.

---

## Cascade check

`themes/tzuchi/components/index.css` is imported `layer(components)` *after*
`styles/components/index.css` (`themes/tzuchi/index.css:15`, `styles/index.css:14`), so same layer,
later — and `[data-theme^="tzuchi"] .chip` is `(0,2,0)` against base `.chip`'s `(0,1,0)`. One
consequence worth stating: the base override also outranks `.chip--sm/--md/--lg` `(0,1,0)`, so those
sizes would collapse into the base unless restated. `--sm` and `--lg` are therefore restated; `--md`
deliberately is not, because md *is* the tc chip. No `!important` is needed anywhere.

## Verification targets

Story `components-data-display-chip--default` renders
`<span class="chip chip--accent chip--secondary"><span class="chip__label">Label</span></span>`
(`chip.stories.tsx:40-44` + `chip.tsx:49-52`; `size` has no `defaultVariants` entry, so no size class).

| selector | property | expected |
|---|---|---|
| `.chip` | `border-top-left-radius` | `9999px` |
| `.chip` | `height` | `40px` (1+1 border + 4+4 padding + 30px line box) |
| `.chip` | `padding-inline-start` | `12px` |
| `.chip` | `font-size` | `20px` |
| `.chip` | `line-height` | `30px` |
| `.chip` | `border-top-width` | `1px` |
