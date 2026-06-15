import { html, svg, nothing, type SVGTemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { iconStyles } from './tc-icon.styles.js';

/** The set of icon names shipped in the built-in registry. */
export type TcIconName =
  | 'search'
  | 'close'
  | 'menu'
  | 'plus'
  | 'check'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'calendar'
  | 'mail';

/**
 * Internal SVG registry. Every glyph is authored on a 24×24 viewBox and uses
 * `currentColor` so the icon inherits the surrounding text color. These are
 * generic placeholders for the mechanism — exact Tzu Chi artwork can be
 * swapped in later without changing the public API.
 */
const ICONS: Record<TcIconName, SVGTemplateResult> = {
  search: svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 4 4" />`,
  close: svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m6 6 12 12M18 6 6 18" />`,
  menu: svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />`,
  plus: svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />`,
  check: svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7" />`,
  'chevron-down': svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />`,
  'chevron-up': svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m6 15 6-6 6 6" />`,
  'chevron-left': svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m15 6-6 6 6 6" />`,
  'chevron-right': svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />`,
  calendar: svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM4 9h16M8 3v4M16 3v4" />`,
  mail: svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 1 8 6 8-6" />`,
};

/**
 * 內嵌 SVG 圖示。
 * @summary Tzu Chi inline-SVG icon from a built-in registry, sized by token and inheriting text color.
 * @csspart svg - 內部 <svg> 元素
 * @cssprop [--tc-icon-size] - 圖示尺寸（由 size 屬性設定，可手動覆寫）
 */
export class TcIcon extends TcElement {
  static styles = iconStyles;

  /** Registry key of the icon to render. */
  @property({ reflect: true }) name: TcIconName | '' = '';

  /** Visual size; maps to the `--tc-size-icon-*` tokens. */
  @property({ reflect: true }) size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Accessible name. When set, the icon is exposed as `role="img"` with this
   * label; otherwise it is decorative and hidden from assistive tech.
   */
  @property({ reflect: true }) label = '';

  render() {
    const glyph = this.name ? ICONS[this.name as TcIconName] : undefined;
    const labelled = this.label.length > 0;
    return html`
      <svg
        part="svg"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        role=${labelled ? 'img' : nothing}
        aria-label=${labelled ? this.label : nothing}
        aria-hidden=${labelled ? nothing : 'true'}
        focusable="false"
      >
        ${labelled ? svg`<title>${this.label}</title>` : nothing}${glyph ?? nothing}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-icon': TcIcon;
  }
}
