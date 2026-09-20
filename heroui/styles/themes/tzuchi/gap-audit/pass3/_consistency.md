# Cross-unit consistency pass — 42 new override files vs the 26 shipped

Scope: all 42 files in `css-reviewed/`, read in full, plus the 26 shipped overrides in
`heroui/styles/themes/tzuchi/components/`. Read-only on both repositories; the corrected
files are in `css-final/`.

Three mechanical passes backed the reading:

1. **Flattened-rule diff.** A nested-CSS walker flattened all 68 files (42 new + 26 shipped)
   into `selector → property: value` triples, then grouped them by exact selector+property
   (to find two files writing the same declaration) and by property+value (to find one role
   written two ways). ~1 070 declarations.
2. **Comment-safety tokenizer.** A pass that consumes comments exactly as a CSS tokenizer
   does and reports any `*` + `/` found *outside* one. This is what found the three dead
   files below.
3. **Token / colour-rule scan.** Every `var(--tc-…)` checked for existence in
   `packages/tokens/dist/tokens.css`, for absence from both of its dark blocks
   (`[data-theme="dark"]` and the `prefers-color-scheme` block), and for a fallback; plus
   hex / `rgb()` / `hsl()` / `oklch()` / `!important` / `--tc-color-` / physical
   `left`/`right`.

Result of pass 3 across all 42 files: **clean.** No colour literal, no `--tc-color-*`, no
colour-valued component token, no `!important`, no physical side property, no undeclared or
mode-dependent token, no token without a fallback. The only `--tzuchi-*` variables read are
`--tzuchi-modal-shadow` and `--tzuchi-accordion-trigger-hover-bg` (both already emitted by
`generate.mjs`, both declared for both modes except the known I4 gap) plus four **local**
calc helpers defined in the same file that reads them (`--tzuchi-toggle-button-block-size`
/ `-size` / `-icon-size`, `--tzuchi-swatch-border-width`). Nothing new was invented.

---

## 1. HIGH — three files are dead CSS (premature comment close)

`slider.css`, `color-slider.css` and `date-picker.css` each spell the comment-terminator
sequence **literally** inside their "Reviewed" paragraph, in the sentence that asserts no
such sequence exists:

| file | line | text |
|---|---|---|
| `slider.css` | 161 | ``Scanned every comment for a premature `*/` close — none.`` |
| `color-slider.css` | 115 | ``… physical `left`/`right` and a premature `*/` — none found`` |
| `date-picker.css` | 120 | ``No comment closes early (no interior `*/`).`` |

CSS does not know about backticks. The header comment ends on that line; the remaining
prose, the file's real terminator and the opening selector are then parsed as **one
selector**, and because that selector is invalid the entire following block is dropped.
Each of these three files has exactly **one** top-level block, so in each case **every
declaration in the file is dead.** This is the pass-1 bug hard rule 8 was written for; each
file's own review note claims to have checked for it.

Confirmed by re-running the flattened-rule walker (which consumes comments the way a parser
does): before the fix, `date-picker.css` contributed **zero** rules to the
`border-radius: var(--tc-card-radius, …)` group that `popover.css`, `date-range-picker.css`,
`color-picker.css`, `toast.css`, `table.css` and `typography.css` all appear in, and
`slider.css` / `color-slider.css` contributed selectors made of prose.

**Why this is a consistency finding and not just three unit bugs** — the failure is silent
and each dead file is the *only* member of a family that would have been left behind:

* **Slider** — the track would keep HeroUI's `--default` (1.12:1 on a card) while
  `progress-bar.css` and `meter.css` moved their tracks; the readout would stay 14px/500
  beside three 16px/400/1.6 readouts; the handle would keep this theme's empty
  `--field-shadow` (`variables.css:22` = `0 0 0 0 transparent`) while `switch.css`'s thumb
  carries `--surface-shadow`. `label.css` excludes `.slider *` from its 700 weight *on the
  assumption that slider.css supplies the metrics* — with slider.css dead, the Slider label
  is the one R19 row-mate left un-typed.
* **ColorSlider** — same, and it renders beside `ColorField` and `Slider` in one frame
  (`components-colors-colorpicker--with-sliders`), which is the mismatch that file's own
  header argues it exists to prevent.
