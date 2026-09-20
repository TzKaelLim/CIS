# Unit "calendars" — Calendar / RangeCalendar / CalendarYearPicker

Targets: `calendar.css`, `range-calendar.css`, `calendar-year-picker.css` — all three needed a file.

Sources read: `heroui/styles/components/{calendar,range-calendar,calendar-year-picker}.css`,
`heroui/react/src/components/{calendar,range-calendar,calendar-year-picker}/*.tsx` (+ stories),
`heroui/styles/src/components/*/{…}.styles.ts`, `heroui/styles/themes/{tzuchi,shared}/…`,
`heroui/styles/utilities/index.css`, the compiled bundle
`heroui/storybook/storybook-static/assets/iframe-DpN8oW_m.css` (to read every base selector at its
real, post-`@apply` specificity), and the existing overrides `themes/tzuchi/components/pagination.css`
+ `gap-audit/pagination.md` (the model my brief points at).

Resolved scale under `[data-theme^="tzuchi"]` (`--radius: --tc-radius-md = 8px`):
`rounded-3xl` = 24px · `rounded-2xl` = 16px · `rounded-xl` = 12px · `rounded-lg` = 8px ·
`rounded-xs` = 2px · `text-sm` = 14px/20px · `text-xs` = 12px/16px · `font-medium` = 500.

**The whole unit is four decisions**, applied three times:
day/year cells take the pagination cell's shape (4px) and type (16/400/1.6, current 700);
the month heading takes the control-label voice (16/700/1.5); everything else — above all the
colour grammar — already resolves to Tzu Chi values through the theme variables and is left alone.

---

## 1. `calendar.css`

| Property | HeroUI base (file:line → resolved) | Now (declaration → resolved) | Spec rule |
|---|---|---|---|
| Day-cell radius | `calendar.css:186` `rounded-3xl` → `calc(var(--radius) * 3)` = **24px** (a circle on the 36px cell) | `border-radius: var(--tc-radius-sm, 4px)` → **4px** | §2 **R33** square-ish cell (pagination item); same resolved value as `pagination.css:93` |
| Day-cell font-size | `calendar.css:186` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 **R21** ("calendar day cells" → R16) + **R16** |
| Day-cell font-weight | `calendar.css:186` `font-medium` → **500** | `font-weight: var(--tc-font-weight-regular, 400)` → **400** | §1 **R16** (pagination number, resting) |
| Day-cell line-height | `calendar.css:186` `text-sm` → **20px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | §1 **R16** / §1.2 (prose voice, 1.6) |
| Selected-day weight | `calendar.css:219-221` sets fill only; weight inherits **500** from `:186` | `&[data-selected="true"] { font-weight: var(--tc-font-weight-bold, 700) }` → **700** | §1 **R16** ("current page 700"), §5 **R81** |
| Heading font-size | `calendar.css:79` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 **R1** + §1 mechanical (no 14px step) |
| Heading font-weight | `calendar.css:79` `font-medium` → **500** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | §1 **R1**, §1.2 ("is the control" → subtitle) |
| Heading line-height | `calendar.css:79` `text-sm` → **20px** | `line-height: var(--tc-line-height-normal, 1.5)` → **24px** | §1 **R1** / §1.2 (control voice, 1.5) |

Cascade: `.calendar__heading` and `.calendar__cell` are (0,1,0) in the base, (0,2,0) here;
`&[data-selected="true"]` compiles to (0,3,0) against a base weight that lives at (0,1,0).
No ties, no `!important`, no base rule shadowed.

### Left as HeroUI's (and why)

