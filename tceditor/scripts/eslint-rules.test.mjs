// Locks the S2 rules of eslint.config.mjs that keep zod, packages/spec and the
// block spec.ts files in line (spec §3, §4.3, §6.6): for each rule family, one
// snippet the rule rejects and one it accepts, linted with the ESLint Node API
// against the repo config at a path the rule applies to. The files don't need
// to exist.
import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const eslint = new ESLint({ cwd: ROOT });

const SPEC_FILE = "packages/blocks/src/example/spec.ts";
const SPEC_PACKAGE_FILE = "packages/spec/src/example.ts";

/** The errors (not warnings) ESLint reports for `code` in the file `file`. */
async function errorsOf(file, code) {
  const [result] = await eslint.lintText(code, {
    filePath: path.join(ROOT, file),
  });

  return result.messages.filter((message) => message.severity === 2);
}

async function assertRejects(file, code, ruleId, fragment) {
  const errors = await errorsOf(file, code);

  assert.ok(
    errors.some(
      (error) => error.ruleId === ruleId && error.message.includes(fragment)
    ),
    `expected ${ruleId} ("${fragment}") in ${file} for:\n${code}\ngot ${JSON.stringify(
      errors.map(({ ruleId: id, message }) => ({ id, message })),
      null,
      2
    )}`
  );
}

async function assertAccepts(file, code) {
  assert.deepEqual(
    (await errorsOf(file, code)).map(({ ruleId, message }) => ({
      ruleId,
      message,
    })),
    [],
    `expected no errors in ${file} for:\n${code}`
  );
}

const ZOD = 'import * as z from "zod";\n';

describe("zod rules (packages/spec, packages/blocks and the apps)", () => {
  it("accepts the namespace import", async () => {
    await assertAccepts(
      SPEC_PACKAGE_FILE,
      `${ZOD}export const text = z.string().max(20);\n`
    );
  });

  const rejected = [
    [
      "import { z }",
      'import { z } from "zod";\nexport const a = z;\n',
      "namespace",
    ],
    ["import z", 'import z from "zod/v4";\nexport const a = z;\n', "namespace"],
    ["z.locales", `${ZOD}export const a = z.locales;\n`, "z.locales"],
    ["z.core.locales", `${ZOD}export const a = z.core.locales;\n`, "z.locales"],
    ["z.config()", `${ZOD}z.config({});\n`, "global config"],
    ["z.core.config()", `${ZOD}z.core.config({});\n`, "global config"],
  ];

  for (const [name, code, fragment] of rejected) {
    it(`rejects ${name}`, async () => {
      await assertRejects(
        "apps/showcase/lib/example.ts",
        code,
        "no-restricted-syntax",
        fragment
      );
    });
  }

  it("rejects the zod locales and zod/compile", async () => {
    await assertRejects(
      SPEC_PACKAGE_FILE,
      'import "zod/v4/locales/en";\n',
      "no-restricted-imports",
      "zod locales"
    );
    await assertRejects(
      "packages/blocks/src/example/view.tsx",
      'import "zod/compile";\n',
      "no-restricted-imports",
      "zod/compile"
    );
  });
});

describe("packages/spec imports", () => {
  it("accepts zod, the rules entry and type imports from core", async () => {
    await assertAccepts(
      SPEC_PACKAGE_FILE,
      `${ZOD}import { isSafeHref } from "@tzuchi/tceditor/rules";\nimport type { Config } from "@tzuchi/tceditor";\nexport const ok = [z, isSafeHref] as const;\nexport type C = Config;\n`
    );
  });

  it("accepts ajv in tests", async () => {
    await assertAccepts(
      "packages/spec/src/__tests__/example.spec.ts",
      'import Ajv from "ajv";\nexport const ajv = new Ajv();\n'
    );
  });

  const rejected = [
    ['import { Render } from "@tzuchi/tceditor";\n', "rules at run time"],
    ['import { Render } from "@tzuchi/tceditor/rsc";\n', "rules at run time"],
    ['import { createElement } from "react";\n', "React"],
    ['import { blockSpecs } from "@tzuchi/tceditor-blocks";\n', "the blocks"],
    ['import Ajv from "ajv";\n', "tests only"],
  ];

  for (const [code, fragment] of rejected) {
    it(`rejects ${code.trim()}`, async () => {
      await assertRejects(
        SPEC_PACKAGE_FILE,
        code,
        "no-restricted-imports",
        fragment
      );
    });
  }
});

