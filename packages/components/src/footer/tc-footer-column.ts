import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { footerColumnStyles } from './tc-footer-column.styles.js';

let columnId = 0;

/**
 * 頁尾連結群組：帶標題的一組連結，置於 `<tc-footer>` 內。桌機固定展開（標題為靜態
 * heading）；行動裝置（<=768px）標題變為可切換展開／收合的按鈕（手風琴）。
 * @summary Tzu Chi footer link group; static heading on desktop, collapsible accordion on mobile.
 * @slot - 連結內容（通常為 `<tc-link>` 或 `<a>`）
 * @csspart header - 標題容器（行動裝置上為切換按鈕）
 * @csspart body - 連結容器（region）
 * @cssprop [--tc-footer-heading-fg] - 標題文字色
 * @cssprop [--tc-footer-link-fg] - 連結靜止文字色
 * @cssprop [--tc-footer-link-fg-hover] - 連結 hover 文字色
 * @cssprop [--tc-footer-divider] - 行動裝置上群組間分隔線色
 * @cssprop [--tc-footer-focus-ring-color] - 切換按鈕焦點環顏色
 * @event {CustomEvent<{ open: boolean }>} tc-toggle - 行動裝置切換展開狀態時派發（composed, bubbles）。
 */
export class TcFooterColumn extends TcElement {
  static styles = footerColumnStyles;

  /** 群組標題。 */
  @property() label = '';

  /** 展開狀態。桌機固定展開；行動裝置預設展開，可切換。 */
  @property({ type: Boolean, reflect: true }) open = true;

  /** 是否處於行動裝置（手風琴）模式。由 matchMedia 維護。 */
  @state() private _mobile = false;

  #headingId = `tc-footer-col-h-${++columnId}`;
  #bodyId = `tc-footer-col-b-${columnId}`;
  #mql: MediaQueryList | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    // SSR-safe: only touch matchMedia in the browser.
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.#mql = window.matchMedia('(max-width: 768px)');
      this._mobile = this.#mql.matches;
      this.#mql.addEventListener('change', this.#onMediaChange);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#mql?.removeEventListener('change', this.#onMediaChange);
    this.#mql = null;
  }

  #onMediaChange = (e: MediaQueryListEvent): void => {
    this._mobile = e.matches;
  };

  #toggle = (): void => {
    this.open = !this.open;
    this.dispatchEvent(
      new CustomEvent('tc-toggle', {
        detail: { open: this.open },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    // On mobile the header is an interactive accordion button; on desktop it is
    // a static heading with the links always visible.
    const expanded = this._mobile ? this.open : true;

    const headerContent = html`<span part="label" class="label" id=${this.#headingId}
        >${this.label}</span
      ><span class="toggle-icon" aria-hidden="true">${chevron()}</span>`;

    const header = this._mobile
      ? html`<button
          part="header"
          class="header"
          type="button"
          aria-expanded=${String(expanded)}
          aria-controls=${this.#bodyId}
          @click=${this.#toggle}
        >
          ${headerContent}
        </button>`
      : html`<h3 part="header" class="header">${headerContent}</h3>`;

    return html`
      ${header}
      <div
        part="body"
        class="body"
        id=${this.#bodyId}
        role="region"
        aria-labelledby=${this.#headingId}
      >
        <slot></slot>
      </div>
    `;
  }
}

/** Inline chevron-down SVG (mirrors the icon registry path, no dependency). */
function chevron() {
  return html`<svg
    viewBox="0 0 24 24"
    width="100%"
    height="100%"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    focusable="false"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>`;
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-footer-column': TcFooterColumn;
  }
}
