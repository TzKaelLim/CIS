# badge — tc-badge ↔ HeroUI Badge gap report

**Verdict: minor-gaps.** Colour, radius, border width, weight and family already
line up once the Tzu Chi theme variables are in play. What is left is density
(the box is ~40% too tall at `md`/`lg`), the inner gap, and a per-size
line-height that Tzu Chi does not have. Three rules, no new theme variables.

## The two components are not the same thing

`tc-badge` is a **standalone label/status pill** (`role="presentation"`, tone ×
variant matrix, optional leading dot, optional `pill` flag). HeroUI `Badge` is
an **indicator anchored on another element** — `Badge.Anchor > Avatar + Badge`,
absolutely positioned into a corner, empty when used as a status dot. So the
parts of the tc design that transfer are the box metrics and the type; the
parts that encode "a pill sitting in a line of text" do not. Both are listed
below rather than silently dropped. HeroUI **Chip** / **TagGroup** are the
closer counterparts for tc-badge's labelling use; this file only covers Badge.

## A quirk on the Tzu Chi side, found while resolving values

`tc-badge.styles.ts:130-136` writes its `sm` overrides as
`var(--tc-badge-min-size, 18px)`, `var(--tc-badge-font-size, 11px)`,
`var(--tc-badge-gap, 3px)`, `var(--tc-badge-padding-inline, var(--tc-space-4))`.
Those custom properties are defined **globally** in `tokens.css` (`:root`,
lines 96-99 / 152-154), so the fallbacks never fire: with the token sheet
loaded, `tc-badge[size="sm"]` resolves identically to `md` — 20px box, 12px
text, 4px gap, 8px/2px padding, 6px dot. The same is true of `pill`
(`:host(:not([pill]))` uses `var(--tc-badge-radius, 4px)` while
`--tc-badge-radius` is globally `--tc-radius-sm` = 4px, so `pill` also renders
4px). Read literally, **the shipped Tzu Chi badge has one size and one
radius**. The table below therefore treats tc's 20px / 12px / 4px / 1.3 set as
*the* Tzu Chi decision and notes the authored-but-unreachable values.

## Gap table

