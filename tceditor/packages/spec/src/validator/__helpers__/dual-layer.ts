// The dual-layer consistency rules of spec §13.1 and gaps #25, in one place.
// Two tests use them, so a change to the rules reaches both:
// - packages/spec/src/validator/__tests__/dual-layer.spec.ts (test specs)
// - packages/blocks/src/__tests__/dual-layer.spec.ts (the generated catalog
//   and page shell, imported by relative path: the package's exports stay
//   "." and "./validator")
// Test code only: it uses Ajv, a devDependency.
import Ajv, { type ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020";
import type { AnyBlockSpec } from "../../define";
import type { JsonSchema } from "../../json-schema";
import { X_KEYS } from "../../meta";
import { slotLocations, type SlotLocation } from "../../slots";
import type { IssueCode } from "../issues";
import type { ValidateResult } from "../types";

export type DualLayerCase = { name: string; input: unknown };

/** x-lost-checks entries that the validator reports as a rejection. */
export const LOST_CHECK_CODES: Readonly<Record<string, IssueCode>> = {
  "safe-href": "unsafe_href",
  "alt-required": "alt_required",
};

/**
 * Whole-page rules that no JSON Schema layer checks: the shell only checks
 * structure (spec §6.5) and the per-block schemas see one block at a time.
 */
export const PAGE_RULE_CODES: readonly IssueCode[] = [
  "duplicate_id",
  "not_allowed_here",
  "too_deep",
  "too_many_blocks",
];

export type DualLayerOracle = {
  /** Each block's props (without id) and the root props against the 2020-12 schemas, as MCP sees them. */
  propsAccepted: (input: unknown) => boolean;
  /** The draft-07 shell plus the per-block schemas, as the database sees them. */
  ajvAccepts: (input: unknown) => boolean;
  /** Codes of the x-lost-checks that the schemas declare anywhere, sorted. */
  lostCheckCodes: readonly IssueCode[];
  /**
   * The cases the validator accepts although Ajv rejects their input props
   * ("<name>: input props") or the data the validator returns ("<name>:
   * stored data"). Must be empty.
   */
  zodOnlyAccepts: (
    corpus: readonly DualLayerCase[],
    validatePage: (data: unknown) => ValidateResult
  ) => string[];
  /**
   * The codes of the cases the validator rejects and Ajv accepts (`seen`,
   * sorted), and the ones that are neither an x-lost-check nor a whole-page
   * rule (`unexpected`, "<name>: <code>"; must be empty).
   */
  zodOnlyRejects: (
    corpus: readonly DualLayerCase[],
    validatePage: (data: unknown) => ValidateResult
  ) => { seen: IssueCode[]; unexpected: string[] };
};

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The values at a slot path such as ["columns", "[]", "content"]. */
const valuesAt = (value: unknown, segments: readonly string[]): unknown[] => {
  let found = [value];

  for (const segment of segments) {
    found = found.flatMap((item) =>
      segment === "[]"
        ? Array.isArray(item)
          ? item
          : []
        : isRecord(item) && Object.prototype.hasOwnProperty.call(item, segment)
        ? [item[segment]]
        : []
    );
  }

  return found;
};

export function createDualLayerOracle(options: {
  /** Each block type's props schema (JSON Schema 2020-12). */
  blocks: readonly { type: string; props: JsonSchema }[];
  /** The page root's props schema (JSON Schema 2020-12). */
  root: JsonSchema;
  /** The draft-07 page shell. */
  shell: JsonSchema;
  /** The specs of the blocks, to find the blocks inside slots. */
  specs: readonly AnyBlockSpec[];
}): DualLayerOracle {
  // Ajv the way S3 and S4 will run it: strict, every x-* keyword registered,
  // defaults filled in like zod does (facts zod-ajv §10.1, gaps #21).
  const ajv2020 = new Ajv2020({
    strict: true,
    allErrors: true,
    useDefaults: true,
  });
  ajv2020.addVocabulary([...X_KEYS]);

  const compile = (schema: JsonSchema): ValidateFunction =>
    ajv2020.compile(structuredClone(schema));

  const propsSchemas = new Map<string, ValidateFunction>(
    options.blocks.map((block) => [block.type, compile(block.props)])
  );
  const rootSchema = compile(options.root);
  const shellSchema = new Ajv({ strict: true, allErrors: true }).compile(
    structuredClone(options.shell)
  );
  const slots = new Map<string, readonly SlotLocation[]>(
    options.specs.map((spec) => [spec.type, slotLocations(spec)])
  );

  /** Every block node in a content array, including the ones in slots. */
  const blocksOf = (content: unknown): AnyRecord[] => {
    const found: AnyRecord[] = [];
    const queue: unknown[] = [content];

    while (queue.length > 0) {
      const list = queue.pop();

      if (!Array.isArray(list)) continue;

      for (const node of list) {
        if (!isRecord(node) || !isRecord(node.props)) continue;

        found.push(node);

        const locations =
          typeof node.type === "string" ? slots.get(node.type) : undefined;

        for (const slot of locations ?? []) {
          queue.push(...valuesAt(node.props, slot.path));
        }
      }
    }

    return found;
  };

  const propsAccepted = (input: unknown): boolean => {
    const data: unknown = structuredClone(input);

    if (!isRecord(data) || !isRecord(data.root)) return false;
    if (!rootSchema(data.root.props)) return false;

    return blocksOf(data.content).every((node) => {
      const check =
        typeof node.type === "string" ? propsSchemas.get(node.type) : undefined;
      const props = { ...(node.props as AnyRecord) };

      delete props.id;

      return check !== undefined && check(props);
    });
  };

  const ajvAccepts = (input: unknown): boolean =>
    shellSchema(structuredClone(input)) && propsAccepted(input);

  const lostCheckCodes = (() => {
    const codes = new Set<IssueCode>();
    const stack: unknown[] = [
      ...options.blocks.map((block) => block.props),
      options.root,
    ];

    while (stack.length > 0) {
      const node = stack.pop();

      if (Array.isArray(node)) {
        stack.push(...node);
      } else if (isRecord(node)) {
        const checks = node["x-lost-checks"];

        if (Array.isArray(checks)) {
          for (const check of checks) {
            // Own keys only: "constructor" in {} is true
            if (
              typeof check === "string" &&
              Object.prototype.hasOwnProperty.call(LOST_CHECK_CODES, check)
            ) {
              codes.add(LOST_CHECK_CODES[check]);
            }
          }
        }

        stack.push(...Object.values(node));
      }
    }

    return [...codes].sort();
  })();

  const allowed = new Set<IssueCode>([...lostCheckCodes, ...PAGE_RULE_CODES]);

  return {
    propsAccepted,
    ajvAccepts,
    lostCheckCodes,
    zodOnlyAccepts: (corpus, validatePage) => {
      const failures: string[] = [];

      for (const { name, input } of corpus) {
        const result = validatePage(structuredClone(input));

        if (!result.ok) continue;

        // MCP checks the block props it sends; the database checks what is stored
        if (!propsAccepted(input)) failures.push(`${name}: input props`);
        if (!ajvAccepts(result.data)) failures.push(`${name}: stored data`);
      }

      return failures;
    },
    zodOnlyRejects: (corpus, validatePage) => {
      const seen = new Set<IssueCode>();
      const unexpected: string[] = [];

      for (const { name, input } of corpus) {
        const result = validatePage(structuredClone(input));

        if (result.ok || !ajvAccepts(input)) continue;

        for (const issue of result.errors) {
          seen.add(issue.code);
          if (!allowed.has(issue.code))
            unexpected.push(`${name}: ${issue.code}`);
        }
      }

      return { seen: [...seen].sort(), unexpected };
    },
  };
}
