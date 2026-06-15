import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { gridStyles } from './tc-grid.styles.js';

/** Space-scale token names that map to a `--tc-space-*` custom property.
 * Anything else passed to `gap` is treated as a raw CSS length. */
const SPACE_TOKENS = new Set(['4', '8', '12', '16', '20', '24', '32', '40', '48', '64']);

/** Resolve a `gap` attribute value to a CSS length:
 * a known space-scale name (e.g. `"16"`) → `var(--tc-space-16)`,
 * otherwise the value is passed through verbatim as a CSS length. */
function resolveGap(value: string): string {
  const v = value.trim();
  if (SPACE_TOKENS.has(v)) return `var(--tc-space-${v})`;
  return v;
}

/**
 * 響應式 CSS Grid 版面容器。預設為固定欄數（columns，預設 12），於平板斷點（768px）以下收合為
 * mobile-columns（預設 1）欄；設定 min-col-width 時改用 auto-fit/minmax 自動填滿模式。
 * @summary Tzu Chi responsive CSS-grid layout primitive.
 * @slot - 網格項目（直接子元素即為各 grid cell）
 * @csspart base - 內層 grid 容器（display: grid）
 * @cssprop [--tc-grid-gap-default] - 預設欄列間距（gap 屬性未設定時採用）
 * @cssprop [--tc-grid-columns] - 桌機固定欄數（由 columns 屬性設定）
 * @cssprop [--tc-grid-mobile-columns] - 行動裝置固定欄數（由 mobile-columns 屬性設定）
 * @cssprop [--tc-grid-min-col-width] - auto-fit 模式下每欄最小寬度（由 min-col-width 屬性設定）
 * @cssprop [--tc-grid-gap] - 實際採用的間距（由 gap 屬性設定）
 */
export class TcGrid extends TcElement {
  static styles = gridStyles;

  /** 桌機固定欄數。設定 `min-col-width` 後此值不生效。 */
  @property({ type: Number, reflect: true }) columns = 12;

  /** 平板斷點（768px）以下使用的固定欄數（僅固定欄數模式生效）。 */
  @property({ type: Number, reflect: true, attribute: 'mobile-columns' }) mobileColumns = 1;

  /** 每欄最小寬度（CSS 長度，如 `"240px"`）。設定後改用
   * `repeat(auto-fit, minmax(min-col-width, 1fr))` 響應式自動填滿模式，並覆寫固定欄數。 */
  @property({ reflect: true, attribute: 'min-col-width' }) minColWidth = '';

  /** 欄列間距：space token 名稱（如 `"16"`）或任意 CSS 長度。預設對應 `var(--tc-space-16)`。 */
  @property({ reflect: true }) gap = '';

  /** 各列項目的區塊方向對齊。未設定時 grid 預設為 `stretch`。 */
  @property({ reflect: true }) align?: 'stretch' | 'start' | 'center' | 'end';

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('columns')) {
      this.style.setProperty('--tc-grid-columns', String(this.columns));
    }
    if (changed.has('mobileColumns')) {
      this.style.setProperty('--tc-grid-mobile-columns', String(this.mobileColumns));
    }
    if (changed.has('minColWidth')) {
      if (this.minColWidth) this.style.setProperty('--tc-grid-min-col-width', this.minColWidth);
      else this.style.removeProperty('--tc-grid-min-col-width');
    }
    if (changed.has('gap')) {
      if (this.gap) this.style.setProperty('--tc-grid-gap', resolveGap(this.gap));
      else this.style.removeProperty('--tc-grid-gap');
    }
  }

  render() {
    return html`
      <div part="base" class="grid">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-grid': TcGrid;
  }
}
