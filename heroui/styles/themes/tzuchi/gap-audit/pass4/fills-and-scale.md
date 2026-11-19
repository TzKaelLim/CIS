# Pass 4 — unit `fills-and-scale`

Files replaced (full, under `heroui/styles/themes/tzuchi/components/`):
`table.css`, `tabs.css`, `calendar.css`, `range-calendar.css`.
Screenshots: `(session screenshot, not kept) shots/fills-and-scale/`.
Read-only on both repositories; every claim below was measured in the static
Storybook build with `tools/qa-shot.cjs` and two helper scripts written for this
unit (`tools/measure-weekdays.cjs`, `tools/measure-locales.cjs`).

Net CSS: **three new declarations** (one per component family) — one `color` in
`table.css`, one `color` rule in `tabs.css`, one `font-size` + `line-height`
rule in each of `calendar.css` / `range-calendar.css`. Everything else in the
four files is byte-identical to the current version; only the header comments
gained a dated `PASS 4` block.

---

## Defect 1a — Table column headers: `--muted` on the `--surface-secondary` fill

### Reproduction (before)

`node tools/qa-shot.cjs tzuchi components-data-display-table--default before-table-light.png probe:.table__column`

- `shots/fills-and-scale/before-table-light.png` — "Worker ID / Member / Role /
  Status / Actions" are grey on the grey header band.
- `shots/fills-and-scale/before-table-dark.png`
- probe: `color: rgb(130,130,130)` (= `--muted` = gray-700 `#828282`) light,
  `rgb(179,179,179)` (gray-400 `#b3b3b3`) dark.
- Band colour: `.table-root--primary` computed
  `background-color: oklch(0.9524 0.0013 286.37)` = `rgb(239,239,240)` light,
  `rgb(35,35,37)` dark.
- **Contrast: 3.34:1 light** (the sweep's figure, reproduced exactly), 7.48:1 dark.

### Root cause

`heroui/styles/components/table.css:121-122`

```
.table__column {
  @apply relative px-4 py-2.5 text-start text-xs font-medium text-muted;
```

The fill comes from `table.css:25-27` (`.table-root--primary { @apply bg-surface-secondary … }`)
in the primary variant and from `table.css:40-42`
(`.table-root--secondary .table__column { @apply bg-surface-secondary; }`) in the
secondary one — so in **both** variants the header label sits on a fill.
`.table__sortable-column-header` (`table.css:165`) declares no colour at all; its
grey is inherited from the `<th>`, so it is the same defect, not a second one.

### Fix

Added to the existing `.table__column` rule in `themes/tzuchi/components/table.css`:

```css
[data-theme^="tzuchi"] .table__column {
  padding-block: var(--tc-space-8, 8px);
  color: var(--surface-secondary-foreground);
  …
}
```

- **Why that variable**: the new rule is "text on a fill takes that fill's own
  foreground". The fill is `--surface-secondary`; HeroUI's own foreground for
  that surface step is `--surface-secondary-foreground`, declared in
  `themes/default/variables.css:76` (light) and `:212` (dark), both as
  `var(--foreground)` — which the Tzu Chi theme remaps to gray-900 / gray-100.
  It is a HeroUI theme variable, it flips with the mode, and it is *not* a
  `--tc-color-*` or a colour literal.
- **Why that specificity**: base is `(0,1,0)`; the override is `(0,2,0)` in the
  same `components` layer, imported later → clean win. The base's sortable-hover
  rule `.table__column[data-allows-sorting="true"]:hover` (`table.css:139-144`)
  is `(0,3,0)` and still outranks it, so no state is hidden.
- Nothing else touched: header fill, separators, focus ring, disabled, dragging,
  resizer, virtualized branches all unchanged.

### After

- `shots/fills-and-scale/after-table-light.png` — probe `color: rgb(51,51,51)`
  (`#333333`), **11.00:1**.
- `shots/fills-and-scale/after-table-dark.png` — `rgb(242,242,242)` (`#f2f2f2`),
  **14.01:1**.
- `shots/fills-and-scale/after-table-secondary-light.png` — the secondary
  variant's standalone header card gets the same treatment (its `<th>` carries
  the fill itself), probe `rgb(51,51,51)` on `oklch(0.9524 …)`.

### Consequence I could NOT fix inside the brief — sortable hover collapses

Measured, both before and after, by hovering the sortable "Member" column:

| | rest | hover |
|---|---|---|
| before | `rgb(130,130,130)` | `rgb(51,51,51)` |
| after | `rgb(51,51,51)` | `rgb(51,51,51)` |

`shots/fills-and-scale/after-table-sortable-hover-light.png`.

