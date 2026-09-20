# dialogs — AlertDialog + Drawer (pass 3, base layer)

**Unit:** `dialogs`
**Targets:** `alert-dialog.css`, `drawer.css`
**Written to:**
`heroui/styles/themes/tzuchi/components/alert-dialog.css`
`heroui/styles/themes/tzuchi/components/drawer.css`
**Destination:** `heroui/styles/themes/tzuchi/components/{alert-dialog,drawer}.css`

Both components are Modal siblings under DESIGN-LANGUAGE **§6(c) "Modal-like — Modal,
AlertDialog, Drawer"**. Neither has a `tc-*` counterpart, so every value below is the one
`themes/tzuchi/components/modal.css` already ships, which is itself traced to `tc-modal` via
`gap-audit/modal.md`. Nothing new was invented.

Reference values used throughout (all verified in `packages/tokens/dist/tokens.css` /
`themes/tzuchi/variables.css` / `themes/shared/theme.css`):

| variable | value |
|---|---|
| `--radius` (theme) | `--tc-radius-md` = **8px** → `--radius-2xl` = 16px, `--radius-3xl` = 24px |
| `--tc-modal-radius` | → `--tc-radius-lg` = **16px** (tokens.css:192, :51) |
| `--tc-space-16` / `--tc-space-24` | 16px / 24px (tokens.css:41, :43) |
| `--tc-font-size-16` / `--tc-font-weight-bold` / `--tc-line-height-relaxed` | 16px / 700 / 1.6 (tokens.css:85, :84, :94) |
| `--tc-motion-duration-base` / `--tc-motion-easing-standard` | 200ms / `cubic-bezier(0.2, 0, 0, 1)` (tokens.css:63, :64) |
| `--tzuchi-modal-shadow` | `0px 12px 28px 0px #00000029` — **declared in the light block only** (`themes/tzuchi/variables.css:68`) |
| `--overlay-shadow` | light `0px 6px 16px 0px #0000001f` (`themes/tzuchi/variables.css:63`); under `tzuchi-dark` it falls through to `themes/default/variables.css:260` = `0 0 1px 0 rgba(255,255,255,.3) inset` |
| `--muted` → `--overlay-foreground` | `#828282 / #b3b3b3` → `#333333 / #f2f2f2` |
| Tailwind | `--spacing` 0.25rem; `--text-sm` .875rem; `--text-base` 1rem; `--font-weight-medium` 500; `--ease-out-quad` `cubic-bezier(0.25,0.46,0.45,0.94)` |

---

## 1. AlertDialog — `alert-dialog.css`

