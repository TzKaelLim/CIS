import { css } from 'lit';

export const listPanelStyles = css`
  :host {
    display: block;
    inline-size: var(--tc-list-panel-width, auto);
    border-radius: var(--tc-list-panel-radius, var(--tc-radius-lg, 16px));
    background: var(--tc-list-panel-bg, var(--tc-color-surface-default, #fff));
    color: var(--tc-color-text-default, #212121);
  }

  .panel {
    display: flex;
    flex-direction: column;
    border-radius: inherit;
    background: inherit;
    border: 1px solid var(--tc-list-panel-border, var(--tc-color-border-default, #bdbdbd));
    /* clip the coloured header bar to the panel's rounded top corners */
    overflow: hidden;
  }

  /* coloured header bar */
  .header {
    margin: 0;
    padding: var(--tc-space-12, 12px) var(--tc-space-16, 16px);
    font: var(--tc-typography-heading-4, 700 24px/1.4 'Noto Sans TC', sans-serif);
    background: var(--tc-list-panel-header-bg, var(--tc-color-brand-primary, #1b2d58));
    color: var(--tc-list-panel-header-fg, var(--tc-color-text-on-brand, #fff));
  }

  /* plain variant: subtle surface header with default text instead of brand bar */
  :host([variant='plain']) .header {
    background: var(--tc-list-panel-header-bg, var(--tc-color-surface-subtle, #f5f5f5));
    color: var(--tc-list-panel-header-fg, var(--tc-color-text-default, #212121));
    border-bottom: 1px solid var(--tc-list-panel-border, var(--tc-color-border-default, #bdbdbd));
  }

  /* body: vertical list of slotted items */
  .body {
    display: block;
    padding: 0 var(--tc-space-16, 16px);
  }
  .body[data-empty] {
    display: none;
  }

  /* thin divider between consecutive list items: a top border on every item
     except the first, set via the slotted item wrapper. ::slotted sibling
     combinators are unreliable, so each consumer-provided child is padded and
     a divider is drawn with ::slotted(:not(:first-child)). */
  ::slotted(*) {
    display: block;
    padding-block: var(--tc-space-16, 16px);
  }
  ::slotted(:not(:first-child)) {
    border-top: 1px solid var(--tc-list-panel-divider, var(--tc-color-border-default, #bdbdbd));
  }
`;
