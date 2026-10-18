import { stableStringify } from "../stable-stringify";

describe("stableStringify", () => {
  it("ignores key order at every level", () => {
    expect(stableStringify({ b: 1, a: { d: [{ y: 1, x: 2 }], c: null } })).toBe(
      stableStringify({ a: { c: null, d: [{ x: 2, y: 1 }] }, b: 1 })
    );
  });

  it("keeps array order", () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
  });

  it("keeps a __proto__ key", () => {
    expect(stableStringify(JSON.parse('{"__proto__": {"a": 1}}'))).toBe(
      '{"__proto__":{"a":1}}'
    );
  });

  it("serializes strings and undefined", () => {
    expect(stableStringify("<p>x</p>")).toBe('"<p>x</p>"');
    expect(stableStringify(undefined)).toBe("");
  });
});