`tc` = `packages/components/src/badge/tc-badge.styles.ts`
`tok` = `packages/tokens/dist/tokens.css`
`hui` = `heroui/styles/components/badge.css`
`shd` = `…/heroui/styles/themes/shared/theme.css`
`tzv` = `…/heroui/styles/themes/tzuchi/variables.css`

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| **radius** | tc:141-147 `var(--tc-badge-radius, 4px)` → tok:152 `--tc-radius-sm` = **4px**; `[pill]` → authored `9999px`, unreachable (see quirk) | hui:10 `rounded-3xl` = shd:110 `calc(var(--radius)*3)`, tzv:19 `--radius: --tc-radius-md` = 8px → **24px**; `--lg` hui:36 `rounded-2xl` = **16px**; `--sm` hui:44 `rounded-xl` = **12px** | **kept.** 24/16/12px against boxes of 20/24/16px all clamp to a full pill — i.e. tc's `pill` shape. tc's 4px default is a *text-pill-in-a-paragraph* decision; a 4px-cornered bubble on an avatar corner reads as broken. Identical values also mean nothing to write. |
| **min box size (md)** | tc:112 `var(--tc-badge-min-size, 20px)` → tok:97 = **20px** | hui:10 `min-h-7 min-w-7` = **28px** (= 70% of the 40px `md` Avatar, avatar.css:33) | **changed → 20px** (`min-block-size`+`min-inline-size`, tc token). 20px is half the 40px avatar — the ratio `sm` already has. |
| **min box size (sm)** | authored 18px, resolves to **20px** (quirk) | hui:44 `min-h-4 min-w-4` = **16px** (half the 32px `sm` Avatar) | **kept at 16px**, but *restated* in the override file: the themed base rule `[data-theme^="tzuchi"] .badge` (0,2,0) out-specifies HeroUI's `.badge--sm` (0,1,0) and would otherwise force 20px on it. |
| **min box size (lg)** | no `lg` variant | hui:36 `min-h-8 min-w-8` = **32px** (67% of the 48px `lg` Avatar) | **changed → 24px.** Extrapolated, not a tc decision: half the 48px avatar, giving a 16/20/24 scale on the 4px `--tc-space-4` rhythm. |
| **padding (box)** | tc:113-114 `2px` block / `8px` inline (tok:98 `--tc-badge-padding-block`, tok:154 `--tc-badge-padding-inline` → `--tc-space-8`) | none on `.badge`; hui:24 `.badge__label { px-0.5 }` = **2px inline**, 0 block | **kept.** Block: 2px would be a no-op — the line box (12px × 1.3 = 15.6px) plus 4px is still under the 20px min. Inline: 8px per side makes a single-digit count ~23px wide, so `min-inline-size` stops governing and the circular count bubble becomes an oval. HeroUI derives width from `min-inline-size`; tc derives it from padding. Not transferable. |
| **gap** | tc:111 `var(--tc-badge-gap, 4px)` → tok:153 `--tc-space-4` = **4px** | hui:7 `gap-0.5` = **2px** | **changed → 4px** (`--tc-badge-gap`). |
| **border width** | tc:122 `1px solid transparent` (soft/filled) | hui:19 `1px solid var(--badge-border)` | **kept** — same 1px. |
| **border colour / style** | tc:122 `transparent`; `outline` variant tc:170 `--tc-badge-_line` (tone colour) | hui:16 `--badge-border: var(--background)` + `background-clip: padding-box` | **kept.** HeroUI's border is a cut-out ring that separates the indicator from whatever it is pinned to — structural to the anchored design, and already a theme variable (`--background`), so correctly themed in both modes. |
| **font-family** | tc:116 `--tc-font-family-base` | not set on `.badge`; inherited from `--font-sans` | **kept** — tzv:25 already sets `--font-sans: var(--tc-font-family-base)`. Already matches. |
| **font-size** | tc:117 `var(--tc-badge-font-size, 12px)` → tok:96 = **12px** (sm's 11px unreachable) | hui:10 `text-xs` = **12px**; `--lg` hui:36 `text-sm` = 14px; `--sm` hui:44 = 10px | **kept.** `md` already equals the tc token exactly. `sm`/`lg` keep HeroUI's ±2px steps — tc has no counterpart and its own `sm` step is dead. |
| **font-weight** | tc:118 `--tc-font-weight-medium` = tok:84 **500** | hui:7 `font-medium` = **500** | **kept** — identical. |
| **line-height** | tc:119 `var(--tc-line-height-tight, 1.25)` → tok:91 = **1.3** (note: the literal fallback in the Lit source disagrees with the token) | hui:10 `leading-[1.34]`; `--lg` hui:36 `leading-[1.43]`; `--sm` hui:44 `leading-[1.34]` | **changed → 1.3 for every size.** Tzu Chi has one value; HeroUI has two. Resolved: md 15.6px (was 16.08px), sm 13px (was 13.4px), lg 18.2px (was 20.02px). |
| **icon size** | no icon slot; only a 6px leading dot (tok:99) | Iconify `<Icon>` inside the badge renders at `1em` (stories:155), i.e. 12px at `md` | **kept.** tc-badge has no icon; nothing to transfer. |
| **leading dot** | tc:175-187 6px circle *inside* the pill, `background: currentColor`; filled variant tc:191 `--tc-badge-dot-color` | no inner dot; a "dot badge" is an **empty** badge whose diameter is `min-w`/`min-h` (stories:216-269) | **not transferable** — different mechanism. Side effect of the size change: the HeroUI dot badge becomes 20px (`md`) / 24px (`lg`), 16px (`sm`) unchanged. |
| **variant: filled** | tc:160-164 `--tc-badge-_solid-bg` / `_solid-fg` | `.badge--primary` + compound hui:115-138 `--badge-bg: var(--accent|--success|…)`, `--badge-fg: var(--*-foreground)` | **kept — colours already themed.** Mapping recorded in the CSS header. |
| **variant: soft** | tc:152-157 `--tc-badge-_soft-bg` / `_soft-fg` | `.badge--soft` + compound hui:144-167 `--badge-bg: var(--*-soft)`, `--badge-fg: var(--*-soft-foreground)` | **kept — colours already themed.** Note tc's soft is the *default* variant while HeroUI defaults to `primary` (badge.styles.ts:10); changing the default is a props/API change, out of scope for a theme file. |
| **variant: outline** | tc:167-171 transparent bg + tone border | no equivalent; the third slot `.badge--secondary` (hui:81-85) is a neutral `--default` fill with tone text | **not transferable.** Adding an outline look to `--secondary` would silently redefine an upstream variant (rule 5). Left alone. |
| **tone: neutral / brand / error / success** | tc:34-48, 61-87 | `--default` / `--accent` / `--danger` / `--success` | **kept** — 1:1, colours come from theme variables. |
| **tone: warning** | tc:91-102 derived from `--tc-color-blue-400` "no dedicated warning token in the palette" | `--warning` → tzv:51/86 `--tc-color-amber-700` (light) / `--tc-color-amber-300` (dark) | **kept amber.** The palette gap tc worked around is closed; reinstating a blue warning would be a regression, and it would need a raw `--tc-color-*` colour reference, which the colour rule forbids. |
| **tone: info** | tc:51-59 blue-700 solid / brand-surface soft | no `info` colour | **not transferable** — no HeroUI slot. |
| **focus ring** | none — tc:61 forces `role="presentation"`, not focusable | none — plain `<span>` (badge.tsx:93) | **kept** — neither component is focusable. `--ring-offset-width` is already themed (tzv:24) for the components that are. |
| **disabled** | no disabled state | no disabled state | **kept** — `--disabled-opacity` already themed (tzv:23). |
| **hover / pressed / selected / invalid / pending** | none (non-interactive) | none (non-interactive) | **kept** — no `data-*` state hooks exist on Badge in either library. |
| **elevation** | none | none | **kept.** No shadow on either; `--surface-shadow`/`--overlay-shadow` not needed here. |
| **motion** | none | none | **kept.** Neither transitions anything (the adjacent Avatar does, avatar.css:18 — untouched). |
| **white-space / user-select** | tc:124-125 `nowrap`, `user-select: none` | not set | **kept.** `nowrap` is a no-op here (the badge is absolutely positioned or shrink-to-fit in every HeroUI usage); `user-select` is a behaviour choice, not shape/density/type. |

## Result

`heroui/styles/themes/tzuchi/components/badge.css` — three rules, one of which
only restates `sm` so the themed base rule does not out-specify it. No new
theme variables, no colour touched, no variant, size, placement or state
removed.
