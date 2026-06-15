import { html, svg, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { searchBarStyles } from './tc-search-bar.styles.js';

let searchBarUid = 0;

/** One selectable search category. */
export interface TcSearchCategory {
  value: string;
  label: string;
}

/**
 * 搜尋列。
 * @summary Tzu Chi search bar — an outlined search field with an optional leading category selector and a trailing search button.
 * @csspart bar - 外框容器（role=search 的 <form>）
 * @csspart category - 前置分類選擇器（原生 <select>，with-category 時）
 * @csspart input - 內部原生文字 <input>
 * @csspart submit - 後置搜尋按鈕
 * @csspart icon - 搜尋按鈕內的 <svg> 圖示
 * @cssprop [--tc-search-bar-bg] - 外框底色
 * @cssprop [--tc-search-bar-border] - 預設邊框色
 * @cssprop [--tc-search-bar-border-hover] - hover 邊框色
 * @cssprop [--tc-search-bar-border-focus] - focus 邊框色
 * @cssprop [--tc-search-bar-focus-ring] - focus 柔光環顏色
 * @cssprop [--tc-search-bar-focus-ring-color] - 內部控制項焦點環顏色
 * @cssprop [--tc-search-bar-radius] - 圓角
 * @cssprop [--tc-search-bar-text] - 輸入文字色
 * @cssprop [--tc-search-bar-placeholder] - placeholder 文字色
 * @cssprop [--tc-search-bar-icon-fg] - 搜尋圖示顏色
 * @cssprop [--tc-search-bar-submit-bg] - 搜尋按鈕底色
 * @cssprop [--tc-search-bar-submit-bg-hover] - 搜尋按鈕 hover 底色
 * @cssprop [--tc-search-bar-category-bg] - 分類選擇器底色
 * @cssprop [--tc-search-bar-category-fg] - 分類選擇器文字色
 * @cssprop [--tc-search-bar-divider] - 區塊之間的分隔線色
 * @cssprop [--tc-search-bar-disabled-opacity] - 停用透明度
 * @event {CustomEvent<{ value: string }>} tc-input - 每次輸入時派發（composed, bubbles）。
 * @event {CustomEvent<{ value: string; category: string }>} tc-search - 按下 Enter 或點擊搜尋鈕時派發（composed, bubbles）。
 * @event {CustomEvent<{ category: string }>} tc-category-change - 切換分類時派發（composed, bubbles）。
 */
export class TcSearchBar extends TcElement {
  static styles = searchBarStyles;

  /** 搜尋字串（反映為屬性）。 */
  @property() value = '';

  /** 未輸入時顯示的提示文字，同時作為輸入框的無障礙標籤。 */
  @property() placeholder = '搜尋';

  /** 表單欄位名稱（套用至內部 input）。 */
  @property({ reflect: true }) name = '';

  /** 停用：停用內部所有原生控制項（非 pointer-events:none）。 */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** 顯示前置分類選擇器。 */
  @property({ type: Boolean, reflect: true, attribute: 'with-category' }) withCategory = false;

  /** 目前選取的分類 value（反映為屬性）。 */
  @property({ reflect: true }) category = '';

  /**
   * 分類選項清單。可由 property 設定物件陣列，或由 HTML/React 以 JSON 字串屬性提供。
   * 僅在 `with-category` 時使用。
   */
  @property({
    attribute: 'categories',
    converter: {
      fromAttribute: (raw: string | null): TcSearchCategory[] => {
        if (!raw) return [];
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? (parsed as TcSearchCategory[]) : [];
        } catch {
          return [];
        }
      },
      toAttribute: (value: TcSearchCategory[]) => JSON.stringify(value ?? []),
    },
  })
  categories: TcSearchCategory[] = [];

  #uid = `tc-search-bar-${++searchBarUid}`;
  #inputId = `${this.#uid}-input`;

  /** Emit `tc-search` with the current value and category. */
  #search(): void {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent('tc-search', {
        detail: { value: this.value, category: this.category },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onInput = (e: Event): void => {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent('tc-input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  };

  #onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.#search();
    }
  };

  #onSubmit = (e: Event): void => {
    // Native <form> submit (Enter while focused in input also routes here).
    e.preventDefault();
    this.#search();
  };

  #onSubmitClick = (e: MouseEvent): void => {
    if (this.disabled) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
    this.#search();
  };

  #onCategoryChange = (e: Event): void => {
    if (this.disabled) return;
    this.category = (e.target as HTMLSelectElement).value;
    this.dispatchEvent(
      new CustomEvent('tc-category-change', {
        detail: { category: this.category },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    return html`
      <form part="bar" class="bar" role="search" @submit=${this.#onSubmit}>
        ${this.withCategory
          ? html`<span class="category-wrap">
              <select
                part="category"
                class="category"
                aria-label="搜尋分類"
                ?disabled=${this.disabled}
                .value=${this.category}
                @change=${this.#onCategoryChange}
              >
                ${this.categories.map(
                  (c) =>
                    html`<option value=${c.value} ?selected=${c.value === this.category}>
                      ${c.label}
                    </option>`,
                )}
              </select>
              <span class="category-chevron" aria-hidden="true">
                ${svg`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" /></svg>`}
              </span>
            </span>`
          : nothing}
        <input
          part="input"
          class="input"
          id=${this.#inputId}
          type="search"
          .value=${this.value}
          name=${this.name || nothing}
          placeholder=${this.placeholder || nothing}
          aria-label=${this.placeholder || '搜尋'}
          ?disabled=${this.disabled}
          @input=${this.#onInput}
          @keydown=${this.#onKeydown}
        />
        <button
          part="submit"
          class="submit"
          type="submit"
          aria-label="搜尋"
          ?disabled=${this.disabled}
          @click=${this.#onSubmitClick}
        >
          ${svg`<svg part="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 4 4" /></svg>`}
        </button>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-search-bar': TcSearchBar;
  }
}