describe("block spec.ts files", () => {
  it("accepts a spec that follows the rules", async () => {
    await assertAccepts(
      SPEC_FILE,
      `${ZOD}import { textToRichText } from "@tzuchi/tceditor/rules";
import { defineBlockSpec, link } from "@tzuchi/tceditor-spec";

export const exampleSpec = defineBlockSpec({
  type: "Example",
  label: "範例",
  category: "內容",
  description: textToRichText("").type,
  version: 1,
  props: z.strictObject({
    label: z.string().min(1).max(40).default("文字").meta({ title: "文字" }),
    count: z.number().int().min(0).max(9).default(0).meta({ title: "數量" }),
    href: link().meta({ title: "連結網址" }),
    tags: z
      .array(z.strictObject({ label: z.string().max(20).meta({ title: "標籤" }) }))
      .max(5)
      .default(() => [{ label: "志工" }])
      .meta({ title: "標籤" }),
  }),
  examples: [{ name: "預設", props: { href: "/" } }],
});
`
    );
  });

  it("allows the spec.ts methods outside spec.ts", async () => {
    await assertAccepts(
      "packages/blocks/src/example/schema.ts",
      `${ZOD}export const text = z.string().refine((value) => value !== "");\n`
    );
  });

  const rejected = [
    [
      'z.string().refine((value) => value !== "")',
      "JSON Schema cannot express",
    ],
    ["z.string().with(() => undefined)", "JSON Schema cannot express"],
    ["z.string().slugify()", "JSON Schema cannot express"],
    ["z.string().apply((schema) => schema)", "JSON Schema cannot express"],
    ['z.string().prefault("")', ".prefault()"],
    ["z.number().gt(0)", ".int(), .min() and .max()"],
    ["z.number().positive()", ".int(), .min() and .max()"],
    ["z.number().nonnegative()", ".int(), .min() and .max()"],
    ["z.number().multipleOf(5)", ".int(), .min() and .max()"],
    ["z.number().step(5)", ".int(), .min() and .max()"],
    ["z.stringbool()", "z.stringbool() or z.codec()"],
    [
      "z.codec(z.string(), z.number(), { decode: Number, encode: String })",
      "z.stringbool() or z.codec()",
    ],
    [
      "z.array(z.strictObject({})).max(3).default([])",
      "defaults are functions",
    ],
    ["z.strictObject({}).default({})", "defaults are functions"],
    [
      'z.string().meta({ title: "文字" }).default("")',
      ".meta() must be the last",
    ],
  ];

  for (const [expression, fragment] of rejected) {
    it(`rejects ${expression}`, async () => {
      await assertRejects(
        SPEC_FILE,
        `${ZOD}export const field = ${expression};\n`,
        "no-restricted-syntax",
        fragment
      );
    });
  }

  it("applies to the page root's spec.ts", async () => {
    await assertRejects(
      "packages/blocks/src/root/spec.ts",
      `${ZOD}export const field = z.string().trim();\n`,
      "no-restricted-syntax",
      "JSON Schema cannot express"
    );
  });

  const rejectedImports = [
    ['import { createElement } from "react";\n', "React"],
    ['import { buttonVariants } from "@heroui/styles";\n', "uikit"],
    ['import { Render } from "@tzuchi/tceditor";\n', "@tzuchi/tceditor/rules"],
  ];

  for (const [code, fragment] of rejectedImports) {
    it(`rejects ${code.trim()}`, async () => {
      await assertRejects(SPEC_FILE, code, "no-restricted-imports", fragment);
    });
  }
});
