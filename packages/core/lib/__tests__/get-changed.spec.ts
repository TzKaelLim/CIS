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

    // CPU time, not wall-clock time: on a busy machine the jest worker can be
    // descheduled for hundreds of ms, which a wall-clock threshold would count.
    const cpuStart = process.cpuUsage();
    const changed = getChanged({ props }, { props: { id: "comp-1" } });
    const cpu = process.cpuUsage(cpuStart);
    const elapsed = (cpu.user + cpu.system) / 1000;

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