| property | HeroUI base (file:line + resolved value) | now (declaration + resolved value) | spec rule |
|---|---|---|---|
| dialog `border-radius` | `components/alert-dialog.css:148` `min(32px, var(--radius-3xl))` → **24px** | `border-radius: var(--tc-modal-radius, var(--tc-radius-lg, 16px))` → **16px** | §2 **R28** / §6(c) **R103** (modal-like overlay) |
| dialog elevation | `components/alert-dialog.css:147` `shadow-overlay` → `--tw-shadow: var(--overlay-shadow)` → **elevation.3** light / inset hairline dark | `--tw-shadow: var(--tzuchi-modal-shadow, var(--overlay-shadow))` → **elevation.4** light / **unchanged** dark | §6(c) **R104** (+ the unit brief); §6 "Shadows" — see spec gaps |
| heading `font-weight` | `components/alert-dialog.css:224` `font-medium` → **500** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | §1 **R11** / §6(c) **R105** (heading inside an overlay) |
| body `font-size` | `components/alert-dialog.css:280` `text-sm` → `--text-sm` = **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 **R5** (body copy) / §6(c) **R106** |
| body `line-height` | `components/alert-dialog.css:280` `leading-[1.43]` → **1.43** (20.02px at 14px) | `line-height: var(--tc-line-height-relaxed, 1.6)` → **1.6** = **25.6px** | §1 **R5** / §1.2 ("1.6 for prose") |
| body `color` | `components/alert-dialog.css:280` `text-muted` → `--muted` = `#828282 / #b3b3b3` | `color: var(--overlay-foreground)` → `#333333 / #f2f2f2` | §6(c) **R106** ("not `--muted`"); `gap-audit/modal.md:76` records `--muted` at 3.84:1 on white — below AA |
| header → body gap | `components/alert-dialog.css:304-306` `mt-2` → **8px** | `margin-block-start: var(--tc-space-16, 16px)` → **16px** | §6(c) **R107** |
| header → footer gap | `components/alert-dialog.css:308-310` `mt-5` → **20px** | `margin-block-start: var(--tc-space-24, 24px)` → **24px** | §6(c) **R107** |
| body → footer gap | `components/alert-dialog.css:312-314` `mt-5` → **20px** | `margin-block-start: var(--tc-space-24, 24px)` → **24px** | §6(c) **R107** |
| footer wrapping | `components/alert-dialog.css:290` `flex-row` → **nowrap** | `flex-wrap: wrap` | §6(c) **R108** |
| close trigger, resting fill | `components/close-button.css:48` `bg-default` → `#F2F2F2 / #333333` chip | `background-color: transparent`, gated by `:not(:hover, [data-hovered="true"], :active, [data-pressed="true"])` | §6(c) **R109** |
| backdrop enter timing | `components/alert-dialog.css:52` `duration-150 ease-out` → **150ms** | `--tw-animation-duration: var(--tc-motion-duration-base, 200ms)`; `--tw-ease: var(--tc-motion-easing-standard, …)` → **200ms / standard** | §6(c) **R110** / §8 **R133** |
| container enter timing | `components/alert-dialog.css:104` `duration-250 ease-out-quad` → **250ms / cubic-bezier(.25,.46,.45,.94)** | same two custom properties → **200ms / cubic-bezier(0.2,0,0,1)** | §6(c) **R110** / §8 **R133** |

### Left as HeroUI's (and why) — AlertDialog

