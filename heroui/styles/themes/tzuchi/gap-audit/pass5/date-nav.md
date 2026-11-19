# Pass 5 — fix unit `date-nav`

Files replaced (full copies at `heroui/styles/themes/tzuchi/components/`):
`calendar.css`, `range-calendar.css`, `calendar-year-picker.css`, `tabs.css`,
`pagination.css`, `breadcrumbs.css`.
**`date-input-group.css` is NOT changed** — item 8 verified clean in the browser (below).
`calendar-year-picker.css` was already present, so no new file was created.

Tool: `atoms4/tools/qa-shot.cjs` (static Storybook build, clock pinned 2026-09-19,
locale zh-Hant, 2x density). Screenshots under
`(session screenshot, not kept) shots/date-nav/`
(`reg/` = did-not-break checks, `final/` = re-run with the delivered files injected).

A note on the `css:` injection limit: it can add or change a declaration, never remove one.
Items 2 and 5 REMOVE reach from an existing rule (a guard, and a variant split), so those two
were driven in the browser with an extra explicit reset that lands the same computed value the
delivered file produces on its own; both are called out below.

---

## 1 — RangeCalendar/Calendar: today is pixel-identical to the range band (qa-date-time #1)

**Reproduction.**
`node atoms4/tools/qa-shot.cjs tzuchi components-date-and-time-rangecalendar--default out.png size:420x420 'click:.range-calendar__cell-button:text-is("15")' 'click:.range-calendar__cell-button:text-is("22")' clip:.range-calendar`
Today (19 Sep) sits inside the 15→22 band and is **invisible**: probed
`.range-calendar__cell[data-today="true"]` background `rgb(232,238,254)` — the same `--accent-soft`
the band paints, on the same 4px rectangle.
Before: `before-rc-todayinband-l.png`, `before-rc-plain-l.png`.

**Root cause.** The theme squared both layers to 4px —
`themes/tzuchi/components/calendar.css:187-189` (`.calendar__cell` → `--tc-radius-sm`) and
`themes/tzuchi/components/range-calendar.css:206-212` (cell + cell-button) — which removed the one
channel upstream used to separate the two: base `styles/components/calendar.css:207` /
`styles/components/range-calendar.css:218` paint today `bg-accent-soft` on a `rounded-3xl`
(24px = a circle on a 36px box), while `styles/components/range-calendar.css:231` paints the band
`bg-accent-soft` on a squared-off cell. Same tint, now also the same shape.

**Fix.** Today keeps HeroUI's fill and gains a 1px `--accent` ring inset inside its own 4px corner:

* `calendar.css` — `[data-theme^="tzuchi"] .calendar__cell[data-today="true"] { outline: 1px solid var(--accent); outline-offset: -1px }`
* `range-calendar.css` — the same on `.range-calendar__cell[data-today="true"] .range-calendar__cell-button`
  (the DAY layer; putting it on the outer cell would draw a box around a band segment)
* both files flip the ring to `--accent-foreground` when that same element is `[data-selected]`,
  because the fill under it is then `--accent` and an `--accent` ring on an `--accent` fill is no
  ring at all. That is the "pick what survives the selected state" half of the decision; both
  values are HeroUI theme variables and resolve in tzuchi and tzuchi-dark.

**Why outline and not box-shadow.** `status-focused` (`styles/utilities/index.css:1-6`) paints the
focus ring as a Tailwind `ring`, i.e. as `box-shadow`; a box-shadow today marker and the focus ring
would evict one another whichever won. The base sets only `outline-none` on these elements and
never an outline width or colour, so outline is free. Measured on a focused today:
`box-shadow: … rgb(79,123,190) 0 0 0 4px` AND `outline-width: 1px / outline-offset: -1px` both
present, concentric, nothing clipped.

**Why that specificity.**
`[data-theme^="tzuchi"] .calendar__cell[data-today="true"]` = (0,3,0) — a tie with the base's
`.calendar__cell:focus-visible:not([data-focused])` (0,3,0), won on import order (this file is
imported later in the same `components` layer), and a win over
`.calendar__cell[data-focus-visible="true"]` (0,2,0).
`[data-theme^="tzuchi"] .range-calendar__cell[data-today="true"] .range-calendar__cell-button` =
(0,4,0) — tie with the base's `…:focus-visible:not([data-focused]) .range-calendar__cell-button`
(0,4,0), same tie-break; win over the `[data-focus-visible="true"]` form (0,3,0). The selected
flips are (0,4,0) / (0,5,0).

