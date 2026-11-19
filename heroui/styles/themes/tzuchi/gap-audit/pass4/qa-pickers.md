# Visual QA — Pickers family (Select, ComboBox, Autocomplete)

Themes: `tzuchi` and `tzuchi-dark`, compared against upstream `light` / `dark`.
Build: `heroui/storybook/storybook-static`. Tool: `tools/qa-shot.cjs`.
Screenshots: `shots/pickers/` (≈150 PNGs, all opened and looked at).

---

## What I covered

**Select** (`components-pickers-select--…`)
`default` (closed / open / keyboard-navigated), `variants` (primary + secondary, closed and
open), `with-sections`, `with-disabled-options` (+ hover), `multiple-select` (two items chosen),
`with-clear-button` (+ clear-button hover), `custom-indicator`, `custom-value-multiple`,
`with-description`, `required` (+ real form submit → invalid), `asynchronous-loading`,
`controlled-open-state`, `disabled`, `full-width`.

**ComboBox** (`components-pickers-combobox--…`)
`default` (closed / focused / typed / open), `default-selected-key`, `with-sections`,
`with-disabled-options`, `with-description`, `required` (+ submit), `custom-indicator`,
`menu-trigger`, `allows-custom-value`, `multiple-selection`, `multiple-selection-with-tags`,
`asynchronous-loading` (empty → loading → "Loading more…"), `full-width`, `disabled`.

**Autocomplete** (`components-pickers-autocomplete--…`)
`default` (closed / open / popover search field), `variants`, `with-clear-button`,
`with-on-clear-callback`, `with-description`, `with-sections`, `with-disabled-options`
(+ keyboard nav), `multiple-select`, `required` (+ submit), `asynchronous-filtering`
(loading / results / "No results found"), `virtualization`, `location-search`,
`email-recipients`, `tag-group-selection`, `controlled-open-state`, `full-width`, `disabled`.

Every finding below was re-rendered in upstream `light`/`dark` before being written down.

---

## Findings

### 1. HIGH — Autocomplete multi-select: tags overrun the affix gutter; clear ✕ and chevron end up on top of / outside the field

Both themes. Stories `--email-recipients`, `--multiple-select`, `--tag-group-selection`.

Repro: `qa-shot.cjs tzuchi components-pickers-autocomplete--email-recipients out.png
key:Tab key:Enter wait:400 key:ArrowDown key:Enter wait:200 key:ArrowDown key:Enter key:Escape
wait:400 clip:.autocomplete__trigger`

What you see (`shots/pickers/139-auto-email-clip-tz.png`, dark `140-…-tzd.png`, full page `112-…`):

* The two recipient tags stack one per line and the trigger grows to **94px**.
* `charlie@example.com ✕` runs **past the 60px end padding**, i.e. straight into the column the
  chevron and clear button live in.
* The chevron is squeezed into the 8px gap *between* the two tag rows and overlaps them.
* The field's own clear `×` is pushed to the trigger's right **border**, half outside the field,
  detached from everything.

Upstream `light` (`114-auto-email-open-UP.png`): both tags fit on one 38px line and the `×` +
chevron sit in a clean reserved column. Nothing overlaps.

Cause: `themes/tzuchi/components/autocomplete.css` gives `.autocomplete__trigger` the Select
geometry (`padding-inline: 32px`, `padding-inline-end: 60px`, 16px/700 type — probed:
`padding-left 32px / padding-right 60px / height 94px`), leaving only **162px** of content width,
while `themes/tzuchi/components/tag.css` grew each Tag from HeroUI's ~20px/12px pill to
**34px tall with 16px type** (probed `[data-slot="tag"]` → `height 34px, font-size 16px`), so
`TypeScript ✕` alone is **124px**. Two tags no longer fit, and the tag group has no
`max-width`/`min-width: 0` to keep it inside the padding box.

Suggested fix: give the tag list inside `.autocomplete__trigger` / `.combo-box` a
`min-width: 0; max-width: 100%` and let the trigger's affix column be a real flex sibling rather
than an absolutely-positioned overlay — or reduce the trigger's 60px end reserve when the value
slot renders a TagGroup.

---

### 2. HIGH — Virtualized option rows overlap; the row edge is drawn through the next row's label

Both themes. Story `components-pickers-autocomplete--virtualization`.

Repro: `qa-shot.cjs tzuchi components-pickers-autocomplete--virtualization out.png
key:Tab key:Enter wait:700 clip:[data-slot="list-box"]`

What you see (`shots/pickers/110-auto-virt-probe-tz.png`, dark `98-auto-virt-tzd.png`):
the focused "Emma Smith" row's fill and bottom edge extend down over the next row, and a solid
navy line is drawn **straight through the "Liam Smith" label** — it reads as a strikethrough.

