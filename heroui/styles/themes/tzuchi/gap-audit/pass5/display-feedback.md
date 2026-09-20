# Fix unit "display-feedback" — Pass 5

Seven triaged items across `table.css`, `chip.css`, `color-swatch-picker.css`,
`progress-circle.css`, `spinner.css`, `alert.css`, `toast.css`.
Every item was reproduced first, fixed, re-rendered with the candidate injected into the
same cascade layer (`css:` on `qa-shot.cjs`) in BOTH themes, and looked at.

Full replacement files (absolute paths):

```
heroui/styles/themes/tzuchi/components/table.css
heroui/styles/themes/tzuchi/components/chip.css
heroui/styles/themes/tzuchi/components/color-swatch-picker.css
heroui/styles/themes/tzuchi/components/progress-circle.css
heroui/styles/themes/tzuchi/components/spinner.css
heroui/styles/themes/tzuchi/components/alert.css
heroui/styles/themes/tzuchi/components/toast.css
```

Screenshots: `…/scratchpad/atoms5/shots/display-feedback/`.
Trial fragments used for the `css:` injections: `…/scratchpad/atoms5/try/`.
Nothing under either repository was created, edited or deleted; no build, install, test or git
command was run.

---

## 1 · Table — row hover is neutral, selection carries the tint

**QA entry** `reports/atoms4/qa-data-display.md` finding 1 (MEDIUM).

**Reproduction** `components-data-display-table--default`, 1100×700.
Hover the second row (`hover:.table__row:nth-child(2) .table__cell:nth-child(2)`), or click its
checkbox to select it.

* tzuchi-dark, hovered: `before-table-hover-dark.png` — the whole row paints opaque navy
  `rgb(27,45,88)`; the `danger-soft` delete button (an alpha-0.15 red) composites to a lavender
  disc and stops reading as danger, while the two `tertiary` discs (opaque `--default`) turn into
  black punch-outs.
* tzuchi-dark, selected: `before-table-sel-dark.png` — `rgb(48,85,159)`, the same failure, louder.
  Close-up of the action cell before the fix is in the previous pass's
  `atoms4/shots/data-display/169-table-selrow-actions-dark.png`.
* tzuchi, hovered: `before-table-hover-light.png` — `rgb(232,238,254)`, the milder dusty-mauve
  version.

**Root cause** `heroui/styles/themes/tzuchi/components/table.css:241-254` — the hover pair set
`background-color: var(--accent-soft)` and the selected rule set `var(--accent-soft-hover)`. Under
`tzuchi-dark` those variables are `--tc-color-blue-900` / `-700` (`themes/tzuchi/variables.css:77-78`),
i.e. opaque, saturated navies rather than the near-surface washes light mode gets. The button fills
come from `heroui/styles/components/button.css:110-113` (`--button-bg: var(--default)`) and `:136-140`
(`--button-bg: var(--danger-soft)`, α 0.15) and were never designed to sit on a tint.

**Fix** (settled decision) — new ladder, identical in both modes:

| state | fill |
|---|---|
| hover | `var(--default)` |
| selected | `var(--accent-soft)` |
| selected + hovered | `var(--accent-soft-hover)` |

Specificity: the hover pair and the selected rule are both `(0,5,0)` (scoped through `.table-root`
so they out-rank `.table-root--secondary .table__row:hover .table__cell`, `(0,4,0)`, in the secondary
variant as well), with the selected rule declared later so selection still beats hover; the new
selected-and-hovered pair is `(0,6,0)` and beats both. Both hover branches stay inside
`@media (hover: hover)`, exactly like the base.

**After** — measured:

| | light | dark |
|---|---|---|
| resting | `rgb(255,255,255)` | `rgb(28,28,30)` |
| hover | `rgb(242,242,242)` | `rgb(51,51,51)` |
| selected | `rgb(232,238,254)` | `rgb(27,45,88)` |
| selected + hovered | `rgb(209,222,255)` | `rgb(48,85,159)` |

