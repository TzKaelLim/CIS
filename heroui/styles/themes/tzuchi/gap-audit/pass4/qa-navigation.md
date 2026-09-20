# Visual QA — family: navigation (tzuchi / tzuchi-dark)

Components: Accordion, Disclosure, DisclosureGroup, Breadcrumbs, Pagination, Tabs.
Tool: `tools/qa-shot.cjs`. Screenshots: `shots/navigation/` (134 PNGs, 2x density).
Upstream comparison renders use themes `light` / `dark`.

## Stories covered

**Accordion** — `--default`, `--surface-variant`, `--custom`, `--without-separator`
(both themes; plus expanded, keyboard focus on the first and last row, hover, and
`light` / `dark` counterparts).

**Disclosure** — `--default`, `--product-details`, `--initially-expanded`, `--disabled`
(both themes; collapsed + expanded, keyboard focus, `light` counterpart for
product-details).

**DisclosureGroup** — `--default`, `--showcase-1` (both themes).

**Breadcrumbs** — `--default`, `--custom-separator`, `--disabled`
(both themes + `light`; plus keyboard focus and hover).

**Pagination** — `--default`, `--sizes`, `--with-ellipsis`, `--simple-prev-next`,
`--with-summary`, `--custom-icons`, `--controlled`, `--disabled`
(both themes; plus keyboard focus on a page number and on Next, hover on a resting
page and on the current page, `light` counterparts for sizes / ellipsis / focus).

**Tabs** — `--default`, `--secondary`, `--vertical`, `--secondary-vertical`,
`--with-disabled-tab`, `--with-separator`, `--overflow`, `--vertical-align`,
`--with-default-selected-tab`, `--with-custom-style`, `--showcase-1`
(both themes; plus `key:Tab` / `ArrowRight` / `ArrowDown` focus, click-selection
without focus, hover on a resting tab, and `light` / `dark` counterparts for the
default, secondary, secondary-vertical and overflow stories).

---

## Findings

### 1 — medium — Tabs (secondary / underline): hover paints a hard square-cornered block

* Screenshots: `shots/navigation/tb-sec-hover-tzuchi.png`, `shots/navigation/tb-sec-hover-tzuchi-dark.png`
  (upstream: `shots/navigation/tb-sec-hover-light.png`)
* Repro: `node tools/qa-shot.cjs tzuchi components-navigation-tabs--secondary out.png size:1000x300 hover:'[role="tab"]:nth-child(3)' clip:'[role="tablist"]'`
* Hovering "Reports" fills the whole tab cell — full height, edge to edge, down onto
  the rail — with a flat `--accent-soft` rectangle that has **no corner radius at all**.
  Upstream only dims the label (`opacity: 0.7`, no fill), so the underline bar is the
  only chrome in the strip.
* Cause: `heroui/styles/themes/tzuchi/components/tabs.css:82-90` adds
  `background-color: var(--accent-soft); opacity: 1` to **every** `.tabs__tab`, but the
  secondary variant's tab is `rounded-none`
  (`heroui/styles/components/tabs.css:~258`, `.tabs--secondary … .tabs__tab { @apply rounded-none }`).
  The radius the theme does apply (`tabs.css:108-111`) is explicitly scoped to
  `.tabs:not(.tabs--secondary)`.
* Suggested fix: scope the hover fill to the segmented variant
  (`.tabs:not(.tabs--secondary) .tabs__tab:hover…`) and give the underline variant a
  text-only hover, or give the secondary tab an 8px radius so the tint reads as a
  control and not as a paint spill.

### 2 — medium — Tabs (both variants, dark): the hover fill outranks the selected state

* Screenshots: `shots/navigation/tb-hover-tzuchi-dark.png` (segmented),
  `shots/navigation/tb-sec-hover-tzuchi-dark.png` (underline)
  (upstream: `shots/navigation/tb-hover-dark-upstream.png`)
* Repro: `node tools/qa-shot.cjs tzuchi-dark components-navigation-tabs--default out.png size:1000x300 hover:'[role="tab"]:nth-child(2)' clip:'[role="tablist"]'`
* In `tzuchi-dark` the hovered tab gets a saturated navy fill (`--accent-soft`
  = rgb(38,56,111)-ish) while the **selected** tab is a neutral gray pill
  (`--segment` = rgb(79,79,79) on a rgb(51,51,51) track). The hovered tab is by far the
  loudest thing in the strip — a user reads "Analytics" as the current tab and
  "Overview" as an inert one. Same inversion in the underline variant, where the
  selected state is only a 2px line.
