# Visual QA — date-time family (DateField, TimeField, DatePicker, DateRangePicker, Calendar, RangeCalendar)

Themes: `tzuchi` / `tzuchi-dark`, compared against upstream `light` / `dark`.
Tool: `tools/qa-shot.cjs` against the static Storybook build. Fixed clock 2026-09-19, locale zh-Hant (so "today" is Sat 19 Sep 2026, the **last column** of the week — which is what surfaced finding 1).
Screenshots: **199** PNGs under `shots/date-time/`, ~55 opened and looked at.

---

## Stories covered

**DateField** — default, variants, all-variations, with-prefix-and-suffix, granularity, with-description, required, full-width, invalid, disabled, controlled, with-validation, form-example
**TimeField** — default, all-variations, with-prefix-and-suffix, invalid, full-width, controlled, with-validation
**DatePicker** — default (closed / popover open by click and by keyboard), with-validation, disabled, with-custom-indicator, form-example
**DateRangePicker** — default (closed / open / range selected), with-validation, disabled, with-custom-indicator, form-example
**Calendar** — default, default-value, controlled, min-max-dates, unavailable-dates, custom-unavailable-dates, weeks-in-month, multiple-selection, disabled, read-only, invalid, focused-value, with-indicators, today-indicator, multiple-months, three-months, day-view, week-view, international-calendar, booking-calendar, event-calendar, with-year-picker, year-picker, year-picker-styled-cells, year-picker-custom-cells, custom-nav-icons
**RangeCalendar** — default, default-value, min-max-dates, unavailable-dates, anchor-unavailable-dates, allows-non-contiguous-ranges, disabled, read-only, invalid, multiple-months, three-months, booking-calendar

States driven: keyboard Tab / Shift-Tab / arrows into the day grid and inside the popover, popover open + year-picker open, real mouse hover on day cells and on a selected cell, click-through range selection (Sun→Sat, Tue→Sat, Tue→Wed, across a week wrap, across a month boundary), invalid + focus, disabled, read-only.

---

## Findings

### 1. RangeCalendar / DateRangePicker — "today" is pixel-identical to an in-range day (medium)

`components-date-and-time-rangecalendar--default`, tzuchi and tzuchi-dark. Click 8 Sep, then 16 Sep.

Today (19 Sep) paints `--accent-soft` on a 4px-radius square. The range band paints the *same* `--accent-soft` with the same 4px outer corners. Probed: both `rgb(232, 238, 254)` in light. Today ends up looking like a selected day sitting just outside/next to the band, and when the range crosses today it disappears entirely.

Upstream keeps them apart by **shape**: today is `rounded-3xl` on a 36px box, i.e. a full circle, clearly not part of the continuous band. The theme squares both to 4px (`themes/tzuchi/components/calendar.css:123`, `themes/tzuchi/components/range-calendar.css:143` and `:148`) and so removes the only channel that separated them.

Worth noting: `themes/tzuchi/components/calendar.css:50-59` already reasons that hover must *not* use `--accent-soft` because "inside this component `--accent-soft` is already load-bearing as the TODAY marker (and, in RangeCalendar, as the selection band)". Those two uses now collide with each other.

- tzuchi: `shots/date-time/rc-tue2wed-l.png`, `shots/date-time/rc-tue2wed-d.png`
- upstream: `shots/date-time/up-rc-tue2wed.png`, `shots/date-time/up-rc-tue2wed-d.png`
- today swallowed by the band: `shots/date-time/rc-todayinband-l.png`, `shots/date-time/rc-todayinband-d.png`
- also visible in `shots/date-time/rc-invalid-zoom-l.png` vs `shots/date-time/up-rc-invalid-zoom.png` (today 19 directly above band cell 26)

Suggested fix: give today its own mark inside RangeCalendar that survives the square shape — e.g. a 1px `--accent` inset ring or a 2px underline on `.range-calendar__cell[data-today="true"] .range-calendar__cell-button` — or move the band onto a distinct tint.

---

### 2. Invalid field + focus — a red hairline nested inside the blue focus ring (medium)

`components-date-and-time-datefield--invalid` (same on TimeField, DatePicker `with-validation`), tzuchi and tzuchi-dark, press Tab once.

Probed on `.date-input-group`: `border-top-color: rgb(212, 73, 79)` **and** `box-shadow: … rgb(79, 123, 190) 0 0 0 2px`. The result is a 1px red outline hugging the field with a 2px blue ring immediately outside it — two status colours fighting on the same edge. Reads as an unfinished double outline rather than either "focused" or "invalid".

Upstream shows a single blue ring: its `.date-input-group` has `border-width: 0`, so there is no red edge left to show through.

