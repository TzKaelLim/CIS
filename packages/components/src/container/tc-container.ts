import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { containerStyles } from './tc-container.styles.js';

/**
 * 響應式、水平置中的最大寬度版心容器。依 `size` 套用 `--tc-container-*` 斷點寬度，
 * `gutter` 提供隨視窗增長的左右內距，`centered` 以 `margin-inline:auto` 置中。
 * @summary Tzu Chi responsive, horizontally-centered max-width layout container.
 * @slot - 版心內容（置於受最大寬度與內距約束的 .inner 內）
 * @csspart base - 受最大寬度／內距／置中約束的內層版心容器
 * @cssprop [--tc-container-max] - 覆寫最大寬度（預設由 size 決定，對應 --tc-container-sm/md/lg/xl/full）
 * @cssprop [--tc-container-padding-inline-mobile] - 行動裝置左右內距
 * @cssprop [--tc-container-padding-inline-tablet] - 平板（≥768px）左右內距
 * @cssprop [--tc-container-padding-inline] - 桌機（≥1024px）左右內距
 */
export class TcContainer extends TcElement {
  static styles = containerStyles;

  /** 最大寬度尺寸：`sm`/`md`/`lg`/`xl`/`full`，對應 `--tc-container-*` 斷點寬度。 */
  @property({ reflect: true }) size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'xl';

  /** 是否套用隨視窗增長的左右內距（gutter）。 */
  @property({ type: Boolean, reflect: true }) gutter = true;

  /** 是否水平置中（`margin-inline:auto`）。 */
  @property({ type: Boolean, reflect: true }) centered = true;

  render() {
    return html`
      <div part="base" class="inner">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-container': TcContainer;
  }
}
