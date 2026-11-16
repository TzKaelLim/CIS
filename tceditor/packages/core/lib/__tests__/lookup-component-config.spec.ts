import { Config } from "../../types";
import { lookupComponentConfig } from "../lookup-component-config";

const render = () => null;

const config: Config = {
  components: {
    Heading: { render },
  },
};

describe("lookupComponentConfig", () => {
  it("returns the config for a defined component type", () => {
    expect(lookupComponentConfig(config, "Heading")).toBe(
      config.components.Heading
    );
  });

  it("returns undefined for an unknown component type", () => {
    expect(lookupComponentConfig(config, "Missing")).toBeUndefined();
  });

  it.each(["constructor", "__proto__", "toString", "hasOwnProperty"])(
    "returns undefined for the inherited member %s",
    (type) => {
      expect(lookupComponentConfig(config, type)).toBeUndefined();
    }
  );

  it("returns undefined when the type is missing", () => {
    expect(lookupComponentConfig(config, undefined)).toBeUndefined();
    expect(lookupComponentConfig(config, null)).toBeUndefined();
  });

  it("returns a component that is really named after an inherited member", () => {
    const ownConstructor = { render };
    const configWithConstructor: Config = {
      components: { constructor: ownConstructor },
    };

    expect(lookupComponentConfig(configWithConstructor, "constructor")).toBe(
      ownConstructor
    );
  });
});
