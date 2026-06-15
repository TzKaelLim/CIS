import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/article-card/tc-article-card-define.js';
import { TcArticleCard } from '../dist/article-card/tc-article-card.js';

it('renders default vertical orientation with slotted content', async () => {
  const el = await fixture<TcArticleCard>(
    html`<tc-article-card>
      <img slot="media" src="cover.jpg" alt="" />
      <span slot="headline">文章標題</span>
      <p slot="excerpt">摘要內文</p>
      <span slot="meta">2022-03-21</span>
    </tc-article-card>`,
  );
  expect(el.orientation).to.equal('vertical');
  expect(el.shadowRoot!.querySelector('.card')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="media"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="badge"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="headline"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="excerpt"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="meta"]')).to.exist;
  expect(el.shadowRoot!.querySelector('slot[name="actions"]')).to.exist;
  expect(el.textContent).to.contain('文章標題');
});

it('reflects orientation attribute', async () => {
  const el = await fixture<TcArticleCard>(
    html`<tc-article-card orientation="horizontal"></tc-article-card>`,
  );
  expect(el.getAttribute('orientation')).to.equal('horizontal');
});

it('reflects featured boolean attribute', async () => {
  const el = await fixture<TcArticleCard>(html`<tc-article-card featured></tc-article-card>`);
  expect(el.featured).to.equal(true);
  expect(el.hasAttribute('featured')).to.be.true;
});

it('renders a centered play overlay only when video is set', async () => {
  const plain = await fixture<TcArticleCard>(html`<tc-article-card></tc-article-card>`);
  expect(plain.shadowRoot!.querySelector('.play')).to.be.null;

  const vid = await fixture<TcArticleCard>(html`<tc-article-card video></tc-article-card>`);
  const play = vid.shadowRoot!.querySelector('.play');
  expect(play).to.exist;
  expect(play!.querySelector('svg')).to.exist;
});

it('renders a stretched-link <a> when href is set and does not wrap content', async () => {
  const el = await fixture<TcArticleCard>(
    html`<tc-article-card href="/news/1"><span slot="headline">標題</span></tc-article-card>`,
  );
  const link = el.shadowRoot!.querySelector('a.link') as HTMLAnchorElement;
  expect(link).to.exist;
  expect(link.getAttribute('href')).to.equal('/news/1');
  // the <a> must NOT contain the slotted content (actions must stay clickable)
  expect(link.querySelector('slot')).to.be.null;
});

it('makes the host focusable with role=button when interactive without href', async () => {
  const el = await fixture<TcArticleCard>(html`<tc-article-card interactive></tc-article-card>`);
  expect(el.getAttribute('tabindex')).to.equal('0');
  expect(el.getAttribute('role')).to.equal('button');
});

it('does not set host tabindex/role when href is present', async () => {
  const el = await fixture<TcArticleCard>(
    html`<tc-article-card interactive href="/x"></tc-article-card>`,
  );
  expect(el.hasAttribute('tabindex')).to.be.false;
  expect(el.getAttribute('role')).to.not.equal('button');
});

it('dispatches tc-card-click on Enter for interactive cards', async () => {
  const el = await fixture<TcArticleCard>(html`<tc-article-card interactive></tc-article-card>`);
  setTimeout(() => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  const ev = await oneEvent(el, 'tc-card-click');
  expect(ev).to.exist;
});

it('does not dispatch tc-card-click on Enter when href is present', async () => {
  const el = await fixture<TcArticleCard>(
    html`<tc-article-card interactive href="/x"></tc-article-card>`,
  );
  let fired = false;
  el.addEventListener('tc-card-click', () => (fired = true));
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await el.updateComplete;
  expect(fired).to.be.false;
});

it('applies width via the --tc-article-card-width custom property', async () => {
  const el = await fixture<TcArticleCard>(html`<tc-article-card width="320px"></tc-article-card>`);
  await el.updateComplete;
  expect(el.style.getPropertyValue('--tc-article-card-width')).to.equal('320px');
});

it('is not form-associated', async () => {
  expect((TcArticleCard as unknown as { formAssociated?: boolean }).formAssociated).to.not.equal(
    true,
  );
});