| what | base | why it stays |
|---|---|---|
| dialog padding | `alert-dialog.css:149` `p-6` = 24px | already `--tc-modal-padding` (`gap-audit/modal.md:44`); §10 **D17** |
| size scale `xs / sm / md / lg / cover` | `:174-204` | no tc counterpart; §10 **D17**. Note `--cover` (unlike Modal's `--full`) is **not** stripped of radius or shadow upstream, so it correctly inherits the 16px corner — no `:not()` carve-out is needed here |
| status icon chip | `:230-273` `size-10` (40px), `rounded-3xl` (24px), `bg-default` / `bg-<tone>-soft` + `text-<tone>-soft-foreground`, glyph `size-5` | the brief keeps the `--default` / status-soft fills; the glyph is already 20px = `--tc-size-icon-sm`; Modal's icon slot is settled as untouched (§10 **D17**). §5 **R87**'s "paint the icon in the raw tone" applies to an icon on the **card** surface (`alert.css`), not to a glyph sitting **on** a `-soft` chip, where `-soft-foreground` is the contrast-checked pair |
| header gap | `:210` `gap-3` = 12px | icon ↕ heading; tc-modal has no icon, so there is no decision to transfer (`gap-audit/modal.md:49`) |
| body scroll gutter | `:281` `-m-[3px] my-0 p-[3px]` | structural (keeps the focus ring of scrolled content visible) |
| footer alignment + gap | `:290` `items-center justify-end gap-2` = 8px | already identical to tc (§9 **R150**) |
| close-trigger position | `:298` `end-4 top-4` = 16px on a 24px box | same 28px optical centre tc reaches with 12px on a 32px box (`gap-audit/modal.md:57`); `.close-button` itself is shared surface, §10 **D8** |
| backdrop colour + `opaque / blur / transparent` | `:74-90` `bg-backdrop` | `--backdrop` is deliberately unmapped, §10 **D31** |
| container padding / placement offsets | `:98-99` `p-4 sm:p-10`; `:153-168` | layout geometry the spec is silent on (restraint rule 6) |
| focus ring, disabled, pressed scale, pending | `close-button.css:22-36, 61-64` | §10 **D2 / D3**; none of `status-focused` / `-disabled` / `-pending` touches `background-color`, so the resting-fill override cannot disturb them |
| exit animations | `:57, :126` `duration-100` | §8 **R140** — exits keep HeroUI's |

---

## 2. Drawer — `drawer.css`

| property | HeroUI base (file:line + resolved value) | now (declaration + resolved value) | spec rule |
|---|---|---|---|
| panel elevation | `components/drawer.css:138` `shadow-overlay` → `--tw-shadow: var(--overlay-shadow)` → **elevation.3** light / inset hairline dark | `--tw-shadow: var(--tzuchi-modal-shadow, var(--overlay-shadow))` → **elevation.4** light / **unchanged** dark | §6(c) **R104** (+ the unit brief) |
| heading `font-weight` | `components/drawer.css:233` `font-medium` → **500** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | §1 **R11** / §6(c) **R105** |
| body `font-size` | `components/drawer.css:242` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 **R5** / §6(c) **R106** |
| body `line-height` | `components/drawer.css:242` `leading-[1.43]` → **1.43** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | §1 **R5** / §1.2 |
| body `color` | `components/drawer.css:242` `text-muted` → `#828282 / #b3b3b3` | `color: var(--overlay-foreground)` → `#333333 / #f2f2f2` | §6(c) **R106** |
| header → body gap | `components/drawer.css:280-282` `mt-2` → **8px** | `margin-block-start: var(--tc-space-16, 16px)` → **16px** | §6(c) **R107** |
| header → footer gap | `components/drawer.css:284-286` `mt-5` → **20px** | `margin-block-start: var(--tc-space-24, 24px)` → **24px** | §6(c) **R107** |
| body → footer gap | `components/drawer.css:288-290` `mt-5` → **20px** | `margin-block-start: var(--tc-space-24, 24px)` → **24px** | §6(c) **R107** |
| footer wrapping | `components/drawer.css:252` `flex-row` → **nowrap** | `flex-wrap: wrap` | §6(c) **R108** |
| close trigger, resting fill | `components/close-button.css:48` `bg-default` | `background-color: transparent` + the same four-state guard | §6(c) **R109** |

### Left as HeroUI's (and why) — Drawer

| what | base | why it stays |
|---|---|---|
| **free-edge radius** | `:158-159` (bottom) / `:165-166` (top) `min(32px, var(--radius-2xl))` → **already 16px** under this theme, because `variables.css:19` sets `--radius: var(--tc-radius-md)` = 8px and `theme.css:109` makes `--radius-2xl` = `calc(--radius * 2)` | **R28 / R103's target value is already met.** Restating it as `var(--tc-modal-radius, …)` would change nothing and would be the duplication **N5** forbids. This is the one place a new override was expected and is not needed — flagged here so nobody reads its absence as an omission |
| **docked-edge radius** | `:171, :176` `rounded-none` on `left` / `right` | **R103** explicitly cites these two lines: edge-docked sides stay square. A left/right drawer is docked on three sides |
| **enter / exit motion** | `:142-148` `--drawer-enter-duration: 250ms`, `--drawer-enter-ease: cubic-bezier(.32,.72,0,1)`, `--drawer-exit-*: 200ms`; backdrop `:48` `transition: opacity 250ms …` | R110/R133 describe an **`animate-in`** overlay (`--tw-animation-duration` + `--tw-ease`). Drawer instead **transitions** `translate`, and its drag-dismiss snap-back is written **inline by JS** — `react/src/components/drawer/drawer.tsx:183` sets `transform 300ms cubic-bezier(0.32,0.72,0,1)`, which CSS cannot reach. Retuning only the two custom properties would leave the panel's enter on the Tzu Chi curve and its own drag release on HeroUI's. §8 **R140** ("durations that differ for a good reason stay") plus the brief's restraint rule ⇒ the slide keeps its choreography. Recorded as a spec gap |
| panel padding | `:139` `p-6` = 24px | already `--tc-modal-padding`; §10 **D17** |
| placement geometry | `:155-178` `w-full` + `max-h-[85vh]` (top/bottom); `w-80 max-w-[85vw] sm:w-96` (left/right); `:213-218` `.drawer__dialog--top { pb-2 }` | layout-specific geometry the spec is silent on (restraint rule 6); tc has no drawer to copy a width from |
| handle bar | `:264-267` `h-1 w-9 rounded-xs` (2px) `bg-separator` | a 2px radius on a **4px-tall** bar is **already a full pill**, so §2 **R26** asks for nothing; `--separator` is already the Tzu Chi border grey |
| `handle + header` / `handle + body` zero margins | `:292-298` | untouched — the new rhythm rules are `header + body` / `… + footer` adjacent pairs only |
| drag-to-dismiss | `drawer.tsx:46-200` | behaviour, §10 **D32** |
| backdrop colour + variants | `:73-89` `bg-backdrop` | `--backdrop` deliberately unmapped, §10 **D31** |
| close-trigger position | `:274` `end-4 top-4` | same optical centre argument as Modal; `.close-button` is shared surface, §10 **D8** |
| focus ring, disabled, pressed scale | `close-button.css:22-36, 61-64` | §10 **D2 / D3** |

---

## 3. Cascade derivation (hand-checked against the built Storybook CSS)

`storybook-static/assets/iframe-DpN8oW_m.css` was read for every selector touched.

| my selector | specificity | base rule it must beat | base specificity |
|---|---|---|---|
| `[data-theme^="tzuchi"] .alert-dialog__dialog` | (0,2,0) | `.alert-dialog__dialog` | (0,1,0) |
| `[data-theme^="tzuchi"] .<x>__heading` / `__body` / `__footer` | (0,2,0) | `.<x>__heading` etc. — note `.<x>__body` emits `line-height` **twice** (`var(--tw-leading,…)` then the literal `1.43`); both are (0,1,0) | (0,1,0) |
| `[data-theme^="tzuchi"] .<x>__header + .<x>__body` | (0,3,0) | `.<x>__header + .<x>__body` | (0,2,0) |
| `[data-theme^="tzuchi"] .<x>__close-trigger.close-button--default:not(:hover, [data-hovered="true"], :active, [data-pressed="true"])` | (0,4,0) — `:not()` contributes its most specific argument, all four being (0,1,0) | `.close-button--default` (0,1,0); its hover rule `.close-button--default:hover` (0,2,0), which my `:not()` simply stops matching | (0,1,0)/(0,2,0) |
| `[data-theme^="tzuchi"] .alert-dialog__backdrop[data-entering="true"]` (and `__container`) | (0,3,0) | `.alert-dialog__backdrop[data-entering="true"]` sets `--tw-duration` / `--tw-ease` | (0,2,0) |

Notes verified in the built CSS:

- `.alert-dialog__dialog` and `.drawer__dialog` both emit `--tw-shadow: var(--overlay-shadow)` feeding
  the shared `box-shadow: var(--tw-inset-shadow), …, var(--tw-shadow)` shorthand — so overriding
  `--tw-shadow` (not `box-shadow`) is the correct mechanism and keeps ring/inset composition.
- `animate-in` compiles to
  `animation: enter var(--tw-animation-duration, var(--tw-duration, .15s)) var(--tw-ease, ease) …`,
  so `--tw-animation-duration` is read **before** the base rule's own `--tw-duration`. Neither
  `animation-name` nor `transition-property` is touched (§8 **R136**), so the
  `[data-reduce-motion="true"]` and `prefers-reduced-motion` guards — which zero `animation` —
  still win outright.
- `.drawer__dialog[data-placement="bottom"]` → `border-start-start/end-radius: min(32px, var(--radius-2xl))`
  → **16px** under this theme. Confirmed in the built CSS, not just the source.
- `AlertDialogCloseTrigger` / `DrawerCloseTrigger` both render `<CloseButton>` with the default
  variant, so the composed class list really is
  `close-button close-button--default <x>__close-trigger` — the compound selector exists.
- No existing override file in `themes/tzuchi/components/` touches `.alert-dialog__*` or
  `.drawer__*`; the only shared surface is `.close-button--default`, which `modal.css:110-118` and
  `tag.css:154-162` each reach only through their **own** host class, exactly as these two files do.
  No declaration is duplicated or contradicted.

## 4. Variants, sizes and states — nothing hidden

- **AlertDialog** `size`: `xs` `sm` `md` (default) `lg` `cover` — all keep their `max-inline-size` /
  full-bleed box; all five now carry the 16px corner and elevation.4 (light).
  `status`: `default` `accent` `success` `warning` `danger` (default) — untouched.
  `variant`: `opaque` (default) `blur` `transparent` — untouched.
- **Drawer** `placement`: `bottom` (default) `top` `left` `right` — geometry, radius and slide
  direction untouched; all four get the shell type, rhythm and elevation.
  `variant`: `opaque` (default) `blur` `transparent` — untouched.
- **States** on both: hover, pressed, focus-visible, disabled, pending, `data-entering`,
  `data-exiting`, `data-placement`, reduced motion — all still reach their base rules.

---

## 5. Spec gaps

1. **§6 "Shadows — the whole rule" contradicts §6(c) R104.** The table lists *"floating overlay
   (popover, dropdown, toast, tooltip, **drawer**, **alert-dialog**) → `var(--overlay-shadow)`"* and
   *"**modal only** → `--tw-shadow: var(--tzuchi-modal-shadow, …)`"*, while R104 sits inside
   §6(c) whose heading is *"Modal-like — Modal, **AlertDialog**, **Drawer**"*. Resolved in favour of
   R104 because the unit brief says so explicitly ("shadow incl. the `--tzuchi-modal-shadow`
   light-only rule"), and because all three are modally-blocking, backdropped surfaces at the same
   z-layer — splitting their elevation would be the inconsistency this pass exists to remove. In
   **dark both readings are identical** (the fallback fires), so the decision only affects light.
   Owner sign-off wanted; it is one declaration per file to revert.
2. **No rule for a transition-driven overlay enter.** §8 R133 / §6(c) R110 only cover Tailwind's
   `animate-in` custom properties. Drawer's enter is a `translate` transition whose curve is also
   duplicated **in JavaScript** (`drawer.tsx:183`, the drag snap-back) where CSS cannot follow.
   Motion was left entirely to HeroUI; if the owner wants the Tzu Chi curve here, it needs a
   matching change in `drawer.tsx`, which is out of scope for a theme override.
3. **No rule for a status icon chip** (AlertDialog's 40px `rounded-3xl` `-soft` disc). §5 R87's
   "paint the icon in the raw tone" is written for an icon on the page/card surface, not for a
   glyph **inside** a soft-filled disc, where `-soft-foreground` is the contrast-checked pair.
   Kept as HeroUI's, per the brief and §10 D17. The 24px radius on a 40px box is the one shape in
   these two components that answers to no rule in §2.
4. **`--tzuchi-modal-shadow` is still light-only** (§11 **I4**, §12 **Q3**). These two files
   therefore inherit Modal's dark-mode behaviour exactly — HeroUI's 1px inset hairline. Their
   header comments say so explicitly and do **not** repeat `modal.css:6-9`'s incorrect claim of "a
   real drop shadow in dark". If `generate.mjs` later emits a dark value, all three siblings pick
   it up together with no further edit.
5. **`--backdrop` is unmapped** (§10 D31), so both scrims keep HeroUI's `rgba(0,0,0,.5)` light /
   `rgba(0,0,0,.6)` dark. Identical to Modal — listed only so the trio is known to match.

---

## 6. Assertions (for the headless checker)

Both stories render **only the trigger button** on load — React Aria mounts the overlay lazily —
so each needs ONE `click` on the first `<button>` inside `#storybook-root`
(`"Delete Project"` and `"Open Drawer"` respectively).

| storyId | selector | property | expected | reveal |
|---|---|---|---|---|
| `components-overlays-alertdialog--default` | `.alert-dialog__dialog` | `border-top-left-radius` | `16px` | click |
| `components-overlays-alertdialog--default` | `.alert-dialog__heading` | `font-weight` | `700` | click |
| `components-overlays-alertdialog--default` | `.alert-dialog__body` | `font-size` | `16px` | click |
| `components-overlays-alertdialog--default` | `.alert-dialog__body` | `line-height` | `25.6px` | click |
| `components-overlays-drawer--default` | `.drawer__heading` | `font-weight` | `700` | click |
| `components-overlays-drawer--default` | `.drawer__body` | `font-size` | `16px` | click |
| `components-overlays-drawer--default` | `.drawer__body` | `line-height` | `25.6px` | click |

No assertion is offered for the Drawer's radius (unchanged — already 16px upstream), for either
shadow (`box-shadow` is not dimension-like and `--tw-shadow` resolves through a shorthand), or for
the region margins (`margin-block-start` is outside the harness's property list).
