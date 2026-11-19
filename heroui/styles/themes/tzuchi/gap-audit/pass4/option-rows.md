# Fix unit: option-rows (pass 4)

Three defects in option lists — the Dropdown menu, the Select / ComboBox /
Autocomplete popovers, and the global `.list-box-item` / `.menu-item` rows.

Files replaced in full (in `scratchpad/atoms4/css/`):
`dropdown.css`, `select.css`, `combo-box.css`, `autocomplete.css`,
`list-box-item.css`, `menu-item.css`, `header.css`.
`list-box.css` and `menu.css` were **not** needed.

Every file was produced by copying the live override and applying literal,
verified substitutions (`tools/patch-option-rows.cjs`), so every line outside
this brief is byte-identical to what is on disk today. Each file's header keeps
its original text and gains a dated `Pass 4 (2026-09-20): …` paragraph
immediately before its closing rule.

---

## Defect 1 — CLIPPED FOCUS RING

### Reproduction

```
node tools/qa-shot.cjs tzuchi components-pickers-select--default \
  shots/option-rows/before-select-ring.png key:Tab key:Enter key:ArrowDown \
  'probe:[data-slot="list-box-item"][data-focus-visible="true"]' clip:.select__popover
```

`shots/option-rows/before-select-ring.png` — the focused "Delaware" row shows
**two horizontal lines**, one above and one below, and nothing at all on the
left or the right. `shots/option-rows/before-listbox-ring.png` shows the same
thing on the **standalone** ListBox (story `components-collections-listbox--default`,
`key:Tab`), so this is not a popover-only defect.

Probe of the focused row, before:

```
width 256px  (= the popover's own width)
box-shadow  rgba(0,0,0,0) 0 0 0 0,
            rgba(0,0,0,0) 0 0 0 0,
            rgb(232,238,254) 0 0 0 2px,   <- ring OFFSET, --accent-soft, outside
            rgb(79,123,190) 0 0 0 4px,    <- ring itself, --focus, 2px..4px outside
            rgba(0,0,0,0) 0 0 0 0
```

### Root cause

* `heroui/styles/utilities/index.css:2-6` — `@utility focus-ring` is
  `ring-2 ring-focus ring-offset-0 ring-offset-background` plus
  `--tw-ring-offset-width: var(--ring-offset-width)` (2px under this theme).
  Tailwind composes it as two **outset** box-shadow layers:

  ```
  --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 <offset-w> <offset-c>
  --tw-ring-shadow:        var(--tw-ring-inset,) 0 0 0 calc(2px + <offset-w>) <ring-c>
  ```

  (verified verbatim in the built Storybook CSS — the `var(--tw-ring-inset,)`
  form with an empty fallback is what makes an inset override possible).
* `heroui/styles/components/list-box-item.css:37-40` and
  `heroui/styles/components/menu-item.css:46-49` apply `status-focused`
  (→ `focus-ring`) to a focused row.
* Pass 1/2 made the row **edge to edge**: `border-radius: 0`, full panel width
  (`list-box-item.css:50-57`, `menu-item.css:97-104`, plus the popover-scoped
  32px inset in `select.css:258-260` etc.). The ring is therefore drawn entirely
  outside the row's box, and the popover (and the standalone `.list-box`'s own
  scroll box) clips its left and right segments away.

The pass-1/2 rules that set `--tw-ring-offset-color: var(--accent-soft)`
(`dropdown.css:153-160`, `select.css:295-302`, `combo-box.css:232-238`,
`autocomplete.css:373-379` — spec R71) fixed the *colour* of the halo but not
its *direction*, so the clipping survived.

### The fix

In all six row files, on the focused row:

```css
--tw-ring-inset: inset;
--tw-ring-offset-width: 0px;
```

