import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/card/tc-card-define.js';
import { TcCard } from '../dist/card/tc-card.js';

it('renders default elevated variant with slotted content', async () => {
  const el = await fixture<TcCard>(
    html`<tc-card>
      <span slot="headline">專案名稱</span>
      內文
    </tc-card>`,
  );
  expect(el.variant).to.equal('elevated');
  expect(el.shadowRoot!.querySelector('.card')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="media"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="headline"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="footer"]')).to.exist;
  expect(el.textContent).to.contain('專案名稱');
});

it('reflects variant attribute', async () => {
  const el = await fixture<TcCard>(html`<tc-card variant="outlined"></tc-card>`);
  expect(el.getAttribute('variant')).to.equal('outlined');
});

it('renders a stretched-link <a> when href is set and does not wrap content', async () => {
  const el = await fixture<TcCard>(
    html`<tc-card href="/news/1"><span slot="headline">標題</span></tc-card>`,
  );
  const link = el.shadowRoot!.querySelector('a.link') as HTMLAnchorElement;
  expect(link).to.exist;
  expect(link.getAttribute('href')).to.equal('/news/1');
  // the <a> must NOT contain the slotted content (footer must stay clickable)
  expect(link.querySelector('slot')).to.be.null;
});

it('makes the host focusable with role=button when interactive without href', async () => {
  const el = await fixture<TcCard>(html`<tc-card interactive></tc-card>`);
  expect(el.getAttribute('tabindex')).to.equal('0');
  expect(el.getAttribute('role')).to.equal('button');
});

it('does not set host tabindex/role when href is present', async () => {
  const el = await fixture<TcCard>(html`<tc-card interactive href="/x"></tc-card>`);
  expect(el.hasAttribute('tabindex')).to.be.false;
  expect(el.getAttribute('role')).to.not.equal('button');
});

it('dispatches tc-card-click on Enter for interactive cards', async () => {
  const el = await fixture<TcCard>(html`<tc-card interactive></tc-card>`);
  setTimeout(() => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  const ev = await oneEvent(el, 'tc-card-click');
  expect(ev).to.exist;
});

it('is not form-associated', async () => {
  expect((TcCard as unknown as { formAssociated?: boolean }).formAssociated).to.not.equal(true);
});