**After, all four states the brief asks for, both themes.**

| state | shot |
| --- | --- |
| today at rest (outside any band) | `after-rc-plain-l.png`, `after-cal-today-l.png`, `after-cal-today-d.png` |
| today INSIDE the band | `after-rc-todayinband-l.png`, `after-rc-todayinband-d.png` |
| today selected (Calendar) | `after-cal-todaysel-l.png` (probe: fill `rgb(27,45,88)`, ring `rgb(255,255,255)`) |
| today as a range END | `after-rc-todayend-l.png`, `after-rc-todayend-d.png`, zooms `after-rc-todayend-zoom-l/d.png` (dark probe: fill `rgb(169,194,234)`, ring `rgb(27,45,88)`) |
| today focused | `after-cal-todayfocus-l.png`, `reg/rc-kbfocus-l.png` |
| today hovered | `reg/cal-hover-today-l.png` (fill moves to `--accent-soft-hover`, ring unchanged) |

Re-run with the delivered file: `final/fin-rc-todayinband-l.png`.

**Did not break.** `reg/cal-ind-l.png` (indicator dot still clears the ring),
`reg/cal-2mo-l.png`, `reg/cal-week-l.png`, `reg/cal-disabled-d.png` (ring dims with the cell),
`reg/rc-value-l.png` / `reg/rc-value-d.png` (band caps and wrap corners unchanged),
`reg/dp-pop-d.png` (inside the DatePicker popover).

---

## 2 — RangeCalendar: a range end on an outside-month day is bold with no fill (qa-date-time #3)

**Reproduction.** `components-date-and-time-rangecalendar--invalid` (range 2026-09-25 → 2026-10-03),
tzuchi. Last row `27 28 29 30 | 1 2 3`: "3" probed `font-weight: 700`, its neighbours `400`.
Before: `before-rc-outside-l.png`.

**Root cause.** `themes/tzuchi/components/range-calendar.css:218-220` bolded **every**
`.range-calendar__cell-button[data-selected="true"]`, while the base deliberately withholds the
`--accent` cap fill from an outside-month day
(`styles/components/range-calendar.css:250-258`, its own `:not([data-outside-month="true"])`).
Weight without fill.

**Fix.** The rule is lifted out of the nested day-layer block and carries the base's own guard:

```
[data-theme^="tzuchi"]
  .range-calendar__cell:not([data-outside-month="true"])
  .range-calendar__cell-button[data-selected="true"] { font-weight: var(--tc-font-weight-bold, 700); }
```

The guard has to sit on the **cell**, not on the button: `range-calendar.tsx:437-447` renders only
`data-disabled / -hovered / -pressed / -selected` on the `.range-calendar__cell-button` span;
`data-outside-month` comes from react-aria on the outer cell, which is exactly where the base
writes it.

**Why that specificity.** (0,5,0). It must beat this file's own day-layer `400` at (0,3,0); the base
declares no `font-weight` on a selected cell-button at all, so there is no other competitor. An
outside-month endpoint now falls through to 400 — the weight its outside-month neighbours already
have (upstream leaves both at 500; the theme has no 500 body step here).

**After.** `after-rc-outside-l.png`, `after-rc-outside-d2.png` — "3" now matches "1" and "2";
in-month cap "25" still 700 with fill (`final/fin-rc-caps.png`, probed 700).
*Injection note:* driven with `try/rc-outside.css`, which adds the guarded rule plus an explicit
`400` for the outside-month case, because the build still carries the unguarded rule and injection
cannot remove it. The delivered file reaches the same two computed values with the guard alone —
confirmed by probing the delivered file directly: outside-month selected button 400, in-month cap 700.

---

## 3 — Calendar header: year-picker chevron 12px beside 16px nav icons (qa-date-time #4)

**Reproduction.** `components-date-and-time-calendar--with-year-picker`, clip `.calendar__header`.
Probed `.calendar-year-picker__trigger-indicator` 12×12 (font-size 12px) vs
`.calendar__nav-button-icon` 16×16, beside a 16px/700 heading.
Before: `before-yp-header-l.png`.

**Root cause.** `styles/components/calendar-year-picker.css:77-82` puts the indicator span on
`text-xs`, and the glyph is `<IconChevronRight height="1em" width="1em">`
(`react/src/components/calendar-year-picker/calendar-year-picker.tsx:199`), so the span's font-size
IS the glyph's box. The theme had explicitly decided to keep it
(`themes/tzuchi/components/calendar-year-picker.css:56-60`) while raising the heading next to it to
16px/700 (`:110-114`).

