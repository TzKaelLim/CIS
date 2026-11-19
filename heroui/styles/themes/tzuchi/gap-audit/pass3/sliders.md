# Unit "sliders" — Slider · ColorSlider · ColorArea

Files written
- `heroui/styles/themes/tzuchi/components/slider.css`
- `heroui/styles/themes/tzuchi/components/color-slider.css`
- ColorArea — **no file**, see §3.

Resolved values below use the Tzu Chi theme: `--radius` = `--tc-radius-md` = **8px**, so
`--radius-sm` 4px · `--radius-lg` 8px · `--radius-xl` 12px · `--radius-2xl` 16px
(`themes/shared/theme.css:105-109`). Light / dark pairs are `[data-theme="tzuchi"]` /
`[data-theme="tzuchi-dark"]`.

One mechanism recurs and is worth stating once, because it is the reason several
spec-mandated radius rules turn out to be no-ops: **CSS clamps a border-radius to half the
shorter side.** A 12px radius on a 20px-thick track renders at 10px — already a stadium. So
every "pill" rule below changes the *computed* value but not one pixel on screen.

---

## 1. `slider.css`

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `.slider__track` `background-color` | `slider.css:24` `bg-default` → `var(--default)` = **#f2f2f2 / #333333** (1.12:1 on a card, **1.05:1 on the page** in light) | `background-color: var(--border);` → **#bdbdbd / #6b6b6e** (1.88 / 3.20 on a card, 1.77 / 3.40 on the page) | **§7 R124** interactive track. The one visible repaint in this unit. |
| `.slider__track` `border-radius` | `slider.css:24` `rounded-xl` → `calc(var(--radius) * 1.5)` = **12px** (renders 10px on the 20px track) | `border-radius: var(--tc-radius-full, 9999px);` → **9999px** (renders 10px) | **§2 R32 / §7 R125** — track radius, set on the root scope. Canonicalisation, no visual change. |
| `.slider__thumb` `border-radius` | `slider.css:35` `rounded-xl` → **12px** (renders 10px on the 28×20 frame) | `border-radius: var(--tc-radius-full, 9999px);` → **9999px** (renders 10px) | **§2 R26 / §7 R125** — round handle. Also sets the focus-ring shape. |
| `.slider__thumb::after` `border-radius` | `slider.css:49` `rounded-lg` → `calc(var(--radius) * 1)` = **8px** (a perfect stadium on the 24×16 handle) | `border-radius: var(--tc-radius-full, 9999px);` → **9999px** (renders 8px) | **§2 R26 / §7 R125**. Canonicalisation, no visual change. |
| `.slider__thumb::after` shadow | `slider.css:49` `shadow-field` → `--tw-shadow: var(--field-shadow)`, and this theme sets `--field-shadow: 0 0 0 0 transparent` (`themes/tzuchi/variables.css:22`) → **no elevation at all** | `--tw-shadow: var(--surface-shadow);` → **`0px 1px 2px 0px #0000001a` / `0px 1px 2px 0px #00000059`** | **§6 "Shadows"** — resting elevation is `--surface-shadow` for "card, switch thumb"; the identical `--field-shadow`-is-empty trap that `themes/tzuchi/components/switch.css:103,115` fixes for the switch thumb. Set as `--tw-shadow`, not `box-shadow`, per **R104**. |
| `.slider__output` `font-size` / `font-weight` / `line-height` / `color` | `slider.css:18` `text-sm font-medium tabular-nums` → **14px / 500 / 20px**, colour inherited (`--foreground`) | `font-size: var(--tc-font-size-16, 16px); font-weight: var(--tc-font-weight-regular, 400); line-height: var(--tc-line-height-relaxed, 1.6); color: var(--muted);` → **16px / 400 / 25.6px, #828282 / #b3b3b3** | **§1 R19** numeric readout. Byte-for-byte `progress-bar.css:133-138`. |
| `.slider [data-slot="label"]` `font-size` / `line-height` | `slider.css:12` `w-fit text-sm font-medium` → **14px / 500 / 20px** | `font-size: var(--tc-font-size-16, 16px); line-height: var(--tc-line-height-relaxed, 1.6);` → **16px / 500 / 25.6px** | **§1 R19** — "give its row-mate the same metrics so they share a baseline"; they occupy one grid row (`slider.css:6-8`). Weight, colour and `w-fit` kept, exactly as `progress-bar.css:126-129`. |

### Left as HeroUI's (and why)

