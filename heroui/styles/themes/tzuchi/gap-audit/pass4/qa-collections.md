# Visual QA — family "collections" (Dropdown · ListBox · TagGroup · Menu-like)

Themes looked at: `tzuchi`, `tzuchi-dark`; every suspected defect re-rendered in upstream
`light` / `dark` before it was written down.
Screenshots: `(session screenshot, not kept) shots/collections/` (154 PNGs, all opened and looked at).

## Stories covered

**Dropdown** — `--default`, `--with-single-selection`, `--with-multiple-selection`,
`--with-section-level-selection`, `--with-sections`, `--with-icons`, `--with-descriptions`,
`--with-keyboard-shortcuts`, `--with-disabled-items`, `--with-submenus`,
`--with-custom-submenu-indicator`, `--single-with-custom-indicator`, `--controlled`,
`--controlled-open-state`, `--custom-trigger`, `--long-press-trigger`
(opened by click and by `Tab`+`Enter`; driven with `ArrowDown` / `ArrowUp` / `ArrowRight`
for keyboard cursor, submenu opening, and with real mouse hover).

**ListBox** — `--default`, `--with-sections`, `--multi-select`, `--with-disabled-items`,
`--custom-check-icon`, `--controlled`, `--virtualization`
(plus `Tab` / `Space` / `ArrowDown` for focus + selection and real mouse hover).

**TagGroup** — `--default`, `--sizes`, `--variants`, `--selection-modes`, `--with-remove-button`,
`--with-prefix`, `--with-error-message`, `--with-list-data`, `--disabled`, `--controlled`
(keyboard focus, `Space` to select, `ArrowRight` to move the cursor off the selected pill,
hover on the remove button).

**Menu-like / tags in a field** — `components-pickers-combobox--multiple-selection-with-tags`,
`components-pickers-autocomplete--tag-group-selection`.

---

## Findings

### 1 · HIGH — ListBox option rows outgrow their box; descriptions are sliced mid-glyph

`components-collections-listbox--default`, both Tzu Chi themes.
`shots/collections/lb-default-tz.png`, `lb-default-tzd.png` — upstream: `lb-default-light.png`.

Third row reads **`martha@heroui.cor`** — the final `m` is cut in half by the list box's
`overflow-clip`, with no ellipsis and no wrap (the address is one unbreakable word).

Measured (`probe`), same story, same 220px ListBox:

| | upstream light | tzuchi |
|---|---|---|
| `.list-box-item` padding-inline | 8px / 28px | **32px / 32px** |
| `.description` font-size | 12px | **16px** |
| row height | 48px | **65.6px** |

32px + 32px + a 32px avatar + a 12px gap leaves ~112px of text column inside a 220px list;
`martha@heroui.com` at 16px needs ~148px.

Cause: `heroui/styles/themes/tzuchi/components/list-box-item.css:5-7` (padding-inline 32px)
together with `heroui/styles/themes/tzuchi/components/description.css:5` (16px), clipped by
`heroui/styles/components/list-box.css:6` (`overflow-clip`).
Upstream does not do this.

---

### 2 · HIGH — ListBox "With Sections" collapses: every row wraps to two or three lines

`components-collections-listbox--with-sections`, both Tzu Chi themes.
`shots/collections/lb-sections-tz-full.png`, `lb-sections-tzd-full.png` —
upstream: `lb-sections-light-full.png`.

In upstream each row is one tidy line of label over one line of description. In tzuchi:
`Create a new file` → `Create a` / `new file`; `Make changes` → `Make` / `changes`;
the **label itself** breaks — `Delete file` → `Delete` / `file`; `Move to trash` → `Move to` / `trash`.
The card grows from ~440px to ~730px tall and the leading icon ends up stranded in the middle
of the text block instead of beside the label.

Same cause as #1: the 32px inline inset takes 64px out of a 256px Surface, and the 16px
description needs the width the inset removed.

---

### 3 · HIGH — Virtualized ListBox: rows overflow their fixed slot; the bottom row is cut in half

