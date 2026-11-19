import { Config, Data } from "../../types";
import { groupZonesByComponent } from "../group-zones-by-component";
import { migrate } from "../migrate";
import { resolveAllData } from "../resolve-all-data";
import { transformProps } from "../transform-props";

jest.spyOn(console, "log").mockImplementation(() => {});

const config: Config = {
  components: {
    Section: {
      fields: { content: { type: "slot" } },
      render: () => <div />,
    },
    Columns: {
      fields: {
        columns: {
          type: "array",
          arrayFields: { items: { type: "slot" } },
        },
      },
      render: () => <div />,
    },
    Card: {
      render: () => <div />,
    },
  },
};

const card = (id: string) => ({ type: "Card", props: { id } });

describe("component ids named after Object.prototype members", () => {
  it("groupZonesByComponent groups zones whose parent is __proto__ or constructor", () => {
    const data: Data = {
      root: { props: {} },
      content: [],
      zones: {
        "__proto__:content": [card("card-1")],
        "constructor:content": [card("card-2")],
      },
    };

    const grouped = groupZonesByComponent(data);

    expect(Object.keys(grouped)).toEqual(["__proto__", "constructor"]);
    expect(grouped["__proto__"]).toEqual([
      { zoneCompound: "__proto__:content", content: [card("card-1")] },
    ]);
    expect(grouped["toString"]).toBeUndefined();
  });

  it("resolveAllData resolves components with those ids", async () => {
    const data: Data = {
      root: { props: {} },
      content: [
        { type: "Section", props: { id: "__proto__" } },
        card("toString"),
      ],
      zones: { "__proto__:content": [card("card-1")] },
    };

    const resolved = await resolveAllData(data, config);

    expect(resolved.content.map((item) => item.props.id)).toEqual([
      "__proto__",
      "toString",
    ]);
    expect(resolved.zones?.["__proto__:content"]).toEqual([card("card-1")]);
  });

  it("migrate moves a DropZone under __proto__ into its slot", () => {
    const data: Data = {
      root: { props: {} },
      content: [{ type: "Section", props: { id: "__proto__" } }, card("type")],
      zones: { "__proto__:content": [card("card-1")] },
    };

    const migrated = migrate(data, config);

    expect(migrated.content).toEqual([
      {
        type: "Section",
        props: { id: "__proto__", content: [card("card-1")] },
      },
      card("type"),
    ]);
    expect(migrated.zones).toBeUndefined();
  });

  it("migrate moves dynamic zones under __proto__ without touching Object.prototype", () => {
    const data: Data = {
      root: { props: {} },
      content: [{ type: "Columns", props: { id: "__proto__" } }],
      zones: {
        "__proto__:column-0": [card("card-1")],
        "__proto__:column-1": [card("card-2")],
      },
    };

    const migrated = migrate(data, config, {
      migrateDynamicZonesForComponent: {
        Columns: (props, zones) => ({
          ...props,
          columns: Object.values(zones).map((items) => ({ items })),
        }),
      },
    });

    expect(migrated.content[0].props.columns).toEqual([
      { items: [card("card-1")] },
      { items: [card("card-2")] },
    ]);
    expect(migrated.zones).toBeUndefined();
    expect(({} as Record<string, unknown>)["column-0"]).toBeUndefined();
  });
});

describe("component types named after Object.prototype members", () => {
  it.each(["constructor", "toString", "__proto__"])(
    "migrate does not call the inherited member %s of migrateDynamicZonesForComponent",
    (type) => {
      const data: Data = {
        root: { props: {} },
        content: [{ type, props: { id: "x" } }],
        zones: { "x:column-0": [card("card-1")] },
      };

      expect(() =>
        migrate(data, config, {
          migrateDynamicZonesForComponent: {
            Columns: (props, zones) => ({ ...props, zones }),
          },
        })
      ).toThrow('Could not migrate DropZone "x:column-0" to slot field');
    }
  );

  it.each(["constructor", "toString", "__proto__"])(
    "transformProps leaves a component of type %s unchanged",
    (type) => {
      const result = transformProps(
        { root: { props: {} }, content: [{ type, props: { id: "x" } }] },
        { Card: (props: any) => props }
      );

      expect(result.content).toEqual([{ type, props: { id: "x" } }]);
    }
  );
});
