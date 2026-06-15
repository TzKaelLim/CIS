import { LitElement } from 'lit';

/** Shared base for all `<tc-*>` components.
 * `delegatesFocus` forwards external `.focus()` and label clicks to the inner
 * native control inside the shadow root. */
export class TcElement extends LitElement {
  static shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
}
