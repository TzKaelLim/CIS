# Visual QA — family "feedback-colors" (Tzu Chi theme)

Components: Alert, Spinner, ProgressBar, ProgressCircle, Meter, Skeleton,
ColorPicker, ColorSlider, ColorArea, ColorSwatch, ColorSwatchPicker, ColorField.

Themes driven: `tzuchi` and `tzuchi-dark`; every suspicious frame re-rendered in
upstream `light` / `dark` before being written up.
127 screenshots, all under
`(session screenshot, not kept) shots/fbc/`.

---

## Stories covered

| Component | Stories |
|---|---|
| Alert | `--default` (all 8 statuses incl. custom spinner indicator + close button), at 900px and at 420px |
| Spinner | `--sizes`, `--colors`; plus `components-buttons-button--with-spinner` and the Alert spinner indicator |
| ProgressBar | `--default`, `--sizes`, `--colors`, `--indeterminate`, `--custom-value`, `--without-label` |
| ProgressCircle | `--sizes`, `--colors`, `--with-label` |
| Meter | `--colors`, `--sizes`, `--custom-value`, `--without-label` |
| Skeleton | `--default`, `--grid`, `--single-shimmer` |
| ColorPicker | `--default`, `--controlled`, `--with-swatches`, `--width-fields`, `--with-sliders` (all opened by keyboard) |
| ColorSlider | `--default` (+Tab focus), `--rgb-channels`, `--alpha-channel`, `--disabled`, `--vertical`, `--without-label` |
| ColorArea | `--default` (+Tab focus), `--with-dots`, `--color-channels`, `--disabled`, `--with-color-preview` |
| ColorSwatch | `--all-variants`, `--with-color-name`, `--transparency` |
| ColorSwatchPicker | `--all-variants`, `--variants`, `--sizes`, `--layouts`, `--disabled`, `--with-custom-indicator`, `--with-default-value` (+Tab / ArrowRight focus), `--extended-palette` |
| ColorField | `--default` (+Tab focus), `--variants`, `--with-description`, `--invalid` (± focus), `--disabled`, `--rgb-channels`, `--channel-editing`, `--with-color-presets`, `--form-example`, `--all-variations` |

---

## Findings

### 1. [medium] ColorSwatchPicker `variant="square"` — the colour chip has effectively sharp corners, and gets sharper the bigger it is

The theme pins the picker *item* to `--tc-radius-sm` (4px) and then derives the
inner swatch as `calc(4px − border-width)`. Because the item's border is
1/2/2/3/3px at xs/sm/md/lg/xl, the **visible** chip ends up at
**3 / 2 / 2 / 1 / 1 px**. None of those is a step on the Tzu Chi radius ladder
(0 · 4 · 8 · 16 · full), and the roundness *decreases* as the swatch grows, so
the xl row reads as hard squares while the xs row still looks rounded. The
standalone `ColorSwatch --square` right next door is a uniform 4px, and upstream
keeps a uniform 8px, so the two "square colour chip" components in this family
no longer match.

- Reproduce: `components-colors-colorswatchpicker--variants` and `--all-variants` in `tzuchi` / `tzuchi-dark`; compare the "Square" row against the same story in `light`, and against `components-colors-colorswatch--all-variants` "Square" rows in `tzuchi`.
- Screenshots: `shots/fbc/csp-variants-tz.png` vs `shots/fbc/csp-variants-up.png`; also `csp-all-tz.png`, `csp-variants-tzd.png`, `csw-all-tz.png`.
- Probe: tzuchi `.color-swatch-picker--square .color-swatch-picker__swatch` → `border-top-left-radius: 2px`; upstream → `8px`.
- Cause: `heroui/styles/themes/tzuchi/components/color-swatch-picker.css:118-120` (`border-radius: calc(var(--tc-radius-sm, 4px) - var(--tzuchi-swatch-border-width, 2px))`), with the border-width helper set at lines 101 / 107 / 112.
- Upstream has it too: no.
- Suggested fix: don't subtract the full border from an already-4px radius. Either give the swatch the same `--tc-radius-sm` (4px) the item has, or clamp the step-down to 1px (`max(var(--tc-radius-sm) - 1px, 3px)`), so every size lands on a real ladder step and the chip stays visibly rounded.

### 2. [medium] Spinner and ProgressCircle — the family's two ring indicators now have wildly different ring weights (and different diameters)

