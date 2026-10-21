# modal — Tzu Chi ↔ HeroUI gap inventory

**Override file:** `/private/tmp/claude-501/-Users-kaellim-Desktop-Personal-CISwebsite/1c74be25-055e-47fb-a92f-f47cfe608bb0/scratchpad/atoms/css/modal.css`
**Destination:** `heroui/styles/themes/tzuchi/components/modal.css`
**Closeness:** minor gaps — the box model is already Tzu Chi's (24px padding, same optical close-button centre, matching heading size and footer gap). What differs is the corner, the elevation, the two type ramps, the inter-region rhythm and the close button's resting fill.

## Source files

| side | files |
|---|---|
| Tzu Chi | `/Users/kaellim/Desktop/Personal/CISwebsite/packages/components/src/modal/tc-modal.styles.ts`, `tc-modal.ts`, `/Users/kaellim/Desktop/Personal/CISwebsite/packages/tokens/src/component/modal.tokens.json` |
| resolved tokens | `/Users/kaellim/Desktop/Personal/CISwebsite-heroui-spike/packages/tokens/dist/tokens.css` |
| HeroUI | `heroui/styles/components/modal.css`, `heroui/styles/components/close-button.css`, `heroui/react/src/components/modal/modal.tsx`, `heroui/styles/src/components/modal/modal.styles.ts`, `heroui/styles/themes/{default,shared,tzuchi}/…` |

## Variant mapping

`tc-modal` is a single, un-varianted native `<dialog>`. Its only props are behavioural
(`open`, `label`, `dismissible`, `no-close`) — there is no size, scroll, placement or backdrop
variant to map. So:

| HeroUI axis | HeroUI values | tc counterpart |
|---|---|---|
| `size` | `xs` 320px · `sm` 384px · `md` 448px (default) · `lg` 512px · `cover` · `full` | one fixed `min(92vw, 560px)` — **no mapping**, see "Not transferable" |
| `scroll` | `inside` (default) · `outside` | tc is always scroll-inside (`overflow: auto` on the dialog, `max-height: 85vh`) |
| `placement` | `auto` (default) · `top` · `center` · `bottom` | tc is UA-centred only (`margin: auto` on a top-layer `<dialog>`) ≈ `center` |
| `variant` (backdrop) | `opaque` (default) · `blur` · `transparent` | tc has one scrim, `rgba(0,0,0,.5)` ≈ HeroUI `opaque` |
| slots | `trigger` `backdrop` `container` `dialog` `header` `heading` `icon` `body` `footer` `closeTrigger` | tc has `dialog` `close` `header` `body` `footer`; no `trigger`, no `container`, no `icon` |

Every rule in the override is therefore variant-agnostic and applies across the whole matrix.
The one carve-out is `.modal__dialog--full`, which upstream deliberately strips of radius and
shadow (`modal.css:255-258`); the shell rule excludes it with `:not(.modal__dialog--full)` so
that variant is provably unchanged.

## Gap table

Light / dark are given as `light | dark` where they differ. Under `[data-theme="tzuchi"]`
`--radius` = `--tc-radius-md` = **8px**, so `--radius-3xl` = `calc(8px * 3)` = **24px**.

