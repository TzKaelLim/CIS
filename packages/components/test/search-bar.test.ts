import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../dist/search-bar/tc-search-bar-define.js';
import type { TcSearchBar } from '../dist/search-bar/tc-search-bar.js';

it('renders an inner search input and submit button with role=search', async () => {
  const el = await fixture<TcSearchBar>(html`<tc-search-bar></tc-search-bar>`);
  const form = el.shadowRoot!.querySelector('form')!;
  expect(form.getAttribute('role')).to.equal('search');
  const input = el.shadowRoot!.querySelector('input')!;
  expect(input).to.exist;
  expect(input.type).to.equal('search');
  const submit = el.shadowRoot!.querySelector('.submit')!;
  expect(submit).to.exist;
  expect(submit.getAttribute('aria-label')).to.equal('搜尋');
});

it('uses the placeholder default and exposes it as the input aria-label', async () => {
  const el = await fixture<TcSearchBar>(html`<tc-search-bar></tc-search-bar>`);
  const input = el.shadowRoot!.querySelector('input')!;
  expect(el.placeholder).to.equal('搜尋');
  expect(input.getAttribute('placeholder')).to.equal('搜尋');
  expect(input.getAttribute('aria-label')).to.equal('搜尋');
});

it('does not render the category selector by default', async () => {
  const el = await fixture<TcSearchBar>(html`<tc-search-bar></tc-search-bar>`);
  expect(el.shadowRoot!.querySelector('.category')).to.not.exist;
});

it('fires tc-input on every keystroke with the new value', async () => {
  const el = await fixture<TcSearchBar>(html`<tc-search-bar></tc-search-bar>`);
  const input = el.shadowRoot!.querySelector('input')!;
  setTimeout(() => {
    input.value = '蓮花';
    input.dispatchEvent(new Event('input'));
  });
  const ev = await oneEvent(el, 'tc-input');
  expect(ev.detail.value).to.equal('蓮花');
  expect(el.value).to.equal('蓮花');
});

it('emits tc-search on clicking the search button with value and category', async () => {
  const el = await fixture<TcSearchBar>(
    html`<tc-search-bar value="慈濟" category="book"></tc-search-bar>`,
  );
  const btn = el.shadowRoot!.querySelector('.submit') as HTMLButtonElement;
  setTimeout(() => btn.click());
  const ev = await oneEvent(el, 'tc-search');
  expect(ev.detail).to.deep.equal({ value: '慈濟', category: 'book' });
});

it('emits tc-search when pressing Enter in the field', async () => {
  const el = await fixture<TcSearchBar>(html`<tc-search-bar value="蓮"></tc-search-bar>`);
  const input = el.shadowRoot!.querySelector('input')!;
  setTimeout(() =>
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })),
  );
  const ev = await oneEvent(el, 'tc-search');
  expect(ev.detail.value).to.equal('蓮');
});

it('renders a leading category selector when with-category and emits tc-category-change', async () => {
  const el = await fixture<TcSearchBar>(
    html`<tc-search-bar
      with-category
      categories='[{"value":"all","label":"全部"},{"value":"book","label":"跨書搜尋"}]'
    ></tc-search-bar>`,
  );
  const select = el.shadowRoot!.querySelector('select')!;
  expect(select).to.exist;
  expect(select.getAttribute('aria-label')).to.equal('搜尋分類');
  expect(select.querySelectorAll('option').length).to.equal(2);

  setTimeout(() => {
    select.value = 'book';
    select.dispatchEvent(new Event('change'));
  });
  const ev = await oneEvent(el, 'tc-category-change');
  expect(ev.detail.category).to.equal('book');
  expect(el.category).to.equal('book');
});

it('parses the categories JSON string attribute into objects', async () => {
  const el = await fixture<TcSearchBar>(
    html`<tc-search-bar with-category categories='[{"value":"a","label":"甲"}]'></tc-search-bar>`,
  );
  expect(el.categories).to.deep.equal([{ value: 'a', label: '甲' }]);
});

it('does not emit tc-search when disabled', async () => {
  const el = await fixture<TcSearchBar>(html`<tc-search-bar disabled value="x"></tc-search-bar>`);
  const btn = el.shadowRoot!.querySelector('.submit') as HTMLButtonElement;
  let fired = false;
  el.addEventListener('tc-search', () => (fired = true));
  btn.click();
  await el.updateComplete;
  expect(fired).to.be.false;
});
