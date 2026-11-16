/** @jest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eachField, toJsonSchema } from "@tzuchi/tceditor-spec";
import { blockSpecs } from "../specs";
import {
  TOKEN_CLASS_PURPOSES,
  TOKEN_PURPOSES,
  tokenClass,
} from "../token-classes";
import { nodesWithKey } from "./__helpers__/schema-nodes";

const packageRoot = join(__dirname, "..", "..");
const repoRoot = join(packageRoot, "..", "..");
const blocksCss = readFileSync(join(packageRoot, "src", "blocks.css"), "utf8");
const tokensCss = readFileSync(
  join(repoRoot, "vendor/uikit/packages/tokens/dist/tokens.css"),
  "utf8"
);

function tokenFields() {
  const found: {
    field: string;
    name: string;
    group: unknown;
    values: string[];
    node: object;
  }[] = [];
  for (const spec of blockSpecs) {
    eachField(toJsonSchema(spec), ({ name, node }) => {
      const token = node["x-token"] as { group?: unknown } | undefined;
      if (token === undefined) return;
      found.push({
        field: `${spec.type}.${name}`,
        name,
        group: token.group,
        values: (node.enum as string[] | undefined) ?? [],
        node,
      });
    });
  }
  return found;
}

/** Every custom property that blocks.css reads with var(), once each. */
const usedVariables = [
  ...new Set(
    [...blocksCss.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)].map(
      (match) => match[1]
    )
  ),
];

describe("blocks.css", () => {
  it("maps token values to tcb- classes", () => {
    expect(tokenClass("space", "padding-y", "48")).toBe("tcb-py-48");
    expect(tokenClass("space", "gap", "24")).toBe("tcb-gap-24");
    expect(tokenClass("space", "gap", "24 tcb-page")).toBe("");
  });

  it("finds every token field of the blocks", () => {
    const found = tokenFields().map((field) => field.node);
    const all = blockSpecs.flatMap((spec) =>
      nodesWithKey(toJsonSchema(spec), "x-token")
    );
    expect(found.length).toBeGreaterThan(0);
    expect(found).toHaveLength(all.length);
    expect(all.every((node) => found.includes(node))).toBe(true);
  });

  it.each(tokenFields())(
    "$field: every value has its class, set from the token",
    ({ name, group, values }) => {
      if (!Object.prototype.hasOwnProperty.call(TOKEN_PURPOSES, name)) {
        throw new Error(
          `add ${name} to TOKEN_PURPOSES in src/token-classes.ts`
        );
      }
      const purpose = TOKEN_PURPOSES[name];
      expect(group).toBe("space");
      expect(values.length).toBeGreaterThan(0);
      for (const value of values) {
        // A token() value is a @tzuchi/tokens name (spec §4.2)
        expect(tokensCss).toContain(`--tc-${group}-${value}:`);
        const className = tokenClass("space", purpose, value);
        const { property } = TOKEN_CLASS_PURPOSES[purpose];
        expect(blocksCss).toContain(
          `.${className} {\n  ${property}: var(--tc-space-${value});\n}`
        );
      }
    }
  );

  it("reads only token variables that the vendored tokens define", () => {
    const tokens = usedVariables.filter((name) => name.startsWith("--tc-"));
    expect(tokens.length).toBeGreaterThan(10);
    expect(tokens.filter((name) => !tokensCss.includes(`${name}:`))).toEqual(
      []
    );
  });

  it("stacks the columns below the tokens' tablet breakpoint", () => {
    const tablet = /--tc-breakpoint-tablet:\s*(\d+)px;/.exec(tokensCss);
    if (!tablet) throw new Error("--tc-breakpoint-tablet not found");
    expect(tablet[1]).toBe("768");
    const queries = blocksCss.match(/@media[^{]*\{/g);
    expect(queries).toEqual([
      `@media (max-width: ${Number(tablet[1]) - 0.02}px) {`,
    ]);
    expect(queries?.[0]).toBe("@media (max-width: 767.98px) {");
  });

  it("uses only primitive --tc-color-* tokens (semantic ones flip in OS dark mode)", () => {
    const used = [...blocksCss.matchAll(/--tc-color-([a-z0-9-]+)/g)].map(
      (match) => match[1]
    );
    expect(used.length).toBeGreaterThan(0);
    for (const name of used) {
      expect(name).toMatch(/^(white|(gray|blue|red|green|amber)-\d+)$/);
    }
  });

  it("loads nothing and sets no styles from outside the file", () => {
    expect(blocksCss).not.toMatch(/url\(|@import/);
  });
});

describe("styles.css", () => {
  it("loads tokens, HeroUI, the Tzu Chi theme, then the blocks' classes", () => {
    const entry = readFileSync(join(packageRoot, "styles.css"), "utf8");
    expect(
      [...entry.matchAll(/@import\s+"([^"]+)"/g)].map((match) => match[1])
    ).toEqual([
      "@tzuchi/tokens/tokens.css",
      "@heroui/styles",
      "@heroui/styles/themes/tzuchi/index.css",
      "./src/blocks.css",
    ]);
    expect(entry).toContain('@source "./src";');
  });
});