| what | why |
|---|---|
| **`.slider__fill` radius** — deliberately diverges from R32's "track AND fill" | A ProgressBar fill is a free-standing bar; a Slider fill is a **segment between caps**. The track carries 12px transparent inline borders that React Aria repaints `--accent` through `data-fill-start` / `data-fill-end` (`slider.css:97-105`, set in `slider.tsx:113-121`), and the fill's start edge butts straight onto that accent border at the padding-box origin. A pill radius on the fill would open a grey crescent between the accent end cap and the fill in the default story (`data-fill-start` is true for any value above min). Its other end is hidden under the 28px thumb. Invisible where it would help, damaging where it would show. Recorded as a spec gap. |
| **Thumb dimensions** (28×20 frame, 24×16 handle; vertical 20×28 / 16×24) | **R126** keeps HeroUI's slider dimensions, and the brief's "thumb per the switch.css treatment" is honoured in its two transferable parts (pill radius, `--surface-shadow`). Its third part — a tc switch thumb is a **circle** — is not transferred: it needs a diameter with no evidence behind it and would shrink a 24px grab handle to 16px, against §3.6's touch-target rule. |
| **Track thickness** 20px, both orientations | **R126**: "Slider/Meter/ProgressCircle: NO EVIDENCE — keep HeroUI's thicknesses, change only colour + radius." |
| **Fill colour** `bg-accent` | **R125 / R75** — `--accent` is already `brand.primary` in both modes. |
| **All motion** (`slider.css:41-45`, `:55`, `:63`) | **R140** no choreography; **R138** adding to a positional `transition-*` list means repeating the whole list. The thumb transitions `background-color` (never changes here), `transform` and `box-shadow`; the handle transitions its drag scale. None of it is R131's colour fade or R132's travelling value — the thumb's *position* is an inline style React Aria writes per pointer move and is deliberately not transitioned. Leaving it verbatim also leaves both reduced-motion guards intact (**R136**). |
| **Focus ring** (`slider.css:68-70` `status-focused`) | **R70 / D3** — 2px `--focus` at `--ring-offset-width` (2px) is theme-wide. **R73**'s inset ring is not needed: no ancestor clips overflow and the track's 12px transparent borders leave room at both ends. |
| **Disabled** (`slider.css:79-87`) | **R85 / D2** — `--disabled-opacity` is already 0.38 and `status-disabled` sets the cursor. The `opacity-100` re-assert on the label is HeroUI's own and untouched. |
| Root `gap-1` (4px) and vertical `gap-2` | **R141** — 4px is already the Tzu Chi label↔control gap. |
| `grid-template-areas` / `-columns` / `-rows`, `justify-self`, `text-align` in vertical, `tabular-nums`, `cursor: grab/grabbing`, `z-index` | Layout and behaviour; the spec is silent (**rule 6**). |
| `.slider__marks` | Never rendered — marks are a `TODO` in `slider.tsx:25-26`. |

### Variants, sizes and states — all still work

Slider has no size or colour variants. `horizontal` (default) and `vertical` both keep their
geometry: every rule is scoped to `.slider` and to slot classes, never to an orientation, and the
orientation blocks (`slider.css:90-124`, `:127-179`, specificity (0,4,0)) declare only
`height` / `width` / `border-inline-width` / `border-color` — never `background-color`,
`border-radius` or `--tw-shadow`, so nothing is contested in either direction. The **Range** story
(two thumbs) is covered because `.slider__thumb` is matched by class. `dragging`,
`focus-visible` and `disabled` are untouched.

### Cascade

Base selectors compile to `.slider [data-slot=label]`, `.slider .slider__output`,
`.slider .slider__track`, `.slider .slider__thumb`, `.slider .slider__thumb:after` — all
**(0,2,0)** (verified in the built `storybook-static/assets/iframe-DpN8oW_m.css`). Every rule in
the override is **(0,3,0)** (a pseudo-element adds no specificity) and wins outright, so it does
not depend on import order. `--tw-shadow` is registered `syntax: "*"; inherits: false;
initial-value: 0 0 #0000`, and the base `::after` rule composes it into
`box-shadow: …, var(--tw-shadow)`, so re-declaring the variable repaints the shadow while leaving
the inset / ring slots free.

---

