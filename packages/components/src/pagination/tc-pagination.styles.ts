import { css } from 'lit';

export const paginationStyles = css`
  :host {
    display: block;
  }

  .nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--tc-space-4, 4px);
  }

  .item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-width: var(--tc-size-icon-lg, 32px);
    height: var(--tc-size-icon-lg, 32px);
    padding: 0 var(--tc-space-4, 4px);
    margin: 0;
    border: 1px solid transparent;
    border-radius: var(--tc-pagination-radius, var(--tc-radius-sm, 4px));
    background: transparent;
    color: var(--tc-pagination-item-fg, var(--tc-color-text-default, #333));
    font: var(--tc-typography-body, 400 16px/1.5 sans-serif);
    cursor: pointer;
    transition: background-color var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }

  .item:hover:not(:disabled):not([aria-current='page']) {
    background: var(--tc-pagination-item-bg-hover, var(--tc-color-brand-surface, #e8eefe));
  }

  .item:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-pagination-focus-ring-color, var(--tc-focus-ring-color, #4f7bbe));
    outline-offset: var(--tc-focus-ring-offset, 2px);
  }

  .item:disabled {
    opacity: var(--tc-pagination-disabled-opacity, var(--tc-opacity-disabled, 0.38));
    cursor: not-allowed;
  }

  /* Current page: brand-primary highlight. */
  .item[aria-current='page'] {
    background: var(--tc-pagination-item-bg-selected, var(--tc-color-brand-primary, #1b2d58));
    color: var(--tc-pagination-item-fg-selected, var(--tc-color-text-on-brand, #fff));
    font: var(--tc-typography-subtitle, 700 16px/1.5 sans-serif);
  }

  /* Prev / next chevron buttons. */
  .nav-button {
    color: var(--tc-pagination-item-fg, var(--tc-color-text-default, #333));
  }

  .nav-button svg {
    display: block;
    width: var(--tc-size-icon-md, 24px);
    height: var(--tc-size-icon-md, 24px);
  }

  /* Ellipsis gap marker. */
  .ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--tc-size-icon-lg, 32px);
    height: var(--tc-size-icon-lg, 32px);
    color: var(--tc-pagination-item-fg, var(--tc-color-text-default, #333));
    user-select: none;
  }
`;
