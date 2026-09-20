# Visual QA — Overlays family (Modal, AlertDialog, Drawer, Popover, Tooltip, Toast)

Themes: `tzuchi` / `tzuchi-dark`, compared against upstream `light` / `dark`.
Viewport: 1100×800 (1100×500 for one scroll test). 144 screenshots in
`(session screenshot, not kept) shots/overlays/`.

Tooling note: `click:` on a story's trigger `<Button>` times out in this build (React Aria press
handling), so every overlay was opened with `key:Tab … key:Enter`. I ran the shots through a copy of
the shot tool, `tools/qa-shot-ov.cjs`, which additionally removes the React Scan toolbar — it sits in
the bottom-right corner exactly where bottom drawers and bottom/bottom-end toasts render. Helpers
added under the scratchpad: `tools/batch-overlays.cjs` (parallel runner), `tools/geom.cjs` (bounding
boxes), `tools/scrollcheck.cjs` (scrollHeight/overflow).

---

## Stories covered

**Modal** — default, placements (top, bottom), sizes (xs, lg, cover, full), backdrop-variants (blur),
scroll-comparison (inside), with-form, close-methods, dismiss-behavior, custom-animations.
**AlertDialog** — default, statuses (accent, success, warning, danger), sizes (xs, lg), placements
(top, bottom), backdrop-variants (blur, transparent), custom-icon, close-methods, dismiss-behavior.
**Drawer** — default, placements (bottom, top, left, right), backdrop-variants (opaque, transparent),
with-form, with-scrollable-content, navigation-drawer, non-dismissable.
**Popover** — default, with-arrow, with-custom-content, card-with-helptext, spring-animation.
**Tooltip** — default, with-trigger, card-with-tooltip.
**Toast** — default (all five statuses), placements, expanded, simple-toast, promise-toast,
custom-indicator, loading-state, custom-toast, toast-in-modal.

States driven: keyboard focus on close triggers, footer buttons, in-dialog fields, popover content
buttons, toast action/close; mouse hover on close triggers and on toasts; scroll-inside; three
stacked toasts; short-viewport drawer scrolling.

---

## Findings

### 1. HIGH — `tzuchi-dark`: a Popover over a Card has exactly the same fill as the Card

`shots/overlays/st-po-help-clip-tzd.png` (theme), `shots/overlays/st-po-help-updark.png` (upstream dark)

Open `components-overlays-popover--card-with-helptext` in `tzuchi-dark`. The popover and the card
under it both paint `rgb(28, 28, 30)`. The only thing separating them is `--overlay-shadow`, which in
this theme falls through to HeroUI's dark value — `rgba(255,255,255,0.3) 0 0 1px 0 **inset**` — a
hairline drawn *inside* the popover, so it does nothing to lift it off the surface underneath. The
result: the card's own paragraphs are chopped mid-word ("…displayed on top of a ca", "The popover
help icon is p") by a panel that has no visible edge on its top and right sides. Upstream dark gets
this right: its popover is a clearly lighter step than the card.

Probed: `.popover` background-color `rgb(28,28,30)`, box-shadow `rgba(255,255,255,0.3) 0px 0px 1px 0px inset`;
`.card` background-color `rgb(28,28,30)`.

Cause — `heroui/styles/themes/tzuchi/variables.css:85` and `:87` (the `tzuchi-dark` block):

```
--surface: var(--tc-color-gray-950);
--overlay: var(--tc-color-gray-950);
```

Both map to the same token, while `heroui/styles/themes/default/variables.css:218` deliberately does
the opposite (`--overlay: oklch(0.2103 0.0059 285.89);` under the comment *"lighter for contrast"*).
The dark block also never redeclares `--overlay-shadow`, so
`heroui/styles/themes/default/variables.css:260`'s inset hairline applies.

In light this is harmless because `variables.css:63` gives `--overlay-shadow: 0px 6px 16px 0px #0000001f`,
a real drop shadow — verified in `shots/overlays/st-po-help-tz.png`.

This is not popover-specific: every floating overlay that can land on a Card/Surface (popover,
dropdown, menu, toast, modal, drawer) has the same fill as that surface in `tzuchi-dark`.

Suggested fix: in the `tzuchi-dark` block, give `--overlay` a lighter step than `--surface`
(a raised-surface token), or declare a dark `--overlay-shadow` that draws an *outer* edge rather
than an inset hairline.

### 2. MEDIUM — Dialog and drawer titles are typographically identical to the field labels beneath them

