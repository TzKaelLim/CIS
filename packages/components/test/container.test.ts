import { expect, fixture, html } from '@open-wc/testing';
import '../dist/container/tc-container-define.js';
import { TcContainer } from '../dist/container/tc-container.js';

it('renders default xl, gutter and centered with a default slot inside .inner', async () => {
  const el = await fixture<TcContainer>(html`<tc-container>內容</tc-container>`);
  expect(el.size).to.equal('xl');
  expect(el.gutter).to.be.true;
  expect(el.centered).to.be.true;
  const inner = el.shadowRoot!.querySelector('.inner');
  expect(inner).to.exist;
  expect(inner!.getAttribute('part')).to.equal('base');
  expect(inner!.querySelector('slot:not([name])')).to.exist;
  expect(el.textContent).to.contain('內容');
});

it('reflects size attribute', async () => {
  const el = await fixture<TcContainer>(html`<tc-container size="md"></tc-container>`);
  expect(el.getAttribute('size')).to.equal('md');
  expect(el.size).to.equal('md');
});

it('reflects gutter and centered as boolean attributes by default', async () => {
  const el = await fixture<TcContainer>(html`<tc-container></tc-container>`);
  expect(el.hasAttribute('gutter')).to.be.true;
  expect(el.hasAttribute('centered')).to.be.true;
});

it('removes the gutter attribute when gutter is set false', async () => {
  const el = await fixture<TcContainer>(html`<tc-container></tc-container>`);
  el.gutter = false;
  await el.updateComplete;
  expect(el.hasAttribute('gutter')).to.be.false;
});

it('removes the centered attribute when centered is set false', async () => {
  const el = await fixture<TcContainer>(html`<tc-container></tc-container>`);
  el.centered = false;
  await el.updateComplete;
  expect(el.hasAttribute('centered')).to.be.false;
});

it('applies a max-inline-size derived from the size variant', async () => {
  const el = await fixture<TcContainer>(html`<tc-container size="md"></tc-container>`);
  const inner = el.shadowRoot!.querySelector('.inner') as HTMLElement;
  const max = getComputedStyle(inner).maxInlineSize || getComputedStyle(inner).maxWidth;
  // md primitive is 768px; computed value must be a concrete length, not 'none'
  expect(max).to.not.equal('none');
  expect(max).to.match(/px$/);
});

it(':host is display:block', async () => {
  const el = await fixture<TcContainer>(html`<tc-container></tc-container>`);
  expect(getComputedStyle(el).display).to.equal('block');
});

it('is not form-associated', async () => {
  expect((TcContainer as unknown as { formAssociated?: boolean }).formAssociated).to.not.equal(
    true,
  );
});
