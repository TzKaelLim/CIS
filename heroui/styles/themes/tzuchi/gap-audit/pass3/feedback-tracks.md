# Unit report — `feedback-tracks` (Meter · ProgressCircle · Skeleton · EmptyState)

Pass 3, base layer. Spec: `scratchpad/atoms3/DESIGN-LANGUAGE.md` (read in full; every
change below cites a rule number from it).

Output files (destined for `heroui/styles/themes/tzuchi/components/`):

| target | file | verdict |
|---|---|---|
| Meter | `scratchpad/atoms3/css/meter.css` | written — shape, readout type, motion |
| ProgressCircle | `scratchpad/atoms3/css/progress-circle.css` | written — motion only |
| EmptyState | `scratchpad/atoms3/css/empty-state.css` | written — type scale only |
| Skeleton | *none* | **no file needed — R129 says NO CHANGE** (below) |

Resolution baseline under `[data-theme^="tzuchi"]` (same as
`gap-audit/progress-bar.md`): `--radius` 8px → `--radius-xs` 2px · `--radius-sm` 4px ·
`--radius-md` 6px · `--radius-lg` 8px; `--spacing` 0.25rem → `h-1/2/3` = 4/8/12px,
`gap-1` = 4px, `p-2` = 8px, `size-5/7/9` = 20/28/36px; `--text-sm` = **14px / 20px**;
`--font-weight-medium` = 500; `--ease-out` = `cubic-bezier(0, 0, .2, 1)`;
`--muted` = light gray-700 `#828282` / dark gray-400 `#b3b3b3`;
`--default` = `#f2f2f2` / `#333333`.

---

## 1. Meter

`meterVariants` defaults are `color: "accent"`, `size: "md"`, so a story's initial state is
`.meter.meter--accent.meter--md`. `gap-audit/progress-bar.md` §"Meter" states the case this
file executes: *"`meter.css` is a line-for-line twin of `progress-bar.css` … The same override
would apply verbatim, with the class prefix swapped … and rule 4b dropped … it must be its own
`meter.css` override file."* DESIGN-LANGUAGE Q9 asks for that to be confirmed before
duplicating; it is confirmed — the two base files were diffed property by property and differ
only in class names and in Meter having no indeterminate block.

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| track corner radius | `meter.css:29` `rounded-sm` → **4px** (`--sm` `meter.css:68` `rounded-xs` → 2px; `--lg` `meter.css:82` `rounded-md` → 6px) | `border-radius: var(--tc-progress-radius, var(--tc-radius-full, 9999px))` → **9999px** at all three sizes | **R32** (track role; declared on the root scope so it beats the per-size rules) |
| fill corner radius | `meter.css:38` `rounded-sm` → **4px** (`--sm` `:72` 2px; `--lg` `:86` 6px) | same declaration → **9999px** | **R32** (track *and* fill) |
| output font-size | `meter.css:23` `text-sm` → **14px** | `font-size: var(--tc-progress-font-size, var(--tc-font-size-16, 16px))` → **16px** | **R19** (names "meter output"); §1 "no 14px step" |
| output font-weight | `meter.css:23` `font-medium` → **500** | `font-weight: var(--tc-font-weight-regular, 400)` → **400** | **R19** |
| output line-height | `meter.css:23` `text-sm` pairing → **20px** (1.4286) | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | **R19**; §1.2 prose voice = 1.6 |
| output colour | not set → inherits `--foreground` (near-black / near-white) | `color: var(--muted)` → **#828282 / #b3b3b3** | **R19** |
| label font-size | `meter.css:17` + `label.css:4` `text-sm` → **14px** | `font-size: var(--tc-font-size-16, 16px)` → **16px** | **R19** row-mate clause ("give its row-mate the same metrics so they share a baseline") |
| label line-height | `text-sm` pairing → **20px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | **R19** row-mate clause |
| fill transition duration | `meter.css:46` `transition: width 300ms …` → **300ms** | `transition-duration: var(--tc-motion-duration-base, 200ms)` → **200ms** | **R132** (a value travelling) |
| fill transition easing | `meter.css:46` `var(--ease-out)` → `cubic-bezier(0, 0, .2, 1)` | `transition-timing-function: var(--tc-motion-easing-standard, …)` → `cubic-bezier(0.2, 0, 0, 1)` | **R132** |

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| track height `h-2` = **8px** at `md`; `h-1` 4px / `h-3` 12px at `sm` / `lg` | 8px is exactly `--tc-progress-height`, so restating it is drift (**R126**, **D19**). `sm`/`lg` have no tc counterpart. |
| track fill `bg-default` (`meter.css:29`) | **R123** — a passive track is scenery; fill-vs-track is 12.00:1 light / 6.97:1 dark. tc's own `surface.subtle` maps onto `--background` in both modes here, i.e. invisible. |
| `--meter-fill: var(--accent)` and the `--default` / `--success` / `--warning` / `--danger` variants (`meter.css:94-112`) | **R75 / R88** — already the Tzu Chi primitives in both modes. |
| grid, `grid-template-areas`, `grid-template-columns`, `w-full` | HeroUI's layout contract (tc puts the readout *below* the track and has no label slot at all — `notTransferable` #1/#2 in `gap-audit/progress-bar.md`). |
| `gap-1` = 4px | Already the tc rhythm (**R141**); `tc-progress.styles.ts:45` uses the same 4px. |
| label weight 500 and colour, `w-fit`, `label.css`'s required / invalid / disabled treatments | tc-progress has no label slot, so nothing contradicts HeroUI's label-over-readout hierarchy. |
| `tabular-nums` | A strict improvement; nothing in tc contradicts it. |
| disabled block (`meter.css:50-59`), incl. the label forced back to `opacity: 1` | **R85 / D2** — `--disabled-opacity` is already 0.38. |
| `transition-property: width` and both `motion-reduce` guards | **R136** — this file sets longhands only, so `motion-reduce:transition-none` still wins. |
| *(no rule written for an indeterminate state)* | Meter has none — `meter.css` has no `:not([aria-valuenow])` block. progress-bar.css's rule 4b is dropped, as `gap-audit/progress-bar.md` instructs. |

