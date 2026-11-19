# Fix unit "controls" — pass 5

Scope: Switch, Slider, ToggleButtonGroup, Button, Tag.
Files replaced (full copies, headers kept, dated `Pass 5:` paragraph appended):

- `heroui/styles/themes/tzuchi/components/switch.css`
- `heroui/styles/themes/tzuchi/components/slider.css`
- `heroui/styles/themes/tzuchi/components/toggle-button-group.css`
- `heroui/styles/themes/tzuchi/components/button.css`
- `heroui/styles/themes/tzuchi/components/tag.css`

`toggle-button.css` was in the unit's allow-list but needed no change: the detached-corner
defect (item 4) is a ToggleButtonGroup corner rule, and the correct place to beat it is the
group file, whose selectors already carry the group class. Nothing in `toggle-button.css` had
to move.

Method for every item: read the QA entry, reproduce it and screenshot it (`before-*.png`),
write the candidate, inject it with `css:` in **both** themes (`after-*.png`), look at the
render and at the `probe:` numbers, then re-render the neighbouring variants / sizes / states.
Finally each **whole assembled file** was injected again (`final-*.png`) to prove the file
parses end to end and that the rules from its far end still apply.

Screenshots: `(session screenshot, not kept) shots/controls/`

All five files were re-scanned after editing: comment `/*` and `*/` counts balance in each,
no `!important`, no `--tc-color-*`, no hex / `rgb()` / `hsl()` / `oklch()` literal, no physical
`left` / `right`, every rule scoped by `[data-theme^="tzuchi"]`. The only colour values
introduced are `var(--white)` and `var(--border)`, both HeroUI theme variables.

---

## 1 · [HIGH] Disabled OFF Switch is a featureless grey pill

**Reproduction** — `components-controls-switch--disabled`, theme `tzuchi`, no interaction.
`before-sw-disabled-lt.png` (and `before-sw-disabled-dk.png`): a plain grey lozenge; you cannot
tell whether it is on or off.
Probed: track `rgb(130,130,130)`, thumb `oklab(0.32109 … / 0.2)` composited on it, both then
dimmed by the wrapper's `opacity: .38` → under 2 % apart.

**Root cause** — `heroui/styles/components/switch.css:24-26`
(`&[data-disabled="true"] { .switch__thumb { @apply bg-default-foreground/20 } }`): a
*translucent dark* thumb designed for HeroUI's near-white off track. This theme replaces the
off track with the tc "border-strong" grey
(`themes/tzuchi/components/switch.css:73`, `--switch-control-bg: var(--tzuchi-switch-track-bg, var(--muted))`),
and the theme's own `.switch__thumb` block (:97-108) never restated the fill, so the
translucent rule survived on top of the new dark track.

**Fix** — see item 2; one set of rules covers both. `after-sw-disabled-lt.png`,
`after-sw-disabled-dk.png`, `final-sw-disabled-dk.png` — a solid white thumb at both ends,
the wrapper opacity alone saying "disabled".

Disabled **+ on** had a second layer: `heroui/styles/components/switch.css:54-64` puts an extra
`opacity: 0.4` on the thumb, on top of the wrapper's 0.38. The brief's decision — "only the
wrapper's opacity communicates disabled" — is implemented literally: that thumb opacity is
released to 1, so a disabled ON switch still reads as ON.
`before-sw-dissel-lt.png` → `after-sw-dissel-lt.png`.

## 2 · Switch ON thumb turns navy in `tzuchi-dark`

**Reproduction** — `components-controls-switch--default-selected`, theme `tzuchi-dark`.
`before-sw-on-dk.png`: probed `background-color: rgb(27,45,88)` on the light-blue track, while
the OFF thumb (`--default`) is `rgb(255,255,255)`. In `tzuchi` both states are white — the
component had two different handle identities across the two modes.

**Root cause** — `heroui/styles/components/switch.css:183-185`
(`.switch[aria-checked="true"] .switch__thumb { @apply … bg-accent-foreground … }`).
`--accent-foreground` is blue-900 in the dark theme (`themes/tzuchi/variables.css`), because
the dark accent is a light blue. The theme's file explicitly deferred to HeroUI here
(`themes/tzuchi/components/switch.css:110-111`), which contradicts
`packages/components/src/switch/tc-switch.styles.ts:29-38`
— "A constant white reads on both track colours, in light AND dark themes, so it intentionally
does not use a text token", `--tc-switch-thumb-bg: #fff`.

**Fix** — three rules appended to `switch.css`, pinning `background-color: var(--white)` in
every state:

| tier | selector | specificity | base rule it must beat |
|---|---|---|---|
| rest | `[data-theme^="tzuchi"] .switch .switch__thumb` | (0,3,0) | `.switch .switch__thumb` (0,2,0) |
| checked / disabled | `… .switch:is([aria-checked="true"], [data-selected="true"]) .switch__thumb` and `… .switch:is([data-disabled="true"], [aria-disabled="true"], :disabled) .switch__thumb` | (0,4,0) | `.switch[aria-checked="true"] .switch__thumb` and `.switch[data-disabled="true"] .switch__thumb`, both (0,3,0) |
| disabled + checked | `… .switch:is(disabled…):is(checked…) .switch__thumb` (`+ opacity: 1`) | (0,5,0) | `.switch[data-disabled="true"][aria-checked="true"] .switch__thumb { opacity: .4 }` (0,4,0) |

Why that specificity: HeroUI's checked and disabled thumb rules are (0,3,0), i.e. they *tie*
with the obvious `[data-theme^="tzuchi"] .switch .switch__thumb` form; a tie would be decided by
import order only. One compound higher at each tier makes every override win on specificity
alone. `:is()` contributes its most specific argument, here one attribute selector (or
`:disabled`, also (0,1,0)).

`--white` is a HeroUI *primitive* declared on `:root, :host` in `themes/default/variables.css:12`
and never re-declared per mode, so "constant white" is true by construction — no
`--tc-color-*`, no literal.

**After** — `after-sw-on-dk.png` (white thumb on the light-blue track),
`after-sw-icons-dk.png` / `after-sw-icons-dk-zoom.png` (the `--with-icons` story),
`after-sw-sizes-dk.png` (sm / md / lg), `after-sw-custom-dk.png` vs
`before-sw-custom-dk.png` (the story-styled 51 × 31 switch — byte-identical, its own class wins).

**Residual, worth the owner's eye (not fixed, outside the brief's decision).** In
`--with-icons` the base also paints the checked thumb's *content* `text-accent`
(same base rule, :185). Four of the five switches in that story set their own glyph colour
(`text-red-600`, `text-purple-600`, …) and now read far better on white than they did on navy.
The fifth (`darkMode`) passes an empty `selectedIconClass`, so its glyph inherits `--accent`,
which in `tzuchi-dark` is the pale blue `rgb(169,194,234)` — on a white thumb that is roughly
1.3:1, where on the old navy thumb it was legible. tc-switch has no icon slot, so Tzu Chi
records no rule for this, and the brief's decision covers the fill only; changing the thumb's
`color` would need a new decision (no single theme variable is dark in both modes).

## 3 · Slider handle is navy in dark

**Reproduction** — `components-controls-slider--range`, theme `tzuchi-dark`.
`before-sl-range-dk.png`: two navy handles reading as holes punched in the blue bar.

**Root cause** — the visible handle is the pseudo-element, painted by
`heroui/styles/components/slider.css:49` (`&::after { @apply … bg-accent-foreground … }`) —
the same token path as item 2. The theme's override
(`themes/tzuchi/components/slider.css:221-224`) changed only the radius and `--tw-shadow`.

**Fix** — one declaration added to that existing block:

```
[data-theme^="tzuchi"] .slider { & .slider__thumb::after { background-color: var(--white); } }
```

(0,3,0) plus a pseudo-element against the base's (0,2,0), so it wins on specificity alone and
does not depend on import order. One declaration covers **rest, hover, dragging, focus-visible
and disabled** because no base rule repaints that pseudo-element in any of those states
(dragging only scales it, focus rings the parent, disabled only sets the root's opacity and a
cursor); it covers **single and range** because `.slider__thumb` is selected by class; and it
covers **horizontal and vertical** because the orientation blocks (0,3,0) declare only
`width` / `height` on the pseudo-element, a disjoint property set.

The integrator's new track colour is untouched — `final-sl-range-dk.png` re-probes
`.slider__track` at `rgb(149,150,155)` = `--tzuchi-border-strong`.

**After** — `after-sl-range-dk.png`, `after-sl-disabled-dk.png` (the disabled handle is legible
again), `after-sl-vert-dk.png`, `after-sl-default-lt.png` (light unchanged: `--accent-foreground`
was already white there). `.color-slider` has its own class names and is not matched.

## 4 · [HIGH] Detached ToggleButtonGroup: first and last cells are half-square