Upstream `light` (`109-auto-virt-UP.png`) and `dark`: rows are cleanly separated, nothing overlaps.

Cause: the story pins the virtualizer to `rowHeight: 50`
(`heroui/react/src/components/autocomplete/autocomplete.stories.tsx:1293`). Probed row height is
**65.59px in tzuchi vs 48px upstream** — `themes/tzuchi/components/list-box-item.css:56` sets
`padding-block: 8px` (base was `py-1.5` = 6px) and `:63-64` sets `16px / line-height 1.5`
(base `14px/20px`). A two-line item (Label + Description) therefore exceeds its virtual slot by
~16px and every row overlaps the one below it.

This is not a story-utility-class artifact: any virtualized list tuned for HeroUI's 48px row
will break the same way under this theme.

Suggested fix: the theme needs a documented row height for list-box items (e.g. a
`--list-box-item-height` the theme raises) that consumers can feed to `ListLayout`, or the theme's
row padding/type has to keep the row at or below HeroUI's 48px baseline.

---

### 3. MEDIUM — A multi-value Select wraps to two lines and doubles in height

Both themes. Story `components-pickers-select--disabled` (and `--custom-value-multiple`).

Repro: `qa-shot.cjs tzuchi components-pickers-select--disabled out.png full`

`shots/pickers/17-select-disabled-tz.png`: the second field's value
`Argentina、Japan和France` wraps onto a second line, the trigger grows to two lines, and it no
longer matches the single-line "State" field directly above it.

Upstream `light` (`25-select-disabled-UP.png`): the identical string fits on one line in the same
256px field.

Cause: `.select__value` is `wrap-break-word` in the base CSS
(`heroui/styles/components/select.css:115`), and
`themes/tzuchi/components/select.css:113-127` + `:135-139` cut the content width from
256−12−28−2 = **214px** to 256−32−60−2 = **162px** while raising the type from 14px/400 to
16px/700. Any value longer than ~2 words now wraps.

Suggested fix: either truncate (`text-overflow: ellipsis; white-space: nowrap; overflow: hidden`)
on `.select__value` under the theme, or pull the Select trigger's 32/60px inset back toward the
themed Input's 20px so the value has room.

---

### 4. MEDIUM — Clear button and chevron are a mismatched pair inside the same field

Both themes. Stories `select--with-clear-button`, `autocomplete--with-clear-button`,
`autocomplete--email-recipients`.

Repro: `qa-shot.cjs tzuchi components-pickers-select--with-clear-button out.png clip:.select__trigger`

`shots/pickers/55-select-clear-clip-tz.png` vs upstream `56-select-clear-clip-UP.png`:

| | tzuchi | upstream |
|---|---|---|
| chevron | 20px, `rgb(27,45,88)` brand navy | 16px, muted grey |
| clear `×` glyph | **12 × 14px**, `rgb(130,130,130)` | 14px, muted grey |

Upstream reads as one matched pair of affordances. In Tzu Chi the chevron is a heavy brand-navy
glyph and the `×` is a pale hairline a third smaller, sitting 27px away from it in the middle of
the field rather than at its edge. Inside the *same* Autocomplete the tag remove `✕` is a third
size again — probed 20px, near-black (`139-auto-email-clip-tz.png`): three "remove/dismiss"
glyphs at three sizes and three colours in one control.

Cause: `themes/tzuchi/components/select.css:192-195` scales only
`[data-slot="select-default-indicator"]` to 20px and `:176-180` recolours it to `inherit`
(→ `--accent`), while the file explicitly leaves `.select__clear-button` untouched
(`select.css:65-68`), so it keeps base `size-3.5` + `text-muted`
(`heroui/styles/components/select.css:129,153-155`).

Suggested fix: size the clear icon to `--tc-size-icon-sm` too (or at least 16px) and give it the
same rest colour as the chevron.

---

### 5. MEDIUM — ComboBox does not match its two siblings, and its typed text does not line up with its own option list

Both themes. Stories `combobox--default`, `combobox--default-selected-key` vs
`select--default`, `select--with-clear-button`.

Repro: `qa-shot.cjs tzuchi components-pickers-combobox--default out.png key:Tab key:ArrowDown wait:400 full`

Probed side by side, same theme, same family:

| | Select / Autocomplete trigger | ComboBox input |
|---|---|---|
| height | 42px | 43.59px |
| padding-left | 32px | 20px |
| padding-right | 60px | 48px |
| value weight | 700 | 400 |
| value colour | `rgb(27,45,88)` navy | `rgb(51,51,51)` grey |
| chevron colour | navy | `rgb(130,130,130)` grey |

`shots/pickers/129-combo-selkey2-tz.png` ("Cat") vs `55-select-clear-clip-tz.png` ("California"):
two controls that do the same job and open the same panel look like they come from different
kits, and they do not line up or share a height when placed in one form.