`--surface-secondary-foreground` **is** `var(--foreground)`, which is exactly what
the base hover rule paints, so the hover no longer changes the label's colour.
The state is not removed or hidden — the base rule still wins the cascade, and
`cursor: var(--cursor-interactive)`, the sort indicator and `aria-sort` are
untouched — but its only visual channel is gone. Giving the hover a *different*
colour means picking one (`--accent` is the obvious candidate), which is a
DESIGN-LANGUAGE decision this brief does not authorise. **Flagged for the owner.**

---

## Defect 1b — Table footer (pagination summary): REPORTED, not fixed

- Reproduced: `shots/fills-and-scale/before-table-light.png` / `after-table-light.png`,
  "1 to 4 of 12 results" stays `rgb(130,130,130)` in both, i.e. 3.34:1 on the same
  `--surface-secondary` band (the primary root's own background shows through the
  footer `div`, which paints nothing).
- The grey comes from **`heroui/styles/components/pagination.css:11-13`**
  (`.pagination__summary { @apply … text-sm text-muted … }`), rendered by
  `Pagination.Summary` inside `Table.Footer` (`table.stories.tsx:181-188, 376-378`).
- The brief allows fixing it from `table.css` only "in the way HeroUI's own base
  `table.css` reaches into its footer, if it does". **It does not.** Base
  `table.css` owns exactly one footer rule —
  `table.css:331-333 .table__footer { @apply flex items-center px-4 py-2.5; }` —
  and never uses a descendant selector from `.table__footer`. A
  `[data-theme^="tzuchi"] .table__footer .pagination__summary` rule would be a
  cross-component reach with no precedent in the base file and would also collide
  with whoever owns `pagination.css` (hard rule 7).
- **Where it belongs**: `themes/tzuchi/components/pagination.css`, as
  `.pagination__summary { color: inherit }` or an explicit fill-foreground — but
  note the summary is *not* always on a fill (a standalone `Pagination` sits on
  the page background), so the right fix is probably scoped to the table context
  and needs an owner decision.

---

## Defect 2 — Segmented ("primary") Tabs: `--muted` on the `--default` track

### Reproduction (before)

`node tools/qa-shot.cjs tzuchi components-navigation-tabs--default … probe:.tabs__tab:not([data-selected="true"])`

- `shots/fills-and-scale/before-tabs-light.png` — "Analytics" / "Reports" grey on
  the grey strip; `shots/fills-and-scale/before-tabs-dark.png`.
