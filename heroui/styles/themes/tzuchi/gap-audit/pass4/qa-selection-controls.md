# Visual QA — selection-controls (Checkbox, CheckboxGroup, RadioGroup, Switch, SwitchGroup, Slider)

Themes: `tzuchi` / `tzuchi-dark`, compared against upstream `light` / `dark`.
Tool: `tools/qa-shot.cjs` against the static Storybook build. 150 screenshots in
`(session screenshot, not kept) shots/selection/`.

## Stories covered

**Checkbox** — default, variants, with-description, with-custom-indicator, indeterminate,
control-only, disabled, invalid, full-rounded, features-and-add-ons-example.
**CheckboxGroup** — default, with-custom-indicator, indeterminate, validation (incl. submit),
disabled.
**RadioGroup** — default, variants, per-radio-invalid, with-custom-indicator, orientation,
validation (incl. submit), disabled, delivery-and-payment-example.
**Switch** — default, default-selected, disabled, disabled-default-selected, invalid,
validation, sizes, label-before, with-description, without-label, with-icons,
with-custom-styles.
**SwitchGroup** — default, horizontal, form (incl. submit).
**Slider** — default, range, vertical, disabled (+ keyboard Home/End/Arrow, focus-visible).

States driven: keyboard focus (`key:Tab`), toggle via Space, real hover, form submit to raise
validation, slider keyboard travel to both ends, viewport widths 300 / 380 / 700–900 px.

---

## Findings

### 1. HIGH — Switch: a **disabled, off** switch has no visible thumb (both themes)

Screenshot: `shots/selection/sw-disabled-zoom-lt.png` (tzuchi), `sw-disabled-zoom-dk.png`
(tzuchi-dark), `sw-disabled-lt.png` / `sw-disabled-dk.png` in context.
Upstream for comparison: `sw-disabled-zoom-up.png` — thumb clearly readable.

Repro: `components-controls-switch--disabled`, theme `tzuchi` (and `tzuchi-dark`), no
interaction. The control renders as a featureless grey pill: you cannot tell whether the
disabled switch is on or off.

Measured (probe): track `rgb(130,130,130)` under the wrapper's `opacity: .38` → ≈ `#c6c6c6`
on `#f8f8f8`; thumb `oklab(0.32109 … / 0.2)` composited on that track and then dimmed →
≈ `#c0c0c0`. Under ~2 % difference. Upstream light: track `oklch(0.94 …)` ≈ `#eee`, same
20 % dark thumb → ≈ `#c5c5c7`, a clear step.

Cause: the theme darkens the **off** track from HeroUI's faint `--default` to a strong grey —
`heroui/styles/themes/tzuchi/components/switch.css:73`
`--switch-control-bg: var(--tzuchi-switch-track-bg, var(--muted));` — while HeroUI still
paints the disabled thumb as a *translucent dark* that was designed for a near-white track:
`heroui/styles/components/switch.css:24-26`
(`&[data-disabled="true"] { .switch__thumb { @apply bg-default-foreground/20; } }`, the
`@apply` on line 25).
The theme's `.switch__thumb` block (switch.css:97-106) restates size/radius/shadow but never
the disabled fill, so HeroUI's translucent rule survives on top of the new dark track.

Suggested fix: in `switch.css`, give the disabled thumb an opaque fill of its own (the resting
white thumb, or `--field-background`) instead of letting `bg-default-foreground/20` stand.
Disabled + **selected** is less bad (`sw-disabled-sel-lt.png`) but the same rule applies.

### 2. MEDIUM — Switch (dark only): the ON thumb turns dark navy instead of white

Screenshots: `sw-sel-dk.png` (on, navy thumb) vs `sw-default-dk.png` (off, white thumb);
`sw-icons-dk.png` shows the consequence for icon thumbs. Upstream dark keeps white:
`sw-sel-updk.png`.

Repro: `components-controls-switch--default-selected`, theme `tzuchi-dark`.

Probe: `tzuchi-dark` on-thumb `background-color: rgb(27,45,88)`; off-thumb
`rgb(255,255,255)`. In `tzuchi` (light) both states are `rgb(255,255,255)`.

Cause: HeroUI paints the checked thumb `bg-accent-foreground`
(`heroui/styles/components/switch.css:183-185`), which in `tzuchi-dark` resolves to the dark
navy `#1b2d58` because the dark accent is a light blue. The theme's own file explicitly leaves
this alone — `heroui/styles/themes/tzuchi/components/switch.css:109-110`
("Colours (bg-accent-foreground / text-accent) stay HeroUI's") — but that contradicts the
recorded Figma decision in
`packages/components/src/switch/tc-switch.styles.ts:29-38`:
"The sliding thumb. A constant white reads on both track colours … `--tc-switch-thumb-bg: #fff`".
It is also worst in `--with-icons`, where the story's `text-blue-600` / `text-red-600` glyphs
now sit on navy instead of white.

Suggested fix: pin the thumb fill in `switch.css` (e.g. `--tzuchi-switch-thumb-bg: #fff`) for
both states rather than inheriting `--accent-foreground`.

