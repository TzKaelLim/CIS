import custom from "eslint-config-custom";

const TS_FILES = ["**/*.ts", "**/*.tsx"];
const ZOD_PACKAGES = [
  "packages/spec",
  "packages/blocks",
  "apps/showcase",
  "apps/storybook",
];

// @heroui/react exports client components, so a file that imports it must be
// a client component too; a server component that imports it directly only
// builds with Turbopack (spec §6.6, §16).
const USE_CLIENT_FOR_HEROUI_REACT = {
  selector:
    "Program:not(:has(ExpressionStatement[directive='use client'])) ImportDeclaration[source.value=/^@heroui\\/react/]",
  message: "Files that import @heroui/react must start with 'use client'.",
};

// `import { z }` and `import z` (from "zod" or "zod/v4") make esbuild bundle
// every zod locale (about 93 KB gzip instead of 28 KB), which breaks the 60 KB
// edge validator limit. The global config stays untouched: messages go
// through safeParse's `error`.
const ZOD_SYNTAX = [
  {
    selector:
      "ImportDeclaration[source.value=/^zod(\\/v4)?$/] > ImportDefaultSpecifier",
    message: 'Import zod as a namespace: import * as z from "zod".',
  },
  {
    selector:
      "ImportDeclaration[source.value=/^zod(\\/v4)?$/][importKind='value'] > ImportSpecifier[importKind='value']",
    message: 'Import zod as a namespace: import * as z from "zod".',
  },
  {
    selector: "MemberExpression[object.name='z'][property.name='locales']",
    message: "Do not use z.locales: it bundles every zod locale.",
  },
  {
    selector:
      "CallExpression[callee.object.name='z'][callee.property.name='config']",
    message:
      "Do not change zod's global config; pass messages to safeParse instead.",
  },
];

const ZOD_IMPORT_PATTERNS = [
  {
    group: [
      "zod/locales",
      "zod/locales/*",
      "zod/v4/locales",
      "zod/v4/locales/*",
    ],
    message:
      "Do not import zod locales: the page validator writes its own messages.",
  },
  {
    group: ["zod/compile"],
    message: "zod/compile changes zod's global config.",
  },
];

// The rules a block spec.ts must follow (spec §4.3 rules 1-2 and 9, §3.3).
const SPEC_FILE_SYNTAX = [
  {
    // C.4's seven methods, plus the ones that silently change or swallow a
    // value (z.preprocess, .catch, the string case and normalize transforms).
    selector:
      "CallExpression[callee.property.name=/^(refine|superRefine|overwrite|transform|trim|check|pipe|preprocess|catch|toLowerCase|toUpperCase|normalize)$/]",
    message:
      "spec.ts must not use checks that JSON Schema cannot express; add a packages/spec helper and list the check in x-lost-checks.",
  },
  {
    // A call on the result of .meta(): .meta().default(), .meta().meta(), …
    selector:
      "MemberExpression > CallExpression.object[callee.type='MemberExpression'][callee.property.name='meta']",
    message:
      ".meta() must be the last call of a field and is called once (spec §4.3 rules 1-2).",
  },
];

const SPEC_FILE_IMPORTS = {
  paths: [
    { name: "react", message: "spec.ts must not import React." },
    { name: "react-dom", message: "spec.ts must not import React." },
    {
      name: "@tzuchi/tceditor",
      allowTypeImports: true,
      message: "Use @tzuchi/tceditor/rules in spec.ts.",
    },
  ],
  patterns: [
    { group: ["@heroui/*"], message: "spec.ts must not import uikit." },
    ...ZOD_IMPORT_PATTERNS,
  ],
};

