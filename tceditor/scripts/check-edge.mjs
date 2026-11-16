// Checks the single-file page validator that S3's Edge Function will run
// (spec §6.4). packages/blocks/scripts/build-edge.mjs writes it during
// `pnpm build`, so run this after the build:
//   1. the bundle imports no other module (node: modules included) and
//      never mentions React or Tiptap;
//   2. gzip -9 keeps it within 60 KB;
//   3. it returns exactly the same results as the source (loaded with tsx)
//      for the shared cases in packages/blocks/src/__fixtures__/
//      validator-cases.json (rich text that needs cleaning included) and for
//      generated raw inputs (size, JSON and block count limits), and the
//      expected error and notice codes for both.
//
// Usage: node scripts/check-edge.mjs
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { gzipSync } from "node:zlib";
import { NODE_IMPORT } from "../packages/core/scripts/check-bundle-imports.mjs";

export const GZIP_LIMIT = 61_440;

// Plain substrings. Not "node:": property names such as `node:` in `{node:e}`
// survive minification, so node: modules are matched as imports below
export const FORBIDDEN_NAMES = ["react", "@tiptap"];

// The metafile check is the authority on imports. These patterns catch a
// bundle that does not match its metafile, and an esbuild require() shim. The
// minified output has no comments, and a false alarm only fails loudly.
// "node: module" is check:bundle's own NODE_IMPORT pattern, so both checks
// treat node: alike; it needs a space after a bare import, and a minified
// `import"node:fs"` fails as a static import instead.
export const MODULE_SYNTAX = [
  ["static import", /(?:^|[^\w$.])import\s*(?:[\w$*{][^;]*?from\s*)?["'`]/],
  ["dynamic import", /(?:^|[^\w$.])import\s*\(/],
  ["export from", /(?:^|[^\w$.])export\s*(?:\*|\{[^}]*\})[^;]*?from\s*["'`]/],
  ["require", /(?:^|[^\w$.])require\s*\(/],
  ["node: module", NODE_IMPORT.pattern],
];

const excerpt = (source, index) =>
  JSON.stringify(source.slice(Math.max(0, index - 30), index + 50));

/** Each import that esbuild's metafile says an output still has. */
export function metafileImports(metafile) {
  return Object.entries(metafile.outputs).flatMap(([output, { imports }]) =>
    imports.map((item) => `${output} imports ${item.path} (${item.kind})`)
  );
}

/** Module syntax and forbidden names found in the bundle's source. */
export function findSourceProblems(source) {
  const problems = [];

  for (const [label, pattern] of MODULE_SYNTAX) {
    const match = pattern.exec(source);

    if (match) problems.push(`${label} at ${excerpt(source, match.index)}`);
  }

  for (const name of FORBIDDEN_NAMES) {
    const index = source.indexOf(name);

    if (index !== -1) problems.push(`"${name}" at ${excerpt(source, index)}`);
  }

  return problems;
}

export function gzipSize(bytes) {
  return gzipSync(bytes, { level: 9 }).length;
}

const byPath = (a, b) =>
  a.pathText === b.pathText
    ? a.code.localeCompare(b.code)
    : a.pathText.localeCompare(b.pathText);

const found = (issues) =>
  issues.map(({ code, pathText }) => ({ code, pathText })).sort(byPath);

/** The code and pathText of each notice or error, sorted (as in validator.spec.ts). */
export function summarize(result) {
  return result.ok
    ? { ok: true, notices: found(result.notices) }
    : { ok: false, errors: found(result.errors) };
}

/**
 * Runs each case through validatePage and validatePageJson; returns where the
 * codes differ from the case's expect. A valid case lists the notices it
 * expects (none when `notices` is left out), so a bundle whose rich text
 * cleaning is broken fails here too.
 */
export function compareCases(validator, cases) {
  const failures = [];

  for (const { name, input, expect: expected } of cases) {
    const wanted = expected.ok
      ? { ok: true, notices: found(expected.notices ?? []) }
      : { ok: false, errors: found(expected.errors) };
    const results = {
      validatePage: summarize(validator.validatePage(structuredClone(input))),
      validatePageJson: summarize(
        validator.validatePageJson(JSON.stringify(input))
      ),
    };

    for (const [fn, actual] of Object.entries(results)) {
      if (!isDeepStrictEqual(actual, wanted)) {
        failures.push({ name, fn, expected: wanted, actual });
      }
    }
  }

  return failures;
}

const utf8Length = (text) => new TextEncoder().encode(text).length;

/**
 * A Paragraph of links written with only their href, as close to maxBytes as
 * it gets: cleaning fills in each link's other attributes, which takes the
 * data over the limit.
 */
function growingPage(maxBytes) {
  const link =
    '{"type":"text","marks":[{"type":"link","attrs":{"href":"/register"}}],"text":"報名"},{"type":"text","text":"、"}';
  const shell = JSON.stringify({
    root: { props: {} },
    content: [
      {
        type: "Paragraph",
        props: {
          id: "Paragraph-1",
          body: { type: "doc", content: [{ type: "paragraph", content: [] }] },
        },
      },
    ],
  });
  const count = Math.floor(
    (maxBytes - utf8Length(shell)) / (utf8Length(link) + 1)
  );

  return shell.replace(
    '"content":[]',
    `"content":[${new Array(count).fill(link).join(",")}]`
  );
}

/**
 * Raw request bodies that validator-cases.json cannot hold (spec §6.2 #1, #2,
 * #7; Review Focus #2), built from the validator's limits. `code` is the one
 * error code expected, or null when the page is valid.
 */
export function rawInputs({ maxBytes, maxBlocks }) {
  const page = (content) => JSON.stringify({ root: { props: {} }, content });
  const heading = (id, text) => ({ type: "Heading", props: { id, text } });
  // 3 bytes per character in UTF-8: over maxBytes bytes, yet a third as
  // many characters
  const tooLarge = page([
    heading("Heading-1", "中".repeat(Math.ceil(maxBytes / 3))),
  ]);
  const small = page([heading("Heading-1", "淨灘")]);

  return [
    {
      name: `over ${maxBytes} bytes of Chinese text`,
      raw: tooLarge,
      code: "too_large",
    },
    {
      name: `over ${maxBytes} bytes of Chinese text as a Uint8Array`,
      raw: new TextEncoder().encode(tooLarge),
      code: "too_large",
    },
    {
      name: `exactly ${maxBytes} bytes`,
      raw: small + " ".repeat(maxBytes - utf8Length(small)),
      code: null,
    },
    {
      name: `within ${maxBytes} bytes, over them once cleaned`,
      raw: growingPage(maxBytes),
      code: "too_large",
    },
    { name: "invalid JSON", raw: "{", code: "invalid_json" },
    {
      name: "bytes that are not UTF-8",
      raw: new Uint8Array([0x7b, 0xff, 0x7d]),
      code: "invalid_json",
    },
    {
      name: `${maxBlocks + 1} blocks`,
      raw: page(
        Array.from({ length: maxBlocks + 1 }, (_, index) =>
          heading(`Heading-${index}`, "標題")
        )
      ),
      code: "too_many_blocks",
    },
  ];
}

/** The raw inputs whose result is not the expected code (or ok). */
export function checkRawCodes(validator, raws) {
  const problems = [];

  for (const { name, raw, code } of raws) {
    const result = validator.validatePageJson(raw);
    const codes = result.ok ? [] : result.errors.map((issue) => issue.code);

    if (!isDeepStrictEqual(codes, code === null ? [] : [code])) {
      problems.push(
        `raw input "${name}": expected ${code ?? "ok"}, got ${
          result.ok ? "ok" : codes.join(", ")
        }`
      );
    }
  }

  return problems;
}

/**
 * Runs every case and raw input through the source and the bundle, and
 * returns where the whole results differ: ok, data (filled-in defaults,
 * cleaned rich text), notices and the Chinese messages (spec §6.4).
 */
export function compareWithSource(source, bundle, cases, raws) {
  const failures = [];
  const check = (name, fn, run) => {
    const expected = run(source);
    const actual = run(bundle);

    if (!isDeepStrictEqual(actual, expected)) {
      failures.push({ name, fn, expected, actual });
    }
  };

  for (const { name, input } of cases) {
    check(name, "validatePage", (validator) =>
      validator.validatePage(structuredClone(input))
    );
    check(name, "validatePageJson", (validator) =>
      validator.validatePageJson(JSON.stringify(input))
    );
  }

  for (const { name, raw } of raws) {
    check(name, "validatePageJson", (validator) =>
      validator.validatePageJson(raw)
    );
  }

  return failures;
}

const short = (value) => JSON.stringify(value).slice(0, 300);

// Node runs the real path of a symlinked script, so compare real paths
const isMain =
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) ===
    realpathSync(fileURLToPath(import.meta.url));

if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const dist = join(root, "packages/blocks/dist");
  const bundlePath = join(dist, "validator.edge.mjs");
  const metaPath = join(dist, "validator.edge.meta.json");

  if (!existsSync(bundlePath) || !existsSync(metaPath)) {
    console.error(
      `check:edge: ${bundlePath} or its metafile not found. Run pnpm build first.`
    );
    process.exit(1);
  }

  const bytes = readFileSync(bundlePath);
  const source = bytes.toString("utf8");
  const metafile = JSON.parse(readFileSync(metaPath, "utf8"));
  const problems = [];

  // 1. no imports, no React, Tiptap or node: modules
  const output = metafile.outputs["dist/validator.edge.mjs"];

  if (!output || output.bytes !== bytes.length) {
    problems.push(
      "the metafile does not describe this bundle; run pnpm build again"
    );
  }

  problems.push(...metafileImports(metafile), ...findSourceProblems(source));

  // 2. size
  const gzipped = gzipSize(bytes);

  console.log(
    `check:edge: validator.edge.mjs is ${bytes.length} bytes, ${gzipped} bytes gzipped (limit ${GZIP_LIMIT})`
  );

  if (gzipped > GZIP_LIMIT) {
    problems.push(
      `gzipped size ${gzipped} exceeds ${GZIP_LIMIT} bytes; check the metafile for code that does not belong in the validator (views, the editor, zod locales)`
    );
  }

  // 3. same results as the source
  const cases = JSON.parse(
    readFileSync(
      join(root, "packages/blocks/src/__fixtures__/validator-cases.json"),
      "utf8"
    )
  );
  let bundle;
  let original;

  try {
    bundle = await import(pathToFileURL(bundlePath).href);
  } catch (error) {
    problems.push(`importing the bundle failed: ${error.message}`);
  }

  try {
    // tsx (a root devDependency) loads the TypeScript source with its
    // workspace imports, the way jest runs it in validator.spec.ts
    const { tsImport } = await import("tsx/esm/api");

    original = await tsImport(
      join(root, "packages/blocks/src/validator.ts"),
      import.meta.url
    );
  } catch (error) {
    problems.push(`loading the source with tsx failed: ${error.message}`);
  }

  const usable = (validator) =>
    typeof validator?.validatePage === "function" &&
    typeof validator?.validatePageJson === "function" &&
    typeof validator?.DEFAULT_LIMITS === "object";
  let raws = [];

  if (bundle && !usable(bundle)) {
    problems.push(
      "the bundle does not export validatePage, validatePageJson and DEFAULT_LIMITS"
    );
  } else if (bundle) {
    raws = rawInputs(bundle.DEFAULT_LIMITS);

    for (const failure of compareCases(bundle, cases)) {
      problems.push(
        `case "${failure.name}" (${failure.fn}): expected ${short(
          failure.expected
        )}, got ${short(failure.actual)}`
      );
    }

    problems.push(...checkRawCodes(bundle, raws));

    if (original && usable(original)) {
      for (const failure of compareWithSource(original, bundle, cases, raws)) {
        problems.push(
          `"${failure.name}" (${
            failure.fn
          }) differs from the source: source ${short(
            failure.expected
          )}, bundle ${short(failure.actual)}`
        );
      }
    } else if (original) {
      problems.push("src/validator.ts does not export the validator");
    }
  }

  if (problems.length > 0) {
    console.error("check:edge: the edge validator bundle failed:");
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  console.log(
    `check:edge: OK (no imports, ${cases.length} cases and ${raws.length} generated inputs match the source)`
  );
}