* **DatePicker** — would be the only content popover still on HeroUI's 20px corner while
  `date-range-picker.css`, `color-picker.css` and `popover.css` went to 16px, and its
  trigger glyph the only field affix still 16px beside the 20px chevrons in `select.css`,
  `combo-box.css`, `autocomplete.css` and `date-range-picker.css`. Its byte-identical twin
  `date-range-picker.css` parses fine, so the two pickers would visibly disagree.

**Fixed** in `css-final/slider.css`, `css-final/color-slider.css`,
`css-final/date-picker.css`. The sentence now *names* the sequence instead of spelling it,
per hard rule 8's own convention. **No selector, declaration or value changed** — verified
by re-parsing each corrected file and printing the rules a tokenizer sees.

---

## 2. MEDIUM — the trigger hover-fade defeats HeroUI's `data-reduce-motion` switch

`disclosure.css` (new) and `accordion.css` (shipped, pass 1) both set `transition-property`
on their trigger and both guard it with R139's shortcut — nesting the rule in
`@media (prefers-reduced-motion: no-preference)`.

That closes only half the guard. HeroUI's `motion-reduce:` variant
(`styles/variants/index.css:22-42`) has **two** branches:

```css
&:is([data-reduce-motion="true"], [data-reduce-motion="true"] *) { … }   /* no media query */
@media (prefers-reduced-motion: reduce) {
  &:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)) { … }
}
```

An app that opts in with `data-reduce-motion="true"` while the OS preference is unset
therefore matches `prefers-reduced-motion: no-preference`, and the theme's fade runs.

* **Disclosure** is the worse case: base `disclosure.css` declares **no transition at all**
  on `.disclosure__trigger`, so there is no `motion-reduce:transition-none` for R139's
  stated mechanism ("HeroUI's lower-specificity guard still wins") to lean on. The theme was
  *introducing* 150ms of motion where the base had none. R137 — "restate the guard on BOTH
  switches" — is the rule that actually applies. **Fixed** in `css-final/disclosure.css` by
  adding HeroUI's own attribute branch as a `:not(:is(…))` exclusion. `:is()` takes its most
  specific argument, (0,1,0), so the selector is (0,3,0); nothing it must beat and nothing
  it can lose to. For anyone who has not asked for reduced motion the computed result is
  byte-identical.
* **Accordion** has the same gap for a different reason: its base *does* ship
  `motion-reduce:transition-none`, but that variant's attribute branch compiles to
  `.accordion__trigger:is([data-reduce-motion="true"], …)` = **(0,2,0)**, which ties
  `[data-theme^="tzuchi"] .accordion__trigger` = (0,2,0) — and the theme imports later, so
  the theme wins the tie and the fade survives. **Reported, not fixed**: `accordion.css` is
  one of the 26. It needs the identical `:not(:is(…))` exclusion, and the two should move
  together so the sibling triggers stay one behaviour. The shape to copy is now in
  `css-final/disclosure.css`.

---

## 3. What was checked and found CONSISTENT

Recording these because "no finding" is the useful answer for most of the brief's list.

### Field-family shell (R41/R49)

`input-group.css`, `number-field.css`, `date-input-group.css`, `color-input-group.css`,
`input-otp.css` and shipped `search-field.css` carry the 43.6px floor as **byte-identical**
text:

```css
min-block-size: calc(
  var(--tc-font-size-16, 16px) * var(--tc-line-height-relaxed, 1.6) + 2 *
    var(--tc-space-8, 8px) + 2 * var(--field-border-width, 1px)
);
```

Every one pairs it with `block-size: auto` except `input-group.css`, which is correct:
base `.input-group` is `min-h-9`, not `h-9`, so there is no fixed height to release
(verified in `styles/components/input-group.css:3`).

Inline inset **20px** on the value in all five plus shipped `input.css`, `textarea.css`,
`search-field.css`. Value type **16px/1.6** in all five. Affix inset **20px** everywhere:
`margin-inline-start/end` in `date-input-group.css`, `color-input-group.css` and shipped
`search-field.css`; `padding-inline: 20px 8px` in `input-group.css` (its affix is a padded,
bordered box beside a `ps-0`/`pe-0` input, so the slot must carry both insets);
`padding-inline-end: 20px` on the ComboBox trigger. R68 + R69's hover mirror present in all
five. `input-otp.css` correctly omits the R69 mirror — its base hover rule carries no
`:not(:focus)` guard, so the plain (0,3,0) state rules already outrank it.