Giving `--tw-ring-inset` a value flips **both** composed layers inward; a 0
offset width collapses the offset layer to nothing and leaves exactly one 2px
band of `--focus` hugging the row edge on all four sides. Colour (`--focus`) and
width (2px) are unchanged — only the direction is. This is HeroUI's own answer
wherever a ring may not escape its box (`focus-field-ring`,
`utilities/index.css:8-12`: *"No separation - ring sits directly against the
element"*). The fill that marks tc's keyboard cursor
(`tc-dropdown.styles.ts:96-98`, `.option.active` = brand-surface-hover) is
untouched, and still carries the state in the Tzu Chi way.

Probe after: `rgb(79,123,190) 0 0 0 2px inset` — one layer, full rectangle.

Selectors and why that specificity:

| file | selector | spec. | beats |
|---|---|---|---|
| dropdown.css | `[data-theme^="tzuchi"] .dropdown__popover [data-slot="menu-item"]:focus-visible` / `[data-focus-visible="true"]` | (0,4,0) | base `.menu-item:focus-visible:not([data-focused])` (0,3,0) |
| select / combo-box / autocomplete | same shape on `.<x>__popover [data-slot="list-box-item"]` | (0,4,0) | base `.list-box-item…` (0,3,0) |
| list-box-item.css | `[data-theme^="tzuchi"] .list-box-item:focus-visible:not([data-focused])` / `[data-focus-visible="true"]` | (0,4,0) / (0,3,0) | base (0,3,0) / (0,2,0) |
| menu-item.css | same on `.menu-item` | (0,4,0) / (0,3,0) | base (0,3,0) / (0,2,0) |

The global rules mirror the base's `:not([data-focused])` branch on purpose, so
they win **outright** instead of tying and depending on import order. The
popover-scoped and global rules carry identical declarations, so neither
contradicts the other where both apply.

**Why the global files and not only the four popovers:** the fix introduces no
colour at all (a 0 offset width paints nothing), so the row needs no knowledge
of the fill behind it; the rule is as correct on an untinted ListBox — where the
defect is equally visible, `before-listbox-ring.png` — as on the brand panel.
A variant that kept a 2px inset gap was tried (`try/ringB.css`,
`shots/option-rows/try-ringB.png`): it works, but the gap must be painted in the
focused row's own fill, which is `--accent-soft-hover` in the popovers and
*unknowable* on a standalone list (a `transparent` offset does not work — an
unpainted offset layer simply reveals the 4px ring band underneath). Rejected in
favour of one construction that is right everywhere.

`--tw-ring-offset-color: var(--accent-soft)` is **removed** from the four
popover rules: with a 0 offset width there is no offset left to colour. The
file comments record that this supersedes R71 in those files.

### Screenshots

| | before | after |
|---|---|---|
| Select, light, middle row | `shots/option-rows/before-select-ring.png` | `shots/option-rows/after-select-ring-light.png` |
| Select, dark, first row | — | `shots/option-rows/after-select-ring-dark.png` |
| Dropdown, light, first row | — | `shots/option-rows/after-dropdown-ring-light.png` |
| Dropdown, dark, **last** row (danger) | — | `shots/option-rows/after-dropdown-ring-dark-last.png` |
| ComboBox, light, first row | — | `shots/option-rows/after-combo-ring-light.png` |
| ComboBox, light, middle row (sections) | — | `shots/option-rows/after-combo-ring-mid.png` |
| standalone ListBox | `shots/option-rows/before-listbox-ring.png` | `shots/option-rows/after-listbox-ring.png` |
| Autocomplete, dark, sections | — | `shots/option-rows/after-autocomplete-dark.png` |
| Autocomplete, **virtualized** rows | — | `shots/option-rows/after-autocomplete-virtual.png` |
| Select, disabled options present | — | `shots/option-rows/after-select-disabled.png` |

---

## Defect 2 — MUTED TEXT ON THE TINTED PANEL

### Reproduction

```
node tools/qa-shot.cjs tzuchi components-collections-dropdown--with-descriptions \
  shots/option-rows/before-dd-desc.png key:Tab key:Enter \
  'probe:[data-slot="description"]' clip:.dropdown__popover
node tools/qa-shot.cjs tzuchi components-pickers-select--with-sections \
  shots/option-rows/before-select-sections.png key:Tab key:Enter 'probe:.header' clip:.select__popover
node tools/qa-shot.cjs tzuchi components-pickers-combobox--asynchronous-loading \
  shots/option-rows/before-combo-empty.png key:Tab wait:800 type:zzz wait:1500 \
  'probe:[data-slot="empty-state"]' clip:.combo-box__popover
```

All three probed `color: rgb(130,130,130)` = `--muted` = `--tc-color-gray-700`,
on the `--accent-soft` (`blue-100`, `rgb(232,238,254)`) panel. Recomputed from
`packages/tokens/dist/tokens.css`:

| text | fill | before | after |
|---|---|---|---|
| light, resting row | `--accent-soft` | **3.31:1** | **11.58:1** |
| light, hovered / focused row | `--accent-soft-hover` | **2.86:1** | **9.98:1** |
| dark, resting row | `--accent-soft` | 6.41:1 | **7.42:1** |
| dark, hovered / focused row | `--accent-soft-hover` (`blue-700`) | 3.42:1 | 3.96:1 |

### Root cause

* `heroui/styles/components/description.css:2-4` — `.description` is
  `text-xs … text-muted` (0,1,0).
* `heroui/styles/components/header.css:5-7` — `.header` is
  `… text-xs font-medium text-muted` (0,1,0).
* `heroui/styles/components/empty-state.css:2-4` — `.empty-state` is
  `p-2 text-sm text-muted` (0,1,0); inside an Autocomplete popover
  `heroui/styles/components/autocomplete.css:230-233` pins it harder still to
  `text-center text-sm text-overlay-foreground/60` (0,2,0).

None of those three knows it is sitting on a **fill**. Pass 1/2 repainted the
panel `--accent-soft` and the row label `--accent-soft-foreground`, but left the
secondary texts on the neutral `--muted`, which is picked for a `--surface`, not
for a brand tint.

### The fix

New design-language rule (owner-approved, pass 4): *text that sits on a fill
never uses `--muted`; it takes that fill's own foreground.* Tzu Chi's own
components work that way — tc-dropdown's option text on brand-surface is
brand-primary (`tc-dropdown.styles.ts:82-93`), tc-search-bar's category label on
surface-subtle is text-default. Hierarchy is carried by **weight**, not colour:
row label 700, section header 500, description 400 (all already set by
`list-box-item.css` / `menu-item.css` / this pass's `header.css`).

One block per popover file, e.g. in `select.css`:

```css
[data-theme^="tzuchi"] .select__popover .header,
[data-theme^="tzuchi"] .select__popover [data-slot="description"],
[data-theme^="tzuchi"] .select__popover [data-slot="empty-state"] {
  color: var(--accent-soft-foreground);
}
```

and the same for `.dropdown__popover`, `.combo-box__popover`,
`.autocomplete__popover`.

**Specificity (0,3,0)** — over base `.header` / `.description` / `.empty-state`
(0,1,0), over `[data-theme^="tzuchi"] .header` (0,2,0) and over
`.autocomplete__popover [data-slot="empty-state"]` (0,2,0), so it wins outright
in every host rather than by import order. The danger row's own label colour
(`.list-box-item--danger [data-slot="label"]` / `.menu-item--danger …`) lives on
a different element and is untouched — verified in
`after-dd-desc.png`, where "Delete file" stays `--danger` while its description
"Move to trash" turns legible.

**Deliberately popover-scoped.** A `.header`, `.description` or empty state on an
untinted surface — the standalone ListBox or Menu — sits on a *surface*, not on
a fill, so it keeps `--muted`. Verified: `after-listbox-sections.png`, where the
header still probes `rgb(130,130,130)`.
`header.css` and `description.css` therefore stay colour-free.

**One honest counter-example**, recorded rather than hidden: tc-dropdown's own
`.empty` (`tc-dropdown.styles.ts:106-110`) *does* put `text-muted` on the
brand-surface listbox. The owner-approved rule and the measured 3.31:1 win over
that single line, but an integrator should know it exists.

### Screenshots

| | before | after |
|---|---|---|
| Dropdown descriptions | `shots/option-rows/before-dd-desc.png` | `shots/option-rows/after-dd-desc.png` |
| Select section headers | `shots/option-rows/before-select-sections.png` | `shots/option-rows/after-select-sections.png` |
| ComboBox empty state | `shots/option-rows/before-combo-empty.png` | `shots/option-rows/after-combo-empty.png` |
| Dropdown headers, dark | — | `shots/option-rows/after-dd-sections-dark.png` |
| Autocomplete, dark | — | `shots/option-rows/after-autocomplete-dark.png` |
| untinted ListBox keeps `--muted` | — | `shots/option-rows/after-listbox-sections.png` |

---

## Defect 3 — SECTION HEADER TYPE

### Reproduction

Probe of `.header` in `components-pickers-select--with-sections`, before:
`font-size 12px, font-weight 500, line-height 16px, height 26px`
(`shots/option-rows/before-select-sections.png` — "North America", "Europe",
"Asia" render as small grey captions).

### Root cause

`heroui/styles/components/header.css:6` — `@apply … text-xs font-medium
text-muted` = 12px / 500 / 16px. Spec R8 / §1.3 exempted `.header` from §1's
"every 12px role moves to 16px", on the grounds that a header must not compete
with the 16/700 rows it introduces. But the Tzu Chi scale's smallest step is
`--tc-font-size-16` (`packages/tokens/dist/tokens.css:85`) — 12px is simply not
a size this theme owns, so the exemption cannot survive contact with the scale.

### The fix — `header.css`, global

```css
[data-theme^="tzuchi"] .header {
  padding-inline: var(--tc-space-32, 32px);      /* unchanged, R146 */
  font-size: var(--tc-font-size-16, 16px);
  font-weight: var(--tc-font-weight-medium, 500);
  line-height: var(--tc-line-height-normal, 1.5);
}
```

What R8 was protecting now passes to **weight and line box**: 500 against the
rows' 700, and the 1.5 *control* line box rather than the 1.6 *prose* one —
exactly the pairing §1.1 R13 gives a tab label (500 / 1.5), and the only weight
between the row's 700 and a description's 400. 500 is also the weight HeroUI
already had, so the header's voice is unchanged; only its size is. Block padding
stays HeroUI's `pt-1.5 pb-1`, so the header box grows 26px → **34px**.

**Specificity (0,2,0)**, unchanged from pass 3 — it beats base `.header` (0,1,0)
and is out-ranked by `dropdown.css`'s `.dropdown__popover .header` and
`list-box.css`'s `.list-box .header` (both 0,3,0), which set only
`padding-inline` and therefore cannot contradict the three new declarations.

**Colour is still not set here.** On the untinted global list the header sits on
a surface, so `--muted` stays right (verified: `after-listbox-sections.png`
probes `rgb(130,130,130)` at 16px/500); on the four tinted panels the popover
files of defect 2 give it `--accent-soft-foreground`.

**Blast radius checked.** The `.header` class is emitted only by
`react/src/components/header/header.tsx` (`data-slot="header"`) and that
component is imported by nothing inside the library except its own barrel — it
reaches the DOM only as a collection `Section` header in Dropdown, ListBox,
Select, ComboBox and Autocomplete. `CardHeader` (`.card__header`) and the
calendar grid header are different classes and are not touched.

### Screenshots

before `shots/option-rows/before-select-sections.png` →
after `shots/option-rows/after-select-sections.png`
(dark: `shots/option-rows/after-dd-sections-dark.png`;
untinted: `shots/option-rows/after-listbox-sections.png`)

---

## What I could NOT verify by injection

1. **The one removal.** `css:` can only add or override declarations, never
   delete one, so the removal of `--tw-ring-offset-color: var(--accent-soft)`
   from the four popover focus rules is the single edit no screenshot proves.
   It is provably inert: with `--tw-ring-offset-width: 0px` the offset layer has
   zero spread whatever its colour, which the after-probe shows
   (`rgb(232,238,254) 0 0 0 0px inset` — a 0-width band). If an integrator
   prefers belt and braces, keeping the line changes nothing.
2. **Dark contrast on a hovered / focused row.** `--accent-soft-foreground` on
   `--accent-soft-hover` is **3.96:1** in dark — an improvement on 3.42:1 but
   still under 4.5:1 for the 400-weight description. This is not something this
   unit can fix: the **row label** (700) already has exactly that ratio there,
   because it is a property of the theme's `blue-300` / `blue-700` pair in
   `variables.css:77-79`, not of these rules. Flag for whoever owns the palette.
3. **`[data-slot="empty-state"]` inside a Dropdown / Menu.** No story renders
   one (`renderEmptyState` is a ListBox prop in these sources), so that branch of
   the `dropdown.css` selector is untested. It is inert when the element is
   absent, and included so a Menu never regresses to `--muted` on the tint.
4. **`forced-colors` / `prefers-contrast` modes** and **coarse-pointer
   (`hover: none`) devices** — headless Chrome here does not emulate them. No
   rule in this unit touches a `@media (hover: hover)` block or an outline, so
   HeroUI's forced-colors behaviour (the `status-invalid-field` outline, the
   system-colour ring) is unaffected in principle, but it was not observed.
5. **RTL.** Every property used is either logical or axis-neutral
   (`--tw-ring-*`, `font-*`, `line-height`, `color`), so RTL cannot be affected,
   but no RTL render was taken.
6. **A Menu rendered outside a Dropdown.** No story renders a standalone
   `<Menu>`, so `menu-item.css`'s global ring rule was exercised only through
   the Dropdown popover, where it agrees declaration-for-declaration with
   `dropdown.css`.