**Fix.** `[data-theme^="tzuchi"] .calendar-year-picker__trigger-indicator { font-size: 16px; line-height: 1.5 }`
(tokens `--tc-font-size-16` / `--tc-line-height-normal`, both mode-independent, both with fallbacks).
Line-height is set to the heading's own 1.5 so the two halves of the trigger share one line box —
measured: the trigger stays 24px tall, the header does not reflow.

**Why that specificity.** Base `.calendar-year-picker__trigger-indicator` (0,1,0) → this (0,2,0);
nothing else declares type on this element. Colour (`--accent-soft-foreground`), the 90° open
rotation, the transition and the RTL flip stay HeroUI's.

**After.** `after-yp-header-l.png`, `after-yp-header-d.png`, `final/fin-yp-l.png` (probe 16×16).
Open state and the DatePicker popover: `reg/yp-open-l.png`, `reg/dp-pop-d.png`.

---

## 4 — Tabs, secondary (underline): hover paints a square full-height block (qa-navigation #1)

**Reproduction.**
`node atoms4/tools/qa-shot.cjs tzuchi components-navigation-tabs--secondary out.png size:1000x300 'hover:[role="tab"]:nth-child(3)' clip:'[role="tablist"]'`
Probed `background-color: rgb(232,238,254)`, `border-top-left-radius: 0px`, height 54px.
Before: `before-tb-sec-hover-l.png`.

**What tc actually does.** `packages/components/src/tabs/tc-tab.styles.ts:24-26` —
`:host(:hover:not([disabled]):not([selected])) { background: var(--tc-tabs-tab-bg-hover, var(--tc-color-brand-surface)) }`.
tc **fills**, across the whole host box, full height, and leaves the label at
`--tc-tabs-tab-fg` (muted). So the fill is faithful and stays. What tc also gives this box is a
**4px corner** — `tc-tab.styles.ts:49-54` sets `border-radius: var(--tc-radius-sm, 4px)` as the
shape of its focus ring on the same element. (`tc-tabs.styles.ts` holds only the row: direction,
4px gap, and the `border-block-end` rail — the rail is on the container, below the tab, exactly as
in HeroUI, so full height into the rail is tc's own geometry and is kept.)

**Root cause of the "spill" look.** `themes/tzuchi/components/tabs.css:142-150` added the fill to
**every** `.tabs__tab`, but `styles/components/tabs.css:258-259` makes the secondary tab
`rounded-none`, and the theme's radius rule (`:180-183`) is scoped `.tabs:not(.tabs--secondary)`.
Tint with no corner = a paint spill.

**Fix.** Give the secondary tab tc's corner, on the tab (not on the hover rule) so the inset focus
ring this file already draws picks it up too — which is the pairing tc-tab itself makes:

```
[data-theme^="tzuchi"] .tabs--secondary > .tabs__list-container .tabs__tab {
  border-radius: var(--tc-radius-sm, 4px);
}
```

and keep `--accent-soft` for this variant's hover (now in its own rule, since item 5 makes the
generic hover neutral).

**Why that specificity.** (0,4,0) against the base's `rounded-none` at (0,3,0). The hover rule adds
`.tabs--secondary > .tabs__list-container` for (0,6,0), so it wins inside this variant only.
Consumer utility classes are untouched: they live in the later `utilities` layer.

**After.** `after-tb-sec-hover-l.png` (probe `border-top-left-radius: 4px`, fill unchanged),
`reg/tb-sec-hover-d.png`, `reg/tb-secv-hover-l.png` (vertical), `final/fin-tb-sec-hover-l.png`.