| Thing | base | Why |
|---|---|---|
| **Every colour** | `:207-221` today `--accent-soft`/`--accent-soft-foreground`, selected `--accent`/`--accent-foreground`; `:243-245` outside-month `--muted` @ 50%; `:252-262` `status-disabled` | Already the Tzu Chi answer: §5 **R81** *is* "selected = `--accent` fill", §5 **R85** is "disabled: nothing". Measured under the theme: selected-vs-surface 13.44 : 1 light / 9.39 : 1 dark; selected-vs-today 11.58 / 7.42; numeral on selected 13.44 / 7.42. Nothing to change. |
| **Hover fill `--default`** (`:235-240`) — *deliberate deviation from §5 R78* | `bg-default` | §5 **R88 ③** — "anything where a brand tint would falsely read as selected". Inside this component `--accent-soft` is already the **today** marker (and the RangeCalendar band). Repainting hover with it makes a hovered day pixel-identical to resting-today. Measured: today-vs-hover is **1.04 : 1 light / 1.06 : 1 dark** in luminance and separates by **hue only** (blue-100 vs gray-100 / blue-900 vs gray-900) — merging the tokens deletes the only channel there is. One answer for the whole family (see §4). |
| **Weekday header 12px** (`:178` `text-xs font-medium text-muted`) | 12px/500 | §1.3 row 1 + §1 **R8**: a structural label above the rows it introduces keeps 12px; only its inset ever moves, and it is already flush with the cells. Raising it to 16px would also crowd seven 36px columns. |
| **Nav button box / radius / icon** (`:82-83` `size-6` + `rounded-2xl`; `:128` `size-4`) | 24px box, 16px specified radius, 16px glyph | The **used** radius on a 24px box is already a full circle — exactly what §2 **R24** asks of an icon-only control — so restating it is noise (§0 **N5**). 16px glyph on a 24px box = 0.67, the precise proportion §1.3 row 4 protects for `.close-button` (tc's 20-on-32 = 0.63), and §10 **D8** keeps that shared box. |
| **Cell indicator** (`:266-273`, 3px dot, `rounded-xs`, `bg-muted` → `bg-accent-foreground` when selected) | — | Spec silent (§12 **Q8**); hard rule 6. |
| **Header padding** `px-0.5 pb-4` (`:69`) | 2px / 16px | 16px is already `--tc-space-16`; the 2px inline gutter is layout geometry. |
| **Grid geometry** — `w-63` (252px), `aspect-square size-full`, the 7-column grid, `display: contents` rows, week-view / day-view modifiers, `mt-1` between header and body | — | Layout-specific geometry, hard rule 6. Growing the 36px cell to pagination's 40px would force the calendar to 280px. |
| **Motion** (`:91-96`, `:193-196`) | `transition` shorthand + `motion-reduce:transition-none` | §8 **R136/R138**: the base transitions `transform`/`background-color`/`box-shadow`/`opacity` as one positional list, so re-timing background-color to 150ms means restating HeroUI's other channels **and** both reduced-motion guards (§8 **R137**) for an imperceptible 100 → 150ms move. |
| **Focus ring** (`:201-204` `status-focused`) | 2px `--focus` @ 2px offset | §4 **R70**, §10 **D3** — already correct, and nothing clips it: `container-type: inline-size` contains layout/style/inline-size, **not paint**, so §4 R72/R73 do not apply. |
| **The container** | `.calendar` paints no background/border/radius/padding | §6(b) **R98-R102** names "Calendar/RangeCalendar containers", but that chrome lives on the DatePicker / DateRangePicker **popover**, which is another unit's file — hard rule 7 (ownership). Applying a radius to a transparent box is a no-op; adding 16px padding would change the standalone layout. |

---

## 2. `range-calendar.css`

Two paint layers: the outer `.range-calendar__cell` draws the **band**, the inner
`.range-calendar__cell-button` draws the **day**. Both take the Calendar's decisions.

| Property | HeroUI base (file:line → resolved) | Now (declaration → resolved) | Spec rule |
|---|---|---|---|
| Day radius | `range-calendar.css:200` `rounded-3xl` → **24px** (circle) | `border-radius: var(--tc-radius-sm, 4px)` on `.range-calendar__cell .range-calendar__cell-button` → **4px** | §2 **R33** |
| Day font-size | `:200` `text-sm` → **14px** | `var(--tc-font-size-16, 16px)` → **16px** | §1 **R21** → **R16** |
| Day font-weight | `:200` `font-medium` → **500** | `var(--tc-font-weight-regular, 400)` → **400** | §1 **R16** |
| Day line-height | `:200` `text-sm` → **20px** | `var(--tc-line-height-relaxed, 1.6)` → **25.6px** | §1 **R16** |
| Range-cap weight | `:254-261` sets fill only; weight inherits **500** | `&[data-selected="true"] { font-weight: … 700 }` → **700** (only the caps carry `data-selected`, `range-calendar.tsx:443`) | §1 **R16**, §5 **R81** |
| Band cell radius, rest | `:185` `rounded-3xl` → **24px** | `border-radius: var(--tc-radius-sm, 4px)` → **4px** | §2 **R33** |
| Band **start** corners — week-wrap | `:239-240` `rounded-ss-lg rounded-es-lg` → **8px** | `border-start-start-radius` / `border-end-start-radius: var(--tc-radius-sm, 4px)` → **4px** | §2 **R33** |
| Band **start** corners — range cap | `:241-243`, `:267-269` `rounded-ss-3xl rounded-es-3xl` → **24px** | same rule → **4px** | §2 **R33** |
| Band **end** corners — week-wrap | `:246-247` `rounded-se-lg rounded-ee-lg` → **8px** | `border-start-end-radius` / `border-end-end-radius: var(--tc-radius-sm, 4px)` → **4px** | §2 **R33** |
| Band **end** corners — range cap | `:248-250`, `:271-273` → **24px** | same rule → **4px** | §2 **R33** |
| Band corners at an outside-month neighbour | `:327-337` (start, 8px / 24px), `:340-351` (end, 8px / 24px) | same two rules → **4px** | §2 **R33** |
| Heading (size / weight / line-height) | `:79` `text-sm font-medium` → 14px / 500 / 20px | 16px / 700 / 24px | §1 **R1**, §1.2 |

**Why the band corners had to follow.** HeroUI ran a two-tier scale — 24px at a range cap, 8px
where the band is cut by a week wrap or an outside-month neighbour — and both tiers exist only to
sit under a 24px circular day. With a 4px day, a 24px cap leaves the `--accent-soft` band rounded
*outside* the `--accent` fill (the fill is drawn on top and covers the cell, so the corner would
show page colour where a square corner is expected), and an 8px wrap-end would be **rounder than
the cap it continues into**, inverting HeroUI's own reading. One value, 4px, on every rounded
corner. The band **middle** keeps HeroUI's `border-radius: 0` (`:234-236`, (0,3,0)) — that rule
still outranks this file's (0,2,0) rest rule, so the track stays continuous.

Cascade (hand-derived against the compiled bundle, every rule listed in the file header):
`a` (0,1,0)→(0,2,0) · `b` (0,2,0)→(0,3,0) · `d`/`f` (0,3,1)→(0,4,1) · `h`/`i` (0,3,0)→(0,4,0) ·
`j` (0,5,2)→(0,6,2) · `l` (0,7,2)→(0,8,2) — all wins. The four `[data-selection-start|end]`
refinements `e`/`g`/`k`/`m` **tie** with their mirrored parent, resolved by source order (this file
is imported after `styles/components/range-calendar.css` in the same `components` layer), and in
every tied pair both rules would set the same corners to the same 4px, so the tie-break only
decides which identical value lands. Each grouped rule sets **only the corners its base
counterpart set** — never the `border-radius` shorthand — so nothing rounds a corner that must stay
square mid-band. Logical corner properties throughout, so RTL keeps HeroUI's behaviour.

### Left as HeroUI's (and why)

| Thing | base | Why |
|---|---|---|
| **The whole colour grammar** | `:218-231` today `--accent-soft`/`-hover`; `:234-236` band `--accent-soft`; `:254-261` caps `--accent`/`--accent-foreground`; `:305-310` selected-outside-month `--default` @ 20%; `:313-323` `status-disabled` | Already Tzu Chi. Measured band-vs-cap **11.58 : 1 light / 7.42 : 1 dark**; cap-vs-surface 13.44 / 9.39; numeral on cap 13.44 / 7.42. §5 **R81**, §5 **R85**. |
| **Hover `--default`** (`:291-298`) — *deviation from §5 R78* | `bg-default` | §5 **R88 ③**, same reasoning as Calendar — here `--accent-soft` carries *two* meanings already (today **and** the selection band), so a brand-tinted hover is even less available. |
| **Weekday header 12px** (`:178`) | 12px/500 | §1.3 row 1, §1 **R8**. |
| **Nav button** (`:83` `size-6 rounded-xl`, `:128` `size-4`) | 24px box, 12px radius (= a circle), 16px glyph | §2 **R24** already satisfied by the used value (§0 **N5**); §1.3 row 4 + §10 **D8** for the box and glyph. Note the upstream inconsistency with Calendar's `rounded-2xl` — zero visual difference, both clamp to a circle, so it is reported, not "fixed". |
| **`my-[2px]` cell margin, `z-1`/`z-2` stacking, `place-self-center`, pressed `scale(.9)`** | `:185`, `:208-215`, `:276-288` | Layout geometry and interaction affordances; hard rule 6 / hard rule 5. |
| **Motion** (`:193-196`, `:203-204`) | `transition` shorthands | §8 **R136/R137/R138**. |
| **Focus ring** (`:208-215`) | `status-focused` on the inner button, `z-2` on the cell | §4 **R70**, §10 **D3**. The ring is drawn on the button, which is exactly where the 4px radius now is, so it follows the new shape automatically. |
| **Container** | — | §6(b) belongs to the DateRangePicker popover — hard rule 7. |

---

## 3. `calendar-year-picker.css`

| Property | HeroUI base (file:line → resolved) | Now (declaration → resolved) | Spec rule |
|---|---|---|---|
| Year-cell radius | `calendar-year-picker.css:119` `rounded-3xl` → **24px** (a full capsule on the 32px cell) | `border-radius: var(--tc-radius-sm, 4px)` → **4px** | §2 **R33** |
| Year-cell font-size | `:119` `text-sm` → **14px** | `var(--tc-font-size-16, 16px)` → **16px** | §1 **R21** → **R16** |
| Year-cell font-weight | `:119` `font-medium` → **500** | `var(--tc-font-weight-regular, 400)` → **400** | §1 **R16** |
| Year-cell line-height | `:119` `text-sm` → **20px** | `var(--tc-line-height-relaxed, 1.6)` → **25.6px** (inside the base's fixed 32px `h-8`: no reflow, no clipping) | §1 **R16** |
| Selected-year weight | `:144-146` sets fill only; weight inherits **500** | `&:is([data-selected="true"], [aria-selected="true"]) { font-weight: … 700 }` → **700** | §1 **R16**, §5 **R81** |
| Trigger heading (size / weight / line-height) | `:71` `text-sm font-medium` → 14px / 500 / 20px | 16px / 700 / 24px | §1 **R1**, §1.2 |

The base file states the mapping itself: `:143` calls the selected year "same as
`.tag[data-selected]`", and `:126-132` copies `.tag`'s transition list — so the year cell is
already understood upstream as a small selectable cell, which is precisely §2 R33 / §5 R81's role.
Both grids crossfade inside the same 252px frame, so they must share one shape and one type.
Cascade: (0,1,0)→(0,2,0) for both classes; the selected-weight rule is (0,3,0) against a base
weight at (0,1,0). `aria-selected` is rendered on **every** year cell
(`calendar-year-picker.tsx:597` passes a boolean), so matching `="true"` is required — the base
file matches the same way.

### Left as HeroUI's (and why)

| Thing | base | Why |
|---|---|---|
| **Colours** — selected `--accent`/`--accent-foreground`, selected-hover `--accent-hover`, hover `--default`/`--default-foreground`, open trigger `--accent-soft-foreground` | `:137-153`, `:89-91` | §5 **R81** is already what the base does; the rest resolves to Tzu Chi values through the theme variables. |
| **Hover `--default`** (`:137-141`) — *deviation from §5 R78* | `bg-default text-default-foreground` | §5 **R88 ③** applied to the family: the year grid crossfades into the day grid's frame and must share its hover language, and in the day grid `--accent-soft` is taken by *today* / the range band. One answer for three files beats two. Kept `--default-foreground` too — it and `--foreground` resolve to the same primitive (§11 **I7**). |
| **Trigger radius** `rounded-lg` (`:59`) | 8px | Already exactly §2 **R22**'s control radius (§0 **N5**). |
| **Trigger indicator** 12px chevron (`:78`) + its 90° open rotation (`:85-87`) | 12px | §1.3 rows 3-4 — a small glyph beside a label keeps its size; raising it draws *more* ink. Rotation is behaviour (§10 **D32**). |
| **Trigger `gap-1`** (`:59`) | 4px | The spec gives **two** competing rules (§9 **R147** icon↔label in a control = 8px; §9 **R154** micro gap = 4px) and 4px is already on the Tzu Chi rhythm. Ambiguous → hard rule 6. Listed in spec gaps. |
| **Year-cell `h-8` (32px) and `px-2.5`** (`:119`) | 32px / 10px | 32px **is** `--tc-size-icon-md`, already on-scale (and it is what `.pagination--sm` uses). The 10px inline padding is invisible: the cell is a stretched `1fr` grid item, so its width comes from the column, not the padding. Hard rule 6. |
| **Year-grid shell** — absolute positioning, JS-set `top`/`height`, `p-1`, `gap-1`, `grid-template-columns: repeat(3, 1fr)`, `overflow-y-auto`, `scrollbar` | `:99-113` | Structural, and the crossfade is animation choreography (§8 **R140**). |
| **Crossfade** (`:34-53`, `:107-113`) and every `transition` | — | §8 **R140**: no choreography, no new keyframes, exits keep HeroUI's timing. |
| **Focus ring** (`:65-67`, `:156-158`) | `status-focused` | §4 **R70**, §10 **D3**. See spec gaps for the one place it can be clipped. |

---

## Spec gaps / open items

1. **Hover tint: R78 vs R88 ③ (the one real conflict in this unit).** My brief said "hover =
   accent-soft" by analogy with pagination; §5 **R78** says the same. I did **not** apply it, in all
   three files, because `--accent-soft` is already spoken for inside this component family: it is
   the **today** marker (`calendar.css:208`, `range-calendar.css:220`) and the **range band**
   (`range-calendar.css:235`). Measured, resting-today vs hover is **1.04 : 1 light / 1.06 : 1 dark**
   — they are the same luminance and separate by hue alone, so a brand-tinted hover would make a
   hovered day and today literally identical. §5 **R88 ③** ("anything where a brand tint would
   falsely read as selected") is the more specific rule and is what I followed. **Consequence to
   sign off:** hovering a pagination number tints blue, hovering a calendar day tints grey. If the
   owner prefers R78 everywhere, the calendar needs a *new* today marker (outline or dot) first —
   that is a redesign, not an override.
2. **`--default` hover is faint in dark** — 1.35 : 1 against the card, 1.43 : 1 against the page
   (§5's own tint ladder). That is the theme's neutral, not a calendar decision, but it is the
   weakest state in this component. Same residual §7 Q5 records for tracks.
3. **Outside-month legibility.** `--muted` at `opacity-50` computes to **#c1c1c1 on white = 1.80 : 1**
   (light) and #686869 on #1c1c1e = 3.06 : 1 (dark); on a selection band, 1.71 / 2.71. The spec has
   no rule for a "de-emphasised but still readable" text role (§5 R85 only covers disabled at 0.38),
   so it is untouched — but light-mode outside-month days are effectively unreadable and the owner
   may want a token for this. Same class of gap as `[data-unavailable]` (2.14 : 1 light).
4. **Today inside a range band is invisible.** Both resolve to `--accent-soft`
   (`range-calendar.css:220` vs `:235`), in HeroUI's own themes too. Not caused by this override and
   not fixable without inventing a today marker (§12 **Q8**: Calendar has no tc counterpart).
5. **Nav-button size.** §3.3 **R45** would make a small icon-only control a 36px box with a 20px
   glyph; the calendar's is 24px with a 16px glyph. I kept HeroUI's, on §1.3 row 4's `.close-button`
   precedent (identical 16-on-24 proportion) and §10 **D8**. If the owner wants R45 applied, note
   36px would exactly match the 36px day cell — a defensible future change, but it is not what the
   spec's own 12px/16px carve-outs imply.
6. **Calendar vs RangeCalendar nav radius diverge upstream** — `rounded-2xl` (16px) vs `rounded-xl`
   (12px) on the same 24px box. Both clamp to a circle, so there is nothing to see; flagged so it is
   not read as a theme decision.
7. **Year-grid focus ring can be clipped.** `.calendar-year-picker__year-grid` is
   `overflow-y-auto` with `p-1` (4px), and the ring is 2px wide at 2px offset = exactly 4px — so a
   scrolled year cell's ring can be cut at the top/bottom edge. §4 **R73** (inset outline) would fix
   it, but the ring is HeroUI's and unchanged by this pass (§10 **D3**), so it is reported, not
   touched.
8. **§6(b) R98-R102 names "Calendar/RangeCalendar containers"** but a standalone `.calendar` has no
   surface at all. The 16px content-popover shell has to land on `.date-picker__popover` /
   `.date-range-picker__popover` — please confirm that unit picked it up, or the decision falls
   through the gap between the two units.
9. **Everything in this unit is §12 Q8 territory** — Calendar / RangeCalendar / CalendarYearPicker
   have no Tzu Chi counterpart. The files are internally consistent with the spec and with
   `pagination.css`, but no value here traces to a Figma decision.

## Verification notes for the browser check

Stories: `components-date-and-time-calendar--default`,
`components-date-and-time-rangecalendar--default` (both render heading + nav buttons + a full
7-column grid in their initial state), and `components-date-and-time-calendar--with-year-picker`
(the year grid and all its cells are always rendered — `opacity: 0` and `aria-hidden`, never
unmounted: `calendar-year-picker.tsx:502-518`, `:533` — so `getComputedStyle` reads them without
any reveal step). None of these components uses a React Aria collection `<template>`.

`.calendar__cell` is the inner `<div role="button">` that RAC's `CalendarCell` renders inside the
`<td>`; `.range-calendar__cell-button` is the `<span>` at `range-calendar.tsx:438-447`.
All checked properties are set with the `border-radius` / font longhands, so the computed values are
the specified ones (`4px`, `16px`, `700`) — no clamping, no box-model dependency.