### Shape

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| dialog border-radius | `tc-modal.styles.ts:21` `--tc-modal-radius` → `--tc-radius-lg` = **16px** (`tokens.css:190,51`) | `modal.css:180` `min(32px, var(--radius-3xl))` → `min(32px, 24px)` = **24px** | **changed** → `border-radius: var(--tc-modal-radius, var(--tc-radius-lg, 16px))` on `.modal__dialog:not(--full)` |
| dialog padding | `tc-modal.styles.ts:13` `--tc-modal-padding` → `--tc-space-24` = **24px** all sides (`tokens.css:191,43`) | `modal.css:182` `p-6` = `6 × 0.25rem` = **24px** (`themes/default/variables.css:18`) | **kept** — already identical |
| dialog width | `tc-modal.styles.ts:14-15` `width: max-content; max-width: min(92vw, 560px)` (`tokens.css:102`) | `modal.css:178` `w-full` inside a `sm:w-fit` container (`modal.css:98`); capped by size modifier, default `md` = `max-w-md` = **448px** (`modal.css:234`) | **kept** — see "Not transferable" |
| dialog max-height | `tc-modal.styles.ts:16` `85vh` | `modal.css:206` `max-h-full` inside a `h-(--visual-viewport-height)` container with `sm:p-10` (40px) → ≈ viewport − 80px | **kept** — different mechanism, equivalent result; changing it would fight `scroll="outside"` |
| dialog border | `tc-modal.styles.ts:20` `border: none` | `modal.css:176-183` — no border declared | **kept** — already identical (0px both) |
| icon slot | none | `modal.css:284-288` `size-10` (**40px**), `rounded-3xl` (**24px**), `shrink-0` | **kept** — no tc counterpart; leaving it alone keeps the Default/Placements/Sizes stories intact |
| header gap | n/a (single text line) | `modal.css:264` `gap-3` = **12px** (icon ↕ heading) | **kept** — tc has no icon, so no decision to transfer |
| header padding-inline-end | `tc-modal.styles.ts:106` `--tc-space-32` = **32px** reserved for the close button | `modal.css:263-271` — **0px**; the close button intrudes 16px into the content box | **kept** — HeroUI's close button is 24px at a 16px inset, so it intrudes half as far as tc's, and an unconditional 32px reserve would misalign the header against the body on every modal that has no close trigger. Authors add padding per-modal upstream. |
| footer wrap | `tc-modal.styles.ts:125` `flex-wrap: wrap` | `modal.css:318` `flex-row` (nowrap) | **changed** → `flex-wrap: wrap` |
| footer gap | `tc-modal.styles.ts:127` `--tc-space-8` = **8px** | `modal.css:318` `gap-2` = **8px** | **kept** — already identical |
| footer alignment | `tc-modal.styles.ts:126` `justify-content: flex-end` | `modal.css:318` `items-center justify-end` | **kept** — already identical |
| header → body | `tc-modal.styles.ts:105` header `margin-block-end` = `--tc-space-16` = **16px** | `modal.css:332-334` `.modal__header + .modal__body { mt-2 }` = **8px** | **changed** → `margin-block-start: var(--tc-space-16, 16px)` |
| body → footer | `tc-modal.styles.ts:128` footer `margin-block-start` = `--tc-space-24` = **24px** | `modal.css:340-342` `mt-5` = **20px** | **changed** → `margin-block-start: var(--tc-space-24, 24px)` |
| header → footer (empty body) | 16px + 24px = 40px (tc always renders the body wrapper) | `modal.css:336-338` `mt-5` = **20px** | **changed** → 24px, for consistency with body→footer |
| close-trigger position | `tc-modal.styles.ts:71-72` `inset-block-start/inset-inline-end` = `--tc-space-12` = **12px**, on a **32px** box → optical centre **28px** in from the corner | `modal.css:325-327` `end-4 top-4` = **16px**, on a **24px** box (`close-button.css:5` `h-6 w-6`) → optical centre **28px** in from the corner | **kept** — the two designs land on the identical optical centre; only the hit-target size differs, and that belongs to the shared `.close-button`, not to modal |
| close-trigger radius | `tc-modal.styles.ts:83` `--tc-radius-full` = 9999px on a 32px box → full circle | `close-button.css:5` `rounded-xl` = `calc(8px × 1.5)` = **12px** on a 24px box → also a full circle | **kept** — visually identical result |
| close icon size | `tc-modal.styles.ts:100-101` `--tc-size-icon-sm` = **20px** (on a 32px box, 0.63 ratio) | `close-button.css:41` `size-4` = **16px** (on a 24px box, 0.67 ratio) | **kept** — proportionally equivalent, and `.close-button svg` is shared with drawer/toast/popover |

### Typography

