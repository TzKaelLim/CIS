import { html, svg, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { ebookToolbarStyles } from './tc-ebook-toolbar.styles.js';

/** Inline back / return arrow glyph (24×24, currentColor) — a curved rotate
 * arrow matching the Figma 返回 control, so the built-in back button needs no
 * dependency on `<tc-icon>` and works when only this component is loaded. */
const BACK_GLYPH = svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 14 4 9l5-5M4 9h9a7 7 0 0 1 0 14H7" />`;

/**
 * 電子書閱讀器上排功能列（慈濟書庫）。版面為 [返回鍵（inline-start）｜書籍名稱（置中）｜工具列（inline-end）]。
 * @summary Tzu Chi e-book reader top toolbar: back button, centered book title and trailing tool controls.
 * @slot - 尾端工具控制項（搜尋／書籤／語音／筆記／個人等，通常放置 <tc-icon-button>，置於 inline-end）
 * @slot title - 覆寫 book-title 的自訂書名內容（置中）
 * @csspart base - 圓角藥丸容器
 * @csspart back - 內建返回按鈕（原生 <button>）
 * @csspart title - 書名區
 * @csspart tools - 尾端工具列
 * @cssprop [--tc-ebook-toolbar-bg] - 容器底色
 * @cssprop [--tc-ebook-toolbar-fg] - 文字／圖示色
 * @cssprop [--tc-ebook-toolbar-border] - 容器邊框色
 * @cssprop [--tc-ebook-toolbar-title-fg] - 書名文字色
 * @cssprop [--tc-ebook-toolbar-height] - 容器高度
 * @cssprop [--tc-ebook-toolbar-radius] - 圓角
 * @cssprop [--tc-ebook-toolbar-padding-inline] - 左右內距
 * @cssprop [--tc-ebook-toolbar-tools-gap] - 工具列項目間距
 * @cssprop [--tc-ebook-toolbar-back-bg-hover] - 返回鍵 hover 底色
 * @cssprop [--tc-ebook-toolbar-focus-ring-color] - 焦點環顏色
 * @event {CustomEvent<void>} tc-back - 點擊返回鍵時派發（composed, bubbles）。
 */
export class TcEbookToolbar extends TcElement {
  static styles = ebookToolbarStyles;

  /** 視覺變體：`light`（淺底、品牌色文字）或 `brand`（品牌深藍底、on-brand 文字）。 */
  @property({ reflect: true }) variant: 'brand' | 'light' = 'light';

  /** 置中顯示的書籍名稱。亦可改用 `title` 插槽覆寫。 */
  @property({ attribute: 'book-title' }) bookTitle = '';

  /** 返回鍵的無障礙標籤（aria-label）。 */
  @property({ attribute: 'back-label' }) backLabel = '返回';

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'toolbar');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', '電子書工具列');
  }

  /** Emit `tc-back` when the built-in back button is pressed. */
  #onBack = (): void => {
    this.dispatchEvent(new CustomEvent('tc-back', { bubbles: true, composed: true }));
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
    // The title region is empty only when neither a slotted title nor the
    // book-title attribute is present; seed data-empty from the attribute so
    // the column collapses before the slot's first slotchange fires.
    const titleEmpty = this.bookTitle.length === 0;
    return html`
      <div part="base" class="base">
        <button
          part="back"
          class="back"
          type="button"
          aria-label=${this.backLabel}
          @click=${this.#onBack}
        >
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            ${BACK_GLYPH}
          </svg>
        </button>

        <div part="title" class="title" ?data-empty=${titleEmpty}>
          <slot name="title" @slotchange=${this.#onSlotChange}
            >${this.bookTitle ? this.bookTitle : nothing}</slot
          >
        </div>

        <div part="tools" class="tools" data-empty>
          <slot @slotchange=${this.#onSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-ebook-toolbar': TcEbookToolbar;
  }
}