- probe: `color: rgb(130,130,130)` light on `--default` = gray-100 `#f2f2f2`
  → **3.43:1** (the sweep's figure); dark `rgb(179,179,179)` on gray-900
  `#333333` → 6.03:1.

### Root cause

`heroui/styles/components/tabs.css:123-124`

```
.tabs__tab {
  @apply relative flex h-8 w-full … text-sm font-medium text-muted …;
```

with the fill from `tabs.css:16-19` (`.tabs__list-container { @apply relative bg-default; … }`).
`gap-audit/tabs.md` recorded `tabs.tab-fg → --muted` as an exact match to
`tc-tab.styles.ts:13` — true for the **secondary/underline** variant (which is
`tc-tabs`, and whose container is `bg-transparent`, `tabs.css:249-250`), but the
segmented `primary` variant has no tc counterpart and puts that same grey on a fill.

### Fix

New rule in `themes/tzuchi/components/tabs.css`, before the existing primary-variant block:

```css
[data-theme^="tzuchi"]
  .tabs:not(.tabs--secondary)
  > :is(.tabs__list-container, .tabs__list)
  .tabs__tab:not([data-selected="true"]) {
  color: var(--default-foreground);
}
```

- **Scope**: `:not(.tabs--secondary)` is how this file already scopes its other
  primary-variant rules; the `>` + `:is(.tabs__list-container, .tabs__list)` step
  is copied from the base's own alignment rules (`tabs.css:177-183`) so a Tabs
  nested inside a primary Tabs' panel keeps its own colours.
  `:not([data-selected="true"])` leaves the selected tab on `--segment-foreground`.
- **Specificity**: `(0,6,0)` against the base's `(0,1,0)`; the base's selected
  (`:141-142`), disabled (`:151-156`), hover (`:158-164`) and focus (`:166-170`)
  rules are untouched. Verified: the disabled tab still renders at
  `opacity: 0.38` (`shots/fills-and-scale/after-tabs-disabled-light.png`).
- The **secondary** variant is provably untouched — probe on
  `.tabs--secondary .tabs__tab:not([data-selected="true"])` after the injection:
  `rgb(130,130,130)` light / `rgb(179,179,179)` dark, i.e. still `--muted`
  (`shots/fills-and-scale/after-tabs-secondary-light.png`, `-dark.png`).

### After — and "does it still read as selected?"

- `shots/fills-and-scale/after-tabs-light.png`: unselected `rgb(51,51,51)`
  (**11.29:1**), selected still `oklch(0.2103 …)` on the white `--segment` pill.
  Selected reads clearly: white pill + `--surface-shadow` + 700 weight, and the
  label colours still differ slightly (`#333333` vs `--eclipse`).
- `shots/fills-and-scale/after-tabs-dark.png`: unselected `rgb(242,242,242)`
  (**11.29:1**). **In tzuchi-dark `--default-foreground` and `--segment-foreground`
  both resolve to gray-100 `#f2f2f2`**, so the dark segmented control now separates
  selected from unselected by **pill + shadow + weight only**, no longer also by
  label colour. Looking at the shot, it still reads correctly (the gray-800 pill on
  the gray-900 track is 1.54:1 in luminance but clearly visible, and "Overview" is
  bold), but this is the change's real cost and the owner should know.
  Mapping `--segment` / `--segment-foreground` for this theme — already named as
  the open item in `gap-audit/tabs.md` — would give the dark pill its colour
  channel back.
- Also checked: `--vertical` (`after-tabs-vertical-dark.png`) and
  `--with-disabled-tab` (`after-tabs-disabled-light.png`).

### Out of scope, noted

On hover an unselected primary tab is filled with `--accent-soft` (this file's
pass-1 rule). Strictly, the new rule would then call for `--accent-soft-foreground`.
Contrast is fine as it stands (`#333333` on blue-100 = 10.89:1; gray-100 on
blue-900 in dark), so I left the hover alone — the brief covers the rest state.

---

## Defect 3 — 12px weekday headers (Calendar + RangeCalendar)

### Reproduction (before)

- probe `.calendar__header-cell`: `font-size: 12px`, `font-weight: 500`,
  `line-height: 16px`, cell `36 × 24px`
  (`shots/fills-and-scale/before-calendar-light.png`).
- probe `.range-calendar__header-cell`: identical
  (`shots/fills-and-scale/before-rangecal-dark.png`).

### Root cause

`heroui/styles/components/calendar.css:176-179` and
`heroui/styles/components/range-calendar.css:176-179`:

```
.calendar__header-cell {
  @apply flex items-center justify-center pb-2 text-xs font-medium text-muted;
}
```

The day numerals moved to 16px in pass 3 (`.calendar__cell`, R21 → R16), but the
weekday row was deliberately left at 12px, citing §1.3 row 1 / R8. §1.3's
exception list never actually names this cell (it names `.header`,
`.badge__label`, `.breadcrumbs__separator`, `.close-button svg`, the toast
spinner), so that was an *extension* of R8, and pass 4 overrules it.

### Fix

```css
[data-theme^="tzuchi"] .calendar__header-cell {
  font-size: var(--tc-font-size-16, 16px);
  line-height: var(--tc-line-height-relaxed, 1.6);
}
```
(and the same for `.range-calendar__header-cell`.)

- **Specificity**: base `(0,1,0)` → override `(0,2,0)`; nothing else in the base
  file declares type on this element.
- **Line-height** moves with the size onto the 1.6 the numerals already use,
  rather than leaving the label in Tailwind's 12px `text-xs` 16px line box.
  Measured result: `font-size: 16px`, `line-height: 25.6px`, cell
  `36 × 33.59px` (was `36 × 24px`).
- **Weight stays 500** (HeroUI's `font-medium`, not restated): below the 700 of a
  subtitle, so the weekday row still reads as subordinate to the numerals — which
  was R8's actual concern.
- **Colour stays `--muted`**: this row sits on the calendar surface, not on a
  fill, so defect 1's new rule does not reach it (per the brief, out of scope).

### After

`after-calendar-light.png`, `after-calendar-dark.png`, `after-rangecal-light.png`,
`after-rangecal-dark.png`, `after-datepicker-popover-light.png`,
`after-calendar-intl.png`, `after-calendar-multi-months.png`,
`after-calendar-three-months.png`.

### Fit — measured, and the locales that overflow

Column width is fixed: `.calendar` / `.range-calendar` are `w-63` = 252px over a
`repeat(7, 1fr)` grid = **36px per column** (36.58px in the `w-64` multi-month
stories). Measured with `tools/measure-weekdays.cjs` (real cells) and
`tools/measure-locales.cjs` (every locale the Storybook i18n addon offers,
labels produced with React Aria's own default `weekdayStyle="short"`,
`calendar.tsx:287` / `range-calendar.tsx:292`).

The cases the brief asks about — **all fit, one line, nothing shrunk**:

| case | label | ink width | column | slack |
|---|---|---|---|---|
| CJK 2-char (zh-TW / zh-CN, the build's default locale) | 週日 | 32.00px | 36px | 4.00px |
| Latin 3-letter (en-US / en-GB) | Wed | 34.31px | 36px | 1.69px |
| Latin 2-letter (de-DE) | Mo | 24.13px | 36px | 11.87px |
| Devanagari (`--international-calendar`) | मंगल | 30.00px | 36px | 6.00px |
| ja-JP | 日 | 16.00px | 36px | 20.00px |

Two CJK glyphs are 2 em, so the 32px figure is font-independent.
Verified story by story (all single-line, no overflow): `calendar--default`,
`--week-view`, `--day-view`, `--multiple-months` (14 cells, 36.58px columns),
`--three-months` (21 cells, 36.58px), `--international-calendar`,
`rangecalendar--default` / `--default-value`, and both popovers
(`datepicker--default`, `daterangepicker--default`, opened with
`click:.date-picker__trigger` / `.date-range-picker__trigger`).

**Locales whose label is wider than the 36px column — reported, not worked
around** (the brief: name them rather than shrink the type; the 36px column is
HeroUI's, not this theme's). Widths are the worst label per locale:

| locale | label | at 16px | at 12px (today) | new? |
|---|---|---|---|---|
| pt-PT | domingo | 66.5px | 50.4px | no — already overset |
| lv-LV | Ceturtd. | 62.2px | 48.1px | no — already overset |
| ar-AE | الخميس | 53.7px | 40.7px | no — already overset |
| pl-PL | niedz. | 46.2px | 35.1px | **yes** |
| pt-BR | dom. | 38.3px | 29.0px | **yes** |
| ro-RO | dum. | 38.3px | 29.0px | **yes** |
| da-DK | man. | 37.4px | 28.3px | **yes** |
| nb-NO | man. | 37.4px | 28.3px | **yes** |
| fr-FR / fr-CA | sam. | 36.4px | 27.6px | **yes** (0.4px) |
| he-IL | יום א׳ | wraps to 2 lines | 33.3px, 1 line | **yes** |

Nothing clips (the cell sets no `overflow`); an overset label simply centres
wider than its column and touches its neighbours. Three locales already did this
at 12px, so the base's 36px column is the underlying constraint; six more (plus
he-IL's wrap) cross it at 16px. If the owner wants them to fit, the lever is the
column width or `weekdayStyle="narrow"` — both are HeroUI-side decisions, not
theme CSS.

---

## What I could NOT verify by injection

1. **Removals.** The `css:` action loads the build's current version of each file
   *before* mine, so it can only prove added/changed declarations. These four files
   remove nothing, so this limitation does not bite — but it does mean I verified
   "my declaration wins" rather than "the file as a whole produces exactly this".
2. **The real build's font.** In this Storybook build the body font resolves to
   `Inter, ui-sans-serif, system-ui, …` (`storybook/.storybook/globals.css:9-11`;
   the `[data-theme^="tzuchi"] { --font-sans: revert-layer }` patch at `:38-42` is
   not taking effect in the static build), **not** the Tzu Chi
   `'Noto Sans TC', system-ui, …` stack. The CJK figures are font-independent
   (1 em per glyph), but the Latin widths above (e.g. en-US "Wed" at 34.31px, with
   only 1.69px of slack, and fr-FR "sam." at 36.42px) could shift by a point or two
   in Noto Sans TC. Worth one re-measure after a real build.
3. **`--surface-secondary` / `--segment` are unmapped** in
   `themes/tzuchi/variables.css` (stated in its own header). Both fixes therefore
   depend on HeroUI's stock values for those two surfaces; if the owner ever maps
   them, both contrast figures move.
4. **The `--three-months` story only paints its first month** in this build:
   `.calendar` is `w-63 max-w-63` (base `calendar.css:11-14`) and the story's
   `w-auto overflow-x-auto` cannot beat `max-w-63`, so the 824px strip is clipped
   to 252px. Pre-existing and unrelated to type size — I measured all 21 header
   cells via the DOM instead (`tools/grids.cjs` confirms the three grids at
   x = 574 / 858 / 1142, each 256px).
5. **Hover on the segmented tabs** was checked by computed style only for the rest
   state; React Aria's `[data-hovered]` path is not reliably reachable in headless
   Chrome (the tool's own caveat). The base `:hover` half of each pair is plain CSS
   and was exercised for the table's sortable column.
