import {
  buildCatalog,
  eachField,
  fieldPathKey,
  slotLocations,
  toArgTypes,
  toJsonSchema,
  toPuckFields,
} from "@tzuchi/tceditor-spec";
import type { FieldFactories, JsonSchema } from "@tzuchi/tceditor-spec";
import { blockSpecs, pageRootSpec } from "../specs";

// Only the field names matter here; the real picker is in image/editor.tsx
const image: NonNullable<FieldFactories["image"]> = ({ label }) => ({
  type: "text",
  label,
});

const catalog = buildCatalog({ blocks: blockSpecs, root: pageRootSpec });
const blockCases = blockSpecs.map((spec) => [spec.type, spec] as const);

const sortedKeys = (object: object | undefined) =>
  Object.keys(object ?? {}).sort();

/** The parts of a Puck field that hold nested fields. */
type EditorField = {
  arrayFields?: Record<string, EditorField>;
  objectFields?: Record<string, EditorField>;
};

/** Every editor field name, nested ones as "tags[].label" (fieldPathKey's format). */
const editorNames = (
  fields: Record<string, EditorField>,
  prefix = ""
): string[] =>
  Object.entries(fields).flatMap(([name, field]) => [
    `${prefix}${name}`,
    ...editorNames(field.arrayFields ?? {}, `${prefix}${name}[].`),
    ...editorNames(field.objectFields ?? {}, `${prefix}${name}.`),
  ]);

/**
 * Every field name of a props schema. The catalog drops x-slot, so eachField
 * would walk into the slot items of the catalog; names inside a slot are left out.
 */
const schemaNames = (
  schema: JsonSchema,
  slotKeys: readonly string[]
): string[] => {
  const names: string[] = [];

  eachField(schema, ({ path }) => {
    const key = fieldPathKey(path);

    if (!slotKeys.some((slot) => key.startsWith(`${slot}[]`))) names.push(key);
  });

  return names.sort();
};

describe("field names agree across the artifacts (spec §5.5 #4)", () => {
  it.each(blockCases)(
    "%s: editor fields, Storybook argTypes and the catalog match the spec",
    (type, spec) => {
      const expected = sortedKeys(spec.props.shape);
      const entry = catalog.blocks.find((block) => block.type === type);

      expect({
        editor: sortedKeys(toPuckFields(spec, { image })),
        storybook: sortedKeys(toArgTypes(spec)),
        catalog: sortedKeys(entry?.props.properties as object | undefined),
      }).toEqual({ editor: expected, storybook: expected, catalog: expected });
    }
  );

  it.each(blockCases)(
    "%s: the fields inside lists and groups match too",
    (type, spec) => {
      const slots = slotLocations(spec).map((slot) => slot.key);
      const expected = schemaNames(toJsonSchema(spec), slots);
      const entry = catalog.blocks.find((block) => block.type === type);

      expect({
        editor: editorNames(
          toPuckFields(spec, { image }) as Record<string, EditorField>
        ).sort(),
        catalog: entry ? schemaNames(entry.props, slots) : [],
      }).toEqual({ editor: expected, catalog: expected });
    }
  );

  it("reaches the fields inside the lists of TagList and Columns", () => {
    const names = blockSpecs.flatMap((spec) =>
      schemaNames(toJsonSchema(spec), [])
    );

    expect(names).toEqual(
      expect.arrayContaining(["tags[].label", "columns[].content"])
    );
  });

  it("page root: editor fields and the catalog match the spec", () => {
    const expected = sortedKeys(pageRootSpec.props.shape);

    expect({
      editor: sortedKeys(toPuckFields(pageRootSpec)),
      catalog: sortedKeys(catalog.root.props.properties as object | undefined),
    }).toEqual({ editor: expected, catalog: expected });
  });
});
