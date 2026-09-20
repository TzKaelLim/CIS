# Pass 5 — fix unit "option-lists"

Files replaced (full copies, ready to drop over
`/Users/kaellim/Desktop/Personal/CISwebsite-heroui-spike/heroui/styles/themes/tzuchi/components/`):

| file | at |
|---|---|
| `list-box-item.css` | `heroui/styles/themes/tzuchi/components/list-box-item.css` |
| `list-box.css` | `…/scratchpad/atoms5/css/list-box.css` |
| `menu-item.css` | `…/scratchpad/atoms5/css/menu-item.css` |
| `header.css` | `…/scratchpad/atoms5/css/header.css` |
| `dropdown.css` | `…/scratchpad/atoms5/css/dropdown.css` |
| `select.css` | `…/scratchpad/atoms5/css/select.css` |
| `combo-box.css` | `…/scratchpad/atoms5/css/combo-box.css` |
| `autocomplete.css` | `…/scratchpad/atoms5/css/autocomplete.css` |
| `kbd.css` | `…/scratchpad/atoms5/css/kbd.css` |

`menu.css` was in the unit's allowance but needed no change and is **not** delivered.

Screenshots: `…/scratchpad/atoms5/shots/option-lists/`.
Every fix was reproduced first (`before-*`), then injected with `qa-shot.cjs css:<file>`
(`after-*`), then looked at; `check-*` are the "did I break the neighbour" shots and
`final-all-*` are all nine files injected together.

Method note: injection can only ADD or CHANGE declarations, never remove them. Nothing in
this pass is a removal — every change is a new declaration or a new value on an existing
one — so the injected result is the real result.

---

## 1 · [HIGH] The 32px row inset was global; bare rows clipped and wrapped

**Reproduction** `qa-shot.cjs tzuchi components-collections-listbox--default out.png
probe:.list-box-item clip:.list-box` → `before-01-listbox-default-tz.png`: the third row
reads `martha@heroui.cor`, the final `m` sliced by the list box's `overflow-clip`.
Probed: `padding-left/right 32px`, description element 128.39px wide inside a 112px column.
`before-02-lb-sections-tz.png` (`--with-sections`): `Delete file` breaks to `Delete / file`,
`Move to trash` to `Move to / trash`.

**Root cause** `themes/tzuchi/components/list-box-item.css:65` and `menu-item.css:111`
(`padding-inline: var(--tc-space-32, 32px)`), plus `header.css:86` and `list-box.css:57`
for the section label. 32px is tc-dropdown's **popover** value
(`packages/components/src/dropdown/tc-dropdown.styles.ts:87`), and a popover sizes itself
to its trigger; a bare ListBox is sized by its consumer (220px / 256px in the stories), so
64px of inset plus a 32px avatar plus a 12px gap left ~112px for a 16px description.

**Fix** Global rows and the global section header take the 20px field inset
(`var(--tc-space-20, 20px)`); 32px survives only where the four popover files re-assert it.
`[data-slot="description"]` additionally gets `overflow-wrap: anywhere`.

