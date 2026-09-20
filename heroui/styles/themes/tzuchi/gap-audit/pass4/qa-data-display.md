# Visual QA — data-display family (Tzu Chi theme on vendored HeroUI v3.2.6)

Themes driven: `tzuchi` and `tzuchi-dark`; every suspected defect re-rendered in upstream
`light` / `dark` before being written down.
Screenshots: **181** PNGs in
`(session screenshot, not kept) shots/data-display/`
(every one opened and looked at, not just captured).

## Stories covered

**Table** — `--default`, `--secondary-variant`, `--dynamic-with-selection`, `--dynamic-collection`,
`--expandable-rows`, `--empty-state-demo`, `--column-resizing`, `--async-loading`, `--virtualization`
**Chip** — `--default`, `--sizes`, `--variants`, `--statuses`, `--with-icon`
**Badge** — `--default`, `--sizes`, `--colors`, `--variants`, `--with-content`, `--placements`, `--dot-badge`
**Avatar** — `--default`, `--sizes`, `--variants`, `--fallback`, `--with-colors`
**AvatarGroup** — `--default`, `--sizes`, `--variants`, `--max`, `--with-count`, `--grid`
**Card** — `--default`, `--variants`, `--horizontal`, `--with-avatar`, `--with-images`, `--with-form`
**Surface** — `--variants`   **Separator** — `--variants`, `--vertical`, `--with-content`
**Kbd** — `--default`, `--key-combinations`, `--special-keys`, `--light-variant`, `--inline-usage`
**Typography** — `--heading-scale`, `--body-sizes`, `--weight-scale`, `--muted-color`, `--truncation`,
`--inline-code`, `--compound-primitives`, `--article-example`
**EmptyState** — no story of its own exists in `index.json`; the only rendering is
`table--empty-state-demo`, whose copy is a bare `<span className="text-sm text-muted">` from the story,
so nothing of the themed `empty-state.css` is exercised. Flagged as a coverage gap, not a defect.

States driven: keyboard `Tab` focus (rows, pagination), `Space`/`Enter` (row select, disclosure),
mouse click (select-all, single row, sort a column, expand a row), real hover on rows, and computed-style
probes on every element where the eye was not enough.

---

## Findings

### 1 · MEDIUM — Table (dark, and milder in light): row action buttons break on the hovered / selected row

`shots/data-display/169-table-selrow-actions-dark.png` (dark close-up),
`170-table-selrow-actions-light.png` (light close-up),
`167-table-def-selected-dark-retry.png`, `164-table-def-hover-dark.png`, `163-table-def-selected.png`,
`168-UP-table-def-selected-dark.png` (upstream dark, for contrast).

**Repro** `components-data-display-table--default` in `tzuchi-dark`; click the second row's checkbox
(or just hover the row). Look at the three action buttons in the Actions column.

**What is wrong** The theme paints the whole row with a brand tint on hover and on selection
(`table.css` R78/R82). Neither icon-button fill was built for that background:

* **Delete** (`.button--danger-soft`) is an *alpha-0.15* red — computed
  `oklab(0.743 0.118 0.038 / 0.15)`. Over the selected row's opaque `rgb(48,85,159)` it composites to a
  **lavender/periwinkle disc**; the red trash glyph on top loses almost all separation and the button no
  longer reads as "danger" at all. It happens on plain hover too, so merely moving the mouse down a table
  recolours every delete button.
* **View / Edit** (`.button--tertiary`) is *opaque* `rgb(51,51,51)`, unchanged by the row fill, so on the
  bright blue row the two neutral discs turn into **black punch-outs** — visually heavier than any other
  control in the table.

In the light theme the same mechanism gives a dusty-mauve delete disc with a washed-out trash icon
(`170-…-light.png`); milder, but the same loss of colour identity.

**Upstream** No. Upstream dark gives a selected row **no fill at all** (`168-UP-…`), so the buttons look
identical in every row. This is introduced by the theme.

**Cause** `heroui/styles/themes/tzuchi/components/table.css:161-177` — R78 sets
`.table-root .table__row:hover .table__cell { background-color: var(--accent-soft) }` and R82 sets
`.table__row[data-selected="true"] .table__cell { background-color: var(--accent-soft-hover) }`.
Under `tzuchi-dark` those two variables resolve to near-full-saturation blue, and the button fills come
from `heroui/styles/components/button.css:110-114` (`--button-bg: var(--default)`, opaque) and
`:136-141` (`--button-bg: var(--danger-soft)`, α 0.15).