The two deliberate splits — §11 I2 (43.6px text field vs 42px Select trigger) and I3 (20px
vs 32px inset) — are applied exactly where the spec puts them: `autocomplete.css` takes the
Select shape (32px / 60px reserved / 42px, mirroring `select.css` line for line) because its
popover rows are inset 32px; `combo-box.css` takes the Input shape (20px / 48px reserved).

### Option-list popovers (§6a R89–R97)

`combo-box.css` and `autocomplete.css` mirror shipped `select.css` **property for
property**: radius `--tc-dropdown-radius`, `--accent-soft` fill, `--accent-soft-foreground`
text, arrow fill, list-box `8px/0` restated in the popover scope, row `padding-inline: 32px`
restated for the same (0,2,0) tie, `[data-slot="label"] { color: inherit }` with the
`:not(.…--danger)` carve-out, `--accent-soft-hover` on hover/`data-focused`/`data-selected`/
`aria-selected` with the hover pair inside `@media (hover: hover)`, and
`--tw-ring-offset-color: var(--accent-soft)`. The one asymmetry is correct:
`autocomplete.css` adds `[role="presentation"] > [data-slot="list-box-item"] {
inline-size: 100% }` because only `styles/components/autocomplete.css:213-215` subtracts the
list-box padding from virtualized rows; `combo-box.css` has no such base rule (grepped).

### Menu rows vs ListBox rows

`menu-item.css` reproduces shipped `list-box-item.css` declaration for declaration
(radius 0, 8px/32px padding, 16px/1.5/700 on the row, `inherit`/`inherit`/700 on the label,
400 on the description) and adds one rule `list-box-item.css` does not need — the (0,4,0)
mirror for the base's `[data-has-submenu="true"]:has(.menu-item__indicator)` (0,3,0) inset.
`menu.css` reproduces `list-box.css` / `dropdown.css`'s column box (`8px / 0`, `gap: 0`).
`header.css` closes the one hole neither `dropdown.css` nor `list-box.css` reaches — the
standalone `<Menu>`.

### Modal-like shells (§6c)

`alert-dialog.css` and `drawer.css` match shipped `modal.css` on all seven shared rules
(`--tw-shadow` rather than `box-shadow`, heading 700, body 16/1.6 in `--overlay-foreground`,
16px header→body, 24px →footer, wrapping footer, the transparent close-trigger with the
identical four-attribute `:not()` guard). Both correctly refuse to repeat `modal.css:6-9`'s
incorrect "real drop shadow in dark" claim (§11 I4).

Two documented omissions verified as correct, not oversights:

* `drawer.css` has no radius rule — `min(32px, var(--radius-2xl))` already resolves to
  exactly 16px because `variables.css:19` sets `--radius` to `--tc-radius-md`. Restating it
  would be N5 duplication.
* `drawer.css` has no R133 enter-motion rule — confirmed in `styles/components/drawer.css`
  that Drawer **transitions** `translate` / `opacity` (lines 48, 148) rather than using
  `animate-in`, so `--tw-animation-duration` would land on nothing. `alert-dialog.css`,
  whose backdrop and container *do* use `animate-in`, has the rule.

### Content popovers (§6b)

`popover.css`, `date-picker.css`, `date-range-picker.css` and `color-picker.css` all land on
`var(--tc-card-radius, var(--radius-2xl))` = 16px, all keep `--overlay` + `--overlay-shadow`
untinted, all keep HeroUI's padding per R102. Verified that `.popover` cannot leak into a
picker shell: `react/src/components/date-picker/date-picker.tsx:15` imports
`Popover` from `react-aria-components/DatePicker`, not HeroUI's `<Popover>`, and
`date-picker.styles.ts:8` / `date-range-picker.styles.ts:8` / `color-picker.styles.ts:8`
each emit only their own `…__popover` class. R101's type half lands only where there is
text, so `popover.css` types its body and heading, `date-range-picker.css` types the range
separator, `color-picker.css` types the trigger, and `date-picker.css` correctly types
nothing beyond the trigger.

### Tracks (§7)

