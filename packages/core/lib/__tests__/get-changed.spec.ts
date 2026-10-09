import { getChanged } from "../get-changed";

describe("getChanged", () => {
  it("flags the props that differ from the previous item", () => {
    const changed = getChanged(
      { props: { id: "comp-1", title: "New", body: "Same" } },
      { props: { id: "comp-1", title: "Old", body: "Same" } }
    );

    expect(changed).toEqual({ id: false, title: true, body: false });
  });

  it("compares 10,000 props in under 200 ms", () => {
    const props: Record<string, string> = { id: "comp-1" };

    for (let i = 0; i < 10_000; i++) {
      props[`key${i}`] = `value${i}`;
    }

    const start = performance.now();
    const changed = getChanged({ props }, { props: { id: "comp-1" } });
    const elapsed = performance.now() - start;

    expect(Object.keys(changed)).toHaveLength(10_001);
    expect(elapsed).toBeLessThan(200);
  });

  it("keeps a __proto__ prop as an own property without touching any prototype", () => {
    const props = JSON.parse('{"id":"comp-1","__proto__":{"polluted":"yes"}}');

    const changed = getChanged({ props }, null);

    expect(Object.prototype.hasOwnProperty.call(changed, "__proto__")).toBe(
      true
    );
    expect(Object.getPrototypeOf(changed)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
