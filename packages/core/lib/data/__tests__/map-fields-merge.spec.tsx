import { Config } from "../../../types";
import { mapFields } from "../map-fields";

const config: Config = {
  components: {
    Comp: {
      fields: {
        title: { type: "text" },
      },
      render: () => <div />,
    },
  },
};

const makeProps = (count: number) => {
  const props: Record<string, string> = { id: "comp-1" };

  for (let i = 0; i < count; i++) {
    props[`key${i}`] = `value${i}`;
  }

  return props;
};

describe("mapFields merging", () => {
  it("maps 10,000 props in under 200 ms", () => {
    const item = { type: "Comp", props: makeProps(10_000) };

    const start = performance.now();
    const result = mapFields(item, {}, config);
    const elapsed = performance.now() - start;

    expect(Object.keys(result.props)).toHaveLength(10_001);
    expect(result.props.key9999).toBe("value9999");
    expect(elapsed).toBeLessThan(200);
  });

  it("keeps a __proto__ prop as an own property without touching any prototype", () => {
    const props = JSON.parse(
      '{"id":"comp-1","__proto__":{"polluted":"yes"},"title":"Hello"}'
    );

    const result = mapFields({ type: "Comp", props }, {}, config);

    expect(
      Object.prototype.hasOwnProperty.call(result.props, "__proto__")
    ).toBe(true);
    expect(Object.getPrototypeOf(result.props)).toBe(Object.prototype);
    expect(result.props.title).toBe("Hello");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
