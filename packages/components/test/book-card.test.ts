import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/book-card/tc-book-card-define.js';
import { TcBookCard } from '../dist/book-card/tc-book-card.js';

it('renders default portrait card with slotted content', async () => {
  const el = await fixture<TcBookCard>(
    html`<tc-book-card>
      <img slot="cover" src="cover.jpg" alt="" />
      <span slot="title">證嚴上人 每日一叮嚀</span>
      <span slot="subtitle">世間祥和在於心</span>
    </tc-book-card>`,
  );
  expect(el.ratio).to.equal('portrait');
  expect(el.shadowRoot!.querySelector('.card')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="cover"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="title"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="subtitle"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="footer"]')).to.exist;
  expect(el.textContent).to.contain('證嚴上人 每日一叮嚀');
});

it('reflects ratio attribute', async () => {
  const el = await fixture<TcBookCard>(html`<tc-book-card ratio="square"></tc-book-card>`);
  expect(el.getAttribute('ratio')).to.equal('square');
});

it('renders a stretched-link <a> when href is set and does not wrap content', async () => {
  const el = await fixture<TcBookCard>(
    html`<tc-book-card href="/books/1"><span slot="title">標題</span></tc-book-card>`,
  );
  const link = el.shadowRoot!.querySelector('a.link') as HTMLAnchorElement;
  expect(link).to.exist;
  expect(link.getAttribute('href')).to.equal('/books/1');
  // the <a> must NOT contain the slotted content (footer must stay clickable)
  expect(link.querySelector('slot')).to.be.null;
});

it('makes the host focusable with role=button when interactive without href', async () => {
  const el = await fixture<TcBookCard>(html`<tc-book-card interactive></tc-book-card>`);
  expect(el.getAttribute('tabindex')).to.equal('0');
  expect(el.getAttribute('role')).to.equal('button');
});

it('does not set host tabindex/role when href is present', async () => {
  const el = await fixture<TcBookCard>(html`<tc-book-card interactive href="/x"></tc-book-card>`);
  expect(el.hasAttribute('tabindex')).to.be.false;
  expect(el.getAttribute('role')).to.not.equal('button');
});

it('dispatches tc-book-card-click on Enter for interactive cards', async () => {
  const el = await fixture<TcBookCard>(html`<tc-book-card interactive></tc-book-card>`);
  setTimeout(() => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  const ev = await oneEvent(el, 'tc-book-card-click');
  expect(ev).to.exist;
});

it('sets the --tc-book-card-width custom property from the width attribute', async () => {
  const el = await fixture<TcBookCard>(html`<tc-book-card width="240px"></tc-book-card>`);
  expect(el.style.getPropertyValue('--tc-book-card-width')).to.equal('240px');
});

it('is not form-associated', async () => {
  expect((TcBookCard as unknown as { formAssociated?: boolean }).formAssociated).to.not.equal(true);
});
