# Reviewer report — unit "surfaces" (surface.css, disclosure.css, disclosure-group.css)

## Verdict: ok

One file needed (disclosure.css), written unchanged in substance to
`css-reviewed/disclosure.css` (only a "Reviewed:" line was added to the header,
per the output contract). `surface.css` and `disclosure-group.css` correctly
need no file — confirmed by reading the live sources, not just trusting the
draft's prose.

## What I checked and how

**surface.css** — read `heroui/styles/components/surface.css` directly: the
entire base rule is `position: relative` + `text-foreground` on `.surface`,
plus one `background-color`/`text-*-foreground` pair per variant
(`--transparent`/`--default`/`--secondary`/`--tertiary`). No radius, padding,
border, shadow, or type declaration exists anywhere in the base file, so
nothing in the design-language spec (radius by role, padding, type scale, etc.)
has a property to re-point. I also verified the "consumed only through
SurfaceContext, never through the class" claim directly: `surface.tsx` shows
`<Surface>` is a real DOM node (`data-slot="surface"`, class from
`surfaceVariants`), but grepping every `*.tsx` under `react/src/components/`
shows Card/Alert/Autocomplete/ComboBox/DateRangePicker/DatePicker/ColorPicker
all import a *different* `SurfaceContext` (the one that only carries a
`variant` flag, used to suppress nested surface chrome) and never render an
actual `<Surface>` element — the only real `<Surface>` usages are its own four
stories, and all four supply `rounded-3xl p-6`/`gap-3` as consumer utilities
(`surface.stories.tsx:29,44,57,71`), which sit in the utilities layer and
always outrank a components-layer override regardless of specificity.
Applying R27's 16px radius to `.surface` would therefore be dead CSS in every
shipped story and would round full-bleed section backgrounds elsewhere. No
file is the correct, conservative call.

**disclosure-group.css** — read `heroui/styles/components/disclosure-group.css`
directly: two structural declarations only (`w-full`, `contain: layout
style`), confirmed against `disclosure-group.styles.ts` which has exactly one
slot (`base: "disclosure-group"`) and `variants: {}` — there is no gap, no
border, no radius, no fill and no variant axis to attach a rule to. Checked
the stories for the "would a gap even be visible" question the report raises:
`disclosure-group.stories.tsx:82` and a second instance later both use an
explicit `<Separator className="my-2" />` between items (already themed by
`separator.css`), and the Showcase-1 story spaces its items with its own
`className="flex flex-col gap-y-3"` on the `<DisclosureGroup>` itself — a
utility-layer override that would beat any components-layer gap the theme
declared anyway. R145 in DESIGN-LANGUAGE.md is explicit "NO EVIDENCE... the
safe move is to change nothing" for exactly this kind of group. No file is
correct.

**disclosure.css** — the substantive review. Checked against
`heroui/styles/components/disclosure.css` (base), `disclosure.tsx` (slot →
`data-slot` map), `disclosure.stories.tsx`, `disclosure.styles.ts`,
`accordion.css` + `gap-audit/accordion.md` (the sibling this file explicitly
derives from), `themes/tzuchi/variables.css`, and
`packages/tokens/dist/tokens.css`.

1. **Selectors** — `.disclosure__trigger`, `.disclosure__indicator`,
   `.disclosure__body` all exist in the base file and in the `tv()` slot map
   (`disclosure.styles.ts`); `data-slot="disclosure-trigger"` /
   `"disclosure-body"` are emitted by `disclosure.tsx`. Confirmed no rule
   targets `.disclosure__body-inner` or `.disclosure__heading` (both correctly
   left alone — neither has a base rule; `styles/components/disclosure.css:6`
   really does declare `.accordion__heading`, not `.disclosure__heading`, an
   upstream slip correctly flagged rather than silently patched).
2. **Scoping** — every rule (including the two `@media`-wrapped ones) is
   rooted at `[data-theme^="tzuchi"]`. No plain rule outside that scope.
3. **Colour rule** — the only colour declaration is
   `background-color: var(--tzuchi-accordion-trigger-hover-bg, var(--surface-hover))`.
   `--tzuchi-accordion-trigger-hover-bg` already exists in both blocks of
   `themes/tzuchi/variables.css` (lines 67, 109) — not invented this pass.
   `--surface-hover` is a HeroUI theme variable declared once in `:root`
   (`themes/default/variables.css:123`) as
   `color-mix(in oklab, var(--surface) 92%, var(--surface-foreground) 8%)`;
   since `--surface`/`--surface-foreground` are redeclared per mode under
   `[data-theme="tzuchi"]`/`[data-theme="tzuchi-dark"]`, this resolves
   correctly in both modes. No `--tc-color-*` token, no hex/rgb/hsl/oklch
   literal, no named colour.
4. **Mode-independent tokens** — `--tc-typography-subtitle`, `-body`,
   `--tc-space-8`, `-16`, `--tc-size-icon-sm`, `--tc-motion-duration-fast`,
   `-base`, `--tc-motion-easing-standard` all exist in `tokens.css` (lines
   140-141, 39, 41, 53, 62-64) and are absent from the file's
   `[data-theme="dark"]` block — genuinely mode-independent, all with
   fallbacks matching their resolved value (the easing fallback is the literal
   `ease`, matching the same pattern `accordion.css` already uses for the same
   token).