* `list-box-item.css` — `padding-inline: 20px`, `overflow-wrap: anywhere` on the description.
* `menu-item.css` — the same, plus the submenu compound
  `[data-has-submenu="true"]:has(.menu-item__indicator)` re-pointed to 20px start / 28px end
  (HeroUI's own `pe-7` clearance for the chevron).
* `header.css`, `list-box.css` — 20px.
* `select.css`, `autocomplete.css` — new `& [data-slot="list-box"] .header { 32px }` at
  **(0,4,0)**, one step above `list-box.css`'s `.list-box .header` (0,3,0), because the two
  popovers' list element carries the shared `.list-box` class.
* `dropdown.css` — new `[data-slot="menu-item"][data-has-submenu]:has(.menu-item__indicator)`
  at **(0,5,0)**. Without it `menu-item.css`'s (0,4,0) compound would have dragged the one
  submenu row in a Dropdown back to 20px while its neighbours stayed at 32px.

**Why that specificity** The row rule is (0,2,0), beating the base `.list-box-item` /
`.menu-item` (0,1,0); the four popovers' row rules are (0,3,0) and are unchanged, so a row
on a tinted panel keeps 32px without this file knowing about it.

**Measured after** `after-01-listbox-default-tz.png` — padding 20/20, `bob@` and `fred@` on
one line, `martha@heroui.com` wraps (no longer sliced). `after-02-lb-sections-tz.png` — no
label breaks, card height back to ~440px. `after-11-dd-sections-tz.png`,
`after-11b-select-sections-tz.png`, `check-04-auto-sections-tz.png` — Dropdown / Select /
Autocomplete rows and headers still 32px. `after-01c-dd-submenu-tz.png` — the `Other`
submenu row still 32px.

**Recorded, not paid for** The `padding-inline` shorthand still overwrites HeroUI's `pe-7`
indicator reserve, exactly as the 32px value did. Measured: the indicator box is
`absolute end-2 size-4` → 8…24px from the row's end, and the 10px checkmark inside it →
11…21px, so the glyph crosses the 20px text column by at most **1px**, and only if a label
filled its column to the last pixel. Reserving 28px instead costs exactly the 8px that lets
`bob@heroui.com` sit on one line in the 220px story — rendered both ways:
`after-01-listbox-default-tz.png` (20/20, row 65.59px, one line each for `bob@` and `fred@`)
vs `trial-01-listbox-20-28-tz.png` (20/28, row **91.19px**, every description on two lines).
Checked on
`--multi-select` and `--custom-check-icon` with a real selection
(`after-03-lb-multi-tz.png`, `check-02-lb-customcheck-tz.png`): no collision.

---

## 2 · ComboBox — query at 20px, results at 32px

**Reproduction** `qa-shot.cjs tzuchi components-pickers-combobox--default out.png key:Tab
key:ArrowDown wait:500 full` → `before-02b-combo-open-tz.png`: `Search animals…` starts 20px
in, `Aardvark` 32px in.

**Root cause** `themes/tzuchi/components/combo-box.css:236-238` (rows) against the Input
shell §11 I3 put at 20px (`input.css`, `combo-box.css:170-174`).

**Fix** `combo-box.css` — the popover's rows AND a new `& [data-slot="list-box"] .header`
rule both take `var(--tc-space-20, 20px)`. Both are written at their own scope's
specificity ((0,3,0) / (0,4,0)) rather than left to `list-box-item.css`'s new global 20px,
because HeroUI's own `.combo-box__popover [data-slot="list-box-item"] { px-2.5 }` is (0,2,0)
and would otherwise be a tie decided by import order.

**After** `after-02b-combo-open-tz.png` — a result starts exactly where the query does.
Dark: `check-05-combo-sections-tzd.png` (rows and headers 20px, probed).

---

## 3 · Bare rows hovered in neutral grey; a selected bare row had no fill

**Reproduction** `qa-shot.cjs tzuchi components-collections-listbox--multi-select out.png
key:Tab key:Space hover:[data-key="2"] probe:…` → `before-03-lb-multi-tz.png`: selected row
`background-color: rgba(0,0,0,0)`, hovered row `rgb(242,242,242)` (`--default`).

**Root cause** `heroui/styles/components/list-box-item.css:53-59` (`bg-default` hover) and
`:61-64` (empty selected block); `menu-item.css:63-90` likewise. The theme's own files ported
geometry and type only, so the identical row inside a Dropdown used the brand tint and the
bare one did not.

**Fix** `list-box-item.css` and `menu-item.css` — hover `--accent-soft`, pressed / selected
`--accent-soft-hover`, mirroring the base's `@media (hover: hover)` wrapper and every state
hook it uses (`:hover` / `[data-hovered]`, `:active` / `[data-pressed]`,
`[aria-selected]` / `[data-selected]`, plus `[aria-checked]` for a Menu's single-selection
rows). The selected rule is declared after the hover rule at equal specificity, so a
hovered-and-selected row keeps the stronger fill.

**Why that specificity** (0,3,0) over the base's `.list-box-item:hover` (0,2,0); the four
popovers' own fills are (0,4,0), so a row on a tinted panel is untouched.

**After** `after-03-lb-multi-tz.png` — selected `rgb(209,222,255)`, hovered `rgb(232,238,254)`,
two clearly different bands. Dark: `check-01-lb-sections-tzd.png` (hover `rgb(27,45,88)` on
the near-black card).

**Observation for the integrator (not in this brief)** a row's `[data-slot="description"]` is
`--muted` (#828282). On the new light hover fill (#e8eefe) that measures ~3.1:1, against ~3.6:1
on the resting surface — the muted-on-surface contrast was already on the known-issues list;
the hover fill makes it marginally worse. Fixing it means recolouring `.description`, which
belongs to another unit's file.

---

## 4 · Selection indicator was the only differentiator and the only neutral on the panel

**Reproduction** `qa-shot.cjs tzuchi components-pickers-select--multiple-select out.png
key:Tab key:Enter key:ArrowDown key:Enter probe:.list-box-item__indicator` →
`before-04b-select-sel-tz.png`, probed `rgb(51,51,51)` (`--default-foreground`).
Dropdown: `.menu-item__indicator` is `text-muted` (`menu-item.css:103`).

**Root cause** `heroui/styles/components/list-box-item.css:76-77`
(`.list-box-item__indicator { text-default-foreground }`, 10px `size-2.5` checkmark inside a
16px box) and `menu-item.css:102-103` (`text-muted`).

**Fix** In each of the four tinted popovers, the indicator takes `--accent-soft-foreground`:
`select.css`, `combo-box.css`, `autocomplete.css` →
`… [data-slot="list-box-item"]:not(.list-box-item--danger) .list-box-item__indicator` (0,5,0);
`dropdown.css` →
`… [data-slot="menu-item"]:not(.menu-item--danger) .menu-item__indicator:not(.menu-item__indicator--submenu)`
(0,6,0).

**Why those exclusions** the danger variant's indicator colour is (0,2,0) and is the point of
that variant. The submenu chevron shares the `.menu-item__indicator` class
(`menu-item.styles.ts:12`) but is not a selection mark and is not in this brief, so it is
excluded and keeps `text-muted` — it is still the `--muted`-on-tint case QA "collections #10"
raised, now the only one left on the panel.

**After** `after-04b-select-sel-tz.png` — `rgb(51,51,51)` → `rgb(27,45,88)`.
Dark: `after-04c-dd-multi-tzd.png` — `--muted` grey → `rgb(169,194,234)`, probed.

---

## 5 · [HIGH] Autocomplete multi-select — tags overran the affix column

**Reproduction** `qa-shot.cjs tzuchi components-pickers-autocomplete--email-recipients out.png
key:Tab key:Enter wait:400 key:ArrowDown key:Enter wait:200 key:ArrowDown key:Enter key:Escape
clip:.autocomplete__trigger` → `before-05-auto-email-tz.png`. Probed: trigger content box
162px, `.autocomplete__value` **210.7px** — the value box is wider than the box that contains
it. On screen: the chevron is squeezed between the two tag rows, the clear ✕ sits on the
trigger's border.

**Root cause** `heroui/styles/components/autocomplete.css:104` — `.autocomplete__value` is
`flex-1`, and a flex item's *automatic minimum size* is its min-content width, so it refuses
to shrink below the widest tag and overflows the padding box instead. Nothing in
`themes/tzuchi/components/autocomplete.css` relaxed it, and the theme's 32px / 60px inset
(`autocomplete.css:232`, `:246-250`) plus the Tag's 16px type left only 162px.

**Fix** (`autocomplete.css`)
* `.autocomplete__value { min-inline-size: 0 }` — removes the automatic minimum, so the value
  box is bounded by the content box.
* `.autocomplete__trigger [data-slot="tag-group"] , … [data-slot="tag-group-list"]
  { min-inline-size: 0; max-inline-size: 100% }` — the list is `flex flex-wrap`
  (`tag-group.css:7`), so once it can no longer push outward it wraps on its own.
* `.autocomplete__trigger [data-slot="tag-group-list"] > * { max-inline-size: 100%;
  overflow-wrap: anywhere }` — the last resort for a tag whose text has no soft wrap
  opportunity at all (an e-mail address): it wraps inside its own pill instead of escaping
  the field.

Every rule is scoped inside `.autocomplete__trigger`, so the TagGroup component and every
TagGroup rendered elsewhere are untouched (`tag.css` belongs to another unit).

**Verified with 1, 2 and 5 tags, both themes**
`after-05-auto-email-2tags-tz.png` (2, light — value 142px, inside the box),
`after-05-auto-email-1tag-tzd.png` (1, dark),
`after-05b-auto-multi5-tzd.png` + `try-05b-auto-multi5-tz.png` (5, dark and light).
In every one the tags stay inside the content box and the chevron and clear ✕ keep their own
column.

**Residual, stated plainly** a tag whose text is wider than the 142px column now breaks
mid-word inside its pill (`Pennsylvani / a`, `charlie@exa / mple.com`) where before it
escaped the field. Containment was the brief; the mid-word break is the price. The real
cause is that a 16px/700 pill needs more room than a 256px field with a 32px inset and a
60px affix reserve can give: 142px of column against ~156px for `Pennsylvania ✕` and ~190px
for `charlie@example.com ✕`. Moving the clear button out of flow does **not** buy anything —
it costs the same 20px whether it sits at the end of the content box or inside a reserve
widened to hold it (arithmetic, not rendered). The three levers that would are the
trigger's 32px inset, the 60px reserve and the Tag's type, and all three are settled
decisions or another unit's file.

---

## 6 · Select / Autocomplete — a long value wrapped and grew the trigger

**Reproduction** `qa-shot.cjs tzuchi components-pickers-select--disabled out.png full` →
`before-06-select-multivalue-tz.png`: `Argentina、Japan和France` on two lines, that field
taller than the `State` field above it.

**Root cause** `heroui/styles/components/select.css:115` (`wrap-break-word`) against the
theme's 162px content column at 16px/700.

**Fix** `select.css` — `.select__value` gets `min-inline-size: 0; overflow: hidden;
text-overflow: ellipsis; white-space: nowrap` (0,2,0 over the base's 0,1,0).
`min-inline-size: 0` is what makes the ellipsis reachable at all, for the same flex reason as
§5. `autocomplete.css` — the same four declarations on
`.autocomplete__value:not(:has([data-slot="tag-group"]))` (0,3,0), so the TEXT value
ellipsizes while the TagGroup case is left free to wrap; `min-inline-size: 0` is declared on
the unconditional (0,2,0) rule because the tag case needs it too.

**After** `after-06-select-multivalue-tz.png` — both fields 43.59px, one line,
`Argentina、Japan…`. Checked that the custom-render values still behave:
`check-06b-select-customvalue-sel-tz.png` (avatar + name, nothing clipped) and
`check-06c-select-customvaluemulti-tz.png` (the story's own chips still wrap, nothing
overflows).

---

## 7 · Clear button — a 12×14px pale glyph beside a 20px navy chevron

**Reproduction** `qa-shot.cjs tzuchi components-pickers-select--with-clear-button out.png
probe:[data-slot="select-clear-button-icon"] clip:.select__trigger` →
`before-07-select-clear-tz.png`, probed **12 × 14px**, `rgb(130,130,130)`.

**Root cause** `heroui/styles/components/select.css:129` gives the button `size-5` (20px)
with `p-1` (4px) and `:153-155` gives the icon `size-3.5` (14px) — a 14px flex item in a 12px
content box, squeezed on the inline axis only. That is where the non-square 12 × 14 comes
from. `themes/tzuchi/components/select.css` left the button alone (`select.css:65-68`).

**Fix** `select.css` and `autocomplete.css` — `color: inherit` and
`padding-block/padding-inline: 0` on the button (0,2,0), `inline-size / block-size: 16px`
(`var(--tc-space-16, 16px)`) on its icon (0,3,0). The padding has to go or the glyph is
squeezed again at any size; at 0 the 16px glyph sits centred in the 20px box with 2px of
slack, and the button's `::after` still holds the WCAG 2.5.8 24px pointer target.

**After** `after-07-select-clear-tz.png` — 16 × 16px, `rgb(27,45,88)`, a matched pair with the
chevron. Dark: `check-08-auto-clear-tzd.png` (probed, and the `[data-empty]` fade still works
— opacity 0 when there is nothing to clear).

---

## 8 · Select / Autocomplete trigger missed the field floor by 1.6px

**Reproduction** `probe:.select__trigger` on `components-pickers-select--default` →
**42px**, against the themed Input / SearchField's **43.59px**.

**Root cause** the trigger's box is `8 + 24 + 8 + 2 = 42px` — a control label takes the 1.5
line box (`themes/tzuchi/components/select.css:155-157`) while a field's text takes the 1.6
prose one. HeroUI's `min-h-9` (36px) never binds.

**Fix** `select.css` §1 and `autocomplete.css` §1 —
`min-block-size: calc(var(--tc-font-size-16, 16px) * var(--tc-line-height-relaxed, 1.6) + 2 *
var(--tc-space-8, 8px) + 2 * var(--field-border-width, 1px))`, character for character the
expression `themes/tzuchi/components/search-field.css:121-125` already uses. (0,2,0) over the
base's (0,1,0); `min-block-size` and the base's `min-height` cascade together, so specificity
decides.

**After** probed 43.5938px on `select--default`, `select--disabled` (both fields),
`select--variants` (the secondary variant too, `check-03-select-variants-tz.png`) and
`autocomplete--with-clear-button` in dark (`check-08-auto-clear-tzd.png`).

---

## 9 · The Autocomplete popover's SearchField was a grey box on the brand panel

**Reproduction** `qa-shot.cjs tzuchi-dark components-pickers-autocomplete--default out.png
key:Tab key:Enter wait:500 key:ArrowDown probe:.search-field__group clip:.autocomplete__popover`
→ `before-09b-auto-search-tzd.png`, probed `rgb(51,51,51)` on the navy panel; light
(`before-09-auto-search-tz.png`) `rgb(242,242,242)`, *lighter* than the `--accent-soft` panel.

**Root cause** `heroui/styles/components/search-field.css:148-152` — the `secondary` variant
the stories use declares `--search-field-group-bg: var(--default)` and reads it back. The
theme never re-pointed it.

**Fix** `autocomplete.css` §9 — inside `.autocomplete__popover`, re-declare the variant's own
three knobs (`--search-field-group-bg`, `-hover`, `-focus`) as `var(--field-background)` and
set `background-color: var(--field-background)` for the `primary` case (0,3,0 over the
variant's 0,2,0). Re-pointing the variables re-points the variant's own rules at whatever
specificity they are written, instead of fighting hover and focus-within one by one.

**Deliberately not restated** the 1px `--field-border` edge and the `--field-border-focus` it
takes on focus: they are already correct, and restating them at (0,3,0) here would out-rank
`search-field.css`'s own hover (0,3,0) and focus (0,3,0) rules and kill the border feedback.
The brief's "1px --field-border edge (focus: --field-border-focus)" is therefore satisfied by
what is already there — probed `border-top-color rgb(169,194,234)` (`--field-border-focus`) on
the focused field, `rgb(189,189,189)` / `rgb(107,107,110)` (`--field-border`) at rest.

**After** `after-09-auto-search-tz.png` (light, `rgb(255,255,255)`),
`after-09b-auto-search-tzd.png` (dark, `rgb(28,28,30)`) — a field sitting on the panel.

---

## 10 · Kbd shouted louder than the command it annotates

**Reproduction** `qa-shot.cjs tzuchi-dark components-collections-dropdown--with-keyboard-shortcuts
out.png key:Tab key:Enter wait:500 probe:.kbd clip:.dropdown__popover` →
`before-10-dd-kbd-tzd.png`, probed 16px / **700** / `rgb(242,242,242)` against a label at
16px/700 `rgb(169,194,234)`: the shortcut was pure white and the command name mid-blue, so
`⌘N` read louder than `New`.

**Root cause** `themes/tzuchi/components/kbd.css:84` (`--tc-font-weight-bold`) and `:77`
(`color: var(--default-foreground)`), against a base `.kbd` that is `font-medium text-muted`
(`heroui/styles/components/kbd.css:3`).

**Fix** `kbd.css` — `font-weight: var(--tc-font-weight-medium, 500)` everywhere (HeroUI's own
weight), plus a new (0,3,0) rule
`[data-theme^="tzuchi"] .menu-item .kbd, [data-theme^="tzuchi"] .list-box-item .kbd
{ color: inherit; font-weight: var(--tc-font-weight-regular, 400) }`.
`color: inherit` is what makes it right in every host at once: `--foreground` on a bare row,
`--accent-soft-foreground` on a tinted panel, and the dimmed value on a disabled row.

**After** `after-10c-dd-kbd-tzd.png` — 400 / `rgb(169,194,234)`, i.e. the row's own colour,
so `New` now reads louder than `⌘N`. Also `after-02-lb-sections-tz.png` and
`after-11-dd-sections-tz.png` (probed 400,
`rgb(51,51,51)` / navy — the row's own colour), `check-01-lb-sections-tzd.png` (dark, 400,
`rgb(242,242,242)` = the row's colour), `after-10-kbd-tz.png` and
`after-10b-kbd-inline-tz.png` (standalone Kbd stories at 500 — the `light` and filled
variants both keep their fills).

---

## 11 · Section separators inside the tinted panels

**Reproduction** `before-11-dd-sections-tz.png` (Dropdown, 255.31px inside a 271.61px panel,
`rgb(189,189,189)`), `before-11b-select-sections-tz.png` (Select, 240.63px inside 256px).

**Root cause** `heroui/styles/components/list-box.css:22-24` and `dropdown.css:128-130`
(`ms-[3%] w-[94%]`) — right while rows are HeroUI's inset pills, wrong once the theme made
them full bleed.

**Fix** In each of the four popovers:
`margin-inline: 0; inline-size: 100%;
background-color: color-mix(in oklab, var(--accent-soft-foreground) 20%, transparent)`.
`dropdown.css` at (0,3,0) over the base's `.dropdown__menu [data-slot="separator"]` (0,2,0);
`select.css` / `combo-box.css` / `autocomplete.css` at (0,4,0) over the base's
`.list-box [data-slot="separator"][data-orientation="horizontal"]` (0,3,0). Logical
properties, so the `ms-` margin is replaced on the correct axis in both writing directions.

**After** `after-11-dd-sections-tz.png` (270.89px = the full panel),
`after-11b-select-sections-tz.png` (256px), `check-05-combo-sections-tzd.png` (dark,
`oklab(0.808998 -0.0111938 -0.0620427 / 0.2)`), `check-04-auto-sections-tz.png`.
A bare ListBox / Menu keeps HeroUI's 94% rule, as the brief scopes this to the tinted panels.

---

## 12 · Virtualized lists — NOT fixable in CSS. Row heights for the integrator

Nothing was changed. The stories pin `layoutOptions={{ rowHeight: 50 }}`
(`list-box.stories.tsx`, `autocomplete.stories.tsx:1293`). Measured under the pass-5 theme
(`after-12-lb-virt-tz.png`, `after-12b-auto-virt-tz.png`, probe `.list-box-item`):

| row | Tzu Chi theme (after pass 5) | arithmetic | where measured |
|---|---|---|---|
| one line (label only) | **40px** | 8 + 24 (16px × 1.5) + 8 | `select--with-sections` popover row |
| two lines (Label + Description) | **65.59px** | 8 + 24 + 25.59 (16px × 1.6) + 8 | `listbox--virtualization`, `autocomplete--virtualization` |
| three lines (description wraps) | **91.19px** | 8 + 24 + 2 × 25.59 + 8 | `listbox--default` at a 28px end inset |

(The pass-4 QA measured HeroUI's own two-line row at 48px, which is what the stories'
`rowHeight: 50` was tuned for.)

A virtualized list under this theme must be given `rowHeight: 40` for label-only rows and
`rowHeight: 66` for a label-plus-description row (and must not let the description wrap, or
budget 92). Pass 5 did not change any of these numbers — it changes the inline inset, not the
block box — but a **narrower** list is now less likely to wrap a description, because the text
column grew by 24px on a bare list.

---

## Cross-checks run (nothing broken)

* Dropdown, both themes: `--with-sections`, `--with-descriptions`, `--with-submenus`,
  `--with-multiple-selection` — rows and headers still 32px, danger label still `--danger`,
  disabled rows still dimmed, the inset focus ring from pass 4 intact.
* Select: `--default`, `--variants` (primary + secondary), `--with-sections`,
  `--with-clear-button`, `--custom-value`, `--custom-value-multiple`,
  `--asynchronous-loading`, `--multiple-select`, `--disabled`.
* Autocomplete: `--default`, `--with-sections`, `--with-clear-button`, `--multiple-select`,
  `--tag-group-selection`, `--email-recipients`, `--virtualization`.
* ComboBox: `--default`, `--with-sections` (dark).
* ListBox: `--default`, `--with-sections`, `--multi-select`, `--custom-check-icon`,
  `--virtualization`.
* Kbd: `--default`, `--key-combinations`, `--inline-usage`.
* All nine files injected together on `select--with-sections` (light) and
  `listbox--default` (dark): `final-all-select-tz.png`, `final-all-lb-tzd.png` — no
  cross-file conflict.
* Mechanical: comment-marker counts balanced in all nine files; no `!important`, no colour
  literal, no `--tc-color-*`, no physical `margin/padding/border-left|right`, and no
  top-level selector without `[data-theme^="tzuchi"]` outside comments.

## Could not verify

* **Standalone `<Menu>`** has no story (`menuVariants` is exported but Dropdown renders
  `.dropdown__menu`), so `menu-item.css`'s new state fills and 20px inset are verified only
  through the Dropdown, where the popover rules out-rank them. The same gap the pass-3 note
  in `menu.css` records.
* **Touch / no-hover devices**: the `@media (hover: hover)` branches were reasoned about, not
  rendered — the tool runs a hover-capable Chrome.
* **RTL**: every new declaration is logical, but no RTL story exists to render.
