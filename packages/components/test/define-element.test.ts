import { expect } from '@open-wc/testing';
import { defineElement } from '../dist/base/define-element.js';

class FakeEl extends HTMLElement {}
class FakeEl2 extends HTMLElement {}

it('registers a tag once and is a no-op on repeat', () => {
  defineElement('tc-fake', FakeEl);
  defineElement('tc-fake', FakeEl2); // must not throw
  expect(customElements.get('tc-fake')).to.equal(FakeEl);
});
