/** Register a custom element once; a no-op if the tag is already defined
 * (prevents "already defined" crashes on double-load / HMR). */
export function defineElement(tag: string, ctor: CustomElementConstructor): void {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}