**Cascade.** Base rules are `.meter .meter__track|__fill|__output` and
`.meter [data-slot="label"]`, all (0,2,0); the per-size rules `.meter--sm .meter__track` are
(0,2,0); `label.css`'s `.label` is (0,1,0). Every rule in the file is (0,3,0) and wins on
specificity alone — no reliance on import order.

---

## 2. ProgressCircle

Nothing in §7 asks for a colour or a shape change here, and the file says so: the only changes
are the two motion values that keep it in step with the themed ProgressBar and the themed
Spinner.

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| fill transition duration | `progress-circle.css:29` `transition: stroke-dashoffset 300ms …` → **300ms** | `transition-duration: var(--tc-motion-duration-base, 200ms)` → **200ms** | **R132** — identical to the change the theme already made to the ProgressBar fill (`progress-bar.css:143-146`), which the base file times identically |
| fill transition easing | `progress-circle.css:29` `var(--ease-out)` → `cubic-bezier(0, 0, .2, 1)` | `transition-timing-function: var(--tc-motion-easing-standard, …)` → `cubic-bezier(0.2, 0, 0, 1)` | **R132** |
| indeterminate spin duration | `progress-circle.css:36` `animation: progress-circle-spin 1s linear infinite` → **1s** | `animation-duration: var(--tc-spinner-duration, 0.8s)` → **0.8s** | **R135** (spin) — the theme's single spin rate, the same token `spinner.css:69` sets on `.spinner` |

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| track stroke `var(--default)` (`progress-circle.css:11`) | **R123** names ProgressCircle as a *passive* track: leave `bg-default`. Already correct, nothing restated. |
| stroke width 4 on an r=16 / 36-unit viewBox | **R126** — "keep HeroUI's thicknesses"; it is set in `progress-circle.tsx:18-21`, not in CSS. |
| round leading edge | Already there: `progress-circle.tsx:159` `strokeLinecap="round"`. **R32**'s pill has no border-radius expression on an SVG stroke. |
| sizes `size-5` / `size-7` / `size-9` = **20 / 28 / 36px** | The spec gives no size rule for ProgressCircle; §6 RESTRAINT. Recorded as a spec gap (the Spinner moved to 20/32/40 under **R127**). |
| `linear` spin easing | Already what **R134** asks for. |
| `--progress-circle-stroke` and the five colour variants (`:87-104`) | **R75 / R88** — already the Tzu Chi primitives per mode. |
| the 75%-circumference indeterminate dash, the -90° rotation, `inline-flex` centring | Structural, set in the TSX. **R140** forbids new choreography. |
| disabled block (`:42-47`) | **R85 / D2**. |
| `transition-property`, `animation-name`, both `motion-reduce` guards | **R136** — longhands only; with `animation-name: none` under reduced motion nothing runs whatever the duration says. |

**Cascade.** `.progress-circle .progress-circle__fill-circle` is (0,2,0) → the override is
(0,3,0). `.progress-circle:not([aria-valuenow]) .progress-circle__track` is (0,3,0) → the
override is (0,4,0).