* Upstream dark keeps the hierarchy: hover just dims the label, the pill stays the
  strongest mark.
* Cause: `heroui/styles/themes/tzuchi/components/tabs.css:82-90` (rule R78, "hover on a
  neutral/transparent surface = `--accent-soft`") applied on top of a selected state
  that is deliberately left neutral (`--segment`, "deliberately unmapped",
  DESIGN-LANGUAGE R130 / D31).
* Note: DESIGN-LANGUAGE §12 Q4 already tracks the *pill-vs-track* contrast (1.35:1) as a
  known token gap. This finding is the separate half of it — the hover, which the theme
  did add, is now stronger than the selection it is supposed to sit under.
* Suggested fix: in dark, use a neutral hover (a step of `--default` / `--surface-hover`)
  rather than the brand tint, or keep the tint but cap it below the `--segment` pill.

### 3 — medium — Accordion (surface variant): the row hover is invisible in dark and nearly invisible in light

* Screenshots: `shots/navigation/acc-surf-hover-tzuchi-dark.png`,
  `shots/navigation/acc-surf-hover-tzuchi.png`
  (upstream: `shots/navigation/acc-surf-hover-dark.png` — unmistakable there)
* Repro: `node tools/qa-shot.cjs tzuchi-dark components-navigation-accordion--surface-variant out.png size:900x700 hover:'.accordion__item:nth-child(2) .accordion__trigger' clip:'.accordion--surface'`
* Dark: card is `rgb(28,28,30)`, the hovered row is `rgb(22,22,24)` — a 6/255 step, and
  it goes *darker*, the opposite of the usual dark-mode convention. On screen the row
  simply does not respond. Light: white card → `rgb(248,248,248)`, a 7/255 step, where
  upstream moves 18/255.
* Cause: `heroui/styles/themes/tzuchi/components/accordion.css:117-122`
  (`background-color: var(--tzuchi-accordion-trigger-hover-bg, var(--surface-hover))`)
  combined with `heroui/styles/themes/tzuchi/variables.css:68` (light `gray-50`) and
  `:111` (dark `gray-980`). `--surface` is `gray-950` in dark (`variables.css:85`), so
  `gray-980` is *below* the card it sits on.
* Suggested fix: in dark point `--tzuchi-accordion-trigger-hover-bg` at a step **above**
  `--surface` (e.g. `gray-900`, which `--default` already uses), and widen the light
  step so the row visibly reacts.

### 4 — medium — Tabs (secondary, horizontal and vertical): keyboard focus hides the selected-tab indicator

* Screenshots: `shots/navigation/tb-sec-arrow-wait-tzuchi.png` (focused — no underline),
  `shots/navigation/tb-sec-click-tzuchi.png` (same tab selected by click — underline present),
  `shots/navigation/tb-secv-arrow-tzuchi.png` / `shots/navigation/tb-secv-click-tzuchi.png` (vertical pair)
* Repro: `node tools/qa-shot.cjs tzuchi components-navigation-tabs--secondary out.png size:1000x300 key:Tab key:ArrowRight wait:1500 clip:'[role="tablist"]'`
  then the same story with `click:'[role="tab"]:nth-child(2)'` and compare.
* With the keyboard, the selected tab's navy 2px indicator is completely covered by the
  focus outline; the rail below it stays plain gray, so nothing marks the current tab
  except the label colour. In the vertical variant the left navy bar disappears
  entirely.
* Mechanism: `.tabs__indicator` carries `z-index: -1`
  (`heroui/styles/components/tabs.css:~225`) and is painted behind the tab, while
  `heroui/styles/themes/tzuchi/components/tabs.css:95-100` replaces HeroUI's outward
  ring with `outline … ; outline-offset: calc(-1 * 2px)` — an **inset** ring that lands
  exactly on the 2px indicator band at the tab's edge.
* upstreamHasItToo: yes — upstream's offset ring also paints over the indicator
  (`shots/navigation/tb-sec-arrow-light.png`, `shots/navigation/tb-secv-arrow-light.png`).
  The inset ring makes the overlap exact rather than incidental, and the theme's chance
  to fix it was not taken.
* Suggested fix: raise the indicator out of the negative stacking context in the
  secondary variant (`z-index: 0` + `isolation`), or inset the secondary tab's focus
  ring only on the three sides that do not carry the indicator.

### 5 — medium — Disclosure "Product details": the chip row overflows the panel card

* Screenshots: `shots/navigation/disc-pd-open-tzuchi.png`
  (upstream: `shots/navigation/disc-pd-open-light.png` — all three chips fit)
* Repro: `node tools/qa-shot.cjs tzuchi components-navigation-disclosure--product-details out.png key:Tab key:Enter wait:600 clip:'#storybook-root > div'`
* The third chip, "Eco-Friendly", is cut in half by the panel's right border: the row is
  `flex gap-2` with no wrap and the three chips no longer fit in the 448px card.
* Cause: the Tzu Chi chip label steps from `text-xs` to 20px
  (`heroui/styles/themes/tzuchi/components/chip.css:57-59`, DESIGN-LANGUAGE R14), which
  widens each chip by ~40%. The Disclosure override itself is not involved; the story's
  `flex gap-2` (no `flex-wrap`) is what turns the overflow into a hard clip.
* Suggested fix: belongs with the Chip owner — either reconsider the 20px `md` chip or
  make chip rows wrap by default. Flagged here because this is where it is visible.

### 6 — low — Tabs `--overflow`: the scroll chevron is drawn on top of a tab label

* Screenshots: `shots/navigation/tb-overflow-btn-tzuchi.png` (close-up),
  `shots/navigation/tb-overflow-zoom-tzuchi.png`
  (upstream: `shots/navigation/tb-overflow-btn-light.png` — clear space before the chevron)
* Repro: `node tools/qa-shot.cjs tzuchi components-navigation-tabs--overflow out.png size:1000x500 clip:'.tabs__list-container__scroll-next'`
* The "next" chevron sits directly over the "f" of the clipped "Perf…" label. The button
  is `bg-transparent` with no backplate or gradient mask
  (`heroui/styles/components/tabs.css:28-31`), so whatever is under it shows through.
* upstreamHasItToo: yes, structurally — upstream just happens not to clip a glyph at
  that x with 14px labels. The 20px Tzu Chi tab label (R13) moves the clip point under
  the chevron, so the theme is what makes it visible.
* Suggested fix: give the scroll button a small `--surface`/`--default` backplate (or a
  fade mask on the scroller's inline end) so no glyph ever sits under it.

### 7 — low — Pagination: the focus ring on a page number lands flush against the current-page chip

* Screenshots: `shots/navigation/pg-focus-zoom-tzuchi.png`
  (upstream: `shots/navigation/pg-focus-zoom-light.png`)
* Repro: `node tools/qa-shot.cjs tzuchi components-navigation-pagination--default out.png size:900x200 key:Tab key:Tab key:Tab clip:'.pagination__content'`
* Tabbing to page "2" draws a 2px ring at a 2px offset — 4px outward — into a 4px gap
  (`--tc-space-4`), so its outer edge meets the filled navy "1" chip with no daylight
  between them. Two squares meeting corner-to-corner reads as a collision; upstream's
  round pills keep a visible gap at the same spacing.
* Cause: `heroui/styles/themes/tzuchi/components/pagination.css` deliberately keeps
  HeroUI's `gap-1` (documented as "already 4px = `--tc-space-4`") while swapping the
  24px pill for a 4px square and growing the box from 32px to 40px.
* Suggested fix: 8px gap between pagination cells, or a 1px ring offset here.

### 8 — low — Breadcrumbs: the separator chevron is now undersized next to its crumbs

* Screenshots: `shots/navigation/bc-default-tzuchi.png`
  (upstream: `shots/navigation/bc-default-light.png`)
* Repro: `node tools/qa-shot.cjs tzuchi components-navigation-breadcrumbs--default out.png size:900x260 clip:'#storybook-root'`
* Crumb text moved from 14px to 16px (`breadcrumbs.css` override, `--tc-font-size-16`)
  but `.breadcrumbs__separator` stays `size-3` = 12px
  (`heroui/styles/components/breadcrumbs.css:24-26`, probed 12x12). Against the heavier
  16px crumbs the chevron reads thin and small, and 12px is below every icon step in the
  theme (`--tc-size-icon-sm` = 20px, `-md` = 32px).
* The override file states this is intentional ("tc's `›` glyph draws less ink at 16px
  than a 12px chevron") — recording it as a designer's-eye nitpick, not a contradiction.
* Suggested fix: 16px separator, or `1em`.

---

## Checked and found FINE

* **Accordion, default variant** — 16px/700 trigger type, 20px chevron, 16px trigger
  padding, the hairline separators and the "no separator after the last item" rule, the
  `--without-separator` story, and the 3% base hover (unchanged from upstream, clearly
  visible). `acc-default-tzuchi*.png`, `acc-nosep-tzuchi2.png`, `acc-def-hover-tzuchi.png`.
* **Accordion, surface variant** — the 8px container radius, the full-bleed
  `--separator` hairlines, the first/last corner rounding, and the keyboard focus ring:
  it hugs the trigger, is **not** clipped by the container at the first or last row, and
  matches the container radius in both themes. `acc-surf-focus1-*.png`,
  `acc-surf-focus6-tzuchi.png`.
* **Accordion expanded panel** — 16px/1.6 body type, even 16px panel inset, panel text
  at full `--foreground` (not muted), open/close leaves no gap or jump.
  `acc-open-tzuchi.png`, `acc-open-tzuchi-dark.png`.
* **Accordion `--custom`** — grouped sections, section headings, per-group cards all
  render correctly in both themes. `acc-custom-tzuchi*.png`.
* **Disclosure** — the Button-hosted trigger, the 20px indicator, its rotation on
  expand, the 16px panel inset, the disabled state (uniformly faded, clearly not
  enabled), and the initially-expanded story. `disc-*.png`.
* **DisclosureGroup** — `--default` and `--showcase-1` in both themes: the separator
  between items, the card container, the expanded/collapsed trigger variants and the
  nested primary button. `dg-*.png`.
* **Breadcrumbs** — spacing rhythm (8px container + 8px item gap), current-crumb weight
  500 at `--foreground`, hover (muted → foreground + underline), the custom-separator
  story, the disabled story (matches upstream exactly, including the full-strength
  current crumb), and the focus ring: 2px at a 2px offset, complete on all four sides,
  not clipped. `bc-*.png`.
* **Pagination** — the 4px square cells, `sm/md/lg` boxes at a clean 32/40/48px with
  16/16/20px labels (no 14px leftovers anywhere, summary included), the current page as
  a brand fill with 700 weight, ellipsis on the same baseline as the digits (identical
  to upstream), `--with-summary` / `--simple-prev-next` / `--custom-icons` /
  `--controlled` layouts, the disabled Previous (correctly the only faded item), hover
  on a resting page and on the current page, and the focus ring on the Prev/Next
  buttons. `pg-*.png`.
* **Tabs, segmented (primary)** — the 12px track over 8px tabs (the concentric R38
  pair), 54px tab height, 20px/500 labels with 700 when selected, the white pill and its
  shadow, the `--with-separator` divider and its suppression next to the selected tab,
  the disabled tab (clearly duller than its siblings), `--vertical`,
  `--vertical-align`, `--with-default-selected-tab`. `tb-default*.png`, `tb-vertical*.png`.
* **Tabs focus ring (segmented)** — inset 2px `--focus` ring, complete, correctly
  clipped-proof inside the ScrollShadow, and clearly distinct from both hover and
  selected in the light theme. `tb-focus-next-tzuchi.png`.
* **Tabs `--secondary` at rest** — the `--accent` label + pill-ended underline inset 8px
  from the cell, the `--border` rail, and the vertical counterpart's left bar; both
  themes. `tb-secondary-*.png`, `tb-secv-click-tzuchi.png`.
* **No text wrapped, truncated or overlapped** anywhere in the family at the default
  900-1100px viewports, apart from the two overflow cases reported above; no unexpected
  scrollbars; no light-coloured remnants in `tzuchi-dark`.