**Suggested fix** Either drop the saturated tint for the dark selected/hover row (use a low-alpha
`--accent-soft` that stays close to the surface, the way light mode does), or, inside a tinted row, give
`.button--tertiary` / `.button--danger-soft` an explicit `--button-bg` that is legible on the tint (e.g.
`color-mix(in oklab, var(--accent-soft-hover), var(--default) 70%)` / an opaque danger-soft).

---

### 2 · MEDIUM — Chip: the 16px `--sm` label no longer fits a table status column and wraps into a two-line lozenge

`shots/data-display/118-table-chipwrap-zoom.png` (tzuchi), `119-UP-table-chipwrap-zoom.png` (upstream,
same viewport), `27-table-resize-tzuchi.png` (full page, default 900px viewport).

**Repro** `components-data-display-table--column-resizing` in `tzuchi` at any viewport — look at the
"On Leave" rows (Sara Johnson, Sophia Anderson).

**What is wrong** "On Leave" breaks after "On" and the chip becomes a ~90px-tall two-line blob with huge
pill ends, roughly doubling those two rows' height and wrecking the vertical rhythm of the table. The
column is **120px in both themes** (verified by DOM measurement — the story sets `defaultWidth="1fr"`,
`minWidth={100}`, no utility class), so this is purely the label growing.

**Upstream** No — at the identical 120px column upstream's 12px/4px chip fits on one line.

**Cause** `heroui/styles/themes/tzuchi/components/chip.css:67-70`
`[data-theme^="tzuchi"] .chip--sm { padding-inline: 8px; font-size: 16px }`, replacing
`heroui/styles/components/chip.css:51-53` `.chip--sm { @apply px-1 py-0 text-xs }` (12px / 4px).
Chip `sm` goes 20px wide × 57px tall → 34px tall and ~35% wider.

**Suggested fix** Give `.chip__label` `white-space: nowrap` (a status pill should never wrap), and/or let
`.chip--sm` keep a tighter inline padding so the 16px label recovers the 8px the bigger type spends.

---

### 3 · LOW — Table: 16px cell type makes two-word names wrap in a 160px column

`shots/data-display/27-table-resize-tzuchi.png` (Sophia Anderson, Name column),
`28-UP-table-resize-light.png` (upstream, same column width, one line).

**Repro** `components-data-display-table--column-resizing` in `tzuchi`, Name column (160px fixed).

**What is wrong** "Sophia Anderson" wraps to two lines and that row grows; upstream keeps it on one.
Same class of problem as #2 but from the cell type rather than the chip, and much less visually jarring —
a wrapped name still looks like a name.

**Cause** `heroui/styles/themes/tzuchi/components/table.css:125-141` raises `.table__column` /
`.table__cell` to `--tc-font-size-16` (verified by probe: 16px vs upstream 13px).

**Suggested fix** Nothing in CSS — worth telling consumers that Tzu Chi tables need ~25% more column
width than HeroUI's defaults, or documenting a `truncate` recipe for name cells.

---

### 4 · LOW — Chip: `md` and `lg` share one label size, so "Medium" and "Large" read as the same chip

`shots/data-display/35-chip-sizes-tzuchi.png`, `33-chip-variants-tzuchi.png`.

**Repro** `components-data-display-chip--sizes` in either Tzu Chi theme.

**What is wrong** Probed: `--sm` 16px/24px line, `--md` **20px**/30px, `--lg` **20px**/30px. The only
difference between a medium and a large chip is 8px of box height (40 vs 48) — the text is byte-identical
in size and weight, and in the Variants grid the Lg and Md blocks are hard to tell apart. Upstream steps
12 → 13 → 14px, so all three sizes are distinguishable.

**Not a bug in the CSS** — `DESIGN-LANGUAGE.md` R14/R61 specify exactly this (only `--sm` steps down to
16px; `--lg` only changes padding). Raised so the owner can decide whether a two-step chip type ladder is
really intended, given Tzu Chi has no type step between 16 and 20.

**Cause** `heroui/styles/themes/tzuchi/components/chip.css:51-60` (base `.chip` = 20px) and `:72-75`
(`.chip--lg` sets padding only, so it inherits the 20px).

---

## Checked and found FINE

Everything below was driven in both Tzu Chi themes, compared against upstream where it looked suspect,
and is genuinely OK.