R123 (passive) vs R124 (interactive) applied exactly as split: `meter.css` and
`progress-circle.css` keep `--default`; `slider.css` repaints `--border`; `color-slider.css`
repaints nothing (its track is its own gradient). Pill radius on track + fill in
`meter.css`, on track + thumb + `::after` in `slider.css`, on the thumb in
`color-slider.css`. `meter.css` and `progress-circle.css` both move their fill transition to
200ms + `--tc-motion-easing-standard`, matching shipped `progress-bar.css:143-146`. Skeleton
correctly has no file (R129).

### R19 readout rows — the one place a silent cross-file break was possible

`label.css` sets `.label` to 700 globally, but excludes `.progress-bar *, .slider *,
.meter *, .color-slider *` with a zero-specificity `:not(:where(…))`. All four of those
components set `[data-slot="label"] { font-size; line-height }` at (0,3,0) and deliberately
leave the **weight** to HeroUI so the label and the numeric output share a baseline. The
exclusion list and the four files agree exactly — including that `.progress-circle` is *not*
in the list, which is right: it has no label slot and its story renders the `<Label>` as a
sibling outside the component, i.e. a standalone R1 label.

### Button family

`toggle-button.css` is `button.css`'s ladder transferred class-for-class: 34/42/50px via a
local `--tzuchi-toggle-button-block-size` calc helper, 16/24/32px inline padding, 16/700/1.5
at every size, 36/48/64px icon-only circles. `toggle-button-group.css` restates the joined
corners at `--tc-button-radius` and re-points icon-only cells at the group's own rhythm,
which is the same repair `button.css:329-339` makes for ButtonGroup, with
`:not(.toggle-button-group--detached)` on every selector. `toolbar.css`'s
`calc(--tc-radius-md + --tc-space-4)` = 12px is written in the exact form
`tabs.css:103-106` uses for the same concentric relationship. `close-button.css` changes
shape only, which is the one property R26 covers, so D8's stated risk does not arise.

One thing checked and cleared: `toggle-button.css`'s icon rule is a bare
`.toggle-button--icon-only svg`, without the `:not([data-slot="spinner"] svg,
[data-slot="link-icon"] svg)` exclusion §3.3 requires of `button.css`. Correct — confirmed
`react/src/components/toggle-button/toggle-button.tsx` has no pending/Spinner path and base
`styles/components/toggle-button.css:83,95` styles `& svg` unguarded, so there is no spinner
or link-icon to protect. Likewise the missing `:not(--full-width)` guard on its width rule:
ToggleButton has no full-width modifier, and
`styles/components/toggle-button-group.css:83-84` stretches full-width cells with `flex-1`
(flex-basis 0%), which overrides `width` for a flex item.

### Form scaffold vs the shipped selection controls

`description.css` / `error-message.css` / `field-error.css` set font metrics only;
`checkbox.css:137-141`, `radio.css:164-167` and `switch.css:128-131` set
`padding-inline-start` only — different properties, so the 40/40/52px indents survive
untouched. `label.css` excludes `.checkbox__content *`, `.radio__content *`,
`.switch__content *` because those three files set R5 prose on the **content container** and
let the label inherit it — a direct declaration on `.label` would beat that by inheritance
regardless of specificity, so the exclusion is load-bearing. `fieldset__legend` is never
`.label`, so no tie.

### Radius by role — the whole system, in one table

Every 4px "square-ish cell" agrees: calendar cell, range-calendar cell and cell-button,
year cell, date segment, `color-swatch--square`, square swatch-picker item, `kbd`,
`typography--code` / prose `code` — all `var(--tc-radius-sm, 4px)`, same value as shipped
`pagination.css`, `link.css`, `checkbox.css` and `tooltip.css`. Every 16px surface agrees:
popover, three picker popovers, toast, `table-root--primary`, prose `pre` and `img` — all
`var(--tc-card-radius, var(--radius-2xl))`, same as shipped `card.css`. 8px control:
`toggle-button` + group corners, same token as shipped `button.css`. 8px option panel:
combo-box + autocomplete, same token as shipped `dropdown.css` / `select.css`. Full circle:
`close-button`, icon-only toggle, slider/color-slider handles, same token as shipped
`radio.css` / `switch.css` / `tag.css`.

### Import order

