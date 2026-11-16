import { fieldKindOf } from "../field-kind";
import type { FieldKind } from "../field-kind";
import { toJsonSchema } from "../json-schema";
import type { JsonSchema } from "../json-schema";
import { kitchenSinkSpec } from "../__fixtures__/test-specs";

const properties = toJsonSchema(kitchenSinkSpec).properties as Record<
  string,
  JsonSchema
>;

describe("fieldKindOf", () => {
  it("covers all 11 kinds with the test spec", () => {
    const kinds = Object.fromEntries(
      Object.entries(properties).map(([name, node]) => [
        name,
        fieldKindOf(node),
      ])
    );

    expect(kinds).toEqual({
      title: "text",
      note: "textarea",
      count: "number",
      tone: "choice",
      size: "choice",
      space: "choice",
      enabled: "boolean",
      href: "link",
      moreHref: "link",
      body: "richtext",
      items: "array",
      group: "object",
      content: "slot",
      picture: "image",
    });
    expect(new Set(Object.values(kinds)).size).toBe(11);
  });

  it("reads nested fields too", () => {
    const items = properties.items.items as {
      properties: Record<string, JsonSchema>;
    };
    const group = properties.group as {
      properties: Record<string, JsonSchema>;
    };

    expect(fieldKindOf(items.properties.label)).toBe<FieldKind>("text");
    expect(fieldKindOf(group.properties.level)).toBe<FieldKind>("number");
  });

  it("checks the x- markers before the JSON type", () => {
    expect(fieldKindOf({ type: "string", enum: ["a"], "x-link": {} })).toBe(
      "link"
    );
    expect(fieldKindOf({ type: "number" })).toBe("number");
  });

  it("throws for nodes it cannot map", () => {
    expect(() => fieldKindOf({ type: ["string", "null"] })).toThrow(TypeError);
    expect(() => fieldKindOf({ anyOf: [{ type: "string" }] })).toThrow(
      "fieldKindOf: unsupported schema node"
    );
  });
});
