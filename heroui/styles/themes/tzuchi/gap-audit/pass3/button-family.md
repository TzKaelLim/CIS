# Unit `button-family` — ButtonGroup · ToggleButton · ToggleButtonGroup · Toolbar · CloseButton

- **Spec**: `heroui/styles/themes/tzuchi/DESIGN-LANGUAGE.md` (read in full; every change below cites a rule number)
- **Prior art read end to end**: `heroui/styles/themes/tzuchi/components/button.css` (both halves — pass 1's
  metrics/variants/ButtonGroup corners and pass 2's icon-only block), `gap-audit/button.md`,
  `gap-audit/button-icon-only.md`, and the CloseButton-touching parts of
  `themes/tzuchi/components/tag.css` (:143-171) and `themes/tzuchi/components/modal.css` (:107-118).
- **Bases read**: `heroui/styles/components/{button,button-group,toggle-button,toggle-button-group,toolbar,close-button}.css`,
  the five `styles/src/components/*/…styles.ts` class maps, the five React sources and all five story files,
  `themes/tzuchi/variables.css`, `themes/shared/theme.css:103-111`, `packages/tokens/dist/tokens.css`.
- **Files written**: `toggle-button.css`, `toggle-button-group.css`, `toolbar.css`, `close-button.css`.
  **`button-group.css`: no file** (reason at the end).

Everything transferred here is a **mode-independent dimension token**. Verified mechanically that the
`[data-theme="dark"]` and `prefers-color-scheme: dark` blocks of `packages/tokens/dist/tokens.css`
redefine none of `--tc-button-radius`, `--tc-icon-button-radius`, `--tc-radius-full`, `--tc-radius-md`,
`--tc-size-control-md/-lg`, `--tc-size-icon-sm/-md/-lg`, `--tc-space-4/-8/-12/-16/-24/-32`,
`--tc-font-size-16`, `--tc-font-weight-bold`, `--tc-line-height-normal`. **Not one colour, shadow or
state declaration is written by this unit**, so `tzuchi` and `tzuchi-dark` resolve identically and
nothing in §10 is touched.

---

## 1. `toggle-button.css`

ToggleButton has no Tzu Chi counterpart of its own, but it does not need one: R22 names
`toggle-button` in the **Control** radius role, and R40/R42–R44 (height) and R24/R45–R47 (icon-only)
are the same ladder `button.css` already walks. So this file is Button's geometry and type,
transferred class-for-class — nothing invented.

| property | HeroUI base (file:line → resolved under `tzuchi`) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `border-radius` | `toggle-button.css:7` `rounded-3xl` = `calc(var(--radius) * 3)` → **24px** | `border-radius: var(--tc-button-radius, var(--radius))` → **8px** | **R22** (Control; names `toggle-button`) |
| `font-size` | `toggle-button.css:7` `text-sm` → **14px** | `var(--tc-font-size-16, 16px)` → **16px** | **R1** (control label = subtitle); §1 "every 14px role moves to 16px" |
| `font-weight` | `toggle-button.css:7` `font-medium` → **500** | `var(--tc-font-weight-bold, 700)` → **700** | **R1** |
| `line-height` | `text-sm` default `calc(1.25 / 0.875)` = 1.4286 → **20px** | `var(--tc-line-height-normal, 1.5)` → **24px** | **R1**; §1.2 "1.5 for controls" |
| `padding-inline` (md) | `toggle-button.css:7` `px-4` → **16px** | `var(--tc-space-24, 24px)` → **24px** | **R43** |
| `padding-inline` (sm) | `toggle-button.css:93` `px-3` → **12px** | `var(--tc-space-16, 16px)` → **16px** | **R42** |
| `padding-inline` (lg) | inherits the base `px-4` → **16px** | `var(--tc-space-32, 32px)` → **32px** | **R44** |
| `height` (md) | `toggle-button.css:7` `h-10` **40px**, `md:h-9` **36px** ≥768px | `--tzuchi-toggle-button-block-size: calc(16px × 1.5 + 8px × 2 + 2px)`; `height: var(…)` → **42px at every width** | **R40**, **R43**; §3.1 "apply R40 as a local custom property" |
| `height` (sm) | `toggle-button.css:93` `h-9` 36px / `md:h-8` 32px | same formula, padding-block `--tc-space-4` → **34px** | **R42** |
| `height` (lg) | `toggle-button.css:110` `h-11` 44px / `md:h-10` 40px | same formula, padding-block `--tc-space-12` → **50px** | **R44** |
| icon-only `border-radius` | base `rounded-3xl` → 24px; the rule above would make it 8px | `var(--tc-icon-button-radius, var(--tc-radius-full, 9999px))` → **9999px (circle)** | **R24** |
| icon-only `padding-inline` | `toggle-button.css:140` `p-0` → 0, but (0,1,0) loses to the theme's own (0,2,0) `padding-inline: 24px` | `padding-inline: 0` restated at (0,2,0) | **R24 / R46** (repair, same one `button.css:126-128` makes) |
| icon-only box (md) | `toggle-button.css:7,140` `h-10 w-10`, `md:h-9 md:w-9` → **40 / 36px** | `--tzuchi-toggle-button-size: var(--tc-size-control-md, 48px)` → **48px** square | **R46** |
| icon-only box (sm) | `toggle-button.css:144` `w-9 md:w-8` → 36 / 32px | `calc(var(--tc-size-icon-sm, 20px) + var(--tc-space-8, 8px) * 2)` → **36px** | **R45** (no tc counterpart; md's 8px ring, expressed as calc-over-tokens per **I6**) |
| icon-only box (lg) | `toggle-button.css:148` `w-11 md:w-10` → 44 / 40px | `var(--tc-size-control-lg, 64px)` → **64px** | **R47** |
| icon-only glyph | `toggle-button.css:84` `size-5` 20px, `sm:size-4` 16px ≥640px; `:96` sm `size-4` 16px | `var(--tc-size-icon-md, 32px)` md · `-icon-sm, 20px` sm · `-icon-lg, 40px` lg, one flat value | **R45–R47** |

**Left as HeroUI's (and why)**

| what | why |
|---|---|
| **the selected fill** `--accent-soft` / `--accent-soft-hover` / `--accent-soft-foreground` (`toggle-button.css:29-32,65-80`) | That is already **R76**'s tonal trio — byte-identical to the recipe pass 1 pointed `.button--secondary` at. Correct in both modes with zero declarations. |
| **`--default` / `--ghost` rest, hover, pressed fills** (`:23-25,122-133`) | **R88 ①** — a HeroUI-only *neutral* variant with no Tzu Chi counterpart keeps `--default`; the identical call **D7** makes for `.button--tertiary` / `--ghost`. |
| **disabled** | **R85 / D2** — `--disabled-opacity` is 0.38 theme-wide and `status-disabled` also sets the cursor. |
| **focus ring** | **R70 / D3** — 2px / 2px / `--focus`, all from `variables.css`. |
| **the `transition` shorthand** (`:13-17`) | It carries the press `transform` and the ring's `box-shadow`; overriding the colour leg means re-declaring both. Same call as `gap-audit/button.md:57`, and **R136** forbids touching `transition-property`. |
| **`-mx-0.5 / my-0.5 / sm:my-1` glyph margins**, `w-fit`, `gap-2` (8px, **R147** already), `scale(0.97/0.98/0.96)` press | Symmetric margins on a flex-centred child in a fixed box move nothing; the rest is HeroUI's interaction signature which tc neither specifies nor contradicts (`gap-audit/button-icon-only.md:62,71`). |
| **`sm:size-4` on a *labelled* toggle's icon** | Kept, exactly as pass 1 keeps it for text buttons; only icon-only drops it. |

**Coverage** — nothing hidden or flattened: variants `default` / `ghost`, sizes `sm` / `md` / `lg`,
`isIconOnly`, and the `selected` / `hover` / `pressed` / `focus-visible` / `disabled` states all
still render, now at 34 / 42 / 50px with 16-700 labels and 36 / 48 / 64px circles.

**Cascade** (every base rule is (0,1,0) or (0,2,0), all earlier in the same layer): `.toggle-button`
(0,2,0) beats the base incl. its `md:` height variants (media queries add no specificity);
`--sm` / `--lg` (0,2,0) retune it by source order inside this file; `--icon-only` (0,2,0, later still)
beats both for `padding-inline` and radius; `--icon-only.--sm/--lg` (0,3,0); `.toggle-button
.toggle-button--icon-only` (0,3,0) supersedes `.toggle-button { height }` (0,2,0) and the base's
`.toggle-button--icon-only.toggle-button--sm/--lg` (0,2,0); `.toggle-button--icon-only svg` (0,2,1)
beats the base's `.toggle-button svg` and `.toggle-button--sm svg`, both (0,1,1), at every breakpoint.

---

## 2. `toggle-button-group.css`

This file exists because of the **same cascade bug `button.css` already fixes for ButtonGroup**:
`.toggle-button-group .toggle-button { rounded-none }` (`toggle-button-group.css:35-37`) is (0,2,0),
and `[data-theme^="tzuchi"] .toggle-button { border-radius: 8px }` is (0,2,0) in a later file — so
without this file every joined cell would take 8px corners and every icon-only cell a full circle, and
the group would stop reading as one control.

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| joined cell `border-radius` | `toggle-button-group.css:36` `rounded-none` → **0**, but out-cascaded by the theme's `.toggle-button` | `border-radius: 0` restated at (0,4,0) under `:not(.toggle-button-group--detached)` | **R22** (restores the base's intent at the Tzu Chi radius) |
| horizontal first cell | `:41` `rounded-s-3xl` → **24px** | `border-start-start-radius` + `border-end-start-radius: var(--tc-button-radius, var(--radius))` → **8px** | **R22** |
| horizontal last cell | `:46` `rounded-e-3xl` → 24px | `border-start-end-radius` + `border-end-end-radius` → **8px** | **R22** |
| vertical first / last cell | `:56` `rounded-t-3xl` / `:61` `rounded-b-3xl` → 24px | the matching logical corner pairs → **8px** | **R22** |
| lone cell (`:first-child:last-child`) | `:51`, `:66` `rounded-3xl` → 24px | `border-radius: var(--tc-button-radius, var(--radius))` → **8px** | **R22** |
| icon-only cell box / glyph inside a group | no base rule; the theme's own `--icon-only` ladder would make it **48 / 36 / 64px** with a 32 / 20 / 40px glyph | `--tzuchi-toggle-button-size: var(--tzuchi-toggle-button-block-size)` → **34 / 42 / 50px**; `--tzuchi-toggle-button-icon-size: var(--tc-size-icon-sm, 20px)` → **20px** | **R48** ("a 48px cell next to a 42px one tears the group apart") |

**Detached mode is deliberately excluded from the corner rules** by `:not(.toggle-button-group
--detached)`. Its cells are separate controls, so they fall through to `toggle-button.css`: **8px** for a
labelled toggle (R22), a **circle** for an icon-only one (R24). The base's own
`.toggle-button-group--detached .toggle-button { rounded-3xl }` (0,2,0) loses to those (0,2,0) rules on
source order, which is the wanted result — so no detached restore rule is written.
The **size** guard is *not* excluded from detached mode: the stories mix icon-only and labelled toggles in
one group (`toggle-button-group.stories.tsx` FullWidth, SelectionMode, WithLabels), and a Toolbar puts a
ToggleButtonGroup beside a ButtonGroup whose icon-only cells `button.css:336-339` already pins to 42px.
One rhythm per group, in both modes.

**Left as HeroUI's (and why)**

| what | why |
|---|---|
| `.toggle-button-group__separator` — 1px × 50% of `bg-current` at `opacity-15` (`:91-118`) | The spec has **no rule for a divider inside a joined control**. It inherits the cell's own label colour, so it re-tints per variant and per selected state, which is strictly better than pinning it to `--separator` on an accent fill. Its `rounded-sm` caps are already 4px = `--tc-radius-sm` and invisible on a 1px line (**D24**). |
| the inset focus ring `--tw-ring-offset-width: 0px` + `ring-inset` (`:76-80`) | This is already **R72 / I8**'s answer for a ring that would spill past a joined edge — applied by HeroUI itself. |
| `transform: none` on press (`:70-73`), `flex-1` on a full-width cell (`:83-85`), `gap-0` attached / `gap-1` detached | 4px detached gap is **R154**, already on the Tzu Chi rhythm; the rest is structural. The `width` this unit sets on an icon-only cell cannot break `fullWidth`, because `flex: 1` carries `flex-basis: 0%`, which outranks `width` for a flex item. |
| both orientations, `display: none` on separators when detached, every colour | **R85**, **R88**, **R76** as above; nothing colour-valued is declared. |

**Cascade** — `:not(--detached) .toggle-button` (0,4,0) beats the base (0,2,0) **and** the theme's own
`.toggle-button` / `.toggle-button--icon-only` (0,2,0); the single-edge corner rules (0,5,0) beat the base's
(0,3,0) and the neutraliser; the `:first-child:last-child` branches (0,6,0) beat the single-edge pair; the
size guard `.toggle-button-group .toggle-button.toggle-button--icon-only` (0,4,0) beats
`toggle-button.css`'s `--icon-only.--sm/--lg` (0,3,0) **without relying on import order**, so the two files
may be imported either way round.

---

## 3. `toolbar.css` — one declaration

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `.toolbar--attached` `border-radius` | `toolbar.css:31` `rounded-3xl` = `calc(var(--radius) * 3)` → **24px** | `calc(var(--tc-radius-md, 8px) + var(--tc-space-4, 4px))` → **12px** | **R38** — "inner item concentric with a padded container: `calc(<inner role radius> + <container inset>)` on the container" |

The attached toolbar pads its content by `p-1` = 4px and what it pads is a row of joined ButtonGroup /
ToggleButtonGroup controls whose outer corners are the 8px Control radius (R22). 8 + 4 = 12, written in
exactly the form `tabs.css:103-106` uses for the segmented tab container over its 8px tabs with a 4px
inset — which is also why `--tc-radius-md` is read directly rather than `--tc-button-radius` (same 8px).

**Left as HeroUI's (and why)**

| what | why |
|---|---|
| `gap-2` = **8px** between groups | **R150**'s action-row gap — already matching, so not restated (**N5**). |
| `p-1` = **4px** inset | **R154**'s micro gap — already matching. It is *read* by the radius calc rather than re-declared, so the two can never disagree. |
| `bg-surface` | A toolbar is a resting panel; `--surface` is the right token and the theme already maps it. |
| `shadow-overlay` | §6's shadow table: a floating bar takes `--overlay-shadow`. In dark it falls through to HeroUI's 1px inset hairline — §6 says explicitly **do not "fix" that per component**. |
| grid layout, `w-fit`, both orientation variants, `.toolbar--vertical .button-group { justify-start }` | Layout-specific geometry; the spec is silent (rule 6). |
| `.separator--vertical { h-1/2 }` / `.separator--horizontal { w-1/2 }` | **D24** — the Separator's geometry is settled, and spacing around it belongs to the consumer, which this grid *is*. |

**Cascade** — (0,2,0) against the base's (0,1,0), same layer, earlier. No breakpoint, `:has()` or
per-size variant of that rule exists upstream.

---

## 4. `close-button.css` — one declaration, shape only

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `.close-button` `border-radius` | `close-button.css:5` `rounded-xl` = `calc(var(--radius) * 1.5)` → **12px** | `var(--tc-radius-full, 9999px)` → **9999px** | **R26** (names the *remove button* role and lists `rounded-xl` among the utilities it replaces; evidence `tag.css:146`) / **R24** (a close affordance is an icon-only button) |

**This is a no-op today, on purpose.** Under `--radius: 8px` the base's 12px is exactly half of its own
24px square box — already a circle — and at the 20px boxes its hosts use (SearchField's clear button,
Toast's close button, Tag's remove button) CSS radius clamping produces a circle too. What changes is the
*reason*: the circle currently depends on `--radius` happening to be 8px and the box happening to be
24px, and would silently become a squircle if either moved. R26 asks for the intent to be stated, and the
shipped `tag.css:146` already states it for the same element under a different selector.

**Does not break the two shipped host overrides** (checked line by line):
`tag.css:143-147` gives `.tag__remove-button` 20px / `padding: 0` / **the same** 9999px — same value,
different selector, both (0,2,0), so whichever lands last the result is 9999px, and size/padding stay that
file's. `tag.css:153-161` and `modal.css:110-118` make the button transparent at rest through a host slot
class compounded with `.close-button--default` plus a `:not(:hover, [data-hovered="true"], :active,
[data-pressed="true"])` guard — this file declares **no background, no colour and no state**, so both keep
working untouched.

**Left as HeroUI's (and why)** — `.close-button` is shared by Modal, Drawer, AlertDialog, Toast, Alert,
Card, SearchField and Tag, and **D8** says restyling it regresses every host:

| what | why |
|---|---|
| 24px box, 16px glyph | §**1.3** keeps the 16px svg explicitly ("tc's 20px glyph on a 32px box = 0.63; HeroUI's 16px on 24px = 0.67 — proportionally equivalent"). Hosts that want another size already set their own (SearchField 20/12 per **D22**, Toast 20/14, Tag 20 with a filling glyph). |
| `bg-default` / `text-muted` rest, `bg-default-hover` | **R88 ①** — a HeroUI-only neutral affordance with no tc counterpart keeps `--default`; **R109**'s transparent-at-rest treatment is scoped *per host*, never global. |
| `p-1`, the `-mx-0.5 / my-0.5` optical margins, `scale(0.93)` press, the 250/150/100 ms transition stack, `status-focused` / `-disabled` / `-pending` | **R85 / D2 / D3 / R136**; the spec is silent on the rest. |

**Cascade** — (0,2,0) against the base's (0,1,0). The host slot classes that reach the same element
(`.search-field__clear-button`, `.toast__close-button`, `.modal__close-trigger`, `.tag__remove-button`)
are (0,1,0)–(0,2,0) upstream and **none of them sets `border-radius`**, so nothing upstream is overridden
except the base utility this rule is meant to replace.

---

## 5. `button-group.css` — no file needed

Everything the spec produces for ButtonGroup is **already shipped inside `button.css`**, and rule 7
forbids duplicating it:

- `button.css:167-194` already neutralises the cell radius and restates all four corner cases plus the
  lone-cell case at `var(--tc-button-radius, var(--radius))` = **8px** (R22), at (0,3,0)–(0,5,0).
- `button.css:336-339` already applies **R48**'s icon-only group guard (`--tzuchi-icon-button-size` →
  `--tzuchi-button-block-size`, glyph back to `--tc-size-icon-sm`).