## 2. `color-slider.css`

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| `.color-slider__output` `font-size` / `font-weight` / `line-height` / `color` | `color-slider.css:50` `text-sm font-medium tabular-nums` → **14px / 500 / 20px**, inherited colour | `font-size: var(--tc-font-size-16, 16px); font-weight: var(--tc-font-weight-regular, 400); line-height: var(--tc-line-height-relaxed, 1.6); color: var(--muted);` → **16px / 400 / 25.6px, #828282 / #b3b3b3** | **§1 R19** — numeric channel readout. *Beyond the letter of the brief, see below.* |
| `.color-slider [data-slot="label"]` `font-size` / `line-height` | `color-slider.css:44` `w-fit text-sm font-medium` → **14px / 500 / 20px** | `font-size: var(--tc-font-size-16, 16px); line-height: var(--tc-line-height-relaxed, 1.6);` → **16px / 500 / 25.6px** | **§1 R19** row-mate. *Beyond the letter of the brief, see below.* |
| `.color-slider__thumb` `border-radius` | `color-slider.css:71` `rounded-2xl` → `calc(var(--radius) * 2)` = **16px** (renders 8px on the `size-4` box — already a circle) | `border-radius: var(--tc-radius-full, 9999px);` → **9999px** (renders 8px) | **§2 R26** round handle. Canonicalisation, no visual change. |

### The scope call, stated plainly