**Reproduction** — `components-buttons-togglebuttongroup--attached-vs-detached`, either theme.
`before-tbg-detached-lt.png`: the two middle cells are 48px circles, the first has square
start corners and the last square end corners. Probed on the first cell:
`border-top-left-radius: 24px` while the other three corners are `9999px`.

**Root cause** — `heroui/styles/components/toggle-button-group.css:40-47`
(`.toggle-button-group--horizontal .toggle-button:first-child { rounded-s-3xl }` / `:last-child
{ rounded-e-3xl }`) is **not** excluded from detached mode and is (0,3,0), out-specifying
`themes/tzuchi/components/toggle-button.css:164-169`
(`[data-theme^="tzuchi"] .toggle-button--icon-only { border-radius: 9999px }`, (0,2,0)).
`24px` and `9999px` on the two ends of one 48px side exceed the box, so CSS's border-radius
overflow scaling divides *all four* radii by the same factor and the 24px pair collapses to
about 0.1px — square. `themes/tzuchi/components/toggle-button-group.css` restated corners only
for `:not(.toggle-button-group--detached)` (lines 91-133), and its header (lines 29-54) argued
the detached case could fall through — which is true for the *size* but not for the *radius*.

**Fix** — a detached block added to `toggle-button-group.css`:

```
[data-theme^="tzuchi"] .toggle-button-group--detached .toggle-button,
[data-theme^="tzuchi"] .toggle-button-group--detached
  .toggle-button:is(:first-child, :last-child, :first-child:last-child)
    { border-radius: var(--tc-button-radius, var(--radius)); }

[data-theme^="tzuchi"] .toggle-button-group--detached .toggle-button.toggle-button--icon-only,
[data-theme^="tzuchi"] .toggle-button-group--detached
  .toggle-button.toggle-button--icon-only:is(:first-child, :last-child, :first-child:last-child)
    { border-radius: var(--tc-icon-button-radius, var(--tc-radius-full, 9999px)); }
```

Why that specificity: the plain branch (0,3,0) states the intent for every cell; the `:is()`
branch is (0,5,0) because `:is()` takes its most specific argument, here the two-pseudo-class
`:first-child:last-child` — enough to beat both the base's single-edge rules (0,3,0) **and** its
one-cell-group rules `…--horizontal .toggle-button:first-child:last-child` (0,4,0) without
relying on import order. The icon-only pair repeats the structure one class higher, (0,4,0) /
(0,6,0), so a circle always wins over the 8px inside detached mode.
Both orientations are covered by the same two rules because `--detached` sits on the same
element as `--horizontal` / `--vertical` and neither rule names an orientation.

**After** — `after-tbg-detached-lt.png`, `after-tbg-detached-dk.png`,
`final-tbg-detached-lt.png`: four identical circles, first cell re-probed at
`border-top-left-radius: 9999px`, box still 48px. The attached group directly above it is
unchanged (re-probed at `8px` / 42px), as are
`after-tbg-orientation-lt.png` (attached, both orientations) and
`after-tbg-examples-lt.png` (three attached toolbars).

**Not screenshotted:** a *vertical* detached group. No story renders one —
`toggle-button-group.stories.tsx` uses `isDetached` only at line 200 (horizontal), and that
story's `render` ignores args, so Storybook's `&args=` URL cannot drive it (tried; the story
re-renders attached/horizontal). The vertical branch is argued from the cascade instead: the
base's vertical corner rules (`…--vertical .toggle-button:first-child` / `:last-child`,
lines 55-62) are (0,3,0) and its one-cell rule (line 65) is (0,4,0) — identical to the
horizontal ones that *were* measured — and the fix's selectors are orientation-agnostic.

## 5 · A pending Button inherits the disabled opacity

**Reproduction** — `components-buttons-button--with-spinner`, theme `tzuchi-dark`, no
interaction. `before-btn-pending-dk.png`: probed `opacity: 0.38` on a light-blue fill with a
navy label — roughly 2.3:1, spinner ring lost in the fill. It reads as broken, not as working.

**Root cause / what HeroUI really sets** — probed in the live Storybook (injected marker rules,
`try/probe-attrs.css`, result in `shots/controls/probe-attrs.png`): a pending button matches
`[aria-disabled="true"]` and `[data-pending="true"]`, and matches **neither** `:disabled` nor
`[data-disabled="true"]`. That agrees with the source: react-aria-components
`dist/private/Button.mjs:95` sets `aria-disabled` from `isPending`, `:96` sets `data-disabled`
only from `props.isDisabled`, `:100` sets `data-pending` from `isPending`. HeroUI's base then
dims on `aria-disabled` (`heroui/styles/components/button.css:36-38` → `status-disabled`), while
`status-pending` itself only sets `pointer-events: none`
(`heroui/styles/utilities/index.css:67-69`). The theme makes it worse by setting
`--disabled-opacity` to 0.38 (`themes/tzuchi/variables.css:23`) against upstream's 0.5.