`after-table-hover-dark.png`, `after-table-hover-light.png`, `after-table-sel-dark.png`,
`after-table-selhover-light.png`, `after-table-selhover-dark.png`,
`final-table-dark.png` (hover and selection visible in one frame, rendered from the finished file).

**Legibility of the row action buttons — checked, as briefed**

* **Hovered row, both themes:** the `danger-soft` delete keeps its red (pale red disc in light,
  dark red disc in dark) and reads as danger again — the whole point of the fix. The `tertiary`
  discs are also `--default`, so on a hovered row the disc itself melts into the row; the glyph is
  `--default-foreground` and keeps exactly the contrast it had before, so the control is legible,
  never hidden, and simply reads as a ghost icon button while hovered. Reported, not "fixed":
  giving those buttons an in-row fill means reaching into `button.css` from `table.css`.
* **Selected row, light:** `after-table-secondary-light.png` — pale-blue row, pale-red delete,
  grey tertiary discs, all three glyphs clearly separated.
* **Selected row, dark:** `after-table-selactions-dark.png` (close-up) — the alpha-0.15 danger
  fill still composites over the navy to a muted periwinkle. Better than before (the row is now
  `--accent-soft`, one step calmer than the old `--accent-soft-hover`) and it now happens only in
  a deliberate state rather than on every pointer move, but it is not fully solved. Reported.

**Nothing broken next to it**

* `--secondary` variant: `after-table-secondary-light.png` — transparent rows, standalone header
  card, hover/selected ladder identical.
* `--virtualization` (the only story using a sticky header — `Table.Header className="sticky top-0
  z-10 bg-surface-secondary"`, `table.stories.tsx:635`): `after-table-sticky-dark.png`, header
  pinned, rows and dividers unchanged.
* **Striped: there is no striped option.** `grep -rn "striped"` over `heroui/styles` and
  `heroui/react` returns nothing in v3.2.6, so there was nothing striped to verify.
* Focus rings, disabled, dragging, drop-target, the column resizer, expandable rows, footer and
  pagination are untouched by this change (it sets `background-color` only).

---

## 2 · Chip — the label no longer wraps

**QA entry** `qa-data-display.md` finding 2 (MEDIUM).

**Reproduction** `components-data-display-table--column-resizing`, tzuchi, 900×700 —
"On Leave" (Sara Johnson, row 3; also Sophia Anderson). `before-chip-wrap-light.png`: the label
breaks after "On" and the pill becomes a two-line lozenge. Probed
`.table__row:nth-child(3) .chip` → **height 58px**, `.chip__label` → **height 48px**.