**Table**
* Keyboard focus ring on a body row is complete on all four sides, correctly rounded, and is **not**
  clipped by the body card — including on the very first row, where the card's own rounding could have
  cut it (`22-table-selectall-kbd.png`, `31-table-expandable-kbd.png`). This is the good counter-example
  to the known option-row bug.
* Focus ring on the pagination buttons: full, offset, unclipped, correct radius (`12-table-kbdfocus-tzuchi.png`).
* Select-all checkbox: 32px in a 48px header — probed identical to the row checkboxes (32px, 2px border,
  4px radius), aligned to the same 41px left edge as the body checkboxes; no overflow into the next column
  (`132-table-header-zoom.png`, `135/136` secondary variant, DOM measurement).
* Indeterminate → checked select-all, per-row select, hover, and the hover-vs-selected ordering are all
  distinguishable in both themes (`14/15/16/17/18/19`, `162-167`).
* Column dividers: three `::after` hairlines in the right places; the missing fourth is the story's own
  `after:hidden` on Worker ID, matching upstream exactly (`132` vs `150-UP-table-header-zoom.png`).
* Sorting: clicking a column promotes its label from `--muted` to full foreground and flips the chevron;
  reads clearly (`151-table-sort-click.png`).
* Expandable rows: chevrons, indentation, dividers and the focused parent row all correct in both themes
  (`09/10/31/32`).
* Empty state, async loading, dynamic collection, virtualization: no clipping, no stray scrollbars, last
  virtualized row not cut (`07/08/25/26/30/159/160`). The empty state's flat grey block (no white body
  card) is identical upstream (`117-UP-table-empty-light.png`) — not a theme regression.
* Footer/pagination: "N to M of X results" baseline lines up with the page buttons; disabled "Prev" reads
  as disabled in both themes.
* Round (9999px) action buttons next to 4px-radius checkboxes look inconsistent at first glance but are
  deliberate — `themes/tzuchi/components/button.css:210-211` specifies `--tc-icon-button-radius: 9999px`.

**Chip** — all 5 colours × 4 variants × 3 sizes in both themes; no clipping, no baseline drift, icons and
status dots vertically centred, dark-mode fills all distinct from their background (`33/34/37/38/39/122/123/137/138/158`).
The 6px status dot looks small against the 20px label, but the dot size is hard-coded in the story
(`chip.stories.tsx:78 <Icon … width={6} />`), not in component CSS — out of scope.

**Badge** — sizes, colours, variants, dot, `99+` overflow and all four placements are pixel-comparable to
upstream; the white ring keeps every badge legible on the avatar, nothing clipped (`42-52`, `156` vs `157-UP`).

**Avatar / AvatarGroup** — sm/md/lg, letter/icon/img, soft variants, fallbacks, `max`, `+N` count, and the
grid layout all match upstream structurally; Tzu Chi only bolds the initials, which still fit the circle
(`55-68`, `71-UP` vs `72`, `124-127`, `147-UP` vs `140`, `148-UP` vs `149`). The `+N` bubble having no ring
while the photos do is upstream's own treatment.

**Card** — default, variants, horizontal, with-avatar, with-form, with-images in both themes; radii,
padding, the white-card/grey-field inversion on tinted surfaces, and the dark-mode inverted primary button
all behave (`73-81`, `128-130`, `142-145`, `152/153`). The square-cornered, light-background media cards in
`--with-images` look wrong in dark mode but are **identical upstream** (`161-UP-card-images-dark.png`) —
HeroUI's, not the theme's.

**Surface / Separator** — `secondary` vs `tertiary` are near-indistinguishable in both components and both
themes, but the probed values are **byte-identical to upstream** (`oklch(0.9524…)` vs `oklch(0.9373…)`),
so the theme neither caused nor worsened it (`82/83/89-97`).

**Kbd** — default, combinations, special keys, navigation keys, inline usage and the `light` variant in
both themes; nothing clipped, glyphs centred, the transparent `light` variant is upstream's design
(`98-105`, `115/116`).

**Typography** — h1–h6 scale, body sizes, weights, alignment, muted, truncation (ellipsis renders
correctly), inline code and the long-form article. The `text-`/`base` inline-code token splitting across
a line break is present upstream too (`113` vs `171-UP-typo-article-light.png`).

## Tools written for this pass (scratchpad only)

* `tools/dd-run.sh` — batch driver for `qa-shot.cjs` (job files in `jobs/dd-*.txt`)
* `tools/dd-dump.cjs` — renders a story in a theme and prints the DOM tree with each node's box, used to
  prove column widths and control sizes rather than eyeballing them