Font family is already Tzu Chi's: `themes/tzuchi/variables.css:25` maps `--font-sans` to
`--tc-font-family-base` = `'Noto Sans TC', system-ui, -apple-system, 'PingFang TC', 'Microsoft JhengHei', sans-serif` (`tokens.css:81`), and the dialog inherits it.

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| heading family | `tc-modal.styles.ts:107` `--tc-typography-subtitle` → Noto Sans TC stack (`tokens.css:138`) | inherits `--font-sans` | **kept** — the theme already routes `--font-sans` to the Tzu Chi stack |
| heading font-size | `--tc-typography-subtitle` → **16px** | `modal.css:278` `text-base` → `--text-base` = `1rem` = **16px** | **kept** — already identical |
| heading line-height | `--tc-typography-subtitle` → **1.5** (= 24px) | `text-base` → `--text-base--line-height` = **1.5** (= 24px) | **kept** — already identical |
| heading font-weight | `--tc-typography-subtitle` → **700** (`--tc-font-weight-bold`, `tokens.css:84`) | `modal.css:278` `font-medium` = **500** | **changed** → `font-weight: var(--tc-font-weight-bold, 700)` |
| heading colour | `tc-modal.styles.ts:108` `--tc-modal-header-fg` → `color.text.default` = `gray-900 #333333 \| gray-100 #f2f2f2` (`tokens.css:338`) | `modal.css:278` `text-foreground` → `--foreground` = `gray-900 \| gray-100` (`themes/tzuchi/variables.css:37,72`) | **kept** — the generated theme already resolves to the same values in both modes |
| body font-size | `tc-modal.styles.ts:119` `--tc-typography-body` → **16px** (`tokens.css:139`) | `modal.css:295` `text-sm` → `--text-sm` = `.875rem` = **14px** | **changed** → `font-size: var(--tc-font-size-16, 16px)` |
| body line-height | `--tc-typography-body` → **1.6** (= 25.6px at 16px) | `modal.css:295` `leading-[1.43]` (= 20.02px at 14px) | **changed** → `line-height: var(--tc-line-height-relaxed, 1.6)` |
| body font-weight | `--tc-typography-body` → **400** | inherited **400** | **kept** — already identical |
| body colour | `tc-modal.styles.ts:120` `--tc-modal-fg` → `color.text.default` = `gray-900 \| gray-100` (`tokens.css:336`) | `modal.css:295` `text-muted` → `--muted` = `gray-700 #828282 \| gray-400 #b3b3b3` | **changed** → `color: var(--overlay-foreground)`. Two reasons: tc paints body copy in text.default, and `MAINTAINING.md` records `--muted` at **3.84:1** on white — below AA — so muted body copy would ship a contrast failure |

### Colour, elevation, states