---

## 3. Skeleton — no file

**R129 is explicit: "Skeleton — NO CHANGE."** Verified against the live base file rather than
taken on trust:

| property | HeroUI base (file:line → resolved) | verdict |
|---|---|---|
| corner radius | `skeleton.css:2` `rounded-sm` → `var(--radius-sm)` = `calc(8px * 0.5)` = **4px** | **Already the Tzu Chi small radius** (`--tc-radius-sm` = 4px, §0). Writing `border-radius: var(--tc-radius-sm, 4px)` would be a no-op that only adds drift risk (**N5**). |
| surface | `skeleton.css:2` `bg-surface-tertiary/70` | **D31 / R129** — `--surface-tertiary` is deliberately unmapped; `neutral-token-impact.md:334-350` records that mapping it turns a placeholder into a loud grey block (2.08:1 in dark). |
| shimmer | `skeleton.css:8-41` (`animate-skeleton`, the `::after` gradient, the synchronised `::before` for `:has(.skeleton)`), `skeleton--pulse`, `skeleton--none` | **R140** — no new choreography, no keyframes. Kept whole, as the brief asks. |

So there is nothing this component needs that the theme does not already give it. An empty
override file would be noise; none is produced.

*Observation for the owner, not a change:* `skeleton.css:21-27`'s synchronised parent shimmer
paints a hard-coded `rgba(255, 255, 255, 0.5)` gradient with `mix-blend-mode: overlay`. That
literal is upstream base CSS (a theme override cannot restyle a `::before` gradient without
re-declaring the whole background) and it is a light-mode assumption. Worth an eye in
`tzuchi-dark` on the *Grid* / *Single Shimmer* stories; it is not in scope for this pass.

---

## 4. EmptyState

One base rule, one change. `EmptyState` has no story of its own; it renders inside Table
(`components-data-display-table--empty-state-demo`) and inside the Autocomplete / ComboBox
popovers (`renderEmptyState`).

| property | HeroUI base (file:line → resolved) | now (declaration → resolved) | spec rule |
|---|---|---|---|
| font-size | `empty-state.css:3` `text-sm` → **14px** (re-stated at `autocomplete.css:231-233` for the popover copy) | `font-size: var(--tc-font-size-16, 16px)` → **16px** | **R21** ("empty-state copy — NO EVIDENCE, derive: prose → R5") + §1's mechanical "every 14px role moves to 16px" |
| line-height | `text-sm` pairing → **20px** | `line-height: var(--tc-line-height-relaxed, 1.6)` → **25.6px** | **R5** / §1.2 — prose voice is 1.6 |

### Left as HeroUI's (and why)