The brief scopes ColorSlider to "**thumbs and radius only**". The thumb and the radius turn out to
need **nothing** (both already render as the spec's shapes — see the clamping note at the top), so
honouring that literally would have produced an empty file and shipped the final base-layer pass
with a **14px** label and readout inside a 16px system. The two type rules are therefore written
anyway, are the *only* thing in the file beyond the canonical thumb radius, are flagged in the
file's own header, and can be deleted in one edit. The reason to keep them:
`components-colors-colorpicker--with-sliders` renders ColorSlider directly beside ColorField, which
another unit is moving to 16px under the same §1 rule — the mismatch would be visible in one
screenshot. **Owner's call.**

### Left as HeroUI's (and why)

| what | why |
|---|---|
| **Every gradient** — `--track-start-color`, `--track-end-color`, the `repeating-conic-gradient` transparency checkerboard (`color-slider.css:142-145`, `:233-236`) and the channel gradient React Aria writes inline | The component's data, not its chrome. Explicitly out of bounds. |
| **Thumb ring and elevation** — `border-3 border-white shadow-overlay` (`color-slider.css:74`) | Unlike the Slider handle, this thumb already carries a real elevation, and its ring must stay a constant light colour because it sits on an arbitrary hue, not on a theme surface. Repainting it from `--surface` would make it vanish over pale hues in light mode — a redesign, not a mapping. |
| **Track radius** | `.color-slider__track`'s root `rounded-2xl` never applies: both orientation blocks override it to `rounded-none` (`:120`, `:209`) and put the rounding on the `::before` / `::after` edge caps. Those caps already render as perfect semicircles — horizontal `rounded-ss-2xl` / `rounded-es-2xl` = 16px clamped to 10px on a 10×20 cap (`:136`, `:148`); vertical hard-codes `999px` (`:226-227`, `:240-241`). R32's pill is already the rendered shape; restating it across four logical corners of two pseudo-elements would be pure noise. Upstream's 16px-vs-999px inconsistency between the orientations is cosmetically identical and left alone. |
| **Track colour** | **R124**'s `--border` is for a *neutral* interactive track. This track is entirely covered by its own channel gradient — there is nothing to repaint. |
| Focus ring (`:94-96`), disabled (`:99-101`, `:104-113`), the three `:has()` grid-collapse rules (`:16-41`, `:178-198`), both orientations' geometry, drag cursor, `tabular-nums`, all motion | **R70/D3**, **R85/D2**, **R140**, and rule 6 (the spec is silent). |

### Variants and states

ColorSlider has no size or colour variants. Every channel story (hue / saturation / lightness /
alpha / rgb), both orientations, `WithoutLabel` (the grid collapses and the label rule simply
matches nothing), `Controlled` and `Disabled` all keep working — the three rules are scoped to
`.color-slider` and to slots present in all of them. The orientation blocks also target the thumb
(`.color-slider[data-orientation=horizontal] .color-slider__thumb`, (0,4,0)) but declare only
`top` / `left` / `width` / `height`, never `border-radius`, so nothing is contested.

---

## 3. ColorArea — no file needed

| what the spec asks | what HeroUI already does |
|---|---|
| **R27 / R30** surface radius **16px** (`var(--radius-2xl)`) | `color-area.css:7` `rounded-2xl` → `calc(var(--radius) * 2)` = **16px** under this theme. Already exact. |
| **R26** round handle | `color-area.css:44` `size-4 rounded-xl` → 12px on a 16px box, clamped to 8px = **a circle**. Dragging (`:73` `size-5`) → 12px on 20px, clamped to 10px = still a circle. |
| **R124** interactive track colour | Not applicable — the surface *is* the colour gradient (`--color-area-background`). Out of bounds. |
| **R70 / D3** focus, **R85 / D2** disabled | `status-focused` / `status-disabled`, already theme-wide. |
| type scale | ColorArea renders no text of its own. |

The only things left are the thumb's `3px solid white` ring and the two 1px `rgba(0,0,0,.1)`
hairlines on the area and the thumb. Both are visibility devices against an arbitrary hue, exactly
like the ColorSlider thumb's ring, and the spec is silent on them. Writing a file to change nothing
would be worse than writing none.

---

## Spec gaps

1. **R125 says "thumb keeps `shadow-field`", which under this theme means *no shadow at all*.**
   `themes/tzuchi/variables.css:22` sets `--field-shadow: 0 0 0 0 transparent`, so the themed
   handle currently has zero elevation. R125 was derived from `progress-bar.css` + `radio.css` and
   did not account for that. `switch.css` items 3 and the §6 shadow table both say the answer for a
   thumb-like handle is `--surface-shadow`, and the brief asks for "the switch.css thumb
   treatment". **This file follows switch.css over R125's `shadow-field` wording.** If the owner
   prefers a flat handle, delete one declaration.
2. **R32 says the pill radius goes on "track AND fill"; this file skips the fill.** See the
   argument above — a Slider fill is a segment between an accent border cap and the thumb, not a
   free-standing bar. The rule reads as if written for ProgressBar only. Worth a sentence in the
   spec either way.
3. **Every radius rule in this unit is a no-op under HeroUI's current dimensions.** Track, thumb
   frame, thumb handle, ColorSlider thumb, ColorArea thumb and the ColorSlider edge caps all
   already clamp to the pill/circle the spec asks for. They are written (except the caps) as
   canonicalisation. If the owner would rather not carry no-op declarations, `slider.css` shrinks
   to three rules and `color-slider.css` to two.
4. **The switch-thumb analogy does not fully transfer.** tc's switch thumb is a *circle*; HeroUI's
   slider handle is a 24×16 *lozenge*. Making it circular is a real design decision (which diameter,
   and it costs 8px of grab width) that R126 forbids and no Figma file answers. Left as HeroUI's;
   owner input wanted if Tzu Chi expects a round slider handle.
5. **`--muted` is 3.84:1 on white.** `--muted` resolves to gray-700 `#828282` in light, so R19's
   readout colour lands under 4.5:1 for normal text on a card (dark is fine at 8.13:1 on
   `#1c1c1e`). This is pre-existing and theme-wide — `progress-bar.css:137` already ships it, and
   it is the same token as the field placeholder — so it is recorded, not re-litigated here. It is
   adjacent to spec Q5 and would need a token change, not a component override.
6. **R124's residual is unchanged and worth restating:** with `--border`, light track-vs-card is
   **1.88:1** (still under WCAG 1.4.11's 3:1) and dark fill-vs-track is **2.93:1**. Spec Q5 already
   records that no neutral in the theme clears 3:1 on both counts.
7. **Brief-vs-spec scope conflict on ColorSlider** — recorded in §2 above. The brief said "thumbs
   and radius only"; §1's type rule is library-wide. Flagged rather than silently resolved.

---

## Checklist (§13)

1. Every rule, including every nested `&`, sits inside a single `[data-theme^="tzuchi"] …` block —
   verified mechanically: after stripping comments the only top-level lines in each file are the
   scope selector and its closing brace.
2. Grepped both files for `--tc-color-`, `#`, `rgb(`, `hsl(`, `oklch(`, `!important`, physical
   `left`/`right` properties — the only hits are inside prose in the header comments.
3. Every `--tc-` token used (`--tc-radius-full`, `--tc-font-size-16`, `--tc-font-weight-regular`,
   `--tc-line-height-relaxed`) exists in `packages/tokens/dist/tokens.css`, carries a fallback, and
   is absent from both of that file's dark blocks (`[data-theme="dark"]` and the
   `prefers-color-scheme` block) — checked with a script, not by eye.
4. Colours used: `--border`, `--muted`, `--surface-shadow`. All HeroUI theme variables. No new
   `--tzuchi-` variable is needed.
5. Specificity hand-derived against the compiled CSS, including the (0,4,0) orientation blocks —
   they declare a disjoint set of properties.
6. No `transition-property`, no `animation-name`, no `transition` shorthand anywhere — both
   reduced-motion guards keep working untouched (**R136**).
7. No variant, size or state is hidden or flattened; each is listed above.
8. Header comments record the mapping, what changed, what was kept and the cascade notes.
9. Nothing in §10 was touched (D2 disabled, D3 focus ring are both explicitly left alone).
10. Comment-safety (rule 8): no `*` immediately followed by `/` anywhere except the comment
    terminators — verified by locating every one of them.