Worse, inside the ComboBox itself (`35-combo-open-tz.png`): the text you type sits **20px** in at
weight 400, while the filtered options right beneath it sit **32px** in at weight 700 — a 12px
jog and a weight change between a query and its results.

Upstream: all three triggers share the same padding, size, weight and colour.

This one is deliberate — `themes/tzuchi/components/combo-box.css:9-19` routes the ComboBox shell
to the Input (DESIGN-LANGUAGE §3.4 / §11 I3, "FOLLOW 20px") while the popover keeps the Select
panel's 32px rows. I'm reporting it because the result is visibly inconsistent on screen, not
because the rule is wrong; the decision may simply need to be revisited for the 32px option inset
or for the ComboBox shell.

---

### 6. MEDIUM — Hover, keyboard cursor and selected paint the identical fill, so the three states cannot be told apart

Both themes. Any open picker; clearest in `select--with-disabled-options` and
`autocomplete--multiple-select`.

Repro: `qa-shot.cjs tzuchi components-pickers-select--with-disabled-options out.png
key:Tab key:Enter wait:400 "hover:[data-key='bird']" wait:300 clip:.select__popover`

`shots/pickers/125-select-opthover-tz.png`: "Dog" (keyboard cursor) and "Bird" (mouse hover) are
painted the same `--accent-soft-hover` blue — two rows both look current at once.
`71-auto-multi-tz.png`: "Texas" (selected) and "Florida" (selected **and** focused) are likewise
identical fills.

Upstream `light` (`160-select-opthover-UP.png`): the keyboard cursor is a blue ring with **no**
fill, hover is a grey fill with **no** ring, selection is the checkmark — three unmistakable
states.

Cause: `themes/tzuchi/components/select.css:279-293` (and the mirror in `combo-box.css:216-230`,
`autocomplete.css`) assigns `background-color: var(--accent-soft-hover)` to `:hover`,
`[data-hovered]`, `[data-focused]`, `[data-selected]` and `[aria-selected]` alike. The only
remaining differentiator is the focus ring, which is the known clipped one.

Suggested fix: keep the brand fill for *selected*, and give hover and the keyboard cursor two
distinguishable treatments (e.g. a lighter tint for hover, the ring alone for the cursor).

---

### 7. MEDIUM — The Autocomplete popover's search field is a neutral grey box sitting on the brand panel

Both themes; worse in dark. Every Autocomplete story with an open popover.

Repro: `qa-shot.cjs tzuchi-dark components-pickers-autocomplete--default out.png
key:Tab key:Enter wait:500 clip:.autocomplete__popover`

`shots/pickers/86-auto-search-clip-tz.png` / `87-auto-search-clip-tzd.png`: the SearchField group
is `rgb(242,242,242)` on an `rgb(232,238,254)` panel in light — a warm grey rectangle that is
*lighter* than the tinted panel it sits on — and a mid-grey box on the navy panel in dark. Every
other element on that panel (rows, labels, headers, fills) has been moved onto the brand ramp;
this one thing has not, so it reads as an un-themed remnant.

Upstream `light`/`dark` (`84-…`, `85-…`) shows the same grey field, but there it sits on a plain
white / near-black panel where a neutral grey is the right answer — `upstreamHasItToo = true`,
but the tinted Tzu Chi panel makes it look wrong.

Cause: `themes/tzuchi/components/autocomplete.css` themes the popover surface to `--accent-soft`
but nothing re-points the nested `.search-field__group` (variant `secondary` → `--default`,
`heroui/styles/components/search-field.css`) at a brand-tinted surface.

Suggested fix: inside `.autocomplete__popover`, give the nested SearchField a surface derived from
the panel (e.g. `--accent-soft` with the accent border, or the field background) instead of
`--default`.

---

### 8. LOW — The Select's label, value and description sit on three different left edges

Both themes. `select--with-description`, `autocomplete--with-description`.

Repro: `qa-shot.cjs tzuchi components-pickers-select--with-description out.png clip:.select`

`shots/pickers/155-select-desc-clip-tz.png`: "State" and "Select your state of residence" are
flush with the field's outer edge; the placeholder "Select one" starts **33px** further right.
The stack's left edge is visibly ragged. Upstream's inset is 13px, which reads as aligned.

Cause: `themes/tzuchi/components/select.css:113-114` (`padding-inline: 32px`) is lifted from
`packages/components/src/dropdown/tc-dropdown.styles.ts:24`, but `tc-dropdown` has **no external
label** — the label lives inside the trigger — so the Figma value was never designed against a
label above the field.

Suggested fix: either bring the Select trigger's inset toward the themed Input's 20px (what the
ComboBox already does) or indent `[data-slot="label"]` / `[data-slot="description"]` to match.

---

### 9. LOW — Section separators in the option panel are inset 8px while everything else is inset 32px

