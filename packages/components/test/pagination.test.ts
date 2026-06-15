import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/pagination/tc-pagination-define.js';
import type { TcPagination } from '../dist/pagination/tc-pagination.js';

const pageButtons = (el: TcPagination): HTMLButtonElement[] =>
  Array.from(el.shadowRoot!.querySelectorAll('button[part="page"]')) as HTMLButtonElement[];

it('renders a nav with an aria-label and prev / next buttons', async () => {
  const el = await fixture<TcPagination>(html`<tc-pagination total="5" page="1"></tc-pagination>`);
  const nav = el.shadowRoot!.querySelector('nav')!;
  expect(nav).to.exist;
  expect(nav.getAttribute('aria-label')).to.equal('分頁導覽');
  expect(el.shadowRoot!.querySelector('button[part="prev"]')).to.exist;
  expect(el.shadowRoot!.querySelector('button[part="next"]')).to.exist;
});

it('reflects total, page and sibling-count attributes', async () => {
  const el = await fixture<TcPagination>(
    html`<tc-pagination total="10" page="3" sibling-count="2"></tc-pagination>`,
  );
  expect(el.total).to.equal(10);
  expect(el.page).to.equal(3);
  expect(el.siblingCount).to.equal(2);
  expect(el.getAttribute('page')).to.equal('3');
});

it('marks the current page with aria-current="page"', async () => {
  const el = await fixture<TcPagination>(html`<tc-pagination total="5" page="3"></tc-pagination>`);
  await el.updateComplete;
  const current = el.shadowRoot!.querySelector('button[aria-current="page"]') as HTMLButtonElement;
  expect(current).to.exist;
  expect(current.textContent!.trim()).to.equal('3');
});

it('disables prev on the first page and next on the last page', async () => {
  const first = await fixture<TcPagination>(
    html`<tc-pagination total="5" page="1"></tc-pagination>`,
  );
  expect((first.shadowRoot!.querySelector('button[part="prev"]') as HTMLButtonElement).disabled).to
    .be.true;
  expect((first.shadowRoot!.querySelector('button[part="next"]') as HTMLButtonElement).disabled).to
    .be.false;

  const last = await fixture<TcPagination>(
    html`<tc-pagination total="5" page="5"></tc-pagination>`,
  );
  expect((last.shadowRoot!.querySelector('button[part="prev"]') as HTMLButtonElement).disabled).to
    .be.false;
  expect((last.shadowRoot!.querySelector('button[part="next"]') as HTMLButtonElement).disabled).to
    .be.true;
});

it('renders every page when total fits the window', async () => {
  const el = await fixture<TcPagination>(html`<tc-pagination total="5" page="1"></tc-pagination>`);
  await el.updateComplete;
  const labels = pageButtons(el).map((b) => b.textContent!.trim());
  expect(labels).to.deep.equal(['1', '2', '3', '4', '5']);
  expect(el.shadowRoot!.querySelector('.ellipsis')).to.not.exist;
});

it('collapses long ranges with an ellipsis', async () => {
  const el = await fixture<TcPagination>(
    html`<tc-pagination total="20" page="10"></tc-pagination>`,
  );
  await el.updateComplete;
  // first + ellipsis + (9,10,11) + ellipsis + last
  const labels = pageButtons(el).map((b) => b.textContent!.trim());
  expect(labels).to.deep.equal(['1', '9', '10', '11', '20']);
  expect(el.shadowRoot!.querySelectorAll('.ellipsis').length).to.equal(2);
});

it('emits tc-page-change with the new page when a page button is clicked', async () => {
  const el = await fixture<TcPagination>(html`<tc-pagination total="5" page="1"></tc-pagination>`);
  await el.updateComplete;
  const third = pageButtons(el).find((b) => b.textContent!.trim() === '3')!;
  setTimeout(() => third.click());
  const ev = await oneEvent(el, 'tc-page-change');
  expect(ev.detail.page).to.equal(3);
  expect(el.page).to.equal(3);
});

it('next button advances the page and emits tc-page-change', async () => {
  const el = await fixture<TcPagination>(html`<tc-pagination total="5" page="2"></tc-pagination>`);
  await el.updateComplete;
  const next = el.shadowRoot!.querySelector('button[part="next"]') as HTMLButtonElement;
  setTimeout(() => next.click());
  const ev = await oneEvent(el, 'tc-page-change');
  expect(ev.detail.page).to.equal(3);
  expect(el.page).to.equal(3);
});

it('prev button decrements the page', async () => {
  const el = await fixture<TcPagination>(html`<tc-pagination total="5" page="3"></tc-pagination>`);
  await el.updateComplete;
  const prev = el.shadowRoot!.querySelector('button[part="prev"]') as HTMLButtonElement;
  prev.click();
  await el.updateComplete;
  expect(el.page).to.equal(2);
});

it('does not emit when clicking the already-current page', async () => {
  const el = await fixture<TcPagination>(html`<tc-pagination total="5" page="3"></tc-pagination>`);
  await el.updateComplete;
  let fired = false;
  el.addEventListener('tc-page-change', () => (fired = true));
  const current = el.shadowRoot!.querySelector('button[aria-current="page"]') as HTMLButtonElement;
  current.click();
  await el.updateComplete;
  expect(fired).to.be.false;
});

it('Enter on a page button activates it (native button keyboard)', async () => {
  const el = await fixture<TcPagination>(html`<tc-pagination total="5" page="1"></tc-pagination>`);
  await el.updateComplete;
  const fourth = pageButtons(el).find((b) => b.textContent!.trim() === '4')!;
  fourth.focus();
  // Native <button> activation: simulate the click the browser produces on Enter.
  setTimeout(() => fourth.click());
  const ev = await oneEvent(el, 'tc-page-change');
  expect(ev.detail.page).to.equal(4);
});
