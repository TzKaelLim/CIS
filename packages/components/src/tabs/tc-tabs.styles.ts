import { css } from 'lit';

export const tabsStyles = css`
  :host {
    display: flex;
    box-sizing: border-box;
  }

  /* Web variant: horizontal tablist with a bottom divider. */
  :host([variant='web']) {
    flex-direction: row;
    align-items: stretch;
    gap: var(--tc-space-4, 4px);
    border-block-end: 1px solid var(--tc-tabs-divider, var(--tc-color-border-default, #bdbdbd));
  }

  /* Mobile variant: full-width stretched tabs. */
  :host([variant='mobile']) {
    flex-direction: row;
    align-items: stretch;
    inline-size: 100%;
    gap: 0;
    border-block-end: 1px solid var(--tc-tabs-divider, var(--tc-color-border-default, #bdbdbd));
  }

  :host([variant='mobile']) ::slotted(tc-tab) {
    flex: 1 1 0;
  }
`;