Both themes. `select--with-sections`, `combobox--with-sections`, `autocomplete--with-sections`.

Repro: `qa-shot.cjs tzuchi components-pickers-select--with-sections out.png
key:Tab key:Enter wait:500 clip:.select__popover`

`shots/pickers/159-select-sections-sep-tz.png` (dark `158-…`): the rules above "Europe" and "Asia"
start 8px from the panel edge, while the section headers and option labels start 32px in and the
row fills run edge to edge. Three different left edges in one panel. Upstream's equivalent gap is
6px vs 16px, so the mismatch is much less obvious there.

Cause: the separator inherits the list-box's inline padding, which
`themes/tzuchi/components/select.css:251-254` sets to `0` while
`:258-260` puts the 32px inset on the item, not on the section.

---

### 10. LOW — Select `secondary` becomes indistinguishable from `primary` once it is open

Both themes. `select--variants`.

Repro: `qa-shot.cjs tzuchi components-pickers-select--variants out.png key:Tab key:Tab key:Enter wait:400 full`

`shots/pickers/117-select-sec-open-tz.png`: closed, the two variants are clearly different (white
outlined vs grey filled — `7-select-variants-tz.png`). Open, the secondary variant takes the same
`--accent-soft-hover` fill + `--accent` border as the primary and the two are identical.

Cause: `themes/tzuchi/components/select.css:150-156` — the open-state rule is written explicitly to
outrank `.select--secondary`'s own fill. It is an intentional trade-off; noting it only because
two adjacent fields of different variants look the same while open.

---

## Checked and found FINE

* **Closed default triggers**, both themes, all three components: correct 8px radius, 1px border,
  single-line, chevron centred, no clipping (`01`, `02`, `33`, `34`, `60`, `61`).
* **Select variants** closed, single and multiple (`7`, `8`, `64`, `65`) — primary/secondary clearly
  distinct, both sizes consistent.
* **Trigger hover** on Select: border moves to `--field-border-hover` blue, clearly different from
  rest and from the open fill (`103`).
* **Open trigger state** (accent fill + accent border + rotated chevron) is unmistakable and
  matches `tc-dropdown`'s Figma "Expanded=True" in both themes (`03`, `04`).
* **Popover surface, radius, shadow and text colour** in both themes — the 8px radius, the
  `--accent-soft` panel and `--accent-soft-foreground` rows all resolve correctly; dark theme's
  navy panel is clearly separated from the near-black page (`03`/`04`, `35`/`36`, `62`/`63`).
* **Popover max-height / positioning**: the long-list popovers are correctly constrained
  (probed 576px in a 700px viewport for `select--with-sections`) and never escape the viewport;
  overflow scrolling works, no stray scrollbars (`53`, `54`, `146`).
* **Disabled options**: `Cat` / `Kangaroo` are unambiguously dimmed against their enabled
  neighbours in both themes, and the keyboard cursor skips them (`11`, `12`, `92`, `93`).
* **Disabled fields**: label, value and chevron all dim together at 0.38 in both themes (`17`,
  `18`, `47`, `48`, `76`).
* **Invalid state**, driven by a real form submit: danger border survives, label turns danger, the
  field-error message renders below in danger, and the danger edge is *not* lost to the focus or
  hover rules — all three components (`119`, `120`, `121`, `122`, `123`).
* **Selected-item checkmarks** in multi-select lists render at the right size and alignment and are
  not clipped (`13`, `14`, `71`, `112`).
* **Async states**: Select/ComboBox/Autocomplete "Loading more…" row with its spinner, "Searching…",
  and "No results found" all render correctly in both themes (`134`, `137`, `146`, `147`, `74`, `144`).
* **Clear-button hover** shows its grey circle backing and is a clear affordance (`124`).
* **ComboBox `multiple-selection-with-tags`** (tags rendered *below* the field, not inside it) is
  laid out correctly in both themes — it is only the *inside-the-trigger* tag case that breaks
  (`42`, `43`).
* **Full-width, controlled-open, menu-trigger, custom-value, custom-indicator** variants all render
  as expected, and `custom-indicator` correctly keeps the story's own icon size (`23`, `24`, `96`,
  `99`, `100`, `107`, `108`, `131`, `132`, `133`).
* **Dark theme edges**: no vanished borders or dividers — trigger border, popover panel, option
  separators and the selected-row fill all stay visible against the near-black page (`02`, `08`,
  `10`, `12`, `14`, `18`, `34`, `48`, `63`, `69`, `87`, `93`, `98`, `102`, `113`, `116`, `126`,
  `135`, `147`, `154`, `158`).

## Not reported (per the exclusion list)

Muted-text contrast on the tinted panel; the clipped edge-to-edge option focus ring; the 2px
focus ring on fields; 12px list section headers; story-supplied utility classes; the React Scan
toolbar.
