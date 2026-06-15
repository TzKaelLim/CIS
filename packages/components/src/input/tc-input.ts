import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TcElement } from '../base/tc-element.js';
import { inputStyles } from './tc-input.styles.js';

let inputUid = 0;

/**
 * 表單輸入欄位。
 * @summary Tzu Chi form-associated text input.
 * @slot prefix - 輸入框前置內容（圖示、單位等）
 * @slot suffix - 輸入框後置內容（圖示、清除鈕等）
 * @csspart label - 上方 <label> 標籤
 * @csspart control - 包覆原生 input 的外框
 * @csspart input - 內部原生 <input>
 * @csspart helper - 下方輔助 / 錯誤訊息 <p>
 * @cssprop [--tc-input-bg] - 輸入框底色
 * @cssprop [--tc-input-border] - 預設邊框色
 * @cssprop [--tc-input-border-hover] - hover 邊框色
 * @cssprop [--tc-input-border-focused] - focus 邊框色
 * @cssprop [--tc-input-border-invalid] - invalid 邊框 / 訊息色
 * @cssprop [--tc-input-radius] - 圓角
 * @cssprop [--tc-input-text] - 輸入文字色
 * @cssprop [--tc-input-placeholder] - placeholder / 輔助文字色
 * @event tc-input - 每次輸入時觸發，detail: { value }
 * @event tc-change - 內部 input change 時觸發，detail: { value }
 */
export class TcInput extends TcElement {
  static formAssociated = true;
  static styles = inputStyles;

  @property() value = '';
  @property() placeholder = '';
  @property({ reflect: true }) type: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' =
    'text';
  @property({ reflect: true }) name = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) readonly = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) invalid = false;
  @property() label = '';
  @property({ attribute: 'helper-text' }) helperText = '';
  @property({ attribute: 'error-text' }) errorText = '';

  #internals = this.attachInternals();
  #inputId = `tc-input-${++inputUid}`;
  #helperId = `${this.#inputId}-help`;

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  get validity(): ValidityState {
    return this.#internals.validity;
  }

  get validationMessage(): string {
    return this.#internals.validationMessage;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#syncFormState();
  }

  updated() {
    this.#syncFormState();
  }

  #syncFormState() {
    this.#internals.setFormValue(this.value);
    const input = this.shadowRoot?.querySelector('input') ?? undefined;
    if (this.required && this.value === '') {
      this.#internals.setValidity(
        { valueMissing: true },
        this.errorText || '此欄位為必填。',
        input,
      );
    } else if (this.invalid) {
      this.#internals.setValidity({ customError: true }, this.errorText || '輸入內容無效。', input);
    } else {
      this.#internals.setValidity({});
    }
  }

  #onInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent('tc-input', { detail: { value: this.value }, composed: true }),
    );
  };

  #onChange = () => {
    this.dispatchEvent(
      new CustomEvent('tc-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    const message = this.invalid && this.errorText ? this.errorText : this.helperText;
    const describedBy = message ? this.#helperId : undefined;

    return html`
      <div class="field">
        ${this.label
          ? html`<label part="label" class="label" for=${this.#inputId}
              >${this.label}${this.required
                ? html`<span class="required-mark" aria-hidden="true">*</span>`
                : nothing}</label
            >`
          : nothing}
        <div part="control" class="control">
          <slot name="prefix"></slot>
          <input
            part="input"
            id=${this.#inputId}
            .value=${this.value}
            type=${this.type}
            name=${this.name || nothing}
            placeholder=${this.placeholder || nothing}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            aria-invalid=${this.invalid ? 'true' : nothing}
            aria-describedby=${describedBy ?? nothing}
            @input=${this.#onInput}
            @change=${this.#onChange}
          />
          <slot name="suffix"></slot>
        </div>
        ${message
          ? html`<p
              part="helper"
              id=${this.#helperId}
              class="helper ${this.invalid && this.errorText ? 'error' : ''}"
            >
              ${message}
            </p>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tc-input': TcInput;
  }
}
