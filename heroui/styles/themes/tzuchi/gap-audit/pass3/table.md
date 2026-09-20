# Unit `table` — Tzu Chi override report

Target file: `styles/themes/tzuchi/components/table.css`
Written to: `heroui/styles/themes/tzuchi/components/table.css`

Sources read: `heroui/styles/components/table.css` (397 lines, the whole file),
`heroui/react/src/components/table/table.tsx`, `table.stories.tsx`,
`heroui/styles/src/components/table/table.styles.ts`,
`heroui/styles/themes/tzuchi/variables.css`, `heroui/styles/themes/shared/theme.css`,
existing overrides `checkbox.css`, `card.css`, `accordion.css`, `index.css`,
`packages/tokens/dist/tokens.css`, and the Tzu Chi list-row reference
`CISwebsite/packages/components/src/list-panel/tc-list-panel.styles.ts`.

Table has **no Tzu Chi counterpart** — DESIGN-LANGUAGE §12 Q8 names it explicitly. Every value
below is a rule the spec states outright, or the most conservative derivation from the closest
role, with the derivation named.

Resolved values assume the theme's `--radius: var(--tc-radius-md)` = 8px, so
`--radius-2xl` = 16px, `--radius-lg` = 8px, and Tailwind's `text-sm` = 14px/20px,
`text-xs` = 12px/16px, `py-2.5` = 10px, `py-3` = 12px, `px-4` = 16px, `size-3` = 12px.

---

## Changes

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `.table-root--primary` `border-radius` | `table.css:27` `min(32px, calc(var(--radius) * 2.5))` → **20px** | `border-radius: var(--tc-card-radius, var(--radius-2xl))` → **16px** | **R37** "Table / container shell", derived from R27 (Card). R37 names `min(32px, calc(--radius * 2.5))` = 20px as exactly what it replaces. |
| `.table__content` `font-size` | `table.css:103` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | **§1** "Every 14px (`text-sm`) role moves to 16px"; the table's default voice is prose → **R10 / R5** body. |
| `.table__content` `line-height` | `table.css:103` `text-sm` → **20px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | **§1.2** "1.6 for prose" (R10/R5). |
| `.table__column` `font-size` | `table.css:122` `text-xs` → **12px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | **R9** "Table header cell". |
| `.table__column` `font-weight` | `table.css:122` `font-medium` → **500** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | **R9**. |
| `.table__column` `line-height` | `table.css:122` `text-xs` → **16px** | `line-height: var(--tc-line-height-normal, 1.5)` → **24px** | **R9** (§1.2 "1.5 for controls" — the header cell is the control-label voice). |
| `.table__column` `padding-block` | `table.css:122` `py-2.5` → **10px** | `padding-block: var(--tc-space-8, 8px)` → **8px**; header band 24 + 16 = **40px** | **R9 → R4 → R57**. R9 derives the header cell from R4 (option row); R4's geometry is R57, `padding-block: var(--tc-space-8, 8px)`, which is exactly the 40px option row. 10px is also not a step on the §0 space scale. |
| `.table__cell` `font-size` | `table.css:264` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | **R10** "Table body cell", derived from R5. |
| `.table__cell` `line-height` | `table.css:264` `text-sm` → **20px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px**; text row 25.6 + 24 = **49.6px** | **R10 / R5** (§1.2 prose = 1.6). Weight still inherits 400, as R10 requires. |
| `.table__sortable-column-indicator` `inline-size` / `block-size` | `table.css:174` `size-3` → **12px** | `inline-size: 1em; block-size: 1em` → **16px** | **§1.3 / D18** — the chevron tracked a 12px label 1:1; the label is now 16px. 16px is the glyph size §1.3 keeps for `.close-button svg` and D18 keeps for the pagination chevrons. There is no 16px step in `--tc-size-icon-*`, so `1em` expresses the relationship without inventing a token. |
| `.table__sortable-column-indicator` `transition-duration` | `table.css:174` `duration-100` → **100ms** | `transition-duration: var(--tc-motion-duration-base, 200ms)` → **200ms** | **R132** — "a value/indicator travelling (progress width, switch thumb + track, **chevron rotation**)". Same form as `accordion.css:76-84`. |
| `.table__sortable-column-indicator` `transition-timing-function` | `table.css:174` `ease-out` | `transition-timing-function: var(--tc-motion-easing-standard, ease)` → `cubic-bezier(0.2, 0, 0, 1)` | **R132**; longhands only, per **R136** (no `transition-property`). |
| row hover — `.table__row:hover .table__cell` | `table.css:228` `bg-surface/40`; `--secondary` `table.css:94` `bg-default/50` | `background-color: var(--accent-soft)` → blue-100 light / blue-900 dark | **R78** "hover, on a neutral/transparent surface … any row *outside* a tinted panel". Kept inside `@media (hover: hover)` as the base and R79 require. |
| row selected — `.table__row[data-selected="true"] .table__cell` | `table.css:234` `bg-surface/10` | `background-color: var(--accent-soft-hover)` → blue-200 light / blue-700 dark | **R82**'s fill, one ladder step above R78's hover fill so hover < selected holds in both modes. R81 (solid `--accent`) is excluded by its own guard — selection is not the only state a row carries, and a row holds chips, avatars and buttons that a solid accent fill would strand. R83 needs a tonal fill at rest, which a table row does not have. See spec gap 4. |
| `.table__footer` `padding-block` | `table.css:332` `py-2.5` → **10px** | `padding-block: var(--tc-space-8, 8px)` → **8px** | **§0 / §9** — 10px is not a step on the Tzu Chi space scale; 8px puts the footer band level with the header band. See spec gap 7. |

