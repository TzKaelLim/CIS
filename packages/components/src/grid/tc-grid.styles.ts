import { css } from 'lit';

export const gridStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
  }

  :host([hidden]) {
    display: none;
  }

  /* the grid container — fixed-columns mode by default. The column count and
     gap come from custom properties set reactively from the attributes, each
     with a literal fallback so the grid is usable without any JS having run. */
  .grid {
    display: grid;
    box-sizing: border-box;
    inline-size: 100%;
    grid-template-columns: repeat(var(--tc-grid-columns, 12), minmax(0, 1fr));
    gap: var(--tc-grid-gap, var(--tc-grid-gap-default, var(--tc-space-16, 16px)));
  }

  /* auto-fit / minmax responsive mode: takes precedence whenever a per-column
     minimum width is set (via the min-col-width attribute). This mode is
     intrinsically responsive, so it needs no breakpoint handling. */
  :host([min-col-width]) .grid {
    grid-template-columns: repeat(auto-fit, minmax(var(--tc-grid-min-col-width, 240px), 1fr));
  }

  /* block-direction alignment of items within each row */
  :host([align='stretch']) .grid {
    align-items: stretch;
  }
  :host([align='start']) .grid {
    align-items: start;
  }
  :host([align='center']) .grid {
    align-items: center;
  }
  :host([align='end']) .grid {
    align-items: end;
  }

  /* ===== Responsive: at / below the tablet breakpoint (768px) =====
     In fixed-columns mode, collapse to mobile-columns (default 1) for
     readability. The auto-fit mode opts out — it already adapts fluidly. */
  @media (max-width: 767.98px) {
    :host(:not([min-col-width])) .grid {
      grid-template-columns: repeat(var(--tc-grid-mobile-columns, 1), minmax(0, 1fr));
    }
  }
`;
