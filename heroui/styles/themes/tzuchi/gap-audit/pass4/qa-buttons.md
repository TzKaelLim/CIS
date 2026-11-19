# Visual QA — family "buttons" (Button, ButtonGroup, ToggleButton, ToggleButtonGroup, CloseButton, Toolbar, Link)

Themes looked at: `tzuchi` and `tzuchi-dark`, with upstream `light` / `dark` renders whenever
something looked wrong. 155 screenshots, all opened and looked at, under
`(session screenshot, not kept) shots/buttons/`.

## Stories covered

Button — `--default`, `--sizes`, `--with-icon`, `--with-icon-only`, `--with-spinner`,
`--with-loading-state`, `--with-link-button`, `--with-social-button`, `--full-width`
ButtonGroup — `--default`, `--sizes`, `--variants`, `--with-icons`, `--examples`, `--disabled`,
`--without-separator`, `--full-width`
ToggleButton — `--default`, `--variants`, `--sizes`, `--icon-only`, `--controlled`, `--disabled`,
`--real-world`
ToggleButtonGroup — `--default`, `--sizes`, `--orientation`, `--attached-vs-detached`,
`--selection-mode`, `--with-labels`, `--examples`, `--disabled`, `--full-width`,
`--without-separator`
CloseButton — `--default`, `--with-custom-icon`, `--interactive`
Toolbar — `--default`, `--vertical`, `--with-button-group`, `--attached`
Link — `--default`, `--custom-icon`, `--icon-placement`, `--underline-variants`

States driven: keyboard focus-visible (`key:Tab` chains) on Button (primary / outline / ghost /
icon-only sm+lg), ButtonGroup (first and middle cell), ToggleButton, ToggleButtonGroup, CloseButton
and Link; hover on primary / secondary / outline / danger / CloseButton / Link / ToggleButton;
selected (single + multiple); disabled (whole group and per-cell override); pending (`isPending`,
both as a static story and by clicking the real loading button); full-width at a 420px viewport.

---

## Findings

### 1. HIGH — detached ToggleButtonGroup: the first and last cell are half-square "D" shapes, not circles

`components-buttons-togglebuttongroup--attached-vs-detached`, both themes, resting state.

Screenshots
`shots/buttons/90-tbg-detached-tinted.png` (cells tinted `#b0c4de` with `css:` so the shape is
unambiguous — the `--default` fill is `#f2f2f2` on a `#f8f8f8` page),
`shots/buttons/89-tbg-detached-clip-tz.png`, `shots/buttons/92-tbg-detached-tzd.png`,
`shots/buttons/77-tbg-attached-tz.png`, `shots/buttons/78-tbg-attached-tzd.png`.
Upstream for comparison: `shots/buttons/91-tbg-detached-light.png` — four identical circles.

The middle cells are proper 48px circles. The first cell has square top-left/bottom-left corners;
the last cell has square top-right/bottom-right corners. It reads as an unfinished sprite sheet,
and it is the more visible in `tzuchi-dark` where the fill is lighter than the page.

Cause (probed): on `.toggle-button-group--detached .toggle-button:first-child`,
`border-top-left-radius` computes to `24px` while the other corners are `9999px`
(`:last-child` is the mirror). HeroUI's
`heroui/styles/components/toggle-button-group.css:40-47`
(`.toggle-button-group--horizontal .toggle-button:first-child { rounded-s-3xl }` /
`:last-child { rounded-e-3xl }`, specificity 0,3,0) out-specifies the theme's
`heroui/styles/themes/tzuchi/components/toggle-button.css:164-169`
(`[data-theme^="tzuchi"] .toggle-button--icon-only { border-radius: … 9999px }`, 0,2,0), so one pair
of corners keeps HeroUI's 24px. `24px + 9999px` on one 48px side exceeds the box, so CSS's
border-radius overflow scaling divides **all four** radii by the same factor and the 24px pair
collapses to ~0.1px — square. Upstream never hits this because every corner there is the same
24px and it scales uniformly to a circle on a 36px box.

`heroui/styles/themes/tzuchi/components/toggle-button-group.css` restates the corners only for
`:not(.toggle-button-group--detached)` (lines 92-135), and its own header (lines 29-54) argues the
detached case can be left to fall through to the standalone icon-only ladder — which is true for
the *size* but not for the *radius*.

Suggested fix: add a detached block to that file, mirroring the attached one at ≥ (0,3,0), e.g.
`[data-theme^="tzuchi"] .toggle-button-group--detached .toggle-button:first-child,
[data-theme^="tzuchi"] .toggle-button-group--detached .toggle-button:last-child { border-radius: var(--tc-button-radius, var(--radius)); }`
plus an icon-only branch restating `var(--tc-icon-button-radius, var(--tc-radius-full, 9999px))`.

### 2. MEDIUM — `tzuchi-dark`: the Danger button wears the brand navy as its label colour