`shots/overlays/dr-form-clip-tz.png`, `shots/overlays/st-modal-form-tz.png`,
`shots/overlays/st-modal-form-tzd.png`; upstream `shots/overlays/dr-form-up.png`

Open `components-overlays-drawer--with-form` (or `components-overlays-modal--with-form`) in `tzuchi`.
"Edit Profile" — the drawer's own title — renders at exactly the same size, weight and colour as
"Name", "Email" and "Bio". The title reads as a fourth field label; with the theme's 16px
`header → body` gap there is nothing left to mark it as the heading of the whole panel.

Probed in `tzuchi`: `.drawer__heading` → 16px / 700 / `rgb(51,51,51)`;
`.drawer__body .label` → 16px / 700 / `rgb(51,51,51)`. Identical.
Probed upstream `light`: heading 16px / 500, label **14px** / 500 — the size step does the work there.

Cause — `heroui/styles/themes/tzuchi/components/drawer.css` (`.drawer__heading`),
`modal.css` (`.modal__heading`) and `alert-dialog.css` (`.alert-dialog__heading`) each raise only the
*weight* to `--tc-font-weight-bold`, keeping `text-base` (16px). Meanwhile the Label override pushes
labels up to 16/700 as well, because the Tzu Chi scale has no 14px step. The two meet in the middle.
The same collision exists in the Modal (`Contact Us` vs `Name`/`Email`/`Phone`/`Company`/`Message`)
in both themes.

Suggested fix: give `.modal__heading` / `.drawer__heading` / `.alert-dialog__heading` the next type
step up (e.g. `--tc-font-size-20`), or drop the in-dialog label weight below 700.

### 3. LOW — Toast title runs into the action button

`shots/overlays/to-default-tz.png`; upstream `shots/overlays/to-default-up.png`

Open `components-feedback-toast--default`, press the first trigger ("Default toast"). "You have been
invited to join a team" now ends 12px from the left edge of the "Dismiss" chip — the two read as
touching. Upstream leaves 74px.

Measured (`tools/geom.cjs`, 1100×800):

| | `.toast__title` right | `.toast__action` x | gap |
|---|---|---|---|
| tzuchi | 643 | 655 | **12px** |
| upstream light | 606 | 680 | 74px |

The flex gap between `.toast__content` and `.toast__action` is 8px in both (content right 647 vs
action 655). What changed is that the 16px/700 title now fills its whole 279px column
(275px of it), where upstream's 14px title used 240px of 308px. Same story with the danger toast,
whose description wraps to three lines and leaves a dead block under the action button
(`shots/overlays/to-danger-tz.png`).

Cause — `heroui/styles/themes/tzuchi/components/toast.css`: `.toast { gap: var(--tc-space-8, 8px) }`
plus `.toast__title { font-size: 16px; font-weight: 700 }`. The 8px gap is inherited from upstream,
so the defect only becomes visible at the Tzu Chi type size — hence `upstreamHasItToo: true`.

Suggested fix: raise the toast's content↔action gap to `--tc-space-16` under this theme.

### 4. LOW — `tzuchi-dark`: the destructive button in an AlertDialog is navy text on a salmon fill

`shots/overlays/ad-danger-tzd.png`; upstream `shots/overlays/ad-danger-updark.png`

Open `components-overlays-alertdialog--statuses`, fourth trigger ("Delete Account"), in `tzuchi-dark`.
"Delete Account" paints `rgb(27, 45, 88)` (Tzu Chi navy) on `rgb(240, 138, 142)` (a salmon red).
Blue lettering on a red button is jarring on the one control in the dialog that must read as
destructive; upstream dark uses white on red.

It is not a contrast problem — it is a hue problem, and it comes from
`heroui/styles/themes/tzuchi/variables.css`'s dark block, where `--danger-foreground`,
`--success-foreground` and `--warning-foreground` all map to `var(--tc-color-blue-900)`. That is
consistent with the theme's dark-mode inversion for *primary* (light-blue fill + navy text, see
`shots/overlays/ad-success-tzd.png`), so it may be deliberate — but on the danger fill it reads wrong.

This is a Button-family token seen through the AlertDialog, so it is likely to be reported by the
buttons unit too; flagging it here because the danger AlertDialog is where it does the most damage.

---

## Checked and FINE