5. **Spec conformance** — R1 (trigger type), R147 (icon gap), R80 (hover
   fill) + R131/R139 (its 150ms fade), R132 (indicator 200ms/standard), R152
   (16px panel inset), R5 (body type) all map to the declared values exactly,
   with no invented numbers. One correction to the draft's own framing: its
   specGaps entry treats R80 as a stretch ("the rule was authored against
   accordion.css... but named [disclosure] anyway") — checking
   DESIGN-LANGUAGE.md directly, R80's "Where it applies" column literally
   reads "accordion trigger, disclosure trigger", so this is direct evidence,
   not an interpretive leap. Doesn't change the CSS, but the draft
   undersold its own justification.
6. **Restraint** — only the four inherited Accordion decisions are touched;
   trigger padding/radius/rest-background, the panel's height/opacity
   transition, and the focus ring are all correctly left alone (verified R72's
   precondition — a container border to clear — genuinely doesn't exist on
   Disclosure's unchromed, container-less trigger, unlike Accordion's boxed
   one).
7. **Cascade** — walked every declaration against its base counterpart's
   specificity: base `.disclosure__trigger`/`__indicator`/`__body` are each
   `(0,1,0)` (Tailwind `@apply` inlines properties, it doesn't add selectors);
   every override rule adds `[data-theme^="tzuchi"]`, landing at `(0,2,0)` or
   higher, so each wins independent of import order within the `components`
   layer. Traced the one place a competing rule from *another* component
   could interfere: when `<Disclosure.Indicator>` renders inside a `<Button>`
   (every shipped story), `button.css`'s
   `.button svg:not(...)` at `(0,2,2)` outranks the indicator rule's
   `(0,2,0)` — correctly documented as a deliberate, intended loss (icon size
   is the hosting button's call per R45-R48), and correctly not asserted.
   Verified the trigger's `gap` only takes effect where a consumer utility
   makes it `flex` (Controlled/ProductDetails stories both add `flex` with no
   competing `gap-*` utility) — matches the file's own reasoning. No other
   tzuchi override file (`grep -rl disclosure styles/themes/tzuchi/components/`)
   touches any `.disclosure*` selector, so rule 7 (ownership) holds.
8. **Comment safety** — every `/*`/`*/` pair balances (6 opens, 6 closes,
   each close alone on its own line); the one place a bare `*` appears before
   a word (`--tc-color-* token`, line 85) is followed by a space, not `/`. No
   premature comment closes.

## Assertions — verified against live sources

Confirmed all 6 story ids exist via `storybook-static/index.json`
(`components-navigation-disclosure--controlled`, `--product-details`,
`--initially-expanded`, plus `--default`/`--disabled`/`--docs` which aren't
used). Confirmed selector/story pairing by reading `disclosure.stories.tsx`
render functions:

- Controlled and ProductDetails templates use `<Disclosure.Trigger>` directly
  (not `<Disclosure.Heading><Button slot="trigger">`), so
  `[data-slot="disclosure-trigger"]` matches a real, unique element in both,
  and both add a bare `flex` utility with no conflicting `gap-*`/font
  utility — font-weight 700 / font-size 16px / line-height 24px / column-gap
  8px all resolve as claimed.
- InitiallyExpanded uses the shared `Template`, which nests the trigger inside
  `<Disclosure.Heading><Button slot="trigger">…<Disclosure.Indicator /></Button>`
  — no `[data-slot="disclosure-trigger"]` in this story, but the report's
  three body assertions target `[data-slot="disclosure-body"]` instead,
  emitted by `<Disclosure.Body className="…">`. Read `disclosure.tsx`'s
  `DisclosureBody`: the consumer's `className` prop lands on the *inner*
  `bodyInner` div, not the outer `dom.div` that carries
  `data-slot="disclosure-body"` and the bare `.disclosure__body` class — so
  none of the story's own utility classes (`rounded-3xl bg-surface p-2 p-4
  shadow-surface`) ever reach the asserted element, and the override's
  `padding: var(--tc-space-16, 16px)` / `font: var(--tc-typography-body,
  400 16px/1.6 …)` apply cleanly. padding-block-start 16px, padding-inline-start
  16px, line-height 25.6px all check out.

All 8 assertions kept, none dropped.

## specGaps carried over from the draft (still accurate)

- No Tzu Chi counterpart exists for Disclosure/DisclosureGroup — every value
  in disclosure.css is Accordion's decision, re-applied.
- `--tzuchi-accordion-trigger-hover-bg` is now shared by two components; a
  rename to something Disclosure-neutral would need a `generate.mjs` change
  out of scope for this pass.
- Upstream slip reported, not fixed: `disclosure.css:6` declares
  `.accordion__heading` where the slot map expects `.disclosure__heading`.
- R145 (DisclosureGroup gap) is spec-silent by its own text; changing it would
  be a new design decision, not a translation.

One amendment to the draft's specGaps: the R80 entry overstated how much of a
stretch naming Disclosure was — the spec's own "Where it applies" column
already names it, so this is applied evidence, not judgement.
