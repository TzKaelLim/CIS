# Unit `popover-toast` — Tzu Chi base-layer overrides

Targets: **Popover** (generic content popover, §6(b)) and **Toast** (§6(d) DECISION: Toast follows
the card/modal surface, not the tooltip inversion).

Both files written:

- `heroui/styles/themes/tzuchi/components/popover.css`
- `heroui/styles/themes/tzuchi/components/toast.css`

Under this theme `--radius: 8px`, so HeroUI's `--radius-2xl` = 16px and `--radius-3xl` = 24px
(`styles/themes/shared/theme.css:108-110`), and `min(32px, var(--radius-3xl))` resolves to **24px**
for both components' shells.

---

## 1. Popover

Ownership check: `.popover` is emitted only by `popoverVariants`
(`styles/src/components/popover/popover.styles.ts:5-12`), which only `react/src/components/popover/popover.tsx`
consumes. Select / Dropdown / ComboBox / Autocomplete map their popover slot to
`select__popover` / `dropdown__popover` / `combo-box__popover` / `autocomplete__popover` and never
add the `popover` base class, so nothing in this file can reach an option-list panel (§6(a)).

| property | HeroUI base (file:line + resolved value) | now (declaration + resolved value) | spec rule |
|---|---|---|---|
| `border-radius` (`.popover`) | `styles/components/popover.css:6` — `min(32px, var(--radius-3xl))` → **24px** | `border-radius: var(--tc-card-radius, var(--radius-2xl))` → **16px** | §2 R30 + §6(b) **R98** (content popover = card/modal surface; `--tc-card-radius` → `--tc-radius-lg` = 16px, `tokens.css:165`, `:51`) |
| `font-size` (`.popover`, inherited by the dialog body) | `styles/components/popover.css:5` — `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §1 (no 14px step) + §6(b) **R101** → **R5** body copy |
| `line-height` (`.popover`) | `styles/components/popover.css:5` — `text-sm` → **20px** (1.25rem) | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | §1.2 prose voice = 1.6; **R5** |
| `font-size` (`.popover__heading`) | inherits `text-sm` from `.popover` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §6(b) **R101** → **R11** (heading inside an overlay) |
| `font-weight` (`.popover__heading`) | `styles/components/popover.css:69` — `font-medium` → **500** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | **R11** (evidence `modal.css:81-83`) |
| `line-height` (`.popover__heading`) | inherits `text-sm` → **20px** (would inherit 25.6px from the new shell rule) | `line-height: var(--tc-line-height-normal, 1.5)` → **24px** | §1.2 "1.5 for controls, 1.6 for prose"; **R11** is the 16/700/1.5 role |

**Cascade.** Base `.popover` and `.popover__heading` are (0,1,0); both override rules are (0,2,0)
and win on specificity alone, independent of import order. No other Tzu Chi override file touches
either selector (verified by grep over `styles/themes/tzuchi/components/`).

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| background `bg-overlay` and `box-shadow: var(--overlay-shadow)` (`popover.css:5,7`) | **R99 / R100** — explicit: do not tint a content popover. The `--accent-soft` wash is tc-dropdown's *listbox* signature; body copy was never contrast-checked against it, and it would make a Popover indistinguishable from a Select menu. §6 shadow table: a floating overlay uses `--overlay-shadow`, which is what the base already applies. |
| arrow `fill: var(--overlay)` (`popover.css:45`) and the four placement rotations (`:49-59`) | The arrow follows the (unchanged) fill. R91's `--accent-soft` arrow is the option-panel rule, not this one. |
| `.popover__dialog { p-4 }` = 16px (`popover.css:64`) | **R102** — HeroUI's padding is kept; 16px already *is* the card / alert / accordion-panel inset. |
| enter/exit animation, `duration-150 ease-smooth`, the per-placement slide-ins, `transition-[opacity,transform]`, `will-change` (`popover.css:10-41`) | §8 **R140** (no choreography), **R138** (a positional `transition-*` list must not be half-restated). §6(d) **R116** keeps HeroUI's motion for the Tooltip — the nearest anchored overlay — and R110/R133's 200ms enter retune was applied to the *Modal* only. Listed in spec gaps. |
| `.popover__trigger` in full (`popover.css:73-98`) | No themed colour changes on it, so R131 has nothing to fade; its focus ring is already 2px / 2px / `--focus` theme-wide (**D3**) and disabled is `--disabled-opacity` 0.38 (**D2**). |
| text colour | The base sets none, so it inherits `--foreground`, which is byte-identical to `--overlay-foreground` in both `tzuchi` and `tzuchi-dark` (`themes/tzuchi/variables.css:41-44`, `:85-88`). **N5 / D1**: nothing to restate. |

No variant/size axis exists for Popover (`popoverVariants` has slots only, no `variants` block), and
no state is hidden: `data-entering` / `data-exiting` / `data-placement` all still match.

---

## 2. Toast

| property | HeroUI base (file:line + resolved value) | now (declaration + resolved value) | spec rule |
|---|---|---|---|
| `border-radius` (`.toast`) | `styles/components/toast.css:47` — `min(32px, var(--radius-3xl))` → **24px** | `border-radius: var(--tc-card-radius, var(--radius-2xl))` → **16px** | §6(d) **R117** (+ R27) |
| `gap` (`.toast`) | `styles/components/toast.css:57` — `gap-1.5` → **6px** | `gap: var(--tc-space-8, 8px)` → **8px** | §9 **R147** (icon ↔ label inside a control). 6px is not a step in the Tzu Chi scale at all (4/8/12/16/20/24…). See spec gaps. |
| `font-size` (`.toast__title`) | `styles/components/toast.css:221` — `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | §6(d) **R119** → **R1 / R11** |
| `font-weight` (`.toast__title`) | `toast.css:221` — `font-medium` → **500** | `font-weight: var(--tc-font-weight-bold, 700)` → **700** | **R1 / R11** |
| `line-height` (`.toast__title`) | `toast.css:221` — `leading-5` → **20px** | `line-height: var(--tc-line-height-normal, 1.5)` → **24px** | §1.2 control voice = 1.5. (Note §11 **I5**: `alert.css` is the one bold-16 role at 1.6; R119 points the Toast title at R1/R11, which are 1.5 — followed.) |
| `font-size` (`.toast__description`) | `toast.css:226` — `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | **R119** → **R5** |
| `line-height` (`.toast__description`) | `toast.css:226` — `text-sm` → **20px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | §1.2 prose voice = 1.6; **R5** |
| `color` (`.toast__description`) | `toast.css:226` — `text-muted` → `--muted` = gray-700 / gray-400 | `color: var(--foreground)` → gray-900 / gray-100 | **R119** ("in `--foreground`, not `--muted`") — the same move `card.css:64-67`, `modal.css:86-90`, `alert.css:97-101` make for body copy |
| `margin-block-start` (`.toast__title + .toast__description`) | none — `.toast__content` (`toast.css:186-188`) is `flex flex-col` with no gap → **0px** | `margin-block-start: var(--tc-space-4, 4px)` → **4px** | §9 **R148** (title ↔ description pair, callout value; `alert.css:73-75` applies the same 4px) |
| `color` (`.toast__indicator`) | `toast.css:192` — `text-overlay-foreground`; per status `toast.css:277-294` — `text-success-soft-foreground` / `-warning-` / `-danger-` (and **no** rule at all for `accent`) | `color: var(--toast-accent)`, where `--toast-accent` is `--overlay-foreground` by default and `--accent` / `--success` / `--warning` / `--danger` on `.toast--accent/--success/--warning/--danger` | §5 **R87** ("paint the icon with the tone channel, never a `-soft-foreground` mix") via §6(d) **R120 / R121**; same shape as `alert.css:55-58`, `:103-135` |

**The tone channel.** R87's *two*-channel pattern collapses to one here, because **R118** keeps the
neutral `bg-surface` fill — a Toast has no tone wash and no tc-alert stripe to paint. So only
`--toast-accent` is declared, on `.toast`, defaulting to the exact colour upstream already gives the
indicator, which leaves `.toast--default` pixel-identical. It is a component-local custom property
(like `alert.css`'s `--alert-accent`), **not** a new `--tzuchi-*` theme variable, so `generate.mjs`
is untouched. Side effect, intentional and consistent: `.toast--accent` finally gets a toned
indicator, which upstream only ever set for success/warning/danger.

**Cascade.** Base `.toast`, `.toast__title`, `.toast__description`, `.toast__indicator` are (0,1,0);
every override rule is (0,2,0) (the adjacency rule is (0,3,0)) and wins on specificity. The one tie
is `[data-theme^="tzuchi"] .toast__indicator` against the base's `.toast--success .toast__indicator`
(both (0,2,0)) — resolved by source order, because `themes/tzuchi/components/index.css` is imported
after `@heroui/styles` inside the same `components` layer; this is the identical tie `alert.css`
already documents for `.alert__title`. The title rule declares **no colour**, so it never competes
with `.toast--<status> .toast__title`. Nothing collides with `spinner.css:106-113`'s
`.toast__indicator .spinner` size guard (a deeper selector, a different property).

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| `bg-surface` + `shadow-overlay` (`toast.css:57`) | **R118**. §6's shadow table puts a floating overlay on `--overlay-shadow`; dark mode's fall-through to the 1px inset hairline is intentional ("do not fix it per component"). |
| **indicator SIZE** — `p-1`, `[data-slot="toast-default-icon"] { box-content size-4 }`, `[data-slot="spinner"] { size-4 }` (`toast.css:191-204`) | **R122 / §1.3** pin the toast indicator to 16px and forbid breaking `spinner.css:106-113`. R120's 20px icon is in direct conflict — see spec gaps. Decisive argument: the icon and the loading spinner occupy the **same** slot and swap in place (promise toasts, `toast.tsx:855-861` + `toast.css:208-217`), so growing only the icon would make that swap jump 16 → 20px. |
| **per-status TITLE colours** (`toast.css:269-294`, `-soft-foreground`) | R119 re-types the title but gives it no colour, and unlike `tc-alert` — which can neutralise its words because a 4px stripe *and* a soft wash carry the tone — a Toast has neither, so the title is the tone's second carrier. Most conservative reading; flagged. |
| close button in full (`toast.css:230-261`) — `size-5` box, `bg-default` / `sm:bg-overlay`, the 3.5/3 glyph, reveal-on-hover, its 150ms fade | **D8** (`.close-button` is shared with drawer / popover / alert-dialog; restyling it regresses every host) and §1.3 (its glyph stays small). R109's "transparent at rest" is a Modal-specific rule. |
| action button (`toast.css:264-265`, `mt-2 sm:mt-0`) | It is a `Button` (`toast.tsx:497-503`), already themed by `button.css`; its row gap now comes from the 8px shell gap (**R150**). |
| padding `px-4 py-3` = 16px / 12px (`toast.css:57`) | §6(d) prescribes no padding for the Toast, and both values are already on the Tzu Chi rhythm (`--tc-space-16` / `--tc-space-12`). Restraint. |
| **all** motion and choreography: `--toast-ease`, the 350/250/200/150ms tokens, the `transition` shorthands (`toast.css:71-74`, `:117`, `:237`), the enter/exit/collapse state blocks (`:80-82`, `:122-179`), stacking offsets and `--toast-scale`, the `[data-expanded]::after` hit area, the indicator swap keyframes (`:297-307`), and both `motion-reduce` guards | §8 **R140** (no choreography), **R136** (never touch `transition-property` / `animation-name`), **R138** (a positional `transition-*` list must be repeated whole or not at all). The brief also names the stacking/offset choreography and swipe behaviour as untouchable. |
| `.toast-region` in full (`toast.css:4-40`) | Placement, width, `z-index`, and its focus ring — **D3 / D32**. |
| `:focus-visible` ring on `.toast` (`toast.css:181-183`) | 2px / offset 2px / `--focus` is already the Tzu Chi ring theme-wide (**R70 / D3**). |
| disabled / hidden / exiting opacity | **R85 / D2** — `--disabled-opacity` is theme-wide. |

**Variant & state matrix after the change** — `default` (neutral indicator + neutral title,
identical to upstream except shape and type), `accent` / `success` / `warning` / `danger` (raw-tone
indicator, upstream's `-soft-foreground` title, neutral surface); all six placements; `entering`,
`exiting`, `expanded`, `frontmost`, `hidden`, `swapped`, `focus-visible`, hover-reveal of the close
button — none hidden, flattened or restyled.

---

## Spec gaps

1. **R120 (20px toast leading icon) contradicts R122 / §1.3 (the toast indicator stays 16px, guarded
   by `spinner.css:106-113`).** I cannot change `spinner.css` (another file's selector) and R122 says
   "do not break" it, so I kept **16px** for the icon and applied only R120's colour half. If the
   owner wants the 20px icon, `spinner.css`'s guard must move to 20px in the same change, or the
   promise-toast swap will jump 4px.
2. **Toast per-status title colour — no rule.** R119 gives the title type but no colour; R87's
   "never a `-soft-foreground` mix" is written about the *icon*. `alert.css` collapsed its per-status
   titles to `--foreground`, but it has a stripe and a wash to carry the tone and a Toast has
   neither. Kept upstream's tinted titles (most conservative). One line in `toast.css` would flip it
   if the owner prefers Alert's "tone never in the words" reading.
3. **Toast shell gap — derived.** No rule names the indicator ↔ content gap. Candidates were R147's
   8px (icon ↔ label) and R151's 12px (`--tc-alert-gap`, bound to the alert's callout box). Chose
   **8px**, the smaller delta from HeroUI's off-scale 6px.
4. **Popover / Toast enter motion — deliberately not retuned.** R133 states the generic "overlay
   enter" rule but its only evidence is `modal.css:120-129`, while §6(d) **R116** explicitly keeps
   HeroUI's motion for the Tooltip. A content popover sits between the two; I left HeroUI's
   `duration-150 ease-smooth`. If the owner wants R133 applied to every overlay, Popover needs
   `--tw-animation-duration` / `--tw-ease` on `[data-entering="true"]` and Toast would need its
   `--toast-*-duration` tokens retuned (which the brief rules out).
5. **Q6 stands** — there is no `tc-toast`; every Toast value here descends from §6(d)'s derived
   decision (`toast.css:47,57` + `tc-alert` + `tc-card`). **Q7 stands** for the popover's 16px radius
   (`card.css:46` + `modal.css:76` vs "every floating panel is 8px").
6. **Popover has no padding rule of its own for a dialog-less popover.** R102's "if the popover has
   none, use 16px" never fires here because `.popover__dialog` already applies `p-4`; a consumer who
   renders `Popover.Content` without `Popover.Dialog` gets `p-0` from the base. Left alone —
   changing `.popover`'s own padding would double-pad the normal case.