**Clipping / overflow**
- Modal close-trigger focus ring, in the corner of the dialog: full circle, not clipped (`modal-focus-close-tz.png`).
- Drawer close-trigger focus ring in the top-right corner of a bottom drawer: full circle (`fo-dr-close-focus-wide-tz.png`).
- Footer button focus rings inside Modal / AlertDialog: fully drawn, no clip (`modal-focus-btn-tz.png`, `ad-danger-focus-tz.png`).
- Focus ring on a Button inside an open Popover: not clipped by the popover (`fi-po-custom-focus-tz.png`).
- Field focus ring inside a Drawer form: not clipped (`fi-dr-form-focusfield-tz.png`).
- Three stacked toasts at `bottom`: the lowest one still sits 16px above the viewport edge, nothing cut (`to-expanded-tz.png`, geometry checked).
- Drawer `with-scrollable-content` at a 500px viewport: `.drawer__body` is `overflow-y: auto`, scrollHeight 1270 / clientHeight 259 — content is reachable, no stray scrollbars (`fo-dr-scroll-focus-tz.png`).
- Modal `scroll: inside`: body clipped at the footer with no fade — but upstream does exactly the same (`modal-scroll-inside-tz.png` vs `modal-scroll-inside-up.png`).
- Modal sizes xs / lg / cover / full: all render correctly; `full` correctly keeps square corners and no shadow.
- Toast `top start` placement: correct 16px inset (`to-place-tz.png`).

**Type / density**
- Modal, AlertDialog and Drawer body copy at 16px/1.6 wraps cleanly; no truncation, no overlap with the close trigger at any size including `xs` (`fi-ad-xs-tz.png`, `modal-size-xs-tz.png`).
- AlertDialog footers (Cancel + long confirm labels such as "Delete Account", "Send Reset Link", "Mark Complete") fit on one row in every status; the theme's `flex-wrap: wrap` never fires unnecessarily.
- Top drawer: handle wedged between the footer and the bottom edge — identical in upstream, so it is HeroUI's layout, not the theme's (`st-dr-top-clip-tz.png` vs `st-dr-top-clip-up.png`).
- Close-trigger optical position is unchanged from upstream; only the resting chip is gone (`fo-modal-head-clip-tz.png` vs `fo-modal-head-clip-up.png`).

**Consistency between siblings**
- Radii: Modal 16px, AlertDialog 16px, Drawer 16px, Popover 16px, Toast 16px — all `--tc-radius-lg`, no 24px HeroUI leftovers. Tooltip is 4px, which is the theme's own rule R31.
- Toast indicator box 24px / 16px glyph across all five statuses; title 16/700 everywhere.

**States**
- Modal / AlertDialog / Drawer close trigger: bare glyph at rest → grey chip on hover, in both themes; the `:not(:hover, [data-hovered], :active, [data-pressed])` guard works (`st-modal-close-rest-tz.png`, `st-modal-close-hover-tz.png`, `st-modal-close-hover-tzd.png`).
- Toast close chip appears on hover at the top-right corner, same as upstream (`fi-toast-hover-tz.png` vs `fi-toast-hover-up.png`).
- The whole toast takes a visible focus ring when tabbed to (`to-danger-focus-tz.png`).
- Nav-drawer item focus is clearly visible (the pill-shaped ring comes from the story's own `rounded-xl`/UA outline, not component CSS).

**Dark theme**
- Modal, AlertDialog and Drawer dialogs all read against the dark backdrop (`modal-default-tzd.png`, `st-dr-right-tzd.png`), including with a `transparent` backdrop and no scrim (`fi-ad-backdrop-transparent-tzd.png`).
- Toasts keep a visible edge against the dark page in all five statuses (`to-*-tzd.png`).
- The inverted (near-white) tooltip in `tzuchi-dark` is the theme's deliberate R112 inversion, not a light-mode remnant; it is legible on both the page and a card (`tt-default-tzd.png`, `fi-tt-card-clip-tzd.png`).
- Popover arrow renders in both themes and matches upstream's geometry (`po-arrow-tzd.png` vs `po-arrow-updark.png`).
- Blur and opaque backdrops behave correctly in dark (`fi-modal-blur-tzd.png`).

**Out of scope, confirmed as story-owned**
- The 24px pill "Follow" button inside the custom popover (`className="rounded-full text-xs …"`).
- The square focus ring around the round Tooltip trigger in `with-trigger` (the story wraps a `rounded-full` div).
- Muted `text-sm` / `text-xs` paragraphs in the ScrollComparison modal header and the custom popover.
