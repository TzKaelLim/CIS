import { html, svg, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { paginationStyles } from './tc-pagination.styles.js';

/** Sentinel inserted into the windowed range to mark a collapsed gap. */
const ELLIPSIS = 'ellipsis' as const;

const chevronLeft = svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m15 6-6 6 6 6" />`;
const chevronRight = svg`<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />`;

/**
 * 分頁導覽：頁碼按鈕與上一頁／下一頁控制，頁數過多時以省略號收合。
 * @summary Tzu Chi pagination — windowed page-number buttons with prev / next controls.
 * @csspart nav - 外層 <nav> 容器
 * @csspart prev - 上一頁按鈕
 * @csspart next - 下一頁按鈕
 * @csspart page - 單一頁碼按鈕
 * @csspart ellipsis - 省略號標記
 * @cssprop [--tc-pagination-item-fg] - 頁碼文字色
 * @cssprop [--tc-pagination-item-bg-selected] - 目前頁碼底色
 * @cssprop [--tc-pagination-item-fg-selected] - 目前頁碼文字色
 * @cssprop [--tc-pagination-item-bg-hover] - 頁碼 hover 底色
 * @cssprop [--tc-pagination-radius] - 頁碼圓角
 * @cssprop [--tc-pagination-focus-ring-color] - 焦點環顏色
 * @event {CustomEvent<{ page: number }>} tc-page-change - 頁碼改變時派發（composed, bubbles）。
 */
export class TcPagination extends TcElement {
  static styles = paginationStyles;

  /** 總頁數。 */
  @property({ type: Number, reflect: true }) total = 1;

  /** 目前頁碼（1 起算，會反映至屬性）。 */
  @property({ type: Number, reflect: true }) page = 1;

  /** 目前頁碼兩側固定顯示的頁數，預設 1。 */
  @property({ type: Number, reflect: true, attribute: 'sibling-count' }) siblingCount = 1;

  /** 導覽區域的無障礙標籤，套用至 <nav> 的 aria-label。 */
  @property({ attribute: 'aria-label-text' }) ariaLabelText = '分頁導覽';

  /** Clamp `total` to at least 1 and `page` into `[1, total]`. */
  get #total(): number {
    return Math.max(1, Math.floor(this.total) || 1);
  }

  get #page(): number {
    return Math.min(this.#total, Math.max(1, Math.floor(this.page) || 1));
  }

  /**
   * Compute the windowed list of page numbers, inserting ELLIPSIS sentinels.
   * Always shows the first and last page; shows `siblingCount` pages on each
   * side of the current page. Collapses gaps wider than one page into an
   * ellipsis, but keeps a real page number when the gap is exactly one.
   */
  #range(): Array<number | typeof ELLIPSIS> {
    const total = this.#total;
    const current = this.#page;
    const siblings = Math.max(0, Math.floor(this.siblingCount) || 0);

    // first + last + current + 2*siblings + 2 ellipses
    const totalSlots = siblings * 2 + 5;
    if (total <= totalSlots) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const leftSibling = Math.max(current - siblings, 1);
    const rightSibling = Math.min(current + siblings, total);

    const showLeftEllipsis = leftSibling > 2;
    const showRightEllipsis = rightSibling < total - 1;

    const range: Array<number | typeof ELLIPSIS> = [];

    if (!showLeftEllipsis && showRightEllipsis) {
      // No left gap: pack pages from the start.
      const leftCount = siblings * 2 + 3;
      for (let i = 1; i <= leftCount; i++) range.push(i);
      range.push(ELLIPSIS, total);
    } else if (showLeftEllipsis && !showRightEllipsis) {
      // No right gap: pack pages to the end.
      const rightCount = siblings * 2 + 3;
      range.push(1, ELLIPSIS);
      for (let i = total - rightCount + 1; i <= total; i++) range.push(i);
    } else if (showLeftEllipsis && showRightEllipsis) {
      // Gaps on both sides.
      range.push(1, ELLIPSIS);
      for (let i = leftSibling; i <= rightSibling; i++) range.push(i);
      range.push(ELLIPSIS, total);
    } else {
      // No gaps (defensive; handled by the totalSlots short-circuit above).
      for (let i = 1; i <= total; i++) range.push(i);
    }

    return range;
  }

  #goTo(next: number): void {
    const total = this.#total;
    const target = Math.min(total, Math.max(1, next));
    if (target === this.#page) return;
    this.page = target;
    this.dispatchEvent(
      new CustomEvent('tc-page-change', {
        detail: { page: target },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onPrev = (): void => {
    this.#goTo(this.#page - 1);
  };

  #onNext = (): void => {
    this.#goTo(this.#page + 1);
  };

  #onPage = (e: Event): void => {
    const target = Number((e.currentTarget as HTMLButtonElement).dataset.page);
    if (Number.isFinite(target)) this.#goTo(target);
  };

  #renderPage(n: number): TemplateResult {
    const current = n === this.#page;
    return html`
      <button
        part="page"
        class="item"
        type="button"
        data-page=${n}
        aria-current=${current ? 'page' : nothing}
        aria-label=${`第 ${n} 頁`}
        @click=${this.#onPage}
      >
        ${n}
      </button>
    `;
  }

  render() {
    const total = this.#total;
    const current = this.#page;
    const atStart = current <= 1;
    const atEnd = current >= total;

    return html`
      <nav part="nav" class="nav" aria-label=${this.ariaLabelText}>
        <button
          part="prev"
          class="item nav-button"
          type="button"
          ?disabled=${atStart}
          aria-label="上一頁"
          @click=${this.#onPrev}
        >
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            ${chevronLeft}
          </svg>
        </button>
        ${this.#range().map((item) =>
          item === ELLIPSIS
            ? html`<span part="ellipsis" class="ellipsis" aria-hidden="true">…</span>`
            : this.#renderPage(item),
        )}
        <button
          part="next"
          class="item nav-button"
          type="button"
          ?disabled=${atEnd}
          aria-label="下一頁"
          @click=${this.#onNext}
        >
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            ${chevronRight}
          </svg>
        </button>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-pagination': TcPagination;
  }
}
