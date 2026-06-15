import { css } from 'lit';

export const ebookToolbarStyles = css`
  :host {
    display: block;
    inline-size: 100%;
    box-sizing: border-box;
    color: var(--tc-ebook-toolbar-fg, var(--tc-color-brand-primary, #1b2d58));
  }

  :host([hidden]) {
    display: none;
  }

  /* rounded pill container — a 3-column grid keeps the title optically
     centered (column 2) while back (column 1) and tools (column 3) flank it. */
  .base {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    column-gap: var(--tc-space-16, 16px);
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: var(--tc-ebook-toolbar-height, var(--tc-size-control-lg, 64px));
    padding-block: var(--tc-space-8, 8px);
    padding-inline: var(--tc-ebook-toolbar-padding-inline, var(--tc-space-24, 24px));
    border-radius: var(--tc-ebook-toolbar-radius, var(--tc-radius-full, 9999px));
    background: var(--tc-ebook-toolbar-bg, var(--tc-color-surface-subtle, #f5f5f5));
    border: 1px solid var(--tc-ebook-toolbar-border, var(--tc-color-border-default, #bdbdbd));
    color: inherit;
  }

  /* brand variant: navy pill with on-brand text/icons */
  :host([variant='brand']) .base {
    background: var(--tc-ebook-toolbar-bg, var(--tc-color-brand-primary, #1b2d58));
    border-color: var(--tc-ebook-toolbar-border, var(--tc-color-brand-primary-hover, #30559f));
    color: var(--tc-ebook-toolbar-fg, var(--tc-color-text-on-brand, #fff));
  }

  /* built-in back button (inline-start, grid column 1) */
  .back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    grid-column: 1;
    flex: 0 0 auto;
    inline-size: var(--tc-size-control-md, 48px);
    block-size: var(--tc-size-control-md, 48px);
    margin: 0;
    padding: 0;
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: var(--tc-radius-full, 9999px);
    cursor: pointer;
    transition: background-color var(--tc-motion-duration-fast, 150ms)
      var(--tc-motion-easing-standard, ease);
  }

  .back:hover {
    background: var(--tc-ebook-toolbar-back-bg-hover, var(--tc-color-brand-surface, #e8eefe));
  }

  :host([variant='brand']) .back:hover {
    background: var(--tc-ebook-toolbar-back-bg-hover, var(--tc-color-brand-primary-hover, #30559f));
  }

  .back:focus-visible {
    outline: var(--tc-focus-ring-width, 2px) solid
      var(--tc-ebook-toolbar-focus-ring-color, var(--tc-color-border-focus, #4f7bbe));
    outline-offset: calc(-1 * var(--tc-focus-ring-width, 2px));
  }

  .back svg {
    inline-size: var(--tc-size-icon-md, 24px);
    block-size: var(--tc-size-icon-md, 24px);
  }

  /* centered book title (grid column 2) */
  .title {
    grid-column: 2;
    min-inline-size: 0;
    margin: 0;
    text-align: center;
    font: var(--tc-typography-title, 700 20px/1.4 'Noto Sans TC', sans-serif);
    color: var(--tc-ebook-toolbar-title-fg, var(--tc-color-brand-primary, #1b2d58));
    /* keep a single-line title from pushing the tool group off the row */
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  :host([variant='brand']) .title {
    color: var(--tc-ebook-toolbar-title-fg, var(--tc-color-text-on-brand, #fff));
  }

  /* hide an empty title region so the grid column collapses cleanly */
  .title[data-empty] {
    display: none;
  }

  /* trailing tool group (inline-end, grid column 3). The flex + gap lives on
     the <slot> itself so multiple slotted controls are spaced — a gap on a
     wrapper element does NOT reach ::slotted children. */
  .tools {
    grid-column: 3;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 0 0 auto;
    gap: var(--tc-ebook-toolbar-tools-gap, var(--tc-space-4, 4px));
    color: inherit;
  }

  .tools[data-empty] {
    display: none;
  }

  .tools ::slotted(*) {
    color: inherit;
  }

  /* ===== Responsive: at / below the tablet breakpoint (768px) =====
     The title drops out of the centered column and sits left, right next to
     the back button; the tool group stays pinned to the inline-end. */
  @media (max-width: 767.98px) {
    .base {
      grid-template-columns: auto auto 1fr;
      column-gap: var(--tc-space-8, 8px);
      padding-inline: var(--tc-ebook-toolbar-padding-inline, var(--tc-space-16, 16px));
    }

    .title {
      grid-column: 2;
      text-align: start;
    }

    .tools {
      grid-column: 3;
    }
  }
`;