`components-collections-listbox--virtualization`, both Tzu Chi themes.
`shots/collections/lb-virt-tz.png`, `lb-virt-tz-clip.png`, `lb-virt-tzd.png` —
upstream: `lb-virt-light.png`.

The story declares `layoutOptions={{rowHeight: 50}}`. Upstream's row is **48px** and fits.
The Tzu Chi row measures **65.59px** (`probe:.list-box-item`), so every row overflows its slot
by ~15.6px: the rows lose all separation (one row's email sits flush against the next row's
name — compare the clear gaps upstream) and the last visible row's email is sliced
horizontally through the middle by the 400px viewport.

Cause: the row's own box is now 8 + 24 (16px/1.5 label) + 25.6 (16px/1.6 description) + 8 =
65.6px — `list-box-item.css:6-11` + `description.css:5-6`.

---

### 4 · MEDIUM — In the Dropdown, hover, keyboard focus and "selected" are the same band

`components-collections-dropdown--with-single-selection` / `--with-multiple-selection`, both themes.
`shots/collections/dd-multi-tz-hover.png`, `dd-single-tz-hover2.png`, `dd-single-tzd-hover2.png` —
upstream: `dd-single-light-hover2.png`.

Open the menu and hover a row that is not the selected one: **two rows now carry exactly the
same `--accent-soft-hover` fill**, and the only thing that says which one is actually selected
is a 10px muted-grey tick in the left gutter. Keyboard focus paints the same band again
(`dd-single-tz-kbd2.png`). Upstream keeps them separate — selection has no fill at all, hover is
a neutral grey pill.

Cause: `heroui/styles/themes/tzuchi/components/dropdown.css:137-151` gives `:hover`,
`[data-hovered]`, `[data-focused]`, `[data-selected]` and `[aria-checked]` one and the same
`background-color: var(--accent-soft-hover)`.

---

### 5 · MEDIUM — Keyboard-shortcut chips shout louder than the commands they belong to

`components-collections-dropdown--with-keyboard-shortcuts`, `--with-descriptions`,
`--with-sections`; ListBox `--with-sections`. Both themes.
`shots/collections/dd-kbd-tz.png`, `dd-kbd-tzd.png` — upstream: `dd-kbd-light.png`.

Probed:

| | upstream light | tzuchi | tzuchi-dark |
|---|---|---|---|
| `.kbd` | 14px / 500 / muted grey | **16px / 700** / `rgb(51,51,51)` | **16px / 700** / `rgb(242,242,242)` |
| item `[data-slot="label"]` | 14px / 500 / near-black | 16px / 700 / `rgb(27,45,88)` | 16px / 700 / `rgb(169,194,234)` |

Upstream keeps the shortcut the same size as the label but mutes its colour, so it recedes.
The theme matches the label's size **and** weight and paints the chip in the plain foreground
colour. In `tzuchi-dark` the result is inverted: `⌘N` is pure white while the command name
`New` is mid-blue — the shortcut is the most prominent thing in the row.

Cause: `heroui/styles/themes/tzuchi/components/kbd.css:8` (`color: var(--default-foreground)`)
and `:14-16` (16px / 700), against a base `.kbd` that was `text-sm font-medium text-muted`
(`heroui/styles/components/kbd.css:3`).

---

### 6 · MEDIUM — tzuchi-dark: the TagGroup "surface" variant disappears into the page

`components-collections-taggroup--variants`, tzuchi-dark only.
`shots/collections/tg-variants-tzd.png` — upstream: `tg-variants-dark.png`.

Probed: `body` background `rgb(22,22,24)`, `.tag--surface` background `rgb(28,28,30)` — a ~1.09:1
step. The pills have no edge to fall back on either: `tag.css:6` sets
`border: 1px solid transparent`. The row reads as four bare labels floating on the page, while
the `default` row right above it shows proper pills. Upstream dark keeps a clear step between
the two (`oklch(0.2103…)` fill on a near-black page) and both variants read as pills.

---