Colours all come from HeroUI theme variables (none of the `--tc-color-*` / colour-valued
component tokens are referenced), so both modes resolve correctly.

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| dialog background | `tc-modal.styles.ts:19` `--tc-modal-bg` → `color.surface.default` = `#ffffff \| gray-950 #1c1c1e` (`tokens.css:335`) | `modal.css:179` `bg-overlay` → `--overlay` = `--tc-color-white \| --tc-color-gray-950` (`themes/tzuchi/variables.css:40,75`) | **kept** — the generated theme already matches exactly |
| dialog elevation | `tc-modal.styles.ts:22` `--tc-modal-shadow` → `elevation.4` = `0px 12px 28px 0px #00000029` \| `0px 12px 28px 0px #00000099` (`tokens.css:37,412`) | `modal.css:179` `shadow-overlay` → `--overlay-shadow` = `0px 6px 16px 0px #0000001f` (= elevation.3, `themes/tzuchi/variables.css:60`) \| **inset hairline** `0 0 1px 0 rgba(255,255,255,.3) inset` (inherited from `themes/default/variables.css:260`; the tzuchi dark block never overrides it) | **changed** → `--tw-shadow: var(--tzuchi-modal-shadow, var(--overlay-shadow))`. `--tc-modal-shadow` / `--tc-elevation-4` are emitted as **light literals** in `:root` and only flip under `[data-theme="dark"]`, which `tzuchi-dark` never matches — so this goes through a new theme variable (see below) rather than a token reference |
| backdrop colour | `tc-modal.styles.ts:27` `--tc-modal-scrim` = `rgba(0,0,0,0.5)` (`tokens.css:103`) | `modal.css:81` `bg-backdrop` → `--backdrop` = `rgba(0,0,0,0.5)` \| `rgba(0,0,0,0.6)` (`themes/default/variables.css:120,256`; unmapped in the tzuchi theme, per `themes/tzuchi/variables.css:14`) | **kept** — light is an exact match; dark at 0.6 is the more appropriate value and is a theme-variable decision, not a modal one |
| backdrop `blur` / `transparent` | none | `modal.css:73-89` `bg-transparent`, `bg-backdrop backdrop-blur-md` | **kept** — extra HeroUI variants, left working |
| close-trigger resting fill | `tc-modal.styles.ts:82` `background: transparent` | `close-button.css:48` `bg-default` → `--default` = `oklch(94% .001 286.375)` (light grey chip) \| `oklch(27.4% …)`; unmapped in the tzuchi theme | **changed** → `background-color: transparent`, scoped to the modal and gated by `:not(:hover, [data-hovered="true"], :active, [data-pressed="true"])` so upstream's hover fill, pressed transform, focus ring and disabled/pending states all keep working |
| close-trigger foreground | `tc-modal.styles.ts:80` `--tc-modal-close-fg` → `color.text.muted` = `gray-700 \| gray-400` (`tokens.css:337`) | `close-button.css:48` `text-muted` → `--muted` = `gray-700 \| gray-400` | **kept** — already identical |
| close-trigger hover | `tc-modal.styles.ts:90` `color.surface.subtle` fill | `close-button.css:57` `bg-default-hover` = `color-mix(--default 96%, --default-foreground 4%)` | **kept** — the same "fills on hover" gesture; the exact neutral depends on `--default`, which `NOTICE.md` lists as an unmapped theme variable (a token-owner decision, not a modal one) |
| close-trigger pressed | none | `close-button.css:61` `scale(0.93)` | **kept** — extra HeroUI state |
| focus ring | `tc-modal.styles.ts:94-96` `2px solid --tc-focus-ring-color` (`blue-500 #4f7bbe \| blue-300 #a9c2ea`), offset `--tc-focus-ring-offset` = **2px** | `close-button.css:24` `status-focused` → `focus-ring` (`utilities/index.css:2-6`) = `ring-2` (**2px**) in `--focus`, offset `--ring-offset-width` = **2px** (`themes/tzuchi/variables.css:24` → `--tc-focus-ring-offset`); `--focus` = `blue-500 \| blue-300` (`themes/tzuchi/variables.css:45,80`) | **kept** — width, offset and colour already match in both modes |
| disabled | not styled on the close button | `close-button.css:29-32` `status-disabled` → `opacity: var(--disabled-opacity)` = `--tc-opacity-disabled` = **0.38** (`themes/tzuchi/variables.css:23`, `tokens.css:58`) + `pointer-events: none` | **kept** — already fed by the Tzu Chi token |
| pending | none | `close-button.css:33-35` `status-pending` | **kept** — extra HeroUI state |
| trigger (`.modal__trigger`) | none — tc-modal is opened imperatively (`show()` / `open`) | `modal.css:9-39` pressable wrapper with focus/disabled/pressed states | **kept** — no tc counterpart |

### Motion