**Root cause** `themes/tzuchi/components/chip.css:67-70` raises `.chip--sm` to 16px type
(HeroUI's is `text-xs` = 12px, `styles/components/chip.css:51-53`), so the label no longer fits the
story's 120px Status column and the inline box wraps. Nothing in the chain declares `white-space`:
`.chip__label` (base `:13-15`) sets padding only.

**Fix** `white-space: nowrap` added to the theme's existing `.chip__label` rule.
`(0,2,0)` against the base's `(0,1,0)`; one declaration covers every size, colour and variant.
The chip keeps HeroUI's `w-fit`, so a long label widens the pill instead of stacking it.

**After** `after-chip-wrap-light.png` — one line; probed `.chip` **34px**, `.chip__label` **24px**;
the pill (89px) still fits the 120px column and the rows regain their rhythm.

**Nothing broken next to it** `after-chip-variants-dark.png` — all 5 colours × 4 variants × the
Lg/Md/Sm blocks in `components-data-display-chip--variants` (tzuchi-dark): no clipping, no baseline
drift, icons and status dots still centred.

---

## 3 · ColorSwatchPicker — the square swatch takes the item's own 4px

**QA entry** `qa-feedback-colors.md` finding 1 (medium).

**Reproduction** `components-colors-colorswatchpicker--all-variants`, tzuchi, 900×900.
`before-csp-square-light.png`; probed `border-top-left-radius` on
`.color-swatch-picker--square … __swatch`: **3px at xs, 2px at sm/md, 1px at lg/xl** — sharper the
bigger the swatch — against the item's own 4px and the standalone square `ColorSwatch`'s 4px.

**Root cause** `themes/tzuchi/components/color-swatch-picker.css:118-121`
`border-radius: calc(var(--tc-radius-sm, 4px) - var(--tzuchi-swatch-border-width, 2px))`, with the
helper set to 2 / 1 / 3 px at lines 101 / 107 / 112. R39's concentric step-down assumes a radius
large enough to absorb the border; 4px is already the smallest rung of the ladder
(0 · 4 · 8 · 16 · full), so the subtraction lands off-ladder every time.

**Fix** both branches (resting and `[data-selected="true"]`) now take
`border-radius: var(--tc-radius-sm, 4px)`, and the `--tzuchi-swatch-border-width` helper plus the
two per-size rules that existed only to carry it are deleted. Those two rules declared nothing
else, so no size loses anything. Specificity is unchanged — `(0,4,0)` and `(0,5,0)`, mirroring the
base's own per-size selected rules.

**After** probed 4px at **xs, sm, md, lg and xl**; item radius still 4px.
`after-csp-square-light.png` (full page), `before-csp-variants-light.png` /
`after-csp-variants-light.png` (the md Square row, side by side),
`after-csp-selected-dark.png` (xl square, selected).

**Why dropping concentricity is safe here** — on a resting item the border is transparent
(`styles/components/color-swatch-picker.css:15`), so there is no visible outer curve to be
concentric with; on a selected item the swatch is scaled to `0.77` to reveal the gap (base `:41-48`),
so it never touches the border. Verified live: ring, gap and checkmark all intact.

**Nothing broken next to it** circle variant at all five sizes (`after-csp-sizes-light.png`),
selected/focus/disabled treatments, layouts and the motion rule untouched.

---

## 4 · ProgressCircle — the track is `--border`

**QA entry** `qa-feedback-colors.md` finding 2 (medium).

**Reproduction** `components-feedback-progresscircle--sizes`, tzuchi, 700×400 —
`before-pcirc-light.png`: no visible ring at any size; at `sm` the component is a bare floating arc.
Dark: `before-pcirc-dark.png`, the ring is there but barely.

**Root cause** the base declares the track as a custom property,
`heroui/styles/components/progress-circle.css:11` `--progress-circle-track-stroke: var(--default)`,
consumed by `.progress-circle .progress-circle__track-circle { stroke: … }` (`:19-21`). The theme's
`progress-circle.css` only retimes motion and never restates it, so the track stayed on `--default`
(gray-100) on a gray-50 page — while `themes/tzuchi/components/spinner.css:61` gives the Spinner a
`--border` ring, so the family's two circular indicators read as two systems.

**Fix** `[data-theme^="tzuchi"] .progress-circle { --progress-circle-track-stroke: var(--border); }`
— `(0,2,0)` against the base's `(0,1,0)`. Re-declaring the property is the whole mechanism; the
`stroke` rule is untouched, and the five colour variants set `--progress-circle-stroke` (the FILL),
so they are unaffected.

**After** `after-pcirc-light.png` (ring clearly visible, same weight and colour as the Spinner's),
`after-pcirc-dark.png`, `after-pcirc-colors-light.png` (all five colour variants keep their fill),
`after-pcirc-label-light.png`.

**Sizes left alone, as briefed** probed after the fix:
`.progress-circle--sm .progress-circle__track` 20px, `--lg` 36px — HeroUI's 20 / 28 / 36 ladder is
untouched, so `size="md"` is still 28px here against the Spinner's 32px. That divergence is
reported, not fixed.

---

## 5 · Spinner inside an Alert — tinted track

**QA entry** `qa-feedback-colors.md` finding 3 (low).

**Reproduction** `components-feedback-alert--default`, 7th card ("Processing your request"), both
themes — `before-alert-spin-zoom-light.png` (grey donut on pale blue),
`before-alert-spin-zoom-dark.png` (grey donut on navy), in context
`before-alert-spinner-light.png`.

**Root cause** `themes/tzuchi/components/spinner.css:58-81` paints the track from
`--spinner-track: var(--border)`; the tinted-surface exception at `:102-104` is scoped to
`.spinner--current` only. An Alert's indicator is an ordinary `<Spinner size="sm">`
(`react/src/components/alert/alert.stories.tsx:119-121`), i.e. colour variant `accent`, not
`current`, so it kept the neutral ring — on a surface the theme repainted with the `*-soft` washes
(`themes/tzuchi/components/alert.css:108-126`).

**Fix** the same kind of guard the toast case already has, one level up the tree:

```
[data-theme^="tzuchi"] .alert__indicator .spinner {
  --spinner-track: color-mix(in oklab, currentColor 20%, transparent);
}
```

`(0,3,0)` beats this file's `.spinner` `(0,2,0)` and the base's `.spinner--accent` `(0,1,0)`; the
radial-gradient that paints the band stays on `.spinner` and simply reads the winning value.
`currentColor` is the card's own tone either way — base `alert.css:31-66` colours
`.alert__indicator` per status and the theme's `alert.css:131-136` overrides the four toned ones to
the raw tone, while the spinner's own `.spinner--accent { color: var(--accent) }` supplies it on the
element itself.

**After** `after-alert-spin-zoom-light.png`, `after-alert-spin-zoom-dark.png` — a faint tone-tinted
ring under the arc in both themes. Size (20px), arc colour and spin rate unchanged.
The `.toast__indicator .spinner` size guard is a different selector on a different property and is
unaffected (`after-toast-danger-dark.png` shows a toast still rendering correctly).

---

## 6 · Alert close button — bare glyph at rest

**QA entry** `qa-feedback-colors.md` finding 5 (low).

**Reproduction** `components-feedback-alert--default`, 6th card ("Profile updated successfully").
`before-alert-spinner-light.png` (a pale grey disc on the green tint),
`before-alert-close-dark.png` (close-up, dark).

**Root cause** `heroui/styles/components/close-button.css:46-48`
`.close-button--default { @apply bg-default text-muted }`, untouched by the theme's
`close-button.css` (which sets the radius only), while the theme's `alert.css` moved the card to the
`*-soft` tints. Upstream's Alert is white, so the same disc looks native there.

**Fix** the four-state guard `modal.css:112-120` and `tag.css:153-161` already use, applied through
the Alert:

```
[data-theme^="tzuchi"]
  .alert .close-button--default:not(
    :hover,
    [data-hovered="true"],
    :active,
    [data-pressed="true"]
  ) {
  background-color: transparent;
}
```

The `:not()` list is the whole point: the rule stops applying the moment any of those states is
active, so `close-button.css`'s own `bg-default-hover` and pressed `scale(0.93)` take over
untouched, and `status-focused` / `status-disabled` / `status-pending` never touch
`background-color`, so focus, disabled and pending are unaffected.
Specificity `(0,4,0)` (the `:not()` contributes its most specific argument, `[data-hovered="true"]`)
against the base variant rule's `(0,1,0)`.
Selector shape: the Alert has **no close-button slot class** — `alert.styles.ts` emits only
base/content/description/indicator/title and the story composes a plain `<CloseButton />` — so
`.alert .close-button--default` is the only form available; it is still confined to this component's
subtree, exactly like modal's and tag's versions are to theirs.

**After** measured in tzuchi-dark: rest `background-color: rgba(0,0,0,0)`, hover `rgb(79,79,79)`
(= `--default-hover`). `after-alert-close-dark.png` (rest),
`after-alert-close-hover-dark.png` (hover), `after-alert-light.png` / `final-alert-dark.png`
(in context, all eight cards).

---

## 7 · Toast — 16px between the content and the action

**QA entry** `reports/atoms4/qa-overlays.md` finding 3 (LOW).

**Reproduction** `components-feedback-toast--default`, fire the first trigger.
`before-toast-light.png`: "You have been invited to join a team" ends 12px from the "Dismiss" chip
and the two read as touching. `before-toast-danger-dark.png`: the same on the danger toast.

**Which gap it really is** `.toast` is ONE flex row (`styles/components/toast.css:57`,
`flex flex-row … gap-1.5`) whose children are the indicator, `.toast__content` (`grow`, base
`:186-188`) and — on a wide viewport — `.toast__action`; `.toast__close-button` is absolutely
positioned (base `:230-232`) and out of flow. So both the indicator↔content gap and the
content↔action gap are the single flex `gap` the theme sets to `--tc-space-8`
(`themes/tzuchi/components/toast.css:116`). Base `.toast__action` declares only `mt-2 sm:mt-0`
(base `:264-266`) — a BLOCK margin, not the separator. Because `.toast__content` is `grow`, its box
always reaches the action, so the gap is the only thing that can separate them.

**Fix** top the shared 8px gap up to 16px with an inline-start margin on the action alone:

```
[data-theme^="tzuchi"] .toast > .toast__action {
  margin-inline-start: calc(var(--tc-space-16, 16px) - var(--tc-space-8, 8px));
}
```

written as the subtraction so the intent (16px total) is legible; both tokens are mode-independent
lengths in `packages/tokens/dist/tokens.css` with fallbacks. The **child combinator is load-bearing**:
below 768px `react/src/components/toast/toast.tsx:866-872` renders the action INSIDE
`.toast__content` instead, where an inline margin would only indent the button.
Specificity `(0,3,0)` against the base's `(0,1,0)`; `margin-block` is never touched, so `mt-2 sm:mt-0`
still owns the vertical offset in both layouts.

**After** `.toast__content` width 279.094px → **271.094px** (exactly 8px), i.e. the content box now
stops 16px short of the action. `after-toast-light.png` (the title wraps to two lines rather than
running into the chip), `after-toast-danger-dark.png` (the three-line description clears the button),
`after-toast-mobile-light.png` at 420px — the action sits inside the content column, flush left, no
stray indent, i.e. the narrow layout is untouched.

---

## Could not verify / reported, not fixed

1. **Tertiary action buttons on a hovered table row** now share the row's `--default` fill, so the
   disc disappears while hovered (glyph contrast unchanged). Fixing it means giving
   `.button--tertiary` an in-row `--button-bg` from `table.css`, a cross-component reach.
2. **Danger-soft delete button on a SELECTED table row in dark** still composites to a muted
   periwinkle over `--accent-soft`; improved (the selected fill is one step calmer than before) but
   not solved. Same cross-component constraint.
3. **ProgressCircle vs Spinner size ladders** remain divergent (20/28/36 vs 20/32/40) — the brief
   says to leave ProgressCircle's sizes alone, so only the track colour moved.
4. **ProgressCircle vs ProgressBar/Meter tracks** now differ: the circle is `--border`, the bars are
   still `--default`. That is the direct consequence of the settled decision (match the Spinner
   rather than the bars) and is flagged rather than re-litigated.
5. **`table--virtualization` hover could not be driven** — `hover:.table__row:nth-child(3) …` times
   out against the virtualizer's row structure, so the sticky-header story was verified at rest only
   (`after-table-sticky-dark.png`); the rules changed are `background-color` only and are the same
   rules verified live on the two non-virtualized tables.
6. **Striped tables** could not be checked because HeroUI v3.2.6 has no striped option
   (`grep -rn "striped"` over `heroui/styles` and `heroui/react` is empty).
7. The `css:` injector cannot test REMOVALS, so item 3's deletion of
   `--tzuchi-swatch-border-width` and its two carrier rules was verified indirectly: the new
   `border-radius` declaration wins by source order and no other rule in either file references the
   helper (checked by grep across `themes/tzuchi/components/`).