### Cascade arithmetic

| rule | base specificity | override specificity | outcome |
|---|---|---|---|
| `.table-root--primary`, `.table__content`, `.table__column`, `.table__cell`, `.table__footer`, `.table__sortable-column-indicator` | (0,1,0) — all `@apply`-ed into single-class rules | (0,2,0) | override wins on specificity, no tie |
| row hover | `.table__row:hover .table__cell` (0,3,0); `.table-root--secondary .table__row:hover .table__cell` (0,4,0) | `[data-theme^="tzuchi"] .table-root .table__row:hover .table__cell` (0,5,0) | wins in **both** variants without relying on source order — `.table-root` is the `base` slot class (`table.styles.ts:10`) and is always present alongside the modifier |
| row selected | `.table__row[data-selected="true"] .table__cell` (0,3,0) | (0,5,0), declared **after** the hover pair | selected beats hover on a hovered selected row in both variants (upstream this is inconsistent: `--primary` selected wins, `--secondary` hover wins) |
| per-story utilities `pe-0`, `after:hidden`, `font-medium`, `text-xs`, `min-w-52`, `sticky top-0 bg-surface-secondary` | utilities layer | components layer | utilities keep winning, by design |

No `!important`, no `transition-property`, no `animation-name`, no hex/rgb/hsl/oklch literal, no
`--tc-color-*` or colour/shadow-valued component token, no physical `left`/`right`. Every
`--tc-*` used exists in `packages/tokens/dist/tokens.css` and carries a fallback:
`--tc-card-radius` (→ `--tc-radius-lg` 16px), `--tc-font-size-16` (16px),
`--tc-font-weight-bold` (700), `--tc-line-height-normal` (1.5), `--tc-line-height-relaxed` (1.6),
`--tc-space-8` (8px), `--tc-motion-duration-base` (200ms), `--tc-motion-easing-standard`.
Colours come only from `--accent-soft` / `--accent-soft-hover`, both flipped by
`themes/tzuchi/variables.css` in the `tzuchi-dark` block (lines 76-77).

---

## Left as HeroUI's (and why)

