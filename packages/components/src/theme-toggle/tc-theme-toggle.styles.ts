import { css } from 'lit';

export const themeToggleStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  .toggle {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--tc-theme-toggle-gap, var(--tc-space-8, 8px));
    inline-size: var(--tc-theme-toggle-size, var(--tc-size-control-md, 48px));
    block-size: var(--tc-theme-toggle-size, var(--tc-size-control-md, 48px));
    padding: 0;
    border: 1px solid var(--tc-theme-toggle-border, var(--tc-color-border-default, #bdbdbd));
    border-radius: var(--tc-theme-toggle-radius, var(--tc-radius-full, 9999px));
    background: var(--tc-theme-toggle-bg, var(--tc-color-surface-default, #fff));
    color: var(--tc-theme-toggle-fg, var(--tc-color-brand-primary, #1b2d58));
    cursor: pointer;
    transition:
      background var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease),
      border-color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease),
      color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease);
  }

  /* Auto-fit when a text label is also rendered (showLabel). */
  :host([show-label]) .toggle {
    inline-size: auto;
    padding-inline: var(--tc-space-16, 16px);
    font: var(--tc-typography-label, 500 14px/1 sans-serif);
  }

  .toggle:hover {
    background: var(--tc-theme-toggle-bg-hover, var(--tc-color-brand-surface, #e8eefe));
    border-color: var(--tc-theme-toggle-border-hover, var(--tc-color-brand-primary, #1b2d58));
  }

  .toggle:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-theme-toggle-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }

  .icon {
    display: inline-flex;
    inline-size: var(--tc-theme-toggle-icon-size, var(--tc-size-icon-sm, 20px));
    block-size: var(--tc-theme-toggle-icon-size, var(--tc-size-icon-sm, 20px));
  }

  .icon svg {
    inline-size: 100%;
    block-size: 100%;
    display: block;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .label {
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .toggle {
      transition: none;
    }
  }
`;
