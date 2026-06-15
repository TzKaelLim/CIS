import { css } from 'lit';

/**
 * Badge styling. Three visual variants (filled / soft / outline) crossed with
 * six tones (neutral / brand / success / error / warning / info). Each tone
 * declares its own filled-bg / filled-fg / soft-bg / soft-fg / line colours via
 * local custom properties, then the variant rules consume them — so the tone
 * matrix lives in one place and stays consumer-overridable through
 * `--tc-badge-*` cssprops. Every value uses a semantic token with a literal
 * fallback; no raw hardcoded colours.
 */
export const badgeStyles = css`
  :host {
    display: inline-flex;
    box-sizing: border-box;
    vertical-align: middle;

    /* Tone-resolved colours, defaulting to the neutral tone. Tone selectors
       below reassign these; the variant rules consume them. */
    --tc-badge-_solid-bg: var(--tc-color-gray-700, #828282);
    --tc-badge-_solid-fg: var(--tc-color-white, #ffffff);
    --tc-badge-_soft-bg: var(--tc-color-surface-subtle, var(--tc-color-gray-50, #f8f8f8));
    --tc-badge-_soft-fg: var(--tc-color-text-default, var(--tc-color-gray-900, #333333));
    --tc-badge-_line: var(--tc-color-border-default, var(--tc-color-gray-300, #bdbdbd));
  }

  :host([hidden]) {
    display: none;
  }

  /* ---- Tone palette ------------------------------------------------------ */

  /* neutral (default) — set on :host above; restated for [tone="neutral"]. */
  :host([tone='neutral']) {
    --tc-badge-_solid-bg: var(--tc-color-gray-700, #828282);
    --tc-badge-_solid-fg: var(--tc-color-white, #ffffff);
    --tc-badge-_soft-bg: var(--tc-color-surface-subtle, var(--tc-color-gray-50, #f8f8f8));
    --tc-badge-_soft-fg: var(--tc-color-text-default, var(--tc-color-gray-900, #333333));
    --tc-badge-_line: var(--tc-color-border-default, var(--tc-color-gray-300, #bdbdbd));
  }

  :host([tone='brand']) {
    --tc-badge-_solid-bg: var(--tc-color-brand-primary, var(--tc-color-blue-900, #1b2d58));
    --tc-badge-_solid-fg: var(--tc-color-text-on-brand, var(--tc-color-white, #ffffff));
    --tc-badge-_soft-bg: var(--tc-color-brand-surface, var(--tc-color-blue-100, #e8eefe));
    --tc-badge-_soft-fg: var(--tc-color-brand-primary, var(--tc-color-blue-900, #1b2d58));
    --tc-badge-_line: var(--tc-color-brand-primary, var(--tc-color-blue-900, #1b2d58));
  }

  /* info shares the brand palette but with a mid-blue accent for separation. */
  :host([tone='info']) {
    --tc-badge-_solid-bg: var(--tc-color-blue-700, #30559f);
    --tc-badge-_solid-fg: var(--tc-color-white, #ffffff);
    --tc-badge-_soft-bg: var(--tc-color-brand-surface, var(--tc-color-blue-100, #e8eefe));
    --tc-badge-_soft-fg: var(--tc-color-blue-700, #30559f);
    --tc-badge-_line: var(--tc-color-blue-700, #30559f);
  }

  :host([tone='success']) {
    --tc-badge-_solid-bg: var(--tc-color-feedback-success, var(--tc-color-green-600, #168967));
    --tc-badge-_solid-fg: var(--tc-color-white, #ffffff);
    /* No dedicated success-surface token: tint with a low-opacity feedback colour. */
    --tc-badge-_soft-bg: color-mix(
      in srgb,
      var(--tc-color-feedback-success, var(--tc-color-green-600, #168967)) 12%,
      var(--tc-color-white, #ffffff)
    );
    --tc-badge-_soft-fg: var(--tc-color-feedback-success, var(--tc-color-green-600, #168967));
    --tc-badge-_line: var(--tc-color-feedback-success, var(--tc-color-green-600, #168967));
  }

  :host([tone='error']) {
    --tc-badge-_solid-bg: var(--tc-color-feedback-error, var(--tc-color-red-500, #d4494f));
    --tc-badge-_solid-fg: var(--tc-color-white, #ffffff);
    --tc-badge-_soft-bg: color-mix(
      in srgb,
      var(--tc-color-feedback-error, var(--tc-color-red-500, #d4494f)) 12%,
      var(--tc-color-white, #ffffff)
    );
    --tc-badge-_soft-fg: var(--tc-color-feedback-error, var(--tc-color-red-500, #d4494f));
    --tc-badge-_line: var(--tc-color-feedback-error, var(--tc-color-red-500, #d4494f));
  }

  /* warning — no dedicated warning token in the palette; derive from brand
     mid-blue so the badge stays on-brand while still reading as an accent. */
  :host([tone='warning']) {
    --tc-badge-_solid-bg: var(--tc-color-blue-400, #587291);
    --tc-badge-_solid-fg: var(--tc-color-white, #ffffff);
    --tc-badge-_soft-bg: color-mix(
      in srgb,
      var(--tc-color-blue-400, #587291) 14%,
      var(--tc-color-white, #ffffff)
    );
    --tc-badge-_soft-fg: var(--tc-color-blue-400, #587291);
    --tc-badge-_line: var(--tc-color-blue-400, #587291);
  }

  /* ---- Badge box --------------------------------------------------------- */

  .badge {
    display: inline-flex;
    box-sizing: border-box;
    align-items: center;
    justify-content: center;
    gap: var(--tc-badge-gap, var(--tc-space-4, 4px));
    min-block-size: var(--tc-badge-min-size, 20px);
    padding: var(--tc-badge-padding-block, 2px)
      var(--tc-badge-padding-inline, var(--tc-space-8, 8px));
    /* Small label type: body family at a reduced size. */
    font-family: var(--tc-font-family-base, 'Noto Sans TC', system-ui, sans-serif);
    font-size: var(--tc-badge-font-size, 12px);
    font-weight: var(--tc-font-weight-medium, 500);
    line-height: var(--tc-line-height-tight, 1.25);
    color: var(--tc-badge-fg, var(--tc-badge-_soft-fg));
    background: var(--tc-badge-bg, var(--tc-badge-_soft-bg));
    border: 1px solid transparent;
    border-radius: var(--tc-badge-radius, var(--tc-radius-full, 9999px));
    white-space: nowrap;
    user-select: none;
  }

  /* ---- Size -------------------------------------------------------------- */

  :host([size='sm']) .badge {
    min-block-size: var(--tc-badge-min-size, 18px);
    padding: var(--tc-badge-padding-block, 1px)
      var(--tc-badge-padding-inline, var(--tc-space-4, 4px));
    font-size: var(--tc-badge-font-size, 11px);
    gap: var(--tc-badge-gap, 3px);
  }

  /* ---- Shape ------------------------------------------------------------- */

  /* Default is slightly rounded; the pill flag makes it fully rounded. */
  :host(:not([pill])) .badge {
    border-radius: var(--tc-badge-radius, var(--tc-radius-sm, 4px));
  }

  :host([pill]) .badge {
    border-radius: var(--tc-badge-radius, var(--tc-radius-full, 9999px));
  }

  /* ---- Variants ---------------------------------------------------------- */

  /* soft (default): tinted bg + tone fg. */
  :host(:not([variant])) .badge,
  :host([variant='soft']) .badge {
    color: var(--tc-badge-fg, var(--tc-badge-_soft-fg));
    background: var(--tc-badge-bg, var(--tc-badge-_soft-bg));
    border-color: transparent;
  }

  /* filled: solid tone bg + on-tone fg. */
  :host([variant='filled']) .badge {
    color: var(--tc-badge-fg, var(--tc-badge-_solid-fg));
    background: var(--tc-badge-bg, var(--tc-badge-_solid-bg));
    border-color: transparent;
  }

  /* outline: transparent bg + tone border + tone fg. */
  :host([variant='outline']) .badge {
    color: var(--tc-badge-fg, var(--tc-badge-_soft-fg));
    background: var(--tc-badge-bg, transparent);
    border-color: var(--tc-badge-border-color, var(--tc-badge-_line));
  }

  /* ---- Leading status dot ------------------------------------------------ */

  .dot {
    display: inline-block;
    flex: 0 0 auto;
    inline-size: var(--tc-badge-dot-size, 6px);
    block-size: var(--tc-badge-dot-size, 6px);
    border-radius: var(--tc-radius-full, 9999px);
    background: currentColor;
  }

  :host([size='sm']) .dot {
    inline-size: var(--tc-badge-dot-size, 5px);
    block-size: var(--tc-badge-dot-size, 5px);
  }

  /* On filled badges the dot would vanish into the matching fg; give it a
     solid tone fill so it still reads against the solid background. */
  :host([variant='filled']) .dot {
    background: var(--tc-badge-dot-color, currentColor);
  }

  .label {
    display: inline-flex;
    align-items: center;
  }

  .vh {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;
