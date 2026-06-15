import { css } from 'lit';

export const buttonStyles = css`
  :host {
    display: inline-block;
  }
  :host([full-width]) {
    display: block;
  }
  :host([full-width]) .btn {
    width: 100%;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--tc-space-8, 8px);
    font: var(--tc-typography-subtitle, 700 16px/1.5 sans-serif);
    border-radius: var(--tc-button-radius, var(--tc-radius-md, 8px));
    padding: var(--tc-space-8, 8px) var(--tc-space-24, 24px);
    border: 1px solid transparent;
    cursor: pointer;
    transition: background-color var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }
  .btn:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-button-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }
  .btn:disabled {
    opacity: var(--tc-button-disabled-opacity, var(--tc-opacity-disabled, 0.38));
    cursor: not-allowed;
  }

  :host([variant='filled']) .btn {
    background: var(--tc-button-filled-bg, #1b2d58);
    color: var(--tc-button-filled-fg, #fff);
  }
  :host([variant='filled']) .btn:hover:not(:disabled) {
    background: var(--tc-button-filled-bg-hover, #30559f);
  }

  :host([variant='outlined']) .btn {
    background: transparent;
    color: var(--tc-button-outlined-fg, #1b2d58);
    border-color: var(--tc-button-outlined-border, #1b2d58);
  }
  :host([variant='outlined']) .btn:hover:not(:disabled) {
    background: var(--tc-button-outlined-bg-hover, #e8eefe);
  }

  :host([variant='tonal']) .btn {
    background: var(--tc-button-tonal-bg, #e8eefe);
    color: var(--tc-button-tonal-fg, #1b2d58);
  }
  :host([variant='tonal']) .btn:hover:not(:disabled) {
    background: var(--tc-button-tonal-bg-hover, #d1deff);
  }
`;
