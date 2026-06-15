import { expect, fixture, html } from '@open-wc/testing';
import '../dist/list-panel/tc-list-panel-define.js';
import { TcListPanel } from '../dist/list-panel/tc-list-panel.js';

it('renders default brand variant with label and slotted items', async () => {
  const el = await fixture<TcListPanel>(
    html`<tc-list-panel label="內部觀點：領航慈濟">
      <article>項目一</article>
      <article>項目二</article>
    </tc-list-panel>`,
  );
  expect(el.variant).to.equal('brand');
  expect(el.label).to.equal('內部觀點：領航慈濟');
  expect(el.shadowRoot!.querySelector('.panel')).to.exist;
  expect(el.shadowRoot!.querySelector('[part="header"]')).to.exist;
  expect(el.shadowRoot!.querySelector('[part="body"]')).to.exist;
  expect(el.shadowRoot!.querySelector('.header .label')!.textContent).to.contain(
    '內部觀點：領航慈濟',
  );
});

it('reflects label and variant attributes', async () => {
  const el = await fixture<TcListPanel>(
    html`<tc-list-panel variant="plain" label="標題"></tc-list-panel>`,
  );
  expect(el.getAttribute('variant')).to.equal('plain');
  expect(el.getAttribute('label')).to.equal('標題');
});

it('renders a header slot to override the label', async () => {
  const el = await fixture<TcListPanel>(
    html`<tc-list-panel label="忽略我"><h3 slot="header">自訂標題</h3></tc-list-panel>`,
  );
  const slot = el.shadowRoot!.querySelector('slot[name="header"]') as HTMLSlotElement;
  expect(slot).to.exist;
  expect(slot.assignedElements()[0]!.textContent).to.equal('自訂標題');
});

it('flags an empty body region via data-empty on slotchange', async () => {
  const el = await fixture<TcListPanel>(html`<tc-list-panel label="空"></tc-list-panel>`);
  expect(el.shadowRoot!.querySelector('.body')!.hasAttribute('data-empty')).to.be.true;
});

it('clears data-empty on the body when items are present', async () => {
  const el = await fixture<TcListPanel>(
    html`<tc-list-panel label="有內容"><div>列</div></tc-list-panel>`,
  );
  expect(el.shadowRoot!.querySelector('.body')!.hasAttribute('data-empty')).to.be.false;
});

it('applies the width property as a CSS custom property', async () => {
  const el = await fixture<TcListPanel>(
    html`<tc-list-panel label="寬度" width="320px"></tc-list-panel>`,
  );
  expect(el.style.getPropertyValue('--tc-list-panel-width')).to.equal('320px');
});

it('is not form-associated', async () => {
  expect((TcListPanel as unknown as { formAssociated?: boolean }).formAssociated).to.not.equal(
    true,
  );
});