Cause: `themes/tzuchi/components/date-input-group.css:155-160` makes focus paint the border (R67), so the field now *has* a visible border in every state; the base then keeps `border-color: var(--color-field-border-invalid)` from `styles/components/date-input-group.css:45-49`, while the danger ring that `invalid-field-ring` would apply on focus (`styles/utilities/index.css:20-26`) loses to `status-focused-field` from `styles/components/date-input-group.css:28-44`.

- tzuchi: `shots/date-time/df-invalid-focus-l.png`, `shots/date-time/df-invalid-focus-d.png`
- upstream: `shots/date-time/up-df-invalid-focus.png`

Suggested fix: when the group is `[data-invalid="true"]` and focused, paint the ring in `--danger` too (or drop the border to the focus colour) so one colour wins.

---

### 3. RangeCalendar — a range endpoint on an adjacent month's day becomes a lone bold number (medium)

`components-date-and-time-rangecalendar--invalid` (range 2026-09-25 → 2026-10-03), tzuchi. Look at the last row: `27 28 29 30 | 1 2 3`. "3" is the range **end**, but it is drawn with no fill and no band — just bolder than the "1" and "2" beside it.

Probed: `.range-calendar__cell[data-selection-end="true"] .range-calendar__cell-button` → `font-weight: 700`; its outside-month neighbours → `400`. Upstream: both `500`, so the end date is equally unfilled but at least does not shout.

Cause: `themes/tzuchi/components/range-calendar.css:154-156` applies `font-weight: 700` to every `[data-selected="true"]` cell-button, while the base deliberately withholds the `--accent` cap fill from outside-month cells (`styles/components/range-calendar.css:254-261`, `:not([data-outside-month="true"])`). Weight without fill.

- tzuchi: `shots/date-time/rc-invalid-zoom-l.png`, `shots/date-time/rc-invalid-zoom-d.png`
- upstream: `shots/date-time/up-rc-invalid-zoom.png`

Suggested fix: add `:not([data-outside-month="true"])` to the selected-weight rule so the bold only appears where the cap fill appears.

---

### 4. Year-picker trigger chevron is 12px beside 16px nav chevrons in the same row (low, upstream has it too)

`components-date-and-time-datepicker--default` with the popover open. The header carries three chevrons: the year-picker indicator right after "2026年9月" and the prev/next nav pair. Probed: `.calendar-year-picker__trigger-indicator` = 12×12; `.calendar__nav-button-icon` = 16×16.

Upstream has the same 12 vs 16 split, but there the heading is 14px/500; the theme raises the heading to 16px/700 (`themes/tzuchi/components/calendar-year-picker.css:110-114`), which makes the 12px glyph beside it look more obviously undersized. It is also inconsistent inside the theme's own work: `themes/tzuchi/components/date-picker.css:155-162` raised `.date-picker__trigger-indicator` to 20px precisely because "16px is not on the scale", while this sibling indicator was left at 12px.

- tzuchi: `shots/date-time/probe-yptrigger.png`
- upstream: `shots/date-time/up-probe-yptrigger.png`

---

### 5. Year-picker grid slices its first and last visible row in half (low, upstream has it too)

`components-date-and-time-calendar--with-year-picker` (and inside the DatePicker popover) — open the year picker. The scroll container is JS-sized to the day grid (probed 208px) and the row pitch is 36px, so the top and bottom rows are always cut through the middle of the glyphs, with no fade and no scrollbar. Inside the DatePicker popover the sliced row runs right into the popover's rounded bottom edge.

Upstream is geometrically identical, so this is HeroUI's; the theme only makes the remnant taller and more legible-as-broken by moving the cells from 14px/500 to 16px/400.

- tzuchi: `shots/date-time/yp-open-clip-l.png`, `shots/date-time/dp-pop-yearopen-l.png`, `shots/date-time/dp-pop-yearopen-d.png`
- upstream: `shots/date-time/up-yp-open-clip.png`, `shots/date-time/up-dp-pop-yearopen.png`

---

### 6. Date/time field shell is 1.6px taller than the Select and Button beside it (low)

`components-date-and-time-datefield--granularity` puts a DateField and a Select on one row. Probed: `.date-input-group` = **43.59px**, `.select__trigger` = **42px**, and `button[type="submit"]` in the form stories = **42px**. Upstream: all three 36px.

The extra 1.6px comes from `themes/tzuchi/components/date-input-group.css:143-146`, which builds the height from a 16px × **1.6** line box (25.6px) + 2×8 + 2×1, while the Select trigger and Button build theirs from 16px × **1.5** (24px) + 2×8 + 2×1. Where a date field sits in a toolbar next to other controls their bottom edges do not line up.

- `shots/date-time/df-gran-row-l.png` (the field's box is visibly deeper than the Select's)
- form stacks: `shots/date-time/dp-form-l.png`, `shots/date-time/drp-form-l.png`

---

## Checked and found FINE

