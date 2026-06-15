import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { footerStyles } from './tc-footer.styles.js';

/**
 * 網站頁尾容器：上方彩色內容區（品牌資訊、社群連結、連結群組、回到頂部）加上底部版權列。
 * @summary Tzu Chi site footer with a coloured top area and a copyright bar.
 * @slot brand - 品牌區（logo、地址／聯絡資訊），置於 inline-start
 * @slot social - 一排社群圖示連結（FB／IG／YT 等，由使用端提供）
 * @slot - `<tc-footer-column>` 連結群組，於響應式格線中排列
 * @slot back-to-top - 自訂「回到頂部」控件（未提供時使用內建按鈕），置於 inline-end
 * @slot copyright - 底部版權列文字（亦可改用 `copyright` 屬性）
 * @csspart base - 內部 <footer> 容器
 * @csspart top - 上方內容區
 * @csspart columns - 連結群組格線容器
 * @csspart copyright - 底部版權列
 * @cssprop [--tc-footer-bg] - 上方內容區底色
 * @cssprop [--tc-footer-fg] - 主要文字色
 * @cssprop [--tc-footer-muted-fg] - 次要（品牌資訊／連結）文字色
 * @cssprop [--tc-footer-heading-fg] - 群組標題與圖示色
 * @cssprop [--tc-footer-link-fg] - 連結靜止色
 * @cssprop [--tc-footer-link-fg-hover] - 連結 hover 色
 * @cssprop [--tc-footer-border] - 邊框色
 * @cssprop [--tc-footer-divider] - 分隔線色
 * @cssprop [--tc-footer-copyright-bg] - 版權列底色
 * @cssprop [--tc-footer-copyright-fg] - 版權列文字色
 * @cssprop [--tc-footer-max-width] - 內容最大寬度（預設 1200px）
 * @event {CustomEvent} tc-back-to-top - 點擊內建「回到頂部」時派發（composed, bubbles），預設捲動至頁首。
 */
export class TcFooter extends TcElement {
  static styles = footerStyles;

  /** 視覺變體：`light`（淺色底）或 `brand`（深色品牌底）。 */
  @property({ reflect: true }) variant: 'light' | 'brand' = 'light';

  /** 版權列文字。設定後等同於提供 `copyright` 插槽內容。 */
  @property() copyright = '';

  /** 內建「回到頂部」按鈕的無障礙標籤。 */
  @property({ attribute: 'back-to-top-label' }) backToTopLabel = '回到頂部';

  #onBackToTop = (): void => {
    this.dispatchEvent(new CustomEvent('tc-back-to-top', { bubbles: true, composed: true }));
    // SSR-safe: only scroll in the browser.
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /** Toggle a `data-empty` flag on a slot's wrapper so empty regions
   * (no assigned nodes) can be hidden via CSS. */
  #onSlotChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    const wrapper = slot.parentElement;
    if (!wrapper) return;
    const empty = slot.assignedNodes({ flatten: true }).length === 0;
    wrapper.toggleAttribute('data-empty', empty);
  };

  /** Flag the back-to-top wrapper when a custom control is slotted (so the
   * built-in button is hidden via CSS). */
  #onBackToTopSlotChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    const wrapper = slot.parentElement;
    if (!wrapper) return;
    const hasSlot = slot.assignedNodes({ flatten: true }).length > 0;
    wrapper.toggleAttribute('data-has-slot', hasSlot);
  };

  render() {
    return html`
      <footer part="base" class="footer" role="contentinfo">
        <div part="top" class="top">
          <div class="toolbar">
            <div class="social" data-empty>
              <slot name="social" @slotchange=${this.#onSlotChange}></slot>
            </div>
            <div class="top-end">
              <slot name="back-to-top" @slotchange=${this.#onBackToTopSlotChange}></slot>
              <button
                class="back-to-top"
                type="button"
                aria-label=${this.backToTopLabel}
                @click=${this.#onBackToTop}
              >
                <span>${this.backToTopLabel}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div class="main">
            <div class="brand" data-empty>
              <slot name="brand" @slotchange=${this.#onSlotChange}></slot>
            </div>
            <div part="columns" class="columns">
              <slot></slot>
            </div>
          </div>
        </div>

        <div part="copyright" class="copyright" data-empty>
          <div class="copyright-inner">
            ${this.copyright ? html`<span>${this.copyright}</span>` : nothing}
            <slot name="copyright" @slotchange=${this.#onCopyrightSlotChange}></slot>
          </div>
        </div>
      </footer>
    `;
  }

  /** Copyright bar is hidden only when BOTH the slot and the `copyright`
   * attribute are empty. */
  #onCopyrightSlotChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    const wrapper = slot.closest('.copyright');
    if (!wrapper) return;
    const empty = slot.assignedNodes({ flatten: true }).length === 0 && !this.copyright;
    wrapper.toggleAttribute('data-empty', empty);
  };

  override updated(changed: Map<string, unknown>): void {
    // Re-evaluate copyright bar visibility when the attribute changes.
    if (changed.has('copyright')) {
      const wrapper = this.shadowRoot?.querySelector('.copyright');
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="copyright"]');
      if (wrapper && slot) {
        const empty = slot.assignedNodes({ flatten: true }).length === 0 && !this.copyright;
        wrapper.toggleAttribute('data-empty', empty);
      }
    }
  }
}

// Re-export the sibling element so `@tzuchi/components/footer/class` exposes both.
export { TcFooterColumn } from './tc-footer-column.js';

declare global {
  interface HTMLElementTagNameMap {
    'tc-footer': TcFooter;
  }
}