**Fix** — one rule in `button.css`:

```
[data-theme^="tzuchi"] .button[data-pending="true"]:not(:disabled, [data-disabled="true"])
  { opacity: 1; }
```

Only `opacity`. Cursor and `pointer-events` stay exactly as HeroUI has them, as the decision
says. (0,4,0) — `:not()` takes its most specific argument, one attribute selector — against the
base's `.button[aria-disabled="true"]` (0,2,0). The `:not()` list is what keeps a genuinely
disabled button dim: `isDisabled` + `isPending` together would carry `data-disabled` and be
excluded.

**After** — `after-btn-pending-dk.png` (opacity 1, legible), `after-btn-loading-dk.png`
(`--with-loading-state`, clicked), `final-btn-pending-dk.png`.
**A disabled button still dims:** `after-btn-disabled-dk.png` —
`components-buttons-button--default&args=isDisabled:!true` (that story's `Template` does read
args), all seven variants re-probed at `opacity: 0.38`.
`final-btn-icononly-lt.png` re-probes `.button--icon-only` at 48 × 48 / 9999px, proving the
rest of the file still applies.

## 6 · Tag "surface" variant is invisible in `tzuchi-dark`

**Reproduction** — `components-collections-taggroup--variants`, theme `tzuchi-dark`.
`before-tag-variants-dk.png`: probed `.tag--surface` `background-color: rgb(28,28,30)` on a
`rgb(22,22,24)` page — about 1.09:1 — with `border-top-color: rgba(0,0,0,0)`. The row reads as
four bare labels while the `default` row above shows proper pills.

**Root cause** — HeroUI's `.tag--surface` (`heroui/styles/components/tag.css:82-91`) declares
background and text only, no border-color; the transparent 1px border comes from this theme's
own box rule, `themes/tzuchi/components/tag.css:73` (`border: 1px solid transparent`).

**Fix** — one rule added to `tag.css`, placed after the `.tag` box rule and after `.tag--lg`:

```
[data-theme^="tzuchi"] .tag--surface { border-color: var(--border); }
```

Why that specificity: (0,2,0), the same as the `.tag` box rule it must beat, won on source
order (it is later in the same file) — and deliberately *lower* than the selected rule
`[data-theme^="tzuchi"] .tag:is([data-selected="true"], [aria-selected="true"])`, which is
(0,3,0) because `:is()` takes its attribute argument. So a selected surface tag still flips its
border to `currentColor`.

**After** — `after-tag-variants-dk.png` and `final-tag-variants-dk.png` (surface pills now have
a `rgb(107,107,110)` edge; `.tag--default` re-probed with its transparent border untouched),
`after-tag-variants-lt.png` (light: white pill, `rgb(189,189,189)` hairline),
`after-tag-selected-dk.png` (clicked — `border-top-color` flips to the accent-soft foreground),
`after-tag-sizes-dk.png` (sm 34px / lg 48px, both still transparent-bordered, 1px at every size),
`final-tag-remove-lt.png` (the remove-button rules at the end of the file still apply).

**Not screenshotted:** a `surface` tag at `--sm` or `--lg`. The TagGroup `--sizes` story uses
the default variant, and the one place a small surface tag exists
(`autocomplete.stories.tsx:420`, `components-pickers-autocomplete--tag-group-selection`) renders
its TagGroup only inside a render-prop that needs a multi-selection that the story's visible
control did not reach in headless driving. The rule is size-independent (it names only
`border-color`), and the 1px border width was probed as identical on `--sm`, `--md` and `--lg`,
so no size-specific behaviour can be affected.

---

## Things I could not verify

1. A **vertical detached** ToggleButtonGroup (item 4) — no story renders one and the relevant
   story ignores URL args. Argued from the cascade; the horizontal twin was measured.
2. A **`surface` tag at sm / lg** (item 6) — no story renders one. Argued from the rule being
   size-independent; the border width was measured at all three sizes.
3. The **`darkMode` switch glyph** in `--with-icons` under `tzuchi-dark` (item 2 residual) — it
   now sits on white with an inherited `--accent` colour and reads worse than before. Left as
   is, because the brief's decision covers the thumb fill and Tzu Chi records no rule for a
   thumb glyph (tc-switch has no icon slot). Flagging it for the owner.
