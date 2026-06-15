import { css } from 'lit';

export const searchBarStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  .bar {
    display: flex;
    align-items: stretch;
    box-sizing: border-box;
    margin: 0;
    background: var(--tc-search-bar-bg, var(--tc-color-surface-default, #fff));
    border: 1px solid var(--tc-search-bar-border, var(--tc-color-border-default, #bdbdbd));
    border-radius: var(--tc-search-bar-radius, var(--tc-radius-md, 8px));
    overflow: hidden;
    transition:
      border-color var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease),
      box-shadow var(--tc-motion-duration-fast, 150ms) var(--tc-motion-easing-standard, ease);
  }

  .bar:hover {
    border-color: var(--tc-search-bar-border-hover, var(--tc-color-border-focus, #30559f));
  }

  /* delegatesFocus puts :focus-within on the host when an inner control is focused */
  :host(:focus-within) .bar {
    border-color: var(--tc-search-bar-border-focus, var(--tc-color-border-focus, #30559f));
    box-shadow: 0 0 0 3px
      var(--tc-search-bar-focus-ring, var(--tc-color-brand-surface-hover, #d1deff));
  }

  /* Leading category selector (native <select>). */
  .category {
    flex: 0 0 auto;
    align-self: stretch;
    margin: 0;
    padding: var(--tc-space-8, 8px) var(--tc-space-12, 12px);
    max-inline-size: 9rem;
    font: var(--tc-typography-subtitle, 700 16px/1.5 sans-serif);
    color: var(--tc-search-bar-category-fg, var(--tc-color-text-default, #333));
    background: var(--tc-search-bar-category-bg, var(--tc-color-surface-subtle, #f5f5f5));
    border: 0;
    border-inline-end: 1px solid
      var(--tc-search-bar-divider, var(--tc-color-border-default, #bdbdbd));
    border-radius: 0;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    background-image: var(--tc-search-bar-chevron-image, none);
  }

  .category:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-search-bar-focus-ring-color, var(--tc-color-border-focus, #30559f));
    outline-offset: calc(-1 * var(--tc-focus-ring-width, 2px));
  }

  .category:disabled {
    cursor: not-allowed;
  }

  /* Wrapper that holds the native select plus the chevron glyph. */
  .category-wrap {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    flex: 0 0 auto;
  }

  .category-chevron {
    position: absolute;
    inset-block: 0;
    inset-inline-end: var(--tc-space-8, 8px);
    display: inline-flex;
    align-items: center;
    inline-size: var(--tc-size-icon-sm, 18px);
    color: var(--tc-search-bar-category-fg, var(--tc-color-text-default, #333));
    pointer-events: none;
  }

  .category-wrap .category {
    padding-inline-end: calc(var(--tc-space-12, 12px) + var(--tc-size-icon-sm, 18px));
  }

  .category-chevron svg {
    inline-size: 100%;
    block-size: 100%;
  }

  /* Text input grows to fill the bar. */
  .input {
    flex: 1 1 auto;
    min-inline-size: 0;
    margin: 0;
    padding: var(--tc-space-8, 8px) var(--tc-space-20, 20px);
    border: 0;
    background: transparent;
    font: var(--tc-typography-body, 400 16px/1.6 sans-serif);
    color: var(--tc-search-bar-text, var(--tc-color-text-default, #333));
    outline: none;
  }

  .input::placeholder {
    color: var(--tc-search-bar-placeholder, var(--tc-color-text-muted, #95969b));
    opacity: 1;
  }

  /* Trailing search button. */
  .submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    align-self: stretch;
    margin: 0;
    padding: var(--tc-space-8, 8px) var(--tc-space-16, 16px);
    color: var(--tc-search-bar-icon-fg, var(--tc-color-brand-primary, #1b2d58));
    background: var(--tc-search-bar-submit-bg, var(--tc-color-surface-subtle, #f5f5f5));
    border: 0;
    border-inline-start: 1px solid
      var(--tc-search-bar-divider, var(--tc-color-border-default, #bdbdbd));
    border-radius: 0;
    cursor: pointer;
    transition: background-color var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }

  .submit:hover:not(:disabled) {
    background: var(--tc-search-bar-submit-bg-hover, var(--tc-color-brand-surface-hover, #d1deff));
  }

  .submit:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-search-bar-focus-ring-color, var(--tc-color-border-focus, #30559f));
    outline-offset: calc(-1 * var(--tc-focus-ring-width, 2px));
  }

  .submit:disabled {
    cursor: not-allowed;
  }

  .submit svg {
    inline-size: var(--tc-size-icon-sm, 18px);
    block-size: var(--tc-size-icon-sm, 18px);
  }

  :host([disabled]) .bar {
    opacity: var(--tc-search-bar-disabled-opacity, var(--tc-opacity-disabled, 0.38));
  }

  :host([disabled]) .input,
  :host([disabled]) .submit,
  :host([disabled]) .category {
    cursor: not-allowed;
  }
`;