// packages/spec is plain TypeScript (spec §3.1, §3.2): at run time it uses
// only zod and @tzuchi/tceditor/rules, and the core main entry only for
// types. Its tests, test helpers, fixtures and type tests are exempt.
const SPEC_PACKAGE_IMPORTS = {
  paths: [
    { name: "react", message: "packages/spec must not depend on React." },
    { name: "react-dom", message: "packages/spec must not depend on React." },
    {
      name: "@tzuchi/tceditor",
      allowTypeImports: true,
      message: "packages/spec may only use @tzuchi/tceditor/rules at run time.",
    },
  ],
  patterns: [
    {
      group: ["react/*", "react-dom/*"],
      message: "packages/spec must not depend on React.",
    },
    {
      group: ["@tzuchi/tceditor/*", "!@tzuchi/tceditor/rules"],
      message: "packages/spec may only use @tzuchi/tceditor/rules at run time.",
    },
    {
      group: [
        "@heroui/*",
        "@tzuchi/tokens",
        "@tzuchi/tokens/*",
        "@tzuchi/tceditor-blocks",
        "@tzuchi/tceditor-blocks/*",
      ],
      message: "packages/spec must not depend on uikit or the blocks.",
    },
    {
      group: ["ajv", "ajv/*"],
      message: "ajv is a devDependency of packages/spec: use it in tests only.",
    },
    ...ZOD_IMPORT_PATTERNS,
  ],
};

// Code that runs on the public pages must not pull in the editor.
const PUBLIC_IMPORTS = {
  paths: [
    {
      name: "@tzuchi/tceditor",
      allowTypeImports: true,
      message:
        "Public pages may only use @tzuchi/tceditor/rsc and @tzuchi/tceditor/rules.",
    },
    {
      name: "@tzuchi/tceditor-blocks/editor",
      message: "Public pages must not import the editor config.",
    },
    {
      name: "../editor-config",
      message: "Public pages must not import the editor config.",
    },
    {
      name: "./editor",
      message: "Views must not import the editor-only image picker.",
    },
  ],
  patterns: ZOD_IMPORT_PATTERNS,
};

const config = [
  {
    ignores: [
      "vendor/**",
      "**/storybook-static/**",
      "apps/storybook/.home/**",
      "apps/showcase/.data/**",
    ],
  },
  ...custom,
  {
    settings: {
      next: {
        rootDir: ["apps/*/"],
      },
    },
    rules: {
      "react-hooks/exhaustive-deps": "off",
      "no-restricted-syntax": ["error", USE_CLIENT_FOR_HEROUI_REACT],
    },
  },
  // In flat config a later block replaces a rule's options instead of merging
  // them, so every block below repeats the selectors that still apply.
  {
    files: ZOD_PACKAGES.flatMap((dir) =>
      TS_FILES.map((glob) => `${dir}/${glob}`)
    ),
    rules: {
      "no-restricted-imports": ["error", { patterns: ZOD_IMPORT_PATTERNS }],
      "no-restricted-syntax": [
        "error",
        USE_CLIENT_FOR_HEROUI_REACT,
        ...ZOD_SYNTAX,
      ],
    },
  },
  {
    files: ["packages/spec/src/**/*.ts", "packages/spec/src/**/*.tsx"],
    ignores: [
      "packages/spec/src/**/__tests__/**",
      "packages/spec/src/**/__helpers__/**",
      "packages/spec/src/**/__fixtures__/**",
      "packages/spec/src/**/__typetests__/**",
    ],
    rules: {
      "no-restricted-imports": ["error", SPEC_PACKAGE_IMPORTS],
    },
  },
  {
    files: ["packages/blocks/src/**/spec.ts"],
    rules: {
      "no-restricted-imports": ["error", SPEC_FILE_IMPORTS],
      "no-restricted-syntax": [
        "error",
        USE_CLIENT_FOR_HEROUI_REACT,
        ...ZOD_SYNTAX,
        ...SPEC_FILE_SYNTAX,
      ],
    },
  },
  {
    files: [
      "packages/blocks/src/**/view.tsx",
      "packages/blocks/src/render-config.tsx",
      "apps/showcase/app/(public)/**/*.ts",
      "apps/showcase/app/(public)/**/*.tsx",
    ],
    rules: {
      "no-restricted-imports": ["error", PUBLIC_IMPORTS],
    },
  },
];

export default config;