### 7 · MEDIUM — The same "Tzu Chi option row" shows hover and selection differently in ListBox and Dropdown

`shots/collections/lb-sections-tz-hover.png` and `lb-multi-tz-sel.png` next to
`dd-single-tz-hover2.png`.

The theme deliberately makes a `.menu-item` and a `.list-box-item` the same row — same 32px
inset, same 16px/700 label, same square full-bleed shape. But:

* in a **Dropdown** a hovered or selected row gets the brand tint (`--accent-soft-hover`);
* in a **ListBox** a hovered row gets HeroUI's neutral grey `bg-default`
  (`lb-sections-tz-hover.png` — a grey rectangle inside a blue-free white card), and a
  **selected** row gets no fill at all, only the tick (`lb-multi-tz-sel.png`).

So two rows that were made to look identical answer the same gesture in two different
colours. Cause: every state rule in `dropdown.css:137-151` is scoped to `.dropdown__popover`,
while `themes/tzuchi/components/list-box-item.css` ports geometry and type only, leaving the
base `heroui/styles/components/list-box-item.css:53-59` (`bg-default`) and `:61-64` (empty
selected block) in charge.
Upstream has the same *base* behaviour, but upstream never claimed the two rows were one row.

---

### 8 · LOW — TagGroup: a selected pill and a keyboard-focused pill both read as "an outlined pill"

`components-collections-taggroup--selection-modes`, both themes.
`shots/collections/tg-sel-tz-2.png`, `tg-sel-tzd-2.png` — upstream: `tg-sel-light.png`.

With `News` selected and the keyboard cursor moved on to `Travel`, both pills are outlined:
`News` by a 1px `currentColor` hairline on its edge (`tag.css:33-35`) over a fill
(`rgb(232,238,254)`) that is barely distinguishable from the unselected `rgb(242,242,242)`;
`Travel` by the 2px focus ring. Two of four chips look picked out and which one holds the
cursor takes a second look. Upstream is unambiguous: selection is a saturated blue fill with
blue text, focus is a ring.

