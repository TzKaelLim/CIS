import { Config, Content, Data } from "../../../types";
import { walkTree } from "../walk-tree";

const config: Config = {
  components: {
    Comp: {
      fields: {},
      render: () => <div />,
    },
  },
};

describe("walkTree merging", () => {
  it("walks 10,000 zones in under 200 ms", () => {
    const zones: Record<string, Content> = {};

    for (let i = 0; i < 10_000; i++) {
      zones[`comp-${i}:content`] = [];
    }

    const data: Data = { root: { props: {} }, content: [], zones };

    // CPU time, not wall-clock time: on a busy machine the jest worker can be
    // descheduled for hundreds of ms, which a wall-clock threshold would count.
    const cpuStart = process.cpuUsage();
    const result = walkTree(data, config, (content) => content);
    const cpu = process.cpuUsage(cpuStart);
    const elapsed = (cpu.user + cpu.system) / 1000;

    expect(Object.keys(result.zones ?? {})).toHaveLength(10_000);
    expect(elapsed).toBeLessThan(200);
  });

  it("keeps a __proto__ zone as an own property without touching any prototype", () => {
    const zones = JSON.parse(
      '{"__proto__":[{"type":"Comp","props":{"id":"comp-1"}}]}'
    );

    const data: Data = { root: { props: {} }, content: [], zones };

    const result = walkTree(data, config, (content) => content);

    expect(
      Object.prototype.hasOwnProperty.call(result.zones, "__proto__")
    ).toBe(true);
    expect(Object.getPrototypeOf(result.zones)).toBe(Object.prototype);
    expect(result.zones?.["__proto__"]).toEqual([
      { type: "Comp", props: { id: "comp-1" } },
    ]);
  });
});