### 3. MEDIUM — Slider (dark only): the handle is dark navy, not white

Screenshots: `sl-default-dk.png`, `sl-range-dk.png` (two dark handles read as holes punched in
the blue bar), `sl-min-dk.png` (handle on the grey unfilled track), `sl-disabled-dk.png`
(handle nearly gone). Upstream dark: `sl-default-updk.png` — white handle.

Repro: `components-controls-slider--range` / `--default`, theme `tzuchi-dark`.

Cause: same token path as #2 — the visible handle is `.slider__thumb::after`, painted
`bg-accent-foreground` by `heroui/styles/components/slider.css:49`. The theme's slider
override (`heroui/styles/themes/tzuchi/components/slider.css:221-224`) changes only the radius
and the shadow, so the handle flips to `#1b2d58` in dark mode. In light it is white
(`sl-default-lt.png`), so the component's handle identity is not the same in the two themes.
Worst at the bottom of the range, where a navy handle sits on the `#6b6b6e` unfilled track.

### 4. MEDIUM — Disabled RadioGroup / CheckboxGroup: the group **description** is the only thing that is not dimmed

Screenshots: `rg-disabled-lt.png`, `rg-disabled-dk.png`, `cbg-disabled-dk.png`.
Upstream: `rg-disabled-up.png`.

Repro: `components-forms-radiogroup--disabled` (or `components-forms-checkboxgroup--disabled`),
either tzuchi theme, no interaction. "Plan changes are temporarily paused while we roll out
updates." renders at full strength while the bold group label above it and every option below
it are faded — the disabled block's most prominent text is its helper line.

Probe (tzuchi light): `.radio-group > [data-slot="label"]` → `opacity: 0.38`,
`.radio > [data-slot="description"]` → `opacity: 0.38`, but
`.radio-group > [data-slot="description"]` → `opacity: 1`, `color: rgb(130,130,130)`.

Cause: HeroUI's `status-disabled` is applied to the group label and to the per-item
description/field-error but never to the **group-level** description
(`heroui/styles/components/radio.css` / `checkbox.css` disabled blocks cover
`[data-slot="description"]` only inside the item). Upstream shows the same `opacity: 1`, so the
bug is HeroUI's — **but the theme makes it clearly worse**: `--disabled-opacity` is
`var(--tc-opacity-disabled)` = 0.38 (`themes/tzuchi/variables.css:23`) against upstream's 0.5,
and the description is 16 px instead of 12 px, so the undimmed line now dominates.
`upstreamHasItToo: true`.

### 5. MEDIUM — RadioGroup "With Custom Indicator": the selected radio's checkmark is invisible

Screenshots: `rg-custind-lt.png`, close-up `rg-custind-probe.png` and `rg-custind-dk2.png`.
Upstream: `rg-custind-up.png` — a white ✓ knocked out of a solid blue disc.

Repro: `components-forms-radiogroup--with-custom-indicator`, theme `tzuchi` or `tzuchi-dark`.
"Premium Plan" is selected; its ✓ is all but invisible.

Probe: selected `.radio__control` in tzuchi → `background-color: rgb(255,255,255)`,
`border-top-color: rgb(27,45,88)`. Upstream → `background-color: oklch(0.6204 0.195 253.83)`
(the accent fill).

Cause: `heroui/styles/themes/tzuchi/components/radio.css:106-112` deliberately keeps the field
background on the selected control ("ring + dot", documented at radio.css:11-12) instead of
HeroUI's accent fill. That is a valid Tzu Chi decision, but it silently breaks HeroUI's
`Radio.Indicator` render-prop contract, where a custom glyph is expected to be drawn *on the
accent fill* — the story's `text-background` glyph now sits on the page background. Any
consumer following the HeroUI docs pattern will hit this.

Suggested fix: either fill the selected control with `--accent` when the indicator is not the
default dot (`.radio__indicator:not(:empty)`), or document the ring+dot contract and change the
custom-indicator guidance.

### 6. MEDIUM — RadioGroup delivery example: the three delivery cards no longer line up

Screenshot: `rg-delivery-lt.png` (and `rg-delivery-dk.png`). Upstream: `rg-delivery-up.png` —
all three cards the same height, all three prices on one baseline.

Repro: `components-forms-radiogroup--delivery-and-payment-example`, theme `tzuchi`, 900 px
viewport.

At 16 px "4-10 business days" and "2-5 business days" wrap to two lines while "1 business day"
stays on one, so the "Super Fast" card ends ~50 px short of its neighbours and its `$25.00`
sits a line higher. Upstream's 12 px description fits on one line everywhere, so the defect
never shows.

Cause: the theme's description type (`themes/tzuchi/components/description.css`, 12 px → 16 px)
inside the story's `grid md:grid-cols-3` at `max-w-lg`. The reason the short card does not
stretch is HeroUI's structure — `.radio` is `flex flex-col items-start` (base `radio.css:14`),
so `Radio.Content` keeps its natural height inside a stretched grid item. The wrap is the
theme's; the ragged bottom edge is HeroUI's latent bug that the bigger type exposes.