`components-buttons-button--default` and `components-buttons-buttongroup--variants`,
`tzuchi-dark`, resting state.

Screenshots `shots/buttons/113-btn-danger-tzd.png`, `shots/buttons/152-bg-variants-clip-tzd.png`,
`shots/buttons/103-btn-clip-tzd.png`.
Upstream dark: `shots/buttons/114-btn-danger-dark.png` (near-white on red).
Same theme, light mode: `shots/buttons/115-btn-danger-tz.png` (white on red).

Probed: `.button--danger` in `tzuchi-dark` is `color: rgb(27, 45, 88)` on
`background-color: rgb(240, 138, 142)` — i.e. the Tzu Chi brand navy on salmon. Contrast is fine
(~5.5:1); the problem is identity: a destructive control is painted in the *brand* colour, it
reads as a blue chip rather than a warning, and it contradicts light mode where the same button is
white on red. Every red control in the family inherits it (single Button, ButtonGroup variant row).

Cause: `heroui/styles/themes/tzuchi/variables.css:95` —
`--danger-foreground: var(--tc-color-blue-900);` in the dark block, versus line 51
`--danger-foreground: var(--tc-color-white);` in the light block.

Suggested fix: point the dark `--danger-foreground` at a neutral "on danger" value (the dark
theme's own near-black / `--tc-color-gray-900`, or white if the fill is darkened) instead of
`blue-900`, in `themes/tzuchi/generate.mjs` so the generated `variables.css` follows.

### 3. MEDIUM — `tzuchi-dark`: a pending / loading Button is almost invisible

`components-buttons-button--with-spinner` (static `isPending`) and
`components-buttons-button--with-loading-state` (clicked).

Screenshots `shots/buttons/99-btn-spinner-clip-tzd.png`, `shots/buttons/151-btn-loading-tzd.png`,
`shots/buttons/97-btn-spinner-clip-tz.png` (light tzuchi, also dull).
Upstream dark: `shots/buttons/112-btn-spinner-clip-dark.png` — a legible blue button with a white
label and a white spinner.

`isPending` makes react-aria set `aria-disabled`, so the Button picks up `status-disabled` →
`opacity: var(--disabled-opacity)`. The theme sets that to `0.38`
(`heroui/styles/themes/tzuchi/variables.css:23`, `--tc-opacity-disabled`) where upstream uses
`0.5` (`heroui/styles/themes/default/variables.css:23`). In `tzuchi-dark` the primary pair is
inverted (light-blue fill, navy label), so at 0.38 over `#1a1a1a` the fill lands at ≈`#505a74` and
the label at ≈`#1a2131` — roughly **2.3:1**. The spinner ring disappears into the fill. The result
is not "this button is working", it is "this button is broken".

upstreamHasItToo: true for the *mechanism* (upstream also dims pending to the disabled opacity),
false for the outcome — upstream's dark pending button stays clearly readable.

Suggested fix: give `[data-theme^="tzuchi"] .button[data-pending="true"]` its own treatment instead
of inheriting `--disabled-opacity` (e.g. keep the fill at full opacity and only dim the label /
show the spinner), or raise `--tc-opacity-disabled` for the dark block.

### 4. LOW — icon-only controls no longer share the text controls' height ladder, so a mixed row is ragged

`components-buttons-togglebutton--real-world` (a real mixed row),
`components-buttons-button--sizes`, `components-buttons-togglebutton--sizes`.

Screenshots `shots/buttons/47-tb-realworld-clip-tz.png` (34px "Like" and "Save" beside a 36px pin
circle — the circle visibly sits proud of the row), `shots/buttons/03-btn-sizes-tz.png`,
`shots/buttons/41-tb-sizes-tz.png`.
Upstream: `shots/buttons/155-tb-realworld-light.png` — probed 32px text cell and 32px icon-only
cell, exactly level; `shots/buttons/154-btn-sizes-light.png` — 32/36/40 for both ladders.

In the theme the text ladder is 34 / 42 / 50 and the icon-only ladder is 36 / 48 / 64, so a text
button and an icon-only button of the same declared `size` differ by 2px (sm), 6px (md) and 14px
(lg). Inside a ButtonGroup / attached ToggleButtonGroup the theme's own guard pulls the icon cell
back to the text rhythm, so groups and Toolbars are fine — the raggedness only shows in an
ordinary flex row, which is exactly what the Real World story is.

This is a deliberate mapping (`tc-icon-button` is a separate Tzu Chi component with its own 48/64
box, documented in `heroui/styles/themes/tzuchi/components/button.css` and
`…/toggle-button.css`), so it may be "as designed" — flagging it because it is the one thing in
this family that upstream got aligned and the theme un-aligned.

Suggested fix: if the ladders are meant to diverge, the guard that already exists for groups should
probably be extended to `.toolbar` too, and the intent documented; otherwise align the sm cell to
34px so at least the most common mixed row is level.

### 5. LOW — CloseButton is still HeroUI-sized (24px box, 16px glyph) and now looks undersized next to everything else

`components-buttons-closebutton--default` / `--interactive` / `--with-custom-icon`, both themes.

Screenshots `shots/buttons/55-close-default-tz.png`, `shots/buttons/57-close-focus-tz.png`,
`shots/buttons/59-close-interactive-tz.png`, `shots/buttons/120-close-tzd-clip.png`,
`shots/buttons/146-close-custom-clip2-tz.png`.

Probed 24×24 with 4px padding and `--muted` `#828282` on `--default` `#f2f2f2`. Every other
affordance in the family moved up (34/42/50 text, 36/48/64 icon-only), so a standalone CloseButton
now reads as a leftover from the other design system; the focus ring also nearly touches the glyph
because there is only 4px of padding to sit outside of.

upstreamHasItToo: true — the box is byte-identical to HeroUI's, and
`heroui/styles/themes/tzuchi/components/close-button.css` says so deliberately (only the radius
intent is restated, D8 argues resizing it regresses Modal / Drawer / Toast / Tag / SearchField).
Listed only because visually, in this theme, it is the most obviously out-of-scale element in the
family.

---

## Checked and found FINE

- **Button shape / density / type** — 8px radius, 16px/700 label, 24px padding-inline, 42px md box
  in both themes; sm 34 / md 42 / lg 50 step cleanly (`01`, `02`, `03`, `04`, `105`, `148`, `149`).
- **Button variants** — primary, secondary (`--accent-soft`), tertiary, outline (accent border +
  accent label), ghost, danger, danger-soft all render distinctly in both themes; outline's hover
  fill and border survive in dark (`18`, `19`, `100`, `101`, `102`, `103`).
- **Focus rings on Button** — complete, unclipped, correctly following the 8px radius and the
  icon-only circle at sm / md / lg; visible in both themes (`13`, `14`, `15`, `16`, `93`, `94`).
- **Icon-only Button** — perfect circles, glyph centred, 20/32/40px glyphs in 36/48/64 boxes, no
  overlap between neighbours (`06`, `07`, `03`).
- **Button with icon** — 16px glyph beside the 16px/700 label, baseline-aligned, no crowding, and
  the same 16px glyph upstream uses (`05`, `117`, `118`, `119`).
- **Full width** — Button and both groups stretch cleanly at a 420px viewport, no clipped labels,
  no stray scrollbars (`123`, `124`, `125`, `139`, `140`, `141`).
- **ButtonGroup** — joined corners land at 8px, separators visible in every variant including
  ghost and outline and in dark, sizes 34/42/50 hold, icon-only cells correctly pulled back to the
  group rhythm, the `--examples` compositions (Merge PR split button, Fork/Star counters,
  Previous/Next, alignment rows) all sit level with nothing clipped (`20`-`33`, `132`, `133`).
- **ButtonGroup focus ring** — first and middle cells behave exactly as upstream, including the
  square inner edge and the ring overhanging the group (`109`, `110`, `111`, `153` — upstream
  identical, so not a theme defect).
- **ButtonGroup disabled** — whole-group and per-cell-override cases both read as disabled and
  keep the joined shape in both themes (`28`, `35`, `36`).
- **ToggleButton** — 8px radius, selected = `--accent-soft` with the accent label, clearly
  distinct from rest, hover and focus in both themes; disabled reads disabled (`37`-`46`, `107`,
  `136`, `144`).
- **ToggleButtonGroup, attached** — corners, separators, single/multiple selection, vertical
  orientation, full width, without-separator and the `--examples` toolbars are all correct in both
  themes; the inset focus ring is visible on the first cell in dark (`74`, `75`, `76`, `79`-`88`,
  `126`, `127`).
- **Toolbar** — horizontal, vertical, attached and with-button-group: group heights match (42px
  everywhere), the toolbar separator is visible in both themes, icons centred, nothing cramped
  (`48`, `49`, `51`, `52`, `53`, `54`, `106`, `121`, `122`, `142`).
  (The missing divider inside the `ButtonGroup.Separator` cells of the Toolbar stories is upstream
  behaviour — `50`, `137` show the same gap.)
- **Link** — accent-hover colour, 700 weight, 4px radius, hover underline in currentColor, focus
  ring, disabled, underline variants and offsets, button-styled link: all correct in both themes
  (`61`-`67`, `72`, `73`, `134`, `135`).
  The missing gap on a *leading* `Link.Icon` is upstream's `ms-1`-only rule — `68` (upstream) and
  `69` (tzuchi) are the same, so it is not a theme defect.
- **CloseButton states** — hover fill change, focus ring and the custom-icon variant all work; only
  the scale (finding 5) is questionable (`55`-`60`, `108`, `120`, `130`, `146`).
- **No clipping, overflow or stray scrollbar** was found anywhere else in this family: no cut-off
  labels, no icons escaping their box, no shadow or ring truncated by a parent.
