import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/ebook-toolbar/tc-ebook-toolbar-define.js';
import { TcEbookToolbar } from '../dist/ebook-toolbar/tc-ebook-toolbar.js';

const sample = () => html`
  <tc-ebook-toolbar book-title="書籍名稱">
    <tc-icon-button slot="" label="搜尋">🔍</tc-icon-button>
    <tc-icon-button label="書籤">🔖</tc-icon-button>
    <tc-icon-button label="個人">👤</tc-icon-button>
  </tc-ebook-toolbar>
`;

it('renders default light variant with toolbar role and aria-label', async () => {
  const el = await fixture<TcEbookToolbar>(sample());
  expect(el.variant).to.equal('light');
  expect(el.getAttribute('role')).to.equal('toolbar');
  expect(el.getAttribute('aria-label')).to.equal('電子書工具列');
  expect(el.shadowRoot!.querySelector('.base')).to.exist;
});

it('reflects variant attribute', async () => {
  const el = await fixture<TcEbookToolbar>(
    html`<tc-ebook-toolbar variant="brand"></tc-ebook-toolbar>`,
  );
  expect(el.getAttribute('variant')).to.equal('brand');
  expect(el.variant).to.equal('brand');
});

it('maps book-title attribute to bookTitle and renders it centered', async () => {
  const el = await fixture<TcEbookToolbar>(
    html`<tc-ebook-toolbar book-title="無量義經"></tc-ebook-toolbar>`,
  );
  expect(el.bookTitle).to.equal('無量義經');
  const title = el.shadowRoot!.querySelector('[part~="title"]') as HTMLElement;
  expect(title).to.exist;
  expect(title.hasAttribute('data-empty')).to.be.false;
  expect(title.textContent).to.contain('無量義經');
});

it('hides the title region when no book-title and no title slot', async () => {
  const el = await fixture<TcEbookToolbar>(html`<tc-ebook-toolbar></tc-ebook-toolbar>`);
  const title = el.shadowRoot!.querySelector('[part~="title"]') as HTMLElement;
  expect(title.hasAttribute('data-empty')).to.be.true;
});

it('lets a title slot override book-title', async () => {
  const el = await fixture<TcEbookToolbar>(
    html`<tc-ebook-toolbar book-title="預設名"
      ><span slot="title">自訂書名</span></tc-ebook-toolbar
    >`,
  );
  const title = el.shadowRoot!.querySelector('[part~="title"]') as HTMLElement;
  expect(title.hasAttribute('data-empty')).to.be.false;
  expect(el.textContent).to.contain('自訂書名');
});

it('exposes the default (tools) slot and a title slot', async () => {
  const el = await fixture<TcEbookToolbar>(sample());
  expect(el.shadowRoot!.querySelector('slot[name="title"]')).to.exist;
  expect(el.shadowRoot!.querySelector('.tools slot:not([name])')).to.exist;
});

it('renders a built-in back button with the default 返回 aria-label', async () => {
  const el = await fixture<TcEbookToolbar>(sample());
  const back = el.shadowRoot!.querySelector('button[part~="back"]') as HTMLButtonElement;
  expect(back).to.exist;
  expect(back.getAttribute('aria-label')).to.equal('返回');
});

it('uses a custom back-label for the back button aria-label', async () => {
  const el = await fixture<TcEbookToolbar>(
    html`<tc-ebook-toolbar back-label="回到書庫"></tc-ebook-toolbar>`,
  );
  const back = el.shadowRoot!.querySelector('button[part~="back"]') as HTMLButtonElement;
  expect(back.getAttribute('aria-label')).to.equal('回到書庫');
});

it('emits a composed, bubbling tc-back on back button click', async () => {
  const el = await fixture<TcEbookToolbar>(sample());
  const back = el.shadowRoot!.querySelector('button[part~="back"]') as HTMLButtonElement;
  setTimeout(() => back.click());
  const ev = await oneEvent(el, 'tc-back');
  expect(ev).to.exist;
  expect(ev.bubbles).to.be.true;
  expect(ev.composed).to.be.true;
});

it('marks the tools region empty when no trailing controls are slotted', async () => {
  const el = await fixture<TcEbookToolbar>(
    html`<tc-ebook-toolbar book-title="x"></tc-ebook-toolbar>`,
  );
  const tools = el.shadowRoot!.querySelector('[part~="tools"]') as HTMLElement;
  expect(tools.hasAttribute('data-empty')).to.be.true;
});

it('is not form-associated', async () => {
  expect((TcEbookToolbar as unknown as { formAssociated?: boolean }).formAssociated).to.not.equal(
    true,
  );
});