| what | why |
|---|---|
| Header fill `--surface-secondary` (`table.css:115`, `:41`) | **D31** — `--surface-secondary` is deliberately unmapped; the tokens have only two surface steps and HeroUI's value already sits correctly between `--surface` and `--default` in both modes. |
| All borders: `.table__header` / `.table__row` `border-separator/50`, `.table__cell` / `--secondary` rows `border-separator-tertiary/50` (`table.css:115`, `:217`, `:266`, `:88`) | **D25** — the separator variables are explicitly noted as shared with table borders and are settled; only a component's own variant classes were ever re-anchored. `--separator` is already remapped by the theme (`variables.css:47`, `:90`). No border rule in this file. |
| `.table__body` corner radius (`table.css:189-199`, `:206`) and `--secondary`'s header-card corners (`table.css:54-64`) — `min(32px, var(--radius-2xl))` | Already **16px** = `--tc-card-radius`, i.e. already on the card role **R27**. Restating would be duplication (**N5**). |
| `.table__cell` `padding-block` `py-3` = 12px and `padding-inline` `px-4` = 16px; `.table__column` `padding-inline` 16px; `.table__footer` `padding-inline` 16px | Already `--tc-space-12` / `--tc-space-16`, both on the Tzu Chi scale; 16px is also the card inset **D9** keeps. **R57**'s 32px inset is earned by popover option rows running edge to edge (`dropdown.css:79-81`) and does not transfer to a table — **I3** says follow the narrower inset outside that case. |
| Header colour `--muted` and its sortable hover `--foreground` (`table.css:122`, `:139-144`) | **R9** prescribes type only; the spec states no colour for a table header. Restraint (brief rule 6). |
| Focus rings — the inset `0 0 0 2px var(--focus)` split across cells (`table.css:147-151`, `:269-273`, `:282-316`) and the 8px `rounded-lg` focus shape | **D3** settles ring width/offset/colour theme-wide, and **R73** is already the inset-ring pattern an overflow-clipped component needs — HeroUI got there on its own. |
| Disabled (`status-disabled`, `table.css:238-241`) | **R85 / D2** — `--disabled-opacity` is already 0.38 and `status-disabled` sets the cursor. |
| Drop-target `bg-accent-soft` (`table.css:255-257`) | Already the grammar's tint. Note the collision recorded in spec gap 5. |
| Dragging `opacity-50` (`table.css:250-252`) | Choreography/state the spec is silent on (**R140**, brief rule 6). |
| Column resizer — `bg-separator` at rest, `bg-accent` on hover/resizing, `bg-focus` on focus (`table.css:347-368`) | Already `--separator` / `--accent` / `--focus`; D25 + D3 + R75 cover all three. Its `::after`-suppression rule (`table.css:371-373`) is structural. |
| `.table__column::after` column separator (`table.css:125-132`, `:157-159`) | Structural, `--separator`, D25. |
| `.table__scroll-container`, `.table__resizable-container`, `.table__load-more` (`py-3 text-center`), `.table__load-more-content` (`gap-2 py-2` = 8px/8px — already on the scale), the virtualized `:not(tbody)` branches, `.table__cell[data-tree-column]`'s `calc(1rem * var(--table-row-level))` indent | Layout-specific geometry / structure the spec is silent on. The load-more gap and padding are already Tzu Chi values. |
| `.table-root--secondary`'s structure (transparent header, `bg-surface-secondary` column cards, `shadow-none` body, `rounded-none` body cells, transparent rows) | HeroUI's variant identity; the row-state rules reach it through `.table-root` so it keeps working without any structural change. |
| **The checkbox column** | Checked against `checkbox.css:65-67`: the themed control is **32px** square (vs HeroUI's 16px). HeroUI's own `align-middle` on `.table__cell` (`table.css:264`) centres it, the `::after` column separator is `h-4` centred on the cell, and the story's `pe-0` + the untouched 16px `padding-inline-start` give a 48px column. The 32px control simply drives the row height (48px header, 56px body row) instead of the text. Nothing is clipped or misaligned, so **no alignment rule was written**. |
| Sticky header (`table.stories.tsx:635` `sticky top-0 z-10 bg-surface-secondary`) | A per-story utility in the utilities layer; unaffected by anything here, and the header band it sticks is now 40px instead of 36px. |
| Both variants, all sizes, and every state — hover, selected, focus-visible (cell, column and the continuous row ring), disabled, dragging, drop-target, `data-allows-sorting`, resizable, virtualized, load-more, expandable/tree rows, empty state | None hidden, none flattened. |

---

## Spec gaps

1. **R37 contradicts R38 on the primary shell.** R37 puts the table shell at 16px and names
   `min(32px, calc(--radius * 2.5))` = 20px as what it replaces. But `.table-root--primary` pads its
   inner white card by 4px (`px-1 pb-1`, `table.css:26`) and that card is already 16px
   (`table.css:189-199`), so HeroUI's 20px **is** R38's concentric answer (`calc(16px + 4px)`).
   Followed **R37**, because it names the value it replaces and because the alternative — pulling the
   inner card down to `calc(16px - 4px)` = 12px — would put a radius that is not on the Tzu Chi scale
   (0 / 4 / 8 / 16 / 9999) on the most card-like element in the component. Cost: the frame is 4px on
   the flats and ~5.7px on the corner diagonal instead of a constant 4px. Owner may prefer keeping
   20px on the root.
2. **R9 and R10 give type but no padding for table cells.** Header block padding was derived through
   R9 → R4 → R57 (8px, the 40px option row). Body cell padding was left at HeroUI's 12px/16px because
   both are already Tzu Chi space steps — but there is no rule that says a table body row should be
   49.6px rather than, say, R57's 40px.
3. **No colour rule for the table header cell.** Kept HeroUI's `--muted`. A 16px/700 label in
   `--muted` carries noticeably more weight than HeroUI's 12px/500 did; if the intent is for the
   header to stay quiet, the owner may want `--foreground` with a lighter weight, or `--muted` kept
   with weight 500. Recorded rather than decided.
4. **No rule fits "selected table row".** R81, R82 and R83 each carry a guard that excludes it
   (R81: selection is not the only state and the row holds its own coloured content; R82: a table is
   not a tinted panel; R83: a table row carries no tonal fill at rest). Used R82's fill
   (`--accent-soft-hover`) one step above R78's hover fill. Needs owner sign-off, same class of
   question as §12 Q6/Q7.
5. **Hover now shares a fill with drop-target.** `table.css:255-257` already paints
   `[data-drop-target="true"] .table__cell` with `bg-accent-soft`, which R78 now also gives to hover.
   Drop-target is transient (only during a drag, when hover is not meaningful) so it was left alone,
   but the two are no longer distinguishable. Closing it would mean re-pointing drop-target, which no
   spec rule covers.
6. **Sort-indicator size has no rule.** §1.3 lists the glyphs that deliberately stay small but does
   not cover a sort chevron, and `--tc-size-icon-*` has no 16px step (sm is 20px). Used `1em` so it
   tracks the header label; a token would need the owner.
7. **Footer band padding has no rule.** 10px (`py-2.5`) is off the §0 space scale; moved to 8px to
   sit level with the header band. §9 has no table-footer entry.
8. **The Tzu Chi list-row reference points looser than a data table.** `tc-list-panel.styles.ts`
   rows are `padding-block: var(--tc-space-16, 16px)` with a 16px inline inset, and its header bar is
   `12px 16px` with heading-4 type. Adopting it literally would give a 48px header and a 57.6px body
   row for a six-column table with avatars and action buttons. Not adopted; R9's own derivation
   (R4 → R57, 40px) was followed instead. Recorded so the divergence is visible.
9. **§12 Q8 already stands:** Table has no Tzu Chi counterpart at all, so none of the above is
   traceable to a Figma decision — only to internal consistency with this spec.