### 7. LOW — RadioGroup `orientation="horizontal"` wraps one option sooner

Screenshot: `rg-orient-lt.png`. Upstream: `rg-orient-up.png`.

Repro: `components-forms-radiogroup--orientation`, theme `tzuchi`, 900 px viewport. Upstream
fits Starter / Pro / Teams on one row; tzuchi's 32 px controls + 16 px label and description
push "Teams" onto a second row, so a control that reads as a single horizontal strip upstream
reads as a ragged 2-row block. Nothing is clipped or overlapping — it is a reflow, not a break.

---

## Checked and found FINE

- **Checkbox** control 32 × 32, 2 px border, 4 px radius; checkmark and indeterminate bar scale
  correctly with the 75 % relative indicator (`cb-checked-lt.png`, `cb-indet-clip-lt.png`,
  `cb-custind-lt.png` / `-dk`). Custom heart / plus / minus indicators all centred.
- **Focus rings** on Checkbox, Radio, Switch, Slider (both orientations, both range thumbs, at
  min and max) — present, correctly placed, never clipped: `cb-focus-lt.png`, `rg-focus-lt.png`,
  `sw-focus-lt.png` / `-dk`, `sl-focus-lt.png` / `-dk`, `sl-range-focus-lt.png`,
  `sl-vert-focus-lt.png`, `sl-min-lt.png`, `sl-max-lt.png`.
- **Hover vs selected vs focused** are all distinguishable on Checkbox and Radio: rest border
  `#828282` → hover `#1b2d58` (navy) → selected navy fill / navy ring + dot
  (`cb-hover-lt.png`, `rg-hover-lt.png`).
- **Description / field-error indent** under the control: checkbox and radio 40 px
  (= 32 control + 8 gap), switch 52 px (= 44 + 8) — all three land exactly under the label text
  in every story and at 300 px width, where labels wrap cleanly under the indent
  (`cbg-narrow-lt.png`, `cb-narrow-lt.png`, `sw-narrow-lt.png`, `sw-desc-lt.png`).
- **Validation**: group label goes danger red, every control border goes red, the error line is
  red 16 px and correctly indented — CheckboxGroup (`cbg-submit-lt.png` / `-dk`) and RadioGroup
  (`rg-submit-lt.png`). Matches upstream's layout (`cbg-submit-up.png`).
- **Switch** geometry 44 × 24 / 36 × 20 / 52 × 28 with an 18/14/22 px thumb and a 3 px inset —
  matches `--tc-switch-*` and tc-switch.styles.ts; thumb travel exact at every size and for the
  story's custom 51 × 31 control (`sw-sizes-lt.png`, `sw-custom-lt.png`).
- **Switch label-before, without-label, with-description** all align correctly
  (`sw-labelbefore-lt.png`, `sw-nolabel-lt.png`, `sw-desc-lt.png`).
- **SwitchGroup** default / horizontal / form — spacing and alignment fine in both themes
  (`swg-default-lt.png` / `-dk`, `swg-horiz-lt.png`, `swg-form-lt.png` / `-dk`).
- **Slider** track 20 px pill, thumb 28 × 20, fill, label/output grid, vertical variant and the
  range variant all render as upstream does; no overflow at 380 px and the same readout
  truncation as upstream at 300 px (`sl-w380-lt.png` vs `sl-w380-up.png`).
- **Slider readout muted grey** (`#828282`, 16 px / 400) while the label stays `#333` / 500 — a
  deliberate decision, `themes/tzuchi/components/slider.css:189-196` (R19, tc's `.value`), not a
  defect.
- **Checkbox "Full Rounded"** story: sizes come entirely from the story's own `size-3/4/5/6`
  utilities; the theme's relative indicator keeps the glyph proportional at each
  (`cb-rounded-lt.png`).
- **No clipping, overflow or stray scrollbars** anywhere in this family: no ring, shadow, text
  or icon is cut off, and nothing escapes its box in any of the 150 shots.

## Upstream parity (present in HeroUI too — not reported)

- `<FieldError>` under a bare Checkbox / Switch renders **grey, not red** — HeroUI deliberately
  repaints it `text-muted` there (`styles/components/field-error.css:19-27`). Same in upstream
  (`sw-invalid-up.png` vs `sw-invalid-lt.png`); the theme only changes its size.
- `isInvalid` on an individual `<Radio>` sets no `data-invalid` at all, so nothing turns red —
  probing `.radio[data-invalid="true"]` returns NO MATCH in `light` and in `tzuchi` alike
  (`rg-perinvalid-lt.png` / `rg-perinvalid-up.png`).
- `isInvalid` on a `<Switch>` gives the track no danger colour in either theme
  (`sw-invalid-lt.png`, `sw-invalid-up.png`).
- The slider handle's accent ring merges with the fill on the filled side in both themes — it is
  the same `.slider__thumb` / `::after` construction upstream uses.
