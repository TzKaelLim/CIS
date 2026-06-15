import { html, svg } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { navbarStyles } from './tc-navbar.styles.js';

/** Inline hamburger / close glyphs (24×24, currentColor) so the toggle needs
 * no dependency on `<tc-icon>` and works even when only the navbar is loaded. */
const MENU_GLYPH = svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />`;
const CLOSE_GLYPH = svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m6 6 12 12M18 6 6 18" />`;

/**
 * 響應式網站頂部導覽列／應用列。桌機顯示水平導覽，於平板斷點（768px）以下收合為漢堡選單抽屜。
 * @summary Tzu Chi responsive top application bar / site header.
 * @slot brand - 品牌標誌／站名（置於 inline-start）
 * @slot - 主要導覽項目（桌機水平排列，行動裝置收合為垂直抽屜）
 * @slot actions - 行動區（搜尋、語言、登入等，置於 inline-end）
 * @csspart base - 頂部列容器
 * @csspart brand - 品牌／標誌區
 * @csspart nav - 導覽區（桌機水平／行動抽屜）
 * @csspart actions - 行動區
 * @csspart toggle - 漢堡按鈕（行動裝置）
 * @csspart drawer - 行動抽屜面板（即 nav 於行動裝置的呈現）
 * @cssprop [--tc-navbar-bg] - 列底色
 * @cssprop [--tc-navbar-fg] - 文字／圖示色
 * @cssprop [--tc-navbar-border] - 底部分隔線色
 * @cssprop [--tc-navbar-height] - 列高度
 * @cssprop [--tc-navbar-padding-inline] - 左右內距
 * @cssprop [--tc-navbar-item-gap] - 導覽項目間距
 * @cssprop [--tc-navbar-drawer-bg] - 行動抽屜底色
 * @cssprop [--tc-navbar-drawer-elevation] - 行動抽屜陰影
 * @cssprop [--tc-navbar-toggle-bg-hover] - 漢堡按鈕 hover 底色
 * @cssprop [--tc-navbar-focus-ring-color] - 焦點環顏色
 * @event {CustomEvent<{ open: boolean }>} tc-menu-toggle - 行動選單開合時派發（composed, bubbles）。
 */
export class TcNavbar extends TcElement {
  static styles = navbarStyles;

  /** 視覺變體：`light`（白底、預設文字）或 `brand`（品牌深藍底、on-brand 文字）。 */
  @property({ reflect: true }) variant: 'brand' | 'light' = 'light';

  /** 是否黏附於捲動容器頂部（`position: sticky; top: 0`）。 */
  @property({ type: Boolean, reflect: true }) sticky = false;

  /** 行動抽屜是否開啟。切換時派發 `tc-menu-toggle`。 */
  @property({ type: Boolean, reflect: true }) open = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'banner');
    // SSR-safe: only attach document-level listeners in the browser.
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.#onDocKeydown);
      document.addEventListener('pointerdown', this.#onDocPointerDown, true);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.#onDocKeydown);
      document.removeEventListener('pointerdown', this.#onDocPointerDown, true);
    }
  }

  /** Toggle the mobile drawer and announce the new state. */
  #toggle = (): void => {
    this.open = !this.open;
    this.dispatchEvent(
      new CustomEvent('tc-menu-toggle', {
        detail: { open: this.open },
        bubbles: true,
        composed: true,
      }),
    );
  };

  /** Close the drawer (no-op when already closed); emits when it actually closes. */
  #close(): void {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(
      new CustomEvent('tc-menu-toggle', {
        detail: { open: false },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Escape closes the drawer. */
  #onDocKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.open) {
      e.stopPropagation();
      this.#close();
    }
  };

  /** Click / tap outside the navbar closes the drawer. Uses capture +
   * composedPath so it works across the shadow boundary. */
  #onDocPointerDown = (e: Event): void => {
    if (!this.open) return;
    const path = e.composedPath();
    if (!path.includes(this)) this.#close();
  };

  /** Toggle a `data-empty` flag on a slot's wrapper so empty regions can be
   * hidden via CSS without unreliable `:has(::slotted())` selectors. */
  #onSlotChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    const wrapper = slot.parentElement;
    if (!wrapper) return;
    const empty = slot.assignedNodes({ flatten: true }).length === 0;
    wrapper.toggleAttribute('data-empty', empty);
  };

  render() {
    return html`
      <header part="base" class="base">
        <div part="brand" class="brand" data-empty>
          <slot name="brand" @slotchange=${this.#onSlotChange}></slot>
        </div>

        <nav part="nav drawer" class="nav" aria-label="主要導覽" id="tc-navbar-nav">
          <slot></slot>
        </nav>

        <div part="actions" class="actions" data-empty>
          <slot name="actions" @slotchange=${this.#onSlotChange}></slot>
        </div>

        <button
          part="toggle"
          class="toggle"
          type="button"
          aria-label="選單"
          aria-controls="tc-navbar-nav"
          aria-expanded=${this.open ? 'true' : 'false'}
          @click=${this.#toggle}
        >
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            ${this.open ? CLOSE_GLYPH : MENU_GLYPH}
          </svg>
        </button>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-navbar': TcNavbar;
  }
}
