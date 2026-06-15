import { css } from 'lit';

export const tabStyles = css`
  :host {
    display: inline-flex;
    position: relative;
    box-sizing: border-box;
    align-items: center;
    justify-content: center;
    gap: var(--tc-space-8, 8px);
    padding: var(--tc-space-12, 12px) var(--tc-space-16, 16px);
    font: var(--tc-typography-tab-sm, 500 20px/1.5 sans-serif);
    color: var(--tc-tabs-tab-fg, var(--tc-color-text-muted, #616161));
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    border: none;
    background: transparent;
    transition:
      color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease),
      background-color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease);
  }

  :host(:hover:not([disabled]):not([selected])) {
    background: var(--tc-tabs-tab-bg-hover, var(--tc-color-brand-surface, #e8eefe));
  }

  :host([selected]) {
    color: var(--tc-tabs-tab-fg-selected, var(--tc-color-brand-primary, #1b2d58));
    font-weight: var(--tc-font-weight-bold, 700);
  }

  /* Selected indicator (underline) */
  :host([selected])::after {
    content: '';
    position: absolute;
    inset-inline: var(--tc-space-8, 8px);
    inset-block-end: 0;
    block-size: var(--tc-focus-ring-width, 2px);
    background: var(--tc-tabs-indicator, var(--tc-color-brand-primary, #1b2d58));
    border-radius: var(--tc-radius-full, 9999px);
  }

  :host([disabled]) {
    opacity: var(--tc-tabs-disabled-opacity, var(--tc-opacity-disabled, 0.38));
    cursor: not-allowed;
  }

  :host(:focus-visible) {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-tabs-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: calc(-1 * var(--tc-focus-ring-offset, 2px));
    border-radius: var(--tc-radius-sm, 4px);
  }

  /* Transparent wrapper: an empty icon slot must occupy no space (otherwise it
     pushes the label off-center). The slotted icon, if any, sizes itself. */
  .icon {
    display: contents;
  }

  ::slotted([slot='icon']) {
    inline-size: var(--tc-size-icon-md, 24px);
    block-size: var(--tc-size-icon-md, 24px);
  }
`;
