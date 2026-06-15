import { css } from 'lit';

export const chipStyles = css`
  :host {
    display: inline-flex;
    box-sizing: border-box;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  .chip {
    display: inline-flex;
    box-sizing: border-box;
    align-items: center;
    justify-content: center;
    gap: var(--tc-space-4, 4px);
    /* 31px tall pill from Figma: padding + line-height land on ~31px. */
    min-block-size: 31px;
    padding: var(--tc-space-4, 4px) var(--tc-space-12, 12px);
    font: var(--tc-typography-tab-sm, 500 20px/1.5 sans-serif);
    color: var(--tc-chip-fg, var(--tc-color-brand-primary, #1b2d58));
    background: var(--tc-chip-bg, var(--tc-color-brand-surface, #e8eefe));
    border: 1px solid transparent;
    border-radius: var(--tc-chip-radius, var(--tc-radius-full, 9999px));
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition:
      background-color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease),
      border-color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease);
  }

  /* Non-interactive (no selection, not removable): present as a static tonal pill. */
  :host([static]) .chip {
    cursor: default;
  }

  :host(:hover:not([disabled])) .chip {
    background: var(--tc-chip-bg-hover, var(--tc-color-brand-surface-hover, #d1deff));
  }

  /* Selected toggle state: keep tonal bg, add a brand border for affordance. */
  :host([selected]:not([disabled])) .chip {
    background: var(--tc-chip-bg-hover, var(--tc-color-brand-surface-hover, #d1deff));
    border-color: var(--tc-chip-fg, var(--tc-color-brand-primary, #1b2d58));
  }

  /* delegatesFocus puts focus on the host; show the ring on the pill. */
  :host(:focus-visible) {
    outline: none;
  }

  :host(:focus-visible) .chip {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-chip-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }

  :host([disabled]) .chip {
    opacity: var(--tc-chip-disabled-opacity, var(--tc-opacity-disabled, 0.38));
    cursor: not-allowed;
  }

  /* Leading icon slot. */
  .leading {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
  }

  ::slotted([slot='leading']) {
    inline-size: var(--tc-size-icon-sm, 18px);
    block-size: var(--tc-size-icon-sm, 18px);
  }

  .label {
    display: inline-flex;
    align-items: center;
  }

  /* Trailing close button. */
  .remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    margin: 0;
    margin-inline-start: var(--tc-space-4, 4px);
    padding: 0;
    inline-size: var(--tc-size-icon-sm, 18px);
    block-size: var(--tc-size-icon-sm, 18px);
    color: inherit;
    background: transparent;
    border: none;
    border-radius: var(--tc-radius-full, 9999px);
    cursor: pointer;
    transition: background-color var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }

  .remove:hover:not(:disabled) {
    background: var(--tc-color-brand-surface, #e8eefe);
  }

  .remove:disabled {
    cursor: not-allowed;
  }

  .remove:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-chip-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }

  .remove svg {
    inline-size: 100%;
    block-size: 100%;
  }
`;
