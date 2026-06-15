import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { badgeStyles } from './tc-badge.styles.js';

/** Tone → visually-hidden status label (announced to assistive tech when the
 * badge conveys status rather than decoration). Neutral/brand are treated as
 * plain labels and get no extra announcement. */
const TONE_STATUS_TEXT: Record<string, string> = {
  success: '成功',
  error: '錯誤',
  warning: '警告',
  info: '資訊',
};

/**
 * 狀態徽章（Badge）。
 * @summary Tzu Chi badge — a small, non-interactive label / status / count pill.
 * @slot - 徽章文字內容（標籤、狀態或數量）。
 * @csspart base - 內部徽章容器。
 * @csspart dot - 前置狀態圓點（`dot` 啟用時）。
 * @csspart label - 文字內容容器。
 * @cssprop [--tc-badge-bg] - 徽章底色（覆寫變體 / 色調預設）。
 * @cssprop [--tc-badge-fg] - 文字與圖示顏色。
 * @cssprop [--tc-badge-border-color] - outline 變體邊框顏色。
 * @cssprop [--tc-badge-radius] - 圓角（pill 為膠囊形，否則為小圓角）。
 * @cssprop [--tc-badge-font-size] - 文字大小。
 * @cssprop [--tc-badge-padding-inline] - 水平內距。
 * @cssprop [--tc-badge-padding-block] - 垂直內距。
 * @cssprop [--tc-badge-dot-size] - 狀態圓點尺寸。
 * @cssprop [--tc-badge-dot-color] - filled 變體圓點顏色。
 */
export class TcBadge extends TcElement {
  static styles = badgeStyles;

  /** 色調：對應語意色彩。`neutral`（預設）、`brand`、`success`、`error`、`warning`、`info`。 */
  @property({ reflect: true }) tone:
    | 'neutral'
    | 'brand'
    | 'success'
    | 'error'
    | 'warning'
    | 'info' = 'neutral';

  /** 變體：`soft`（預設，淡底 + 色調文字）、`filled`（實底 + 反白文字）、`outline`（透明底 + 色調邊框與文字）。 */
  @property({ reflect: true }) variant: 'filled' | 'soft' | 'outline' = 'soft';

  /** 尺寸：`md`（預設，桌機 / 平板橫式）或 `sm`（平板直式 / 手機）。 */
  @property({ reflect: true }) size: 'sm' | 'md' = 'md';

  /** 前置狀態圓點。 */
  @property({ type: Boolean, reflect: true }) dot = false;

  /** 完整膠囊形圓角；未設定時為小圓角。 */
  @property({ type: Boolean, reflect: true }) pill = false;

  connectedCallback(): void {
    super.connectedCallback();
    // Default presentational: a badge carries no interaction and no inherent
    // semantics. Status meaning is conveyed via a visually-hidden label below.
    if (!this.hasAttribute('role')) this.setAttribute('role', 'presentation');
  }

  render() {
    const statusText = TONE_STATUS_TEXT[this.tone];
    return html`
      <span part="base" class="badge">
        ${this.dot ? html`<span part="dot" class="dot" aria-hidden="true"></span>` : nothing}
        ${statusText ? html`<span class="vh">${statusText}：</span>` : nothing}
        <span part="label" class="label"><slot></slot></span>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-badge': TcBadge;
  }
}