Note: border-as-selection is the deliberate rule (DESIGN-LANGUAGE R83, "use when the item
already carries a tonal fill at rest"); the problem is that on the `default` tag variant the
"tonal fill at rest" is a near-white grey, so the hairline is carrying the whole signal.

---

### 9 · LOW — Section separator inside the Dropdown is inset 3% and lines up with nothing

`components-collections-dropdown--default`, `--with-sections`, `--with-section-level-selection`,
both themes. `shots/collections/dd-default-tz.png`, `dd-sections-tz.png`, `dd-sectionsel-tzd2.png`.

Rows now run edge to edge and their text starts 32px in, but the separator keeps HeroUI's
`ms-[3%] w-[94%]` (`heroui/styles/components/dropdown.css:128-130`) — ~6.5px in from each
panel edge. It is flush with neither the rows nor the text column, and between two full-bleed
selection bands it reads as an accident. In `tzuchi-dark` it also reads warm/beige: it is a
neutral `rgb(107,107,110)` rule sitting on the navy `rgb(27,45,88)` panel, the only neutral in
an otherwise fully blue-tinted surface.

upstreamHasItToo: the 3% inset is HeroUI's, but upstream's rows are inset 16px pills, so there
the rule is roughly aligned with them; the theme is what made it line up with nothing.

---

### 10 · LOW — Submenu chevron: 14px, muted, hugging the panel edge against a 32px text inset

`components-collections-dropdown--with-submenus`, `--with-custom-submenu-indicator`, both themes.
`shots/collections/dd-submenu-tz-row.png`, `dd-submenu-tz.png` — upstream: `dd-submenu-light-row.png`.

The `Other` row's label starts 32px from the panel edge; the chevron sits 8px from the other
edge (`.menu-item__indicator` `end-2`, `heroui/styles/components/menu-item.css:111-113`) and
measures 14px in `--muted` grey. Beside a 16px/700 label, and beside the 20px chevron the same
theme puts on a Select trigger (probed: `.select__trigger svg` = 20px), it looks undersized and
the row looks lopsided. Upstream's 16px text inset vs 14px chevron inset is near-symmetric, so
nothing stands out there.

---

## Checked and found FINE

* **Dropdown panel** — 8px radius, brand-tinted surface, 8px block padding, correct elevation in
  both themes (drop shadow light / 1px inset white hairline dark). No scrollbars appeared where
  they should not. `dd-default-tz.png`, `dd-default-tzd.png`.
* **Menu row geometry** — 40px rows, 32px inset, 16px/700 labels; the Dropdown popover sizes
  itself to the content, so nothing truncates or wraps there even with a long label
  (`dd-customsub-tz.png`, "Other (default indicator)" fits exactly inside the 32px band).
* **Selection indicators** — checkmark, dot and the story's custom circle-check all stay centred
  in their 16px box, never collide with the 32px text inset, in single, multiple and
  section-level selection, light and dark. `dd-single-tz.png`, `dd-customind-tz.png`,
  `dd-sectionsel-tz2.png`, `lb-customcheck-tz.png`.
* **Danger variant** — red label and red indicator survive hover, keyboard focus and the brand
  fill in both themes, and dim correctly when disabled. `dd-default-tz.png`,
  `dd-default-tz-kbdnav-danger.png`, `dd-disabled-tz.png`, `lb-disabled-tz-clip.png`.
* **Disabled rows** — Dropdown and ListBox both dim the whole row (label, description, icon and
  kbd) cleanly; never readable as enabled. `dd-disabled-tz.png` / `-tzd`, `lb-disabled-tz-clip.png`.
* **Submenus** — the submenu panel inherits the parent's radius, fill and 8px block padding,
  opens clear of the parent and does not overlap it, light and dark.
  `dd-submenu-tz-open.png`, `dd-submenu-tzd-open.png`.
* **Section headers** — 32px-inset headers keep the same relationship to the icon column that
  upstream has; no collision with rows. (Their 12px size is on the known-issues list.)
* **TagGroup sizes** — 34 / 40 / 48px for sm / md / lg, matching DESIGN-LANGUAGE R61; md and lg
  share 20px type *by design* (only the padding steps), pill radius consistent across all three.
  `tg-sizes-tz.png`, `tg-sizes-tzd.png`.
* **TagGroup wrapping and gap** — the 8px list gap keeps wrapped rows evenly spaced and the
  20px remove button's 24px touch target never overlaps a neighbouring pill.
  `tg-remove-tz.png`, `tg-listdata-tz2.png`.
* **Tag internals** — icons and avatars scale with the 1em rule and stay optically centred on
  the label; the remove `×` is centred and does not push the pill out of shape.
  `tg-prefix-tz.png`, `tg-listdata-tz2.png`.
* **Tag disabled** — clearly faded in both themes, in both `disabledKeys` and per-tag form.
  `tg-disabled-tz.png`, `tg-disabled-tzd.png`.
* **TagGroup description + error message** — stack below the pills without overlapping them;
  the red error line is legible in both themes. `tg-error-tz.png`, `tg-error-tzd2.png`.
* **Tags rendered inside a field** (ComboBox / Autocomplete) — the pills sit below the input,
  wrap correctly and clear the field; nothing overlaps. `cb-tags-tz.png`, `ac-tags-tz.png`.
* **Custom trigger / long-press trigger / controlled-open** — render and open normally in both
  themes. `dd-customtrig-tz.png`, `dd-longpress-tz.png`, `dd-ctrlopen-tz.png`.

## Deliberately not reported (on the known / out-of-scope list)

The clipped option-row focus ring (seen in `dd-single-tz-kbd2.png`, `lb-multi-tz-sel.png`,
`dd-submenu-tz-open.png`); 12px section headers; `#828282` muted text and muted icons on the
tinted option panel; danger red as text; the `h-8 items-start` icon wrapper the Description
stories use, which is what puts the leading icon a few pixels below the label once the row's
text block grows.