| kept | why |
|---|---|
| `text-muted` (`empty-state.css:3`) | Already the themed `--muted` = `color.text.muted`, the same colour **R19** gives the Progress/Meter readouts. |
| font-weight | The base declares none, so the copy inherits **400** — R5's value — in every context audited (Table; the themed option panel puts its 700 on `[data-slot="list-box-item"]`, not on the panel). Declaring it would guard a hypothesis, not follow a rule. |
| `p-2` = 8px | No spec rule for an empty state's inset; §6 RESTRAINT. See the spec gap about the 32px option-row inset. |
| `autocomplete.css:231-233`'s `text-center` and tinted colour | Another component's base rule for its own popover; only the 14px inside it is overridden. |
| consumer utilities (the Table story's `flex h-full w-full flex-col items-center justify-center gap-4 text-center`, and its inner `<span class="text-sm">`) | The utilities layer beats the components layer by design (**D10**). The *root* `.empty-state` font-size is what this file sets. |

**Cascade.** `.empty-state` is (0,1,0). `.autocomplete [data-slot="empty-state"]`
(`autocomplete.css:231`) is (0,2,0) and re-states `text-sm`, so the first branch
(`[data-theme^="tzuchi"] .empty-state`, (0,2,0)) only ties it — a tie that already resolves this
file's way on import order (**N7**). The second branch adds the element's own `data-slot`
(0,3,0) so the win does not depend on import order at all. Both branches carry the same two
declarations. Neither reaches into another component (**rule 7**): both match EmptyState's own
root, whose `data-slot="empty-state"` is emitted unconditionally at `empty-state.tsx:25`.

---

## Spec gaps

1. **EmptyState has no Figma record at all.** R21 is flagged *NO EVIDENCE — derive*, and Q8
   lists EmptyState among the components with no Tzu Chi counterpart. "Prose → R5" is the
   closest role; the change is internally consistent with the spec but is not traceable to a
   design decision.
2. **EmptyState inside a themed option panel is not inset like the rows.** §6(a) R57/R93 inset
   option rows `32px`; the empty-state copy keeps its `p-2` = 8px, so "No results found" sits
   24px to the inside of where the options were. The spec has no rule for it and a fix belongs
   to whoever owns `combo-box` / `autocomplete` popovers (**rule 7**), not to `empty-state.css`.
   Flagging so it is not read as an oversight.
3. **ProgressCircle's size scale is off the Tzu Chi icon scale.** `spinner.css:58-98` moved the
   Spinner to 20 / 32 / 40px (**R127**, `--tc-size-icon-*`); ProgressCircle stays at HeroUI's
   20 / 28 / 36px because §7 gives it a rule for thickness (R126) and colour (R123) but none for
   size. An indeterminate ProgressCircle and a Spinner are the same gesture at two different
   diameters at `md` and `lg`. Owner call: if they should match, `--md` → 32px and `--lg` → 40px.
4. **The indeterminate ProgressCircle track has two readings.** §7.1 row 2 says a track with an
   indicator moving over it takes `--border` (that is exactly what the themed Spinner's ring
   is); R123 names ProgressCircle a *passive* `--default` track. Both apply in the
   `:not([aria-valuenow])` state. R123 is the explicitly-named rule, so `--default` was kept in
   both states. If the owner prefers the Spinner reading, it is one declaration on
   `.progress-circle:not([aria-valuenow])`.
5. **R135's spin rate is tc-spinner's token.** `--tc-spinner-duration` (0.8s) is applied to
   ProgressCircle because it is the theme's only spin rate and §8 has exactly one spin rule.
   There is no `--tc-progress-circle-duration`, and this pass may not invent `--tzuchi-*`
   variables. If borrowing the token is unwanted, the alternative is to leave HeroUI's 1s and
   accept two revolution rates in one library.
6. **Meter is pinned to the Progress tokens.** `--tc-progress-radius` and
   `--tc-progress-font-size` are referenced verbatim, per `gap-audit/progress-bar.md`'s
   "the same override would apply verbatim" and Q9. Both are mode-independent and resolve to
   `--tc-radius-full` / `--tc-font-size-16`. If the owner would rather Meter not follow future
   edits to the Progress tokens, swap the two references for `var(--tc-radius-full, 9999px)` and
   `var(--tc-font-size-16, 16px)`; the resolved values are identical today.
7. **`--muted` contrast (inherited, not introduced).** The Meter readout is painted `--muted`,
   which in light is gray-700 `#828282` = **3.62:1** on the page — below AA. Identical to the
   caveat already recorded for ProgressBar in `gap-audit/progress-bar.md` and in
   `heroui/MAINTAINING.md`; it is a token-owner decision, not a component one.

## Checklist (§13)

1. Every rule and every comma branch is under `[data-theme^="tzuchi"]` — verified mechanically
   (a parser that strips comments, walks brace depth and tests each top-level branch).
2. Scanned all three files for `--tc-color`, `#`, `rgb(`, `hsl(`, `oklch(`, `!important`, and
   physical `left`/`right` properties — clean. No stray comment terminator: the count of `*` + `/`
   sequences equals the count of `/` + `*` openers in each file.
3. Every `--tc-` token used (`--tc-progress-radius`, `--tc-progress-font-size`,
   `--tc-radius-full`, `--tc-font-size-16`, `--tc-line-height-relaxed`,
   `--tc-font-weight-regular`, `--tc-motion-duration-base`, `--tc-motion-easing-standard`,
   `--tc-spinner-duration`) exists in `packages/tokens/dist/tokens.css`, carries a fallback, and
   is absent from both dark blocks (`[data-theme="dark"]` at line 410 and the
   `prefers-color-scheme` block at 435) — i.e. mode-independent.
4. The only colour declared anywhere in the unit is `color: var(--muted)`, a HeroUI theme
   variable. No new `--tzuchi-*` variable is needed.
5. Specificity hand-derived against every base rule replaced, including the per-size variants
   and `autocomplete.css`'s re-statement.
6. No `transition-property` and no `animation-name` anywhere (R136), so no reduced-motion guard
   needed restating (R137).
7. No HeroUI variant, size or state is hidden or flattened — enumerated per component above.
8. Each file's header records the model, what changed with its rule number, what was kept and
   why, the variant mapping and the cascade notes.
9. Nothing in §10 is touched (closest calls: D19 ProgressBar heights — Meter's heights are
   likewise untouched; D2 disabled; D31 `--surface-tertiary` — the reason Skeleton gets no file).