- **Sizes** need nothing: a group propagates `size` to its children as `.button--sm/--md/--lg`, which
  `button.css:103-118` already puts on the 34 / 42 / 50px ladder. The group itself sets no height.
- **Separator** (`button-group.css:73-100`): no spec rule exists for a divider inside a joined control.
  `bg-current` at `opacity-15` inherits the cell's own label colour, so it re-tints per variant — better
  than pinning it to `--separator` on an accent fill — and its `rounded-sm` caps are already 4px and
  invisible on a 1px line (**D24**).
- `gap-0`, `z-10` on the focused cell, `transform: none` on press, the outline border-collapsing rules
  (`:106-136`) and `--full-width` are structural; `button.css:130-132` already carries the
  `:not(.button--full-width)` guard that keeps a full-width icon-only cell stretching.

Writing a file would therefore either duplicate `button.css` (forbidden) or invent a treatment the spec
does not have.

---

## 6. Spec gaps / judgement calls recorded for the owner

1. **R83 names ToggleButton but its condition does not hold.** R83 ("selected = BORDER currentColor")
   lists ToggleButton in *Where it applies*, qualified by "use when the item already carries a **tonal
   fill at rest**". ToggleButton's rest fill is the **neutral `--default`**, and HeroUI already swaps
   both the fill (→ `--accent-soft`) and the label colour (→ `--accent-soft-foreground`) on select —
   i.e. **R76**'s tonal trio, already correct. Applying R83 would mean adding a `border: 1px solid
   transparent` that `.toggle-button` does not have (free in box-model terms, since the 42px is
   border-box and the R40 formula already budgets 2px of border, but a visible change). The conservative
   reading was taken: **no border, no colour declaration**. If the owner wants the tc-chip selected
   signal on ToggleButton too, it is two rules —
   `border: 1px solid transparent` on `.toggle-button` and `border-color: currentColor` on
   `:is([data-selected="true"], [aria-selected="true"])` — and it would not disturb any metric here.
2. **Toolbar's attached radius: R38 (12px) vs R27 (16px).** R38 was chosen because `p-1` = 4px and the
   Attached story's content is joined 8px-cornered groups, which is literally R38's shape. If a toolbar
   were instead a row of loose **circular** icon buttons, R38's "inner role radius" would be undefined
   and R27's flat 16px surface radius would be the competing answer. Toolbar is on the spec's own
   **Q8** "no Tzu Chi counterpart at all" list.
3. **CloseButton vs D8.** §10 **D8** says do not touch `.close-button`; **R26** names the remove-button
   role and lists `rounded-xl` among the utilities it replaces, and `tag.css:146` already applies exactly
   this declaration to a CloseButton. The conflict was resolved by changing **shape only** — the one
   property R26 covers — and nothing else (no fill, size, glyph, motion or state), so D8's stated risk
   ("restyling it regresses every host") does not arise: the rendered radius is unchanged in every host
   today.
4. **ToggleButton's `sm` size and its icon-only `sm`** (36px box / 20px glyph) are an extrapolation from
   md's 8px icon ring, exactly as `gap-audit/button-icon-only.md:53` records for Button. No Figma
   decision backs them.
5. **Joined-control separators have no rule anywhere in the spec** (§9 covers gaps between items, §7
   covers tracks, D24 covers the standalone Separator). Both `button-group__separator` and
   `toggle-button-group__separator` were left alone for that reason; if a Tzu Chi decision exists, it
   would be one declaration in each file.

## 7. Checklist (§13)

1. Every rule, every comma branch: scoped by `[data-theme^="tzuchi"]` — verified mechanically. ✓
2. Grepped the four files (outside comments) for `--tc-color-`, `#`, `rgb(`, `hsl(`, `oklch(`,
   `!important`, physical `left`/`right` properties — all clean. ✓
3. Every `--tc-*` used exists in `packages/tokens/dist/tokens.css` and carries a fallback. ✓
4. Every value is a mode-independent dimension token; **no colour is declared at all**; no new
   `--tzuchi-*` theme variable (the three `--tzuchi-toggle-button-*` names are local calc helpers of the
   same kind as `button.css`'s `--tzuchi-button-block-size`). ✓
5. Specificity hand-derived against every base rule, including `md:` / `sm:` breakpoint variants and the
   `:not()` compounds. ✓
6. No `transition-property` and no `animation-name` anywhere — motion is untouched (**R136**). ✓
7. No variant, size or state hidden or flattened; each is enumerated above. ✓
8. Header comments record the mapping, what changed, what was kept and the cascade math. ✓
9. Nothing in §10 touched — the only §10 entry in scope, **D8**, is addressed in gap 3 above. ✓
10. Comment safety (rule 8): scanned all four files — `/*` and `*/` counts match exactly (14/14, 5/5,
    2/2, 2/2) and no glob is written immediately before a slash. ✓
