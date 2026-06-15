import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/navbar/tc-navbar-define.js';
import { TcNavbar } from '../dist/navbar/tc-navbar.js';

const sample = () => html`
  <tc-navbar>
    <span slot="brand">慈濟</span>
    <tc-link href="#a">全球消息</tc-link>
    <tc-link href="#b">活動訊息</tc-link>
    <button slot="actions" aria-label="搜尋">🔍</button>
  </tc-navbar>
`;

it('renders default light variant with banner role and a nav landmark', async () => {
  const el = await fixture<TcNavbar>(sample());
  expect(el.variant).to.equal('light');
  expect(el.getAttribute('role')).to.equal('banner');
  const nav = el.shadowRoot!.querySelector('nav');
  expect(nav).to.exist;
  expect(nav!.getAttribute('aria-label')).to.equal('主要導覽');
});

it('reflects variant, sticky and open attributes', async () => {
  const el = await fixture<TcNavbar>(html`<tc-navbar variant="brand" sticky open></tc-navbar>`);
  expect(el.getAttribute('variant')).to.equal('brand');
  expect(el.hasAttribute('sticky')).to.be.true;
  expect(el.hasAttribute('open')).to.be.true;
});

it('exposes the brand, default and actions slots', async () => {
  const el = await fixture<TcNavbar>(sample());
  expect(el.shadowRoot!.querySelector('slot[name="brand"]')).to.exist;
  expect(el.shadowRoot!.querySelector('nav slot:not([name])')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="actions"]')).to.exist;
});

it('wires the hamburger toggle with aria-controls / aria-expanded / aria-label', async () => {
  const el = await fixture<TcNavbar>(sample());
  const toggle = el.shadowRoot!.querySelector('button[part~="toggle"]') as HTMLButtonElement;
  const nav = el.shadowRoot!.querySelector('nav') as HTMLElement;
  expect(toggle).to.exist;
  expect(toggle.getAttribute('aria-label')).to.equal('選單');
  expect(toggle.getAttribute('aria-controls')).to.equal(nav.id);
  expect(toggle.getAttribute('aria-expanded')).to.equal('false');
});

it('toggles open and emits tc-menu-toggle on hamburger click', async () => {
  const el = await fixture<TcNavbar>(sample());
  const toggle = el.shadowRoot!.querySelector('button[part~="toggle"]') as HTMLButtonElement;
  setTimeout(() => toggle.click());
  const ev = await oneEvent(el, 'tc-menu-toggle');
  expect(ev.detail.open).to.be.true;
  expect(el.open).to.be.true;
  await el.updateComplete;
  expect(toggle.getAttribute('aria-expanded')).to.equal('true');
});

it('Escape closes an open drawer and emits tc-menu-toggle with open:false', async () => {
  const el = await fixture<TcNavbar>(html`<tc-navbar open>${''}</tc-navbar>`);
  expect(el.open).to.be.true;
  setTimeout(() =>
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
  );
  const ev = await oneEvent(el, 'tc-menu-toggle');
  expect(ev.detail.open).to.be.false;
  expect(el.open).to.be.false;
});

it('clicking outside the navbar closes the drawer', async () => {
  const el = await fixture<TcNavbar>(html`<tc-navbar open></tc-navbar>`);
  expect(el.open).to.be.true;
  setTimeout(() =>
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true })),
  );
  const ev = await oneEvent(el, 'tc-menu-toggle');
  expect(ev.detail.open).to.be.false;
  expect(el.open).to.be.false;
});

it('clicking inside the navbar does not close the drawer', async () => {
  const el = await fixture<TcNavbar>(sample());
  el.open = true;
  await el.updateComplete;
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
  await el.updateComplete;
  expect(el.open).to.be.true;
});

it('is not form-associated', async () => {
  expect((TcNavbar as unknown as { formAssociated?: boolean }).formAssociated).to.not.equal(true);
});