**Did not break.** `reg/tb-sec-rest-l.png` (rest identical: accent label, pill-ended underline, rail),
`reg/tb-sec-focus-l.png` (the inset focus ring now follows the 4px corner — tc's own focus shape),
`reg/tb-disabled-hover-l.png` (a disabled tab still never fills).
Out of scope and still present: qa-navigation #4 (the inset focus ring covering the 2px indicator).

---

## 5 — Tabs, segmented: the dark hover fill outranks the selected pill (qa-navigation #2)

**Reproduction.**
`node atoms4/tools/qa-shot.cjs tzuchi-dark components-navigation-tabs--default out.png size:1000x300 'hover:[role="tab"]:nth-child(2)' clip:'[role="tablist"]'`
Hovered tab `rgb(27,45,88)` (saturated navy `--accent-soft`) against a selected
`.tabs__indicator` at `rgb(79,79,79)` on a `rgb(51,51,51)` track — the hover was the loudest mark.
Before: `before-tb-seg-hover-d.png`, `before-tb-seg-hover-l.png`.

**Root cause.** `themes/tzuchi/components/tabs.css:142-150` (rule R78, "hover on a neutral surface =
`--accent-soft`") applied on top of a selected state that is deliberately neutral (`--segment`,
DESIGN-LANGUAGE R130 / D31).

**Fix.** The generic hover rule keeps its selectors and changes value to `var(--default-hover)`; the
brand tint moves into the secondary-only rule from item 4. `--default-hover` is the hover step of
the fill the strip itself is painted with (`.tabs__list-container` is `bg-default`,
`styles/components/tabs.css:16-19`), so hover now sits one step above the track.

**Why that specificity.** Unchanged selectors (0,4,0) — the value is simply replaced; the secondary
rule out-specifies it at (0,6,0) where the tint is wanted.

**After.** Light `after-tb-seg-hover-l.png` — neutral `rgb(224,224,224)` chip clearly below the
white pill; hierarchy restored. Dark `after-tb-seg-hover-d.png` — `rgb(79,79,79)`.
`final/fin-tb-seg-hover-l.png` re-run with the delivered file.

**Residual, reported not worked around.** In tzuchi-dark `--default-hover` and `--segment` are the
same `gray-800` (`rgb(79,79,79)`), so a hovered tab and the selected pill now share a fill and are
told apart only by the pill's `--surface-shadow` and the 700 weight. The dark neutral ramp offers
exactly one step above the `--default` track, and inventing a colour is not available to this file;
this is the unmapped-`--segment` gap DESIGN-LANGUAGE §12 Q4 already tracks. It is still strictly
better than the inversion it replaces (hover no longer outranks selection). See `notDone`.

**Did not break.** `reg/tb-sep-hover-l.png` (`--with-separator`), `reg/tb-vert-hover-l.png`
(`--vertical`), `reg/tb-disabled-hover-l.png`, `reg/tb-showcase-l.png`.

---

## 6 — Pagination: the focus ring touches the neighbouring current-page cell (qa-navigation #7)

**Reproduction.**
`node atoms4/tools/qa-shot.cjs tzuchi components-navigation-pagination--default out.png size:900x200 key:Tab key:Tab key:Tab clip:.pagination__content`
Probed `box-shadow: … rgb(248,248,248) 0 0 0 2px, rgb(79,123,190) 0 0 0 4px` — 2px ring at a 2px
offset, 4px outward, into a 4px gap. Before: `before-pg-focus-l.png`.

**Root cause.** Two of the theme's own decisions meeting: the gap is HeroUI's `gap-1`
(`styles/components/pagination.css:17`), kept because it is already 4px
(`themes/tzuchi/components/pagination.css:27`), and the cell is no longer a 24px pill but a 4px
square grown to 40px (`:83-95`). Round pills keep daylight at that spacing; squares do not.

**Fix.** `[data-theme^="tzuchi"] .pagination__link { --ring-offset-width: 0px }`.
`status-focused` → `focus-ring` reads its offset from `--tw-ring-offset-width: var(--ring-offset-width)`
(`styles/utilities/index.css:1-6`), and `--ring-offset-width` is a theme-level variable
(`themes/tzuchi/variables.css:24` = `--tc-focus-ring-offset`), so re-pointing it per component is a
scoped answer that needs no `!important` and does not restate the ring. Width and colour are
untouched (2px `--focus`). Applied to every `.pagination__link`, numbers and prev/next alike,
because they share one 4px strip and one strip should not carry two ring geometries.

**Why that specificity.** The base never declares `--ring-offset-width` on this element, so there is
nothing to out-specify; (0,2,0) is enough.

**After.** `after-pg-focus-l.png`, `after-pg-focus-d.png`, `final/fin-pg-focus-l.png` —
probed `… rgb(79,123,190) 0 0 0 2px` with a 0px offset band; the full 4px gap is now daylight.

**Did not break.** `reg/pg-sizes-l.png` (sm/md/lg 32/40/48px boxes unchanged),
`reg/pg-ellipsis-l.png`, `reg/pg-focus-prev-l.png` (ring on the active navy chip, still legible).

---

## 7 — Breadcrumbs: the separator chevron stayed 12px (qa-navigation #8)

**Reproduction.** `components-navigation-breadcrumbs--default`, clip `#storybook-root`.
Probed `.breadcrumbs__separator` 12×12 inside an item whose font-size is already 16px.
Before: `before-bc-l.png`.

**Root cause.** `styles/components/breadcrumbs.css:25-27` (`size-3`), left alone on purpose by
`themes/tzuchi/components/breadcrumbs.css:110-113` while change 4 of that same file moved the crumbs
from 14px to 16px.

**Fix.** `[data-theme^="tzuchi"] .breadcrumbs .breadcrumbs__separator { inline-size: 1em; block-size: 1em }`.
`1em` rather than the token because the element is an `<svg>` whose inherited font-size is the crumb's
own 16px (measured), so the separator is tied to the crumb type and cannot fall behind it again.
Logical properties, so the base's RTL rotation is unaffected; colour stays `--muted`.

**Why that specificity.** Base `.breadcrumbs .breadcrumbs__separator` (0,2,0) → this (0,3,0).

**After.** `after-bc-l.png`, `after-bc-d.png`, `final/fin-bc-l.png` (probe 16×16).
A custom separator element receives the same class (`breadcrumbs.tsx:68-78` clones it with
`slots.separator()`), so it scales with the crumbs too — checked: `after-bc-custom-l.png`.

**Did not break.** `reg/bc-focus-l.png` (2px ring at 2px offset, complete),
`reg/bc-disabled-l.png` (matches upstream, current crumb at full strength).

---

## 8 — date-input-group invalid + focus: VERIFY ONLY, no change

**Reproduction.** `components-date-and-time-datefield--invalid`, `key:Tab` (focuses the first segment),
probe `.date-input-group`, both themes.

```
tzuchi        border-top-color rgb(212,73,79)   box-shadow … rgb(212,73,79) 0 0 0 3px
tzuchi-dark   border-top-color rgb(240,138,142) box-shadow … rgb(240,138,142) 0 0 0 3px
```

One colour — `--danger` — for both the edge and the halo. The blue ring the earlier QA saw is gone:
Pass 4's `themes/tzuchi/components/date-input-group.css:238-252` gives a focused invalid shell
`--tw-ring-shadow: 0 0 0 3px var(--danger)` at (0,6,0), which clears the base focus ring.
Shots: `verify-df-invalid-focus-l.png`, `verify-df-invalid-focus-d.png`.
**`date-input-group.css` is therefore not in the delivered set.**

---

## Cross-cutting checks on the delivered files

* Comment safety: every file's `/*` and `*/` counts balance and no comment closes early
  (scanned programmatically; the string `"*"`+`"/"` appears only as a real terminator).
* No `!important`, no hex / `rgb()` / `hsl()` / `oklch()` literal, no `--tc-color-*`, no
  colour-valued `--tc-<component>-*` anywhere outside comments.
* No physical `left/right/top/bottom/width/height` properties in any declaration (scanned);
  everything added is logical (`inline-size`, `block-size`) or side-neutral
  (`outline`, `outline-offset`, `outline-color`, `border-radius`, `font-size`, `line-height`,
  `font-weight`, `background-color`, a custom property).
* Every added rule is prefixed `[data-theme^="tzuchi"]`.
* New colours come only from `--accent`, `--accent-foreground`, `--accent-soft`,
  `--default-hover`; new dimensions only from `--tc-radius-sm`, `--tc-font-size-16`,
  `--tc-line-height-normal`, `--tc-font-weight-bold/-regular` (all with fallbacks) or the
  literals `1px`, `-1px`, `0px`, `1em`.
* Every delivered file was injected into the live build and re-probed (`shots/date-nav/final/`);
  all parse and produce the intended computed values.

## Could not verify

* The two REMOVALS (item 2's guard, item 5's variant split) could not be driven by injection alone,
  since the build still carries the pre-Pass-5 rule. Both were verified by probing the delivered
  file's new rule directly and, for the visual, by pairing it with an explicit reset that lands the
  same computed value. A rebuild would confirm them end to end.
* Real mouse hover only; React Aria's `[data-hovered]` branch of each hover rule was not exercised
  separately — it is the same declaration block in every case.
* `prefers-reduced-motion`, RTL and non-`hover:hover` (touch) media were not rendered.
