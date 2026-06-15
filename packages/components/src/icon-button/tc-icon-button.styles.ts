import { css } from 'lit';

export const iconButtonStyles = css`
  :host {
    display: inline-block;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--tc-size-control-md, 48px);
    height: var(--tc-size-control-md, 48px);
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--tc-icon-button-radius, var(--tc-radius-full, 9999px));
    cursor: pointer;
    color: inherit;
    background: transparent;
    transition: background-color var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }
  .btn ::slotted(*) {
    display: inline-flex;
    width: var(--tc-size-icon-md, 24px);
    height: var(--tc-size-icon-md, 24px);
  }
  .btn:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-icon-button-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }
  .btn:disabled {
    opacity: var(--tc-icon-button-disabled-opacity, var(--tc-opacity-disabled, 0.38));
    cursor: not-allowed;
  }

  :host([size='lg']) .btn {
    width: var(--tc-size-control-lg, 64px);
    height: var(--tc-size-control-lg, 64px);
  }
  :host([size='lg']) .btn ::slotted(*) {
    width: var(--tc-size-icon-lg, 32px);
    height: var(--tc-size-icon-lg, 32px);
  }

  :host([variant='tonal']) .btn {
    background: var(--tc-icon-button-tonal-bg, var(--tc-color-brand-surface, #e8eefe));
    color: var(--tc-icon-button-tonal-fg, var(--tc-color-brand-primary, #1b2d58));
  }
  :host([variant='tonal']) .btn:hover:not(:disabled) {
    background: var(--tc-icon-button-tonal-bg-hover, var(--tc-color-brand-surface-hover, #d1deff));
  }

  :host([variant='filled']) .btn {
    background: var(--tc-icon-button-filled-bg, var(--tc-color-brand-primary, #1b2d58));
    color: var(--tc-icon-button-filled-fg, var(--tc-color-text-on-brand, #fff));
  }
  :host([variant='filled']) .btn:hover:not(:disabled) {
    background: var(--tc-icon-button-filled-bg-hover, var(--tc-color-brand-primary-hover, #30559f));
  }
`;
