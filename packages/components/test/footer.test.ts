import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/footer/tc-footer-define.js';
import { TcFooter } from '../dist/footer/tc-footer.js';
import { TcFooterColumn } from '../dist/footer/tc-footer-column.js';

const basicFooter = () => html`
  <tc-footer copyright="Copyright © 2020 Tzu Chi Foundation.">
    <span slot="brand">花蓮本會</span>
    <a slot="social" href="#">FB</a>
    <tc-footer-column label="公益慈善">
      <a href="#">國際賑災</a>
      <a href="#">全球志工服務</a>
    </tc-footer-column>
    <tc-footer-column label="醫療志業">
      <a href="#">慈濟醫療基金會</a>
    </tc-footer-column>
  </tc-footer>
`;

it('renders default light variant with a contentinfo footer', async () => {
  const el = await fixture<TcFooter>(basicFooter());
  expect(el.variant).to.equal('light');
  const footer = el.shadowRoot!.querySelector('footer');
  expect(footer).to.exist;
  expect(footer!.getAttribute('role')).to.equal('contentinfo');
});

it('reflects the variant attribute', async () => {
  const el = await fixture<TcFooter>(html`<tc-footer variant="brand"></tc-footer>`);
  expect(el.getAttribute('variant')).to.equal('brand');
});

it('exposes the expected slots and parts', async () => {
  const el = await fixture<TcFooter>(basicFooter());
  expect(el.shadowRoot!.querySelector('slot[name="brand"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="social"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="copyright"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot:not([name])')).to.exist;
  expect(el.shadowRoot!.querySelector('[part="columns"]')).to.exist;
});

it('renders the copyright attribute text in the bottom bar', async () => {
  const el = await fixture<TcFooter>(basicFooter());
  await el.updateComplete;
  const bar = el.shadowRoot!.querySelector('.copyright');
  expect(bar).to.exist;
  expect(bar!.hasAttribute('data-empty')).to.be.false;
  expect(bar!.textContent).to.contain('Tzu Chi Foundation');
});

it('hides the copyright bar when empty', async () => {
  const el = await fixture<TcFooter>(html`<tc-footer></tc-footer>`);
  await el.updateComplete;
  const bar = el.shadowRoot!.querySelector('.copyright');
  expect(bar!.hasAttribute('data-empty')).to.be.true;
});

it('dispatches tc-back-to-top when the built-in control is activated', async () => {
  const el = await fixture<TcFooter>(html`<tc-footer></tc-footer>`);
  await el.updateComplete;
  const btn = el.shadowRoot!.querySelector('button.back-to-top') as HTMLButtonElement;
  expect(btn).to.exist;
  setTimeout(() => btn.click());
  const ev = await oneEvent(el, 'tc-back-to-top');
  expect(ev).to.exist;
});

it('re-exports TcFooterColumn from the main class entry', async () => {
  expect(TcFooterColumn).to.be.a('function');
});

it('is not form-associated', async () => {
  expect((TcFooter as unknown as { formAssociated?: boolean }).formAssociated).to.not.equal(true);
});

// ----- tc-footer-column -----

it('column renders a group role with the label as heading', async () => {
  const el = await fixture<TcFooterColumn>(
    html`<tc-footer-column label="教育志業"><a href="#">慈濟大學</a></tc-footer-column>`,
  );
  expect(el.getAttribute('role')).to.equal('group');
  expect(el.open).to.be.true;
  const header = el.shadowRoot!.querySelector('[part="header"]');
  expect(header).to.exist;
  expect(header!.textContent).to.contain('教育志業');
  const body = el.shadowRoot!.querySelector('[part="body"]');
  expect(body!.getAttribute('role')).to.equal('region');
});

it('column reflects the open attribute', async () => {
  const el = await fixture<TcFooterColumn>(
    html`<tc-footer-column label="人文志業"></tc-footer-column>`,
  );
  expect(el.hasAttribute('open')).to.be.true;
  el.open = false;
  await el.updateComplete;
  expect(el.hasAttribute('open')).to.be.false;
});
