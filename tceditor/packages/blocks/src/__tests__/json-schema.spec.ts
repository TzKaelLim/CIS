import Ajv2020 from "ajv/dist/2020";
import type { ValidateFunction } from "ajv/dist/2020";
import {
  X_KEYS,
  exampleToPageData,
  slotLocations,
  toJsonSchema,
} from "@tzuchi/tceditor-spec";
import type { AnyBlockSpec, BlockNode } from "@tzuchi/tceditor-spec";
import { blockSpecs, pageRootSpec } from "../specs";
import { validatePage } from "../validator";

const ajv = new Ajv2020({ strict: true, allErrors: true });

ajv.addVocabulary([...X_KEYS]);

const specs = new Map<string, AnyBlockSpec>(
  blockSpecs.map((spec) => [spec.type, spec])
);
const blockSchemas = new Map<string, ValidateFunction>(
  blockSpecs.map((spec) => [spec.type, ajv.compile(toJsonSchema(spec))])
);
const rootSchema = ajv.compile(toJsonSchema(pageRootSpec));

/** Every node of a validated page, slot children included. */
const allNodes = (content: BlockNode[]): BlockNode[] => {
  const nodes: BlockNode[] = [];
  const stack = [...content];

  while (stack.length > 0) {
    const node = stack.pop() as BlockNode;

    nodes.push(node);

    for (const { path } of slotLocations(
      specs.get(node.type) as AnyBlockSpec
    )) {
      const value = node.props[path[0]];

      if (path.length === 1) {
        stack.push(...(value as BlockNode[]));
      } else {
        for (const item of value as Record<string, BlockNode[]>[]) {
          stack.push(...item[path[2]]);
        }
      }
    }
  }

  return nodes;
};

const examples = blockSpecs.flatMap((spec) =>
  spec.examples.map((example, index) => ({
    name: `${spec.type}: ${example.name}`,
    spec,
    index,
  }))
);

describe("JSON Schema of the blocks (Ajv 2020-12)", () => {
  it.each(examples)(
    "accepts every node the validator accepts in $name",
    ({ spec, index }) => {
      const result = validatePage(exampleToPageData(spec, index));

      if (!result.ok) throw new Error(JSON.stringify(result.errors));

      for (const node of allNodes(result.data.content)) {
        const { id: _id, ...props } = node.props;
        const validate = blockSchemas.get(node.type) as ValidateFunction;

        // The type is in the expectation so a failure names the block
        expect([node.type, validate(props), validate.errors ?? null]).toEqual([
          node.type,
          true,
          null,
        ]);
      }

      expect(rootSchema(result.data.root.props)).toBe(true);
    }
  );
});