- **DateField / TimeField resting, prefix, suffix, prefix+suffix, full-width, description, required, controlled** — segments, separators and affixes centre correctly in the taller 43.6px shell in both themes; no truncation, no baseline drift, no clipped icons. (`df-default-*`, `df-allvar-*`, `df-prefsuf-*`, `tf-allvar-*`, `tf-prefsuf-l`, `df-fw-l`, `tf-fw-l`)
- **Segment focus highlight** — the focused segment gets a readable tinted chip in both themes and moves correctly with arrow keys. (`df-focus-seg-l/d`, `df-focus-seg2-l`, `df-typed-l`)
- **Disabled fields** — dimmed consistently, value and placeholder both; the help text staying at full strength is base behaviour and matches upstream. (`df-disabled-l/d`)
- **DatePicker / DateRangePicker trigger button focus ring** — fully drawn, not clipped by the field, correct in dark. (`dp-btnfocus-l/d`)
- **Popover chrome** — 16px radius, 12px padding, `--overlay-shadow` in light and a visible 1px edge in dark; the calendar is not cramped and nothing overflows. (`dp-open-click-l/d`, `drp-open-l/d`)
- **Focus ring on day cells** — concentric with the new 4px cell radius (4 → 6 → 8px), not clipped anywhere: last column, first column, top row, bottom row, standalone and inside the popover, light and dark. The `container-type: inline-size` on `.calendar` and the popover's `overflow-y: auto` do not cut it. (`cal-kbfocus-l/d`, `cal-focus-zoom-l`, `dp-pop-focus-l`, `dp-pop-focusup-l`, `dp-pop-focusdown-l/d`, `dp-pop-focusleft-l`, `dp-cellfocus-zoom-l`)
- **Focus ring on the popover nav buttons and the year-picker trigger** — complete, correct offset, no clipping. (`dp-pop-navfocus-l`, `dp-pop-yearfocus-l`)
- **Day-cell hover** — real and distinguishable from today (neutral grey vs blue tint) in both themes. It is faint in light (`rgb(242,242,242)` on `rgb(248,248,248)`), but upstream's delta is the same size (`~rgb(238,238,241)` on `~rgb(244,244,245)`), so this is not a theme regression. (`cal-hover-l/d`, `cal-hoversel-l`, `tz-hover-bg`, `up-hover-bg`)
- **Selected day** — `--accent` fill + 700 weight, clearly distinct from today and from hover in both themes. (`cal-value-l/d`, `cal-todaysel-l`)
- **Disabled / min-max / unavailable / read-only calendars** — dimming and the strikethrough land correctly; outside-month days not being struck matches upstream. (`cal-disabled-l`, `cal-disabled-zoom-d`, `cal-minmax-zoom-l`, `cal-unavail-l/d`, `cal-readonly-zoom-l`, `rc-readonly-zoom-l`, `rc-disabled-zoom-l`)
- **Cell indicator dot** — sits clear of the taller 16px digits and inside the cell in every state incl. today and selected; identical position to upstream. (`ind-zoom-l`, `ind-zoom-today-l/d`, `up-ind-zoom-today`, `cal-ind-l/d`, `cal-event-l/d`)
- **Range band geometry** — mid-band cells square, week-wrap ends and range caps both land on the Tzu Chi 4px (probed 4px where upstream is 24px), including a range that starts in the first column or ends in the last. (`rc-sun2sat-l/d`, `rc-sun2wed-l`, `rc-tue2sat-l`, `rc-value-l/d`, `rc-noncontig-l`, `up-rc-sun2sat`)
- **Multiple months / week view / day view / international calendar** — headings, grids and gutters all hold; the 16px/700 heading does not overflow the 252px calendar or collide with the nav buttons. (`cal-2mo-l/d`, `rc-2mo-l/d`, `cal-week-l`, `cal-day-l`, `cal-intl-l`)
- **Booking and event calendars** — legends, disabled weekends and the dimmed prev-nav all render as intended. (`cal-booking-l/d`, `rc-booking-zoom-l/d`, `rc-anchor-l`, `cal-customunavail-l`)
- **Year-picker cells** — 4px shape, 16px/400 type in the 32px box with no clipping, selected year filled + bold, keyboard focus visible. (`yp-open-clip-l/d`, `yp-kbfocus-l`, `yp-styled-l`, `yp-custom-l`)

### Known / out of scope, seen but not reported

- `Calendar`/`RangeCalendar` `isInvalid` changes nothing in the grid — the base file has no invalid rule at all (`styles/components/calendar.css` has no `invalid`/`danger` selector), so upstream is identical and the theme neither helps nor hurts. (`cal-invalid-l/d`, `rc-invalid-l/d`)
- `three-months` renders a single 252px month at any viewport in both themes — a base container-query/story behaviour, probed identical at 252px upstream. (`cal-3mo-wide-l`, `up-cal-3mo-wide`)
- 12px weekday headers, the 2px (not 3px halo) field focus ring, and muted-text contrast were all on the do-not-report list.
