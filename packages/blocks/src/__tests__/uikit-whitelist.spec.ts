import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eachField, toJsonSchema } from "@tzuchi/tceditor-spec";
import { blockSpecs, pageRootSpec } from "../specs";
import { STYLE_DECISIONS } from "../style-decisions";
import { nodesWithKey } from "./__helpers__/schema-nodes";

type UikitOptions = {
  components: Record<string, { variants: Record<string, string[]> }>;
};

/** One style() field: which uikit variant it maps to and the options it offers. */
type StyleField = {
  field: string;
  styleKey: string;
  offered: string[];
  node: object;
};

const uikit = JSON.parse(
  readFileSync(join(__dirname, "../../generated/uikit-options.json"), "utf8")
) as UikitOptions;

const own = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key);

/** The variant's options in the uikit snapshot; [] when uikit has no such variant. */
function uikitOptions(styleKey: string): string[] {
  const [component, key] = styleKey.split(".");

  if (!own(uikit.components, component)) return [];

  const { variants } = uikit.components[component];

  return own(variants, key) ? variants[key] : [];
}

const styleFields: StyleField[] = [];
const specs = [...blockSpecs, pageRootSpec];

for (const spec of specs) {
  const owner = spec.kind === "block" ? spec.type : "root";

  eachField(toJsonSchema(spec), ({ path, node }) => {
    const xStyle = node["x-style"] as
      | { component: string; key: string }
      | undefined;

    if (xStyle) {
      styleFields.push({
        field: `${owner}.${path.join(".")}`,
        styleKey: `${xStyle.component}.${xStyle.key}`,
        offered: node.enum as string[],
        node,
      });
    }
  });
}

/** Options offered for each uikit variant, over every spec that uses it. */
const offered = new Map<string, Set<string>>();

for (const { styleKey, offered: values } of styleFields) {
  offered.set(styleKey, new Set([...(offered.get(styleKey) ?? []), ...values]));
}

describe("style options against the uikit snapshot (spec §5.5)", () => {
  it("finds every style() field of the blocks and the page root", () => {
    const found = styleFields.map((field) => field.node);
    const all = specs.flatMap((spec) =>
      nodesWithKey(toJsonSchema(spec), "x-style")
    );
    expect(found.length).toBeGreaterThan(0);
    expect(found).toHaveLength(all.length);
    expect(all.every((node) => found.includes(node))).toBe(true);
  });

  it("#2: offers only options that exist in uikit", () => {
    const missing = styleFields.flatMap(
      ({ field, styleKey, offered: values }) =>
        values
          .filter((value) => !uikitOptions(styleKey).includes(value))
          .map((value) => `${field}: uikit's ${styleKey} has no "${value}"`)
    );

    expect(missing).toEqual([]);
  });

  it("#3: offers each uikit option or explains in style-decisions.ts why not", () => {
    const undecided = [...offered].flatMap(([styleKey, values]) => {
      const decisions = own(STYLE_DECISIONS, styleKey)
        ? STYLE_DECISIONS[styleKey]
        : {};

      return uikitOptions(styleKey)
        .filter((value) => !values.has(value) && !own(decisions, value))
        .map((value) => `${styleKey}: "${value}"`);
    });

    expect(undecided).toEqual([]);
  });

  it("explains only uikit options that are not offered", () => {
    const problems: string[] = [];

    for (const [styleKey, decisions] of Object.entries(STYLE_DECISIONS)) {
      const values = offered.get(styleKey);

      if (!values) {
        problems.push(`${styleKey}: no spec uses this variant`);
        continue;
      }

      for (const [value, reason] of Object.entries(decisions)) {
        if (values.has(value))
          problems.push(`${styleKey}: "${value}" is offered`);
        if (!uikitOptions(styleKey).includes(value)) {
          problems.push(`${styleKey}: uikit has no "${value}"`);
        }
        if (reason.trim() === "") {
          problems.push(`${styleKey}: "${value}" has no reason`);
        }
      }
    }

    expect(problems).toEqual([]);
  });
});