| property | Tzu Chi | HeroUI | action |
|---|---|---|---|
| dialog enter duration | `tc-modal.styles.ts:32-33` `--tc-motion-duration-base` = **200ms** (`tokens.css:63`) | `modal.css:103` `duration-250` = **250ms** | **changed** → `--tw-animation-duration: var(--tc-motion-duration-base, 200ms)` |
| dialog enter easing | `--tc-motion-easing-standard` = `cubic-bezier(0.2, 0, 0, 1)` (`tokens.css:64`) | `modal.css:103` `ease-out-quad` = `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (`themes/shared/theme.css:125`) | **changed** → `--tw-ease: var(--tc-motion-easing-standard, …)` |
| backdrop enter | `tc-modal.styles.ts:36-38` fade, **200ms**, standard easing | `modal.css:51` `animate-in duration-150 ease-out fade-in-0` = **150ms** | **changed** → same two custom properties |
| dialog enter transform | `tc-modal.styles.ts:42-49` `translateY(8px) → 0` + fade | `modal.css:103-120` `fade-in-0 zoom-in-105` + `slide-in-from-bottom-1` (4px, mobile only) | **kept** — the rise + fade is the same gesture; the extra `zoom-in-105` lives inside Tailwind's `enter` keyframes and killing it would mean poking `--tw-enter-scale`, which is not worth the fragility |
| exit | tc has none (native `<dialog>` closes instantly) | `modal.css:55,124` `duration-100 ease-out fade-out-0 zoom-out-95` | **kept** — an HeroUI affordance tc simply lacks; left at 100ms |
| reduced motion | `tc-modal.styles.ts:61-66` `animation: none` | `modal.css:63-67,132-136` `motion-reduce:animate-none` | **kept** — identical intent; the override only feeds custom properties, so `animation-name: none` still wins under `prefers-reduced-motion` |
| close-button transition | `tc-modal.styles.ts:85-86` `background-color 150ms` standard | `close-button.css:16-21` `transform 250ms`, `color 150ms`, `background-color 100ms`, `box-shadow 150ms` | **kept** — shared component, and the background timing is already in the same range |

## Not transferable

1. **Fixed 560px width.** `--tc-modal-width` = 560px sits between HeroUI's `lg` (512px) and
   nothing. Re-pointing `.modal__dialog--md` at 560px would make `md` wider than `lg` and break
   the `Sizes` story and the documented scale, which rule 5 forbids. HeroUI's `sm:w-fit` container
   plus `p-4` / `sm:p-10` gutters already covers tc's `min(92vw, …)` clamp.
2. **`max-height: 85vh` + `overflow: auto` on the dialog itself.** HeroUI splits this across
   `scroll="inside"` (dialog `max-h-full`, body `overflow-y-auto`) and `scroll="outside"`
   (backdrop scrolls). Forcing tc's single mechanism would break the `outside` variant.
3. **`z-index: 1300`** (`--tc-modal-z`). HeroUI uses `z-(--z-index-overlay)` on the backdrop and
   a React-Aria portal; tc rides the native `<dialog>` top layer. Different stacking strategies —
   nothing to port, and the theme variable set has no z-index slot.
4. **The close button's own 32px box** and the header's 32px reserve. Both belong to shared
   surface (`.close-button`, used by drawer/toast/popover/alert-dialog) or would regress modals
   with no close trigger; see the gap table for the optical-centre reasoning.
5. **`Modal.Trigger`, `Modal.Container`, `Modal.Icon`, placement and backdrop variants.** tc-modal
   has no equivalent of any of them; they are left exactly as upstream ships them.
6. **`tc-modal`'s `[data-empty]` collapsing** of an empty header/footer. That is a Lit
   `slotchange` behaviour, not CSS HeroUI can reproduce — in React you simply do not render the
   region.

## New theme variable

| name | should resolve from | why |
|---|---|---|
| `--tzuchi-modal-shadow` | `elevation.4` (`--tc-elevation-4`: `0px 12px 28px 0px #00000029` light, `0px 12px 28px 0px #00000099` dark) | `modal.tokens.json` pins the modal at elevation.4, but HeroUI's `--overlay-shadow` is elevation.3 in light and, worse, an inset white hairline in dark (the tzuchi dark block never overrides it — `themes/tzuchi/variables.css:94-96`). `--tc-modal-shadow` / `--tc-elevation-4` cannot be referenced directly: `tokens.css` emits them as light literals in `:root` and only flips them under `[data-theme="dark"]`, which `tzuchi-dark` never matches. Used as `var(--tzuchi-modal-shadow, var(--overlay-shadow))`, so it degrades to the current behaviour until the generator emits it. |

## Assertions

All four target `components-overlays-modal--default`. **Note for the harness:** that story
renders only the trigger button on load — React Aria mounts the overlay lazily, so the
`.modal__*` elements exist only after the "Open Modal" button is pressed. No modal story in
`index.json` renders open by default (`grep defaultOpen react/src/components/modal/modal.stories.tsx`
returns nothing), so the checker must press the trigger first.

| storyId | selector | property | expected |
|---|---|---|---|
| `components-overlays-modal--default` | `.modal__dialog` | `border-top-left-radius` | `16px` |
| `components-overlays-modal--default` | `.modal__heading` | `font-weight` | `700` |
| `components-overlays-modal--default` | `.modal__body` | `font-size` | `16px` |
| `components-overlays-modal--default` | `.modal__body` | `line-height` | `25.6px` |
