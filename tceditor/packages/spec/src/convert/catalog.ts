import type { AnyBlockSpec, PageRootSpec } from "../define";
import { toJsonSchema, type JsonSchema } from "../json-schema";
import { DEFAULT_LIMITS, NODE_ID_PATTERN } from "../limits";
import type { SlotRule } from "../meta";
import { slotLocations } from "../slots";
import {
  findKeywords,
  hasFailingDefault,
  omitKeys,
  propertiesOf,
  requiredOf,
  rewriteSchema,
} from "./schema-utils";

export const CATALOG_VERSION = 1;

export type CatalogBlock = {
  type: string;
  label: string;
  category: string;
  description: string;
  version: number;
  deprecated: boolean;
  /**
   * JSON Schema 2020-12，去掉 $schema 與只給編輯器、Storybook 用的 x-*。
   * 必填的 link()（x-link.optional 為 false）與 image()（x-image）列在 required，
   * 因為它們的預設值不合格。
   */
  props: JsonSchema;
  /** key 同 SlotLocation.key；值為展開後、排除 deprecated 區塊、依登記順序排列的類型清單。 */
  slots: Record<string, string[]>;
  examples: { name: string; props: Record<string, unknown> }[];
};

export type Catalog = {
  catalogVersion: 1;
  nodeIdPattern: string;
  limits: { maxBytes: number; maxDepth: number; maxBlocks: number };
  blocks: CatalogBlock[];
  root: { label: string; props: JsonSchema };
};

/** catalog 的 props 要去掉的 key（規格 §5.4）。x-labels、x-lost-checks、x-richtext、x-image、x-link 保留。 */
const STRIPPED_KEYS = [
  "$schema",
  "x-inline",
  "x-field",
  "x-item-label",
  "x-style",
  "x-token",
  "x-slot",
];

/** MCP 端不支援的關鍵字（規格 §5.4）。 */
const FORBIDDEN_KEYWORDS = ["$ref", "oneOf", "anyOf", "allOf"];

/**
 * 把必填的 link() 與 image() 加進該層的 required。它們用 prefault，在 io "input" 下
 * 不列入 required，預設值卻不合格；AI 或不補預設值的 Ajv 不能以為可以省略它們。
 */
function requirePrefaulted(node: JsonSchema): JsonSchema {
  const names = Object.entries(propertiesOf(node))
    .filter(([, property]) => hasFailingDefault(property))
    .map(([name]) => name);
  if (names.length === 0) return node;
  return { ...node, required: [...new Set([...requiredOf(node), ...names])] };
}

function catalogProps(schema: JsonSchema, owner: string): JsonSchema {
  const props = rewriteSchema(schema, (node) =>
    requirePrefaulted(omitKeys(node, STRIPPED_KEYS))
  );
  const forbidden = findKeywords(props, FORBIDDEN_KEYWORDS).join(", ");
  if (forbidden !== "") {
    throw new TypeError(
      `buildCatalog: ${owner} props use ${forbidden}; catalog props must not contain $ref, oneOf, anyOf or allOf`
    );
  }
  return props;
}

/** 把 allow／disallow 展開成明確的類型清單：只列已登記、未 deprecated 的區塊，依登記順序。 */
function expandSlotRule(
  rule: SlotRule,
  blocks: readonly AnyBlockSpec[]
): string[] {
  const usable = blocks.filter((spec) => !spec.deprecated);
  const allowed =
    "allow" in rule
      ? usable.filter((spec) => rule.allow.includes(spec.type))
      : usable.filter((spec) => !rule.disallow.includes(spec.type));
  return allowed.map((spec) => spec.type);
}

/** 產生 MCP 元件目錄（規格 §5.4）。 */
export function buildCatalog(input: {
  blocks: readonly AnyBlockSpec[];
  root: PageRootSpec;
}): Catalog {
  const { blocks, root } = input;
  return {
    catalogVersion: CATALOG_VERSION,
    nodeIdPattern: NODE_ID_PATTERN.source,
    limits: {
      maxBytes: DEFAULT_LIMITS.maxBytes,
      maxDepth: DEFAULT_LIMITS.maxDepth,
      maxBlocks: DEFAULT_LIMITS.maxBlocks,
    },
    blocks: blocks.map((spec) => ({
      type: spec.type,
      label: spec.label,
      category: spec.category,
      description: spec.description,
      version: spec.version,
      deprecated: spec.deprecated,
      props: catalogProps(toJsonSchema(spec), spec.type),
      slots: Object.fromEntries(
        slotLocations(spec).map((location) => [
          location.key,
          expandSlotRule(location.rule, blocks),
        ])
      ),
      examples: spec.examples.map((example) => ({
        name: example.name,
        props: structuredClone(example.props) as Record<string, unknown>,
      })),
    })),
    root: {
      label: root.label,
      props: catalogProps(toJsonSchema(root), "root"),
    },
  };
}