Every new-vs-new and new-vs-shipped **tie** was re-derived against the import order of
`styles/components/index.css` (shared primitives first: close-button, description,
error-message, field-error, label). No tie resolves the wrong way, and no tie decides a
*different* value — in every case both sides carry the same declaration. The three
same-element/same-property/same-value duplicates are listed under §4.

---

## 4. LOW — recorded, not fixed

| # | What | Why not fixed |
|---|---|---|
| L1 | **Token spelling.** Shipped `select.css:137,193` uses `--tc-icon-size-sm`; all nine new files that size an affix glyph use the §0 spelling `--tc-size-icon-sm`. `tokens.css:186` aliases the first to the second, so both resolve to 20px. | `select.css` is one of the 26. The new files are already uniform on the correct spelling. |
| L2 | **Physical vs logical for the same 20px glyph.** `combo-box.css` and `autocomplete.css` use `width`/`height` (following `select.css:192-195`); `date-picker.css`, `date-range-picker.css` and `disclosure.css` use `inline-size`/`block-size` (following `search-field.css:179-180` and `accordion.css:76-78`). | Both precedents are shipped, both are non-directional, neither violates hard rule 1. Unifying would mean editing one of the 26 or diverging from it. |
| L3 | **`close-button.css` duplicates `tag.css:146`.** Same element (`.tag__remove-button` *is* a `.close-button`), same property, same 9999px, both (0,2,0); `tag.css` imports later so it lands. | Harmless. Removing the global rule would lose the statement of intent R26 asks for (today's circle is an accident of `--radius: 8px` on a 24px box); removing `tag.css`'s side is not permitted. |
| L4 | **`header.css` duplicates `dropdown.css:89-91` and `list-box.css:56-58`.** Same element inside those hosts, same property, same 32px; those two are (0,3,0) and still win. | Harmless, and the global rule is the whole point — it is what reaches the standalone `<Menu>`, `<Popover>`-hosted menus and any future host. The shipped side cannot be removed. |
| L5 | **`date-range-picker.css`'s range-separator type rule is now redundant, and its comment is stale.** It says the separator "inherits 14px from `.date-input-group`'s `text-sm`", but `date-input-group.css` (same pass) now sets 16px/1.6 on that shell. | The declaration is identical to what it would inherit, so it changes nothing; keeping it makes the separator independent of the shell. Comment-only defect. |
| L6 | **Two tokens for one role in the track family.** `meter.css` reads `--tc-progress-radius` / `--tc-progress-font-size` (per Q9's "the same override applies verbatim"); `slider.css` and `color-slider.css` read raw `--tc-radius-full` / `--tc-font-size-16`. | Identical resolved values today. A future Progress retune would move Meter but not Slider — which is arguably correct (Meter *is* ProgressBar) and is exactly what Q9 asks the owner to confirm. |
| L7 | **Disclosure-chevron size: 20px everywhere except `calendar-year-picker.css` (12px).** `accordion.css`, `disclosure.css`, `select.css`, `combo-box.css`, `autocomplete.css`, `date-picker.css`, `date-range-picker.css` all put a disclosure glyph on `--tc-size-icon-sm`. `.calendar-year-picker__trigger-indicator` keeps `text-xs`. | Checked the element: it is `<IconChevronRight height="1em" width="1em"/>` (`calendar-year-picker.tsx:199`), i.e. an em-sized glyph whose font-size *is* its size — the same construction as the breadcrumb separator §1.3 row 3 deliberately keeps at 12px, and unlike the `size-4` SVG boxes the other seven resize. Defensible either way; moving it is a visible change with no Figma behind it. Owner call. |
| L8 | **Toast shell gap 8px vs Alert 12px.** §6(d) reads a Toast as structurally `tc-alert`, but `toast.css` takes R147's 8px icon↔label step while `alert.css` takes `--tc-alert-gap` (12px). | R151 binds `--tc-alert-gap` to the alert's flat callout box, and the two components pad differently (toast 16/12, alert 16 all round). Both readings cite a real rule; §9 names neither. Owner call — one declaration either way. |
| L9 | **§11 I5 propagates to Toast.** `toast.css`'s title is 16/700/**1.5** (R119 → R1/R11); `alert.css:90-95`'s visually identical title is 16/700/**1.6**. 1.6px per line apart. | Pre-existing, already recorded as I5. `alert.css` is the outlier and is one of the 26. |
| L10 | **`toast.css` paints its description `--foreground`; `modal.css` / `alert-dialog.css` / `drawer.css` paint theirs `--overlay-foreground`.** | Deliberate and correct: a Toast sits on `bg-surface`, the dialogs on `--overlay`. Both resolve to the same primitive in both Tzu Chi modes, so nothing differs on screen today. |

---

## 5. Spec deviations shared by more than one unit

Only one, and it is coherent rather than wrong: **the calendar family declines R78.**
`calendar.css`, `range-calendar.css` and `calendar-year-picker.css` all keep `--default` for
hover instead of `--accent-soft`, while `table.css` (this pass) and shipped
`pagination.css` / `tabs.css` apply R78. The three calendar files give the same reason —
inside that family `--accent-soft` is *already* the today marker and the RangeCalendar
selection band, so a brand-tinted hover would make a hovered day and today pixel-identical
(measured 1.04:1 light / 1.06:1 dark, separating by hue alone). That is R88 ③ ("anything
where a brand tint would falsely read as selected"), which R78 does not carve out.

**The spec is what should move**, not the files: R78 needs R88 ③ named as its exception, or
R88 ③ needs "hover" added to its list. Applying R78 to a calendar first requires a new today
marker (an outline or a dot) — a redesign, not an override. Visible consequence for the
owner to accept or reject: hovering a pagination number or a table row tints blue; hovering
a calendar day tints grey.

No other deviation is shared. `color-slider.css`'s "beyond the brief" R19 rules and
`tag-group.css`'s override of a pass-2 NOTE are each single-unit, each disclosed in the
file, and each one declaration to revert.

---

## 6. Ownership

No violations. Every file styles its own BEM classes, and every reach into another
component's element mirrors a reach HeroUI's own base file for that component already makes:

* `combo-box.css` / `autocomplete.css` → `[data-slot="list-box"]`, `[data-slot="list-box-item"]`, `[data-slot="label"]`, `[data-slot="popover-overlay-arrow"]`, `[role="presentation"] >` — every one of these is scoped inside `.<name>__popover` and every one has a counterpart in `styles/components/combo-box.css:165-175` / `autocomplete.css:200-233`.
* `color-picker.css` → `.color-picker__trigger [data-slot="label"]`, mirroring base `color-picker.css:29-31`.
* `meter.css` / `slider.css` / `color-slider.css` → `[data-slot="label"]` inside their own root, mirroring their own base files and shipped `progress-bar.css:126-131`.
* `alert-dialog.css` / `drawer.css` → `.<host>__close-trigger.close-button--default`, the same own-host-class compound `modal.css:110-118` and `tag.css:153-161` already use.
* `typography.css` → element selectors (`h1`…`h6`, `p`, `li`, `code`, `pre`, `img`, `a`, `strong`) only inside `.typography-prose`, exactly as its base file does.
* `label.css`'s exclusion list names other components' classes only inside `:where()`, which styles nothing and contributes zero specificity.

`header.css`'s global `.header` rule is the one file that deliberately reaches beyond a
single host. It is correct: `.header` is the collection `<Header>`'s own class, imported by
exactly five story files (dropdown, autocomplete, combo-box, list-box, select — grepped
across `react/src`), and HeroUI's own base already styles it globally with a far wider
declaration set (`w-full px-2 pt-1.5 pb-1 text-start text-xs font-medium text-muted`), so
the theme adds no blast radius the base does not already have.

---

## 7. Files written

| target | change |
|---|---|
| `css-final/slider.css` | HIGH — premature comment close repaired; whole file was dead. No CSS changed. |
| `css-final/color-slider.css` | HIGH — same. No CSS changed. |
| `css-final/date-picker.css` | HIGH — same. No CSS changed. |
| `css-final/disclosure.css` | MEDIUM — R137's `data-reduce-motion` switch added to the hover-fade guard as a `:not(:is(…))` exclusion. Computed result unchanged for anyone not asking for reduced motion. |

All four re-verified after editing: comment tokenizer clean, braces balanced, every rule and
every `@media` branch scoped by `[data-theme^="tzuchi"]`, no colour literal / `--tc-color-*`
/ `!important` / physical side property, every `--tc-*` token present in `tokens.css`,
absent from both dark blocks, and carrying a fallback. The other 38 files need no change.