The theme *added* a full track ring to Spinner, painted in `--border`
(#bdbdbd light / #6b6b6e dark) — clearly visible. ProgressCircle's track was
left at HeroUI's `--default` (#f2f2f2 light), which on the page background
(#f8f8f8) is invisible: at `sm` the ProgressCircle reads as a bare floating arc
with no ring at all. Put the two next to each other and they look like two
different design systems. The size scales diverged the same way: the theme moved
Spinner to 20/32/40/48 but left ProgressCircle at HeroUI's 20/28/36, so
`size="md"` means 32px for one and 28px for the other.

- Reproduce: `components-feedback-spinner--sizes` and `components-feedback-progresscircle--sizes`, both in `tzuchi`, side by side.
- Screenshots: `shots/fbc/spinner-sizes-clip-tz.png` (heavy grey ring) vs `shots/fbc/pcirc-sizes-clip-tz.png` (no visible ring); upstream reference `shots/fbc/spinner-sizes-up.png` (no ring at all) and `shots/fbc/pcirc-sizes-clip-up.png`.
- Probe: `.spinner--md` 32×32, `.progress-circle` md track 28×28.
- Cause: `heroui/styles/themes/tzuchi/components/spinner.css:61` sets `--spinner-track: var(--border)` (and 68-80 paints it), while `heroui/styles/components/progress-circle.css:11` keeps `--progress-circle-track-stroke: var(--default)` and `heroui/styles/themes/tzuchi/components/progress-circle.css` only touches motion — it never restates the track stroke or the size scale.
- Upstream has it too: no — upstream's Spinner draws no track, so there is no mismatched pair.
- Suggested fix: set `--progress-circle-track-stroke: var(--border)` (and, if the size scale is meant to follow Tzu Chi's icon ladder, give `.progress-circle__track` the same 20/32/40 steps) in the tzuchi `progress-circle.css`.

### 3. [low] Spinner as an Alert indicator — neutral grey track ring sits on the tinted alert surface

The theme's Alert surfaces are now tinted (`--accent-soft` etc.). The custom
`<Spinner size="sm">` indicator in the "Processing your request" alert uses the
default `accent` colour variant, so it gets the neutral `--border` track — a
grey donut on pale blue in light, and a grey donut on navy in dark, where the
moving arc is barely lighter than the ring. The theme already recognised this
class of problem: `.spinner--current` gets a `currentColor`-derived track
precisely "because it rides on filled surfaces (Button pending, Toast)" — the
tinted Alert is exactly such a surface but isn't covered.

- Reproduce: `components-feedback-alert--default` in `tzuchi` and `tzuchi-dark`, 7th alert ("Processing your request").
- Screenshots: `shots/fbc/alert-spin-clip-tz.png`, `shots/fbc/alert-spin-tzd.png`, in context `shots/fbc/alert-tz.png` / `alert-tzd.png`.
- Cause: `heroui/styles/themes/tzuchi/components/spinner.css:61` (`--spinner-track: var(--border)`) with the tinted-surface exception at 101-104 scoped only to `.spinner--current`.
- Upstream has it too: no (upstream Spinner has no track ring).
- Suggested fix: add `[data-theme^="tzuchi"] .alert__indicator .spinner { --spinner-track: color-mix(in oklab, currentColor 20%, transparent); }` alongside the existing `.toast__indicator` guard, so the ring tints with the status instead of staying neutral.

### 4. [low] ColorPicker "Width Fields" — the 20px field padding is completely eaten in the 72px channel fields, and the three values end up at different insets

In the channel-field row the grid cells are 72px wide. With the theme's 16px
value type and `padding-inline: 20px`, the input's content box is only ~30px, so
a 4-glyph value overflows it: "220°" (and "360°" after End) runs to within
~9px of the field border while its neighbours "90%" / "50%" keep ~15-19px. The
row therefore reads as three fields with three different paddings, and the first
one looks stuffed. Nothing is hard-clipped, but the intended 20px inset is not
honoured anywhere in that row. Upstream (14px value, 12px padding) leaves all
three comfortable and even.

- Reproduce: `components-colors-colorpicker--width-fields` in `tzuchi`, `key:Tab key:Enter`, look at the bottom three fields; press `End` in the first field to see it at "360°".
- Screenshots: `shots/fbc/cp-fields-row-tz.png` vs `shots/fbc/cp-fields-row-up.png`; `shots/fbc/cp-fields-end-tz.png`; full popover `cp-fields-tz.png` / `cp-fields-up.png`.
- Probe: `.color-input-group` 72×43.6, `.color-input-group__input` `padding-left/right: 20px`.
- Cause: `heroui/styles/themes/tzuchi/components/color-input-group.css:141` (`padding-inline: var(--tc-space-20, 20px)`) applied unconditionally to every colour input, however narrow.
- Upstream has it too: no.
- Suggested fix: make the inline padding shrink on narrow fields, e.g. `padding-inline: min(var(--tc-space-20, 20px), 12%)` or a `--tc-space-8` fallback under a container/width condition, so a 3-4 glyph channel value keeps real breathing room.

### 5. [low] Alert close button is still neutral grey on the now-tinted Alert surfaces

`.close-button--default` keeps `bg-default` (#f2f2f2 light / #333 dark) while the
theme repainted the Alert surface with the status tint. The result is a pale
grey disc stuck on the green success card (light) and a mid-grey disc on the
dark-green card (dark) — the only neutral element on an otherwise tinted card.
Upstream's Alert is white, so the same grey disc looks native there.

- Reproduce: `components-feedback-alert--default` in `tzuchi` / `tzuchi-dark`, 6th alert ("Profile updated successfully").
- Screenshots: `shots/fbc/alert-close-ctx-tz.png`, `shots/fbc/alert-close-ctx-tzd.png` vs upstream `shots/fbc/alert-close-ctx-up.png`.
- Probe: `.close-button` background `rgb(242,242,242)` (light) / `rgb(51,51,51)` (dark).
- Cause: `heroui/styles/components/close-button.css:47` (`.close-button--default { @apply bg-default text-muted }`) is untouched by `heroui/styles/themes/tzuchi/components/close-button.css`, which only sets the radius (line 88-91), while `heroui/styles/themes/tzuchi/components/alert.css:65,108-126` moved the alert surface to the `*-soft` tints.
- Upstream has it too: no (upstream Alert is not tinted).
- Suggested fix: inside an Alert, make the close button transparent-until-hover, or derive its fill from the alert tone (`color-mix(in oklab, var(--alert-accent) 12%, transparent)`), so it belongs to the card.

---

## Checked and found FINE

**Alert**
- All five statuses (default/accent/success/warning/danger) in both themes: 4px status stripe, tint, 8px radius, 16px padding all consistent; titles 16px/700, descriptions 16px, no truncation or overlap.
- Indicator icon sizing: status icons and the custom `<Spinner size="sm">` both resolve to exactly 20px — no mismatch.
- Narrow viewport (420px): the `sm:hidden` action buttons stack under the content correctly, no overlap, no horizontal scroll, bullets and text wrap cleanly.
- Dark theme: neutral alert surface (#1c1c1e) still separates from the page (#161618); all four tinted surfaces and their stripes stay distinct.

**Spinner / ProgressBar / ProgressCircle / Meter / Skeleton**
- Spinner colour variants in both themes; `--current` correctly derives its track from `currentColor`; the toast/button size guards hold (Button "With Spinner" renders correctly).
- ProgressBar & Meter render identically to each other across `--colors` and `--sizes` — pill radius at every size, 16px label + 16px muted value sharing one baseline, no wrapping, fills correct per status in both themes.
- ProgressBar/Meter `--without-label` and `--custom-value` ("Revenue / US$750.00") lay out cleanly; long custom values don't collide with the label.
- Light-theme track colour (#f2f2f2 on #f8f8f8) is very low contrast — but upstream is identical (oklch 0.94 on lab 96.5), so it is HeroUI's, not the theme's. Dark theme's track (#333 on #161618) is fine.
- ProgressCircle colour variants and `--with-label` in both themes; indeterminate spin rate matches Spinner.
- Skeleton default / grid / single-shimmer in both themes: shimmer visible in light and dark, corners and block sizes intact.

**Colour components**
- ColorPicker popover opens by keyboard in all five stories; nothing clipped — the ColorArea thumb overhangs the area's corner into the popover padding exactly as upstream does, no cut rings.
- ColorArea: focus-visible ring renders fully on all four edges; `--with-dots`, `--color-channels`, `--disabled`, `--with-color-preview` all correct; the near-invisible thumb on a white corner is upstream's `rgba(0,0,0,.1)` hairline, unchanged by the theme.
- ColorSlider: horizontal, vertical, alpha (checkerboard), RGB channels, disabled, without-label, and thumbs at both extremes (hue 0° and 349.72°) — the thumb and its focus ring overflow the track without ever being clipped by the popover.
- ColorSwatch: circle and square at all five sizes, transparency checkerboard, colour name — pixel-identical to upstream apart from the intended square 6px → 4px.
- ColorSwatchPicker: selected state (ring in the swatch's own colour + gap + checkmark) is clearly distinguishable from focus (accent ring) and from hover; disabled at 0.38 opacity reads as disabled; stack/grid layouts, extended palette and custom indicator all fine; xs swatches inside the ColorPicker popover keep their ring on the white surface.
- ColorField: label/description/field-error hierarchy, prefix and suffix swatch alignment with the value baseline, 43.6px field height consistent across every variant, primary vs secondary variants distinguishable in both themes, disabled state unmistakable, `--channel-editing` and `--rgb-channels` fields (100px) keep their padding.
- ColorField invalid state: keeps its red edge through focus, and focus only thickens it 1px → 3px, so focus is nearly invisible — **but upstream behaves the same way** (2px danger ring appearing over an already-red edge), and the theme does not make it worse, so it is not listed as a finding.
