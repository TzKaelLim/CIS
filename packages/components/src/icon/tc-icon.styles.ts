import { css } from 'lit';

export const iconStyles = css`
  :host {
    /* Resolved per size below; defaults to md. currentColor lets the glyph
       inherit the surrounding text color. */
    display: inline-flex;
    width: var(--tc-icon-size, var(--tc-size-icon-md, 32px));
    height: var(--tc-icon-size, var(--tc-size-icon-md, 32px));
    color: inherit;
    flex: none;
    vertical-align: middle;
    line-height: 0;
  }

  :host([size='sm']) {
    --tc-icon-size: var(--tc-size-icon-sm, 20px);
  }
  :host([size='md']) {
    --tc-icon-size: var(--tc-size-icon-md, 32px);
  }
  :host([size='lg']) {
    --tc-icon-size: var(--tc-size-icon-lg, 40px);
  }

  :host([hidden]) {
    display: none;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    /* Glyphs are authored with currentColor so they inherit text color. */
    fill: currentColor;
    stroke: currentColor;
  }
`;
