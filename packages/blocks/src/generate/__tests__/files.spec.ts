import type { ContractProblem } from "../contracts";
import { planGeneration, sameSnapshot, type GeneratedFile } from "../files";
import { GENERATED_HEADER } from "../stories";

const story = (path: string, contents: string): GeneratedFile => ({
  path,
  contents,
  kind: "regenerate",
});
const snapshot = (path: string, contents: string): GeneratedFile => ({
  path,
  contents,
  kind: "snapshot",
});

/** A fake disk: path → contents; every other path is missing. */
const disk = (files: Record<string, string>) => {
  const contents = new Map(Object.entries(files));

  return (path: string): string | null => contents.get(path) ?? null;
};

const files = [
  story("generated/catalog.json", "catalog v2\n"),
  snapshot("generated/schemas/Button.v1.json", '{ "button": 1 }\n'),
  snapshot("generated/schemas/Card.v1.json", '{ "card": 1 }\n'),
  story("src/button/Button.stories.tsx", `${GENERATED_HEADER}\nbutton\n`),
];

describe("planGeneration (what pnpm gen:blocks writes and deletes)", () => {
  it.each<[string, ContractProblem]>([
    [
      "changed-without-bump",
      { kind: "changed-without-bump", file: "Button.v1.json" },
    ],
    [
      "incompatible",
      { kind: "incompatible", file: "Button.v1.json", breaks: [] },
    ],
    ["orphan", { kind: "orphan", file: "Gone.v1.json", reason: "no spec" }],
  ])("plans nothing on a %s problem", (_kind, problem) => {
    const missing: ContractProblem = { kind: "missing", file: "Card.v1.json" };

    expect(
      planGeneration({
        files,
        problems: [missing, problem],
        read: disk({}),
        storyFiles: ["src/old/Old.stories.tsx"],
      })
    ).toEqual({ ok: false, problems: [problem] });
  });

  it("writes missing and changed files and skips unchanged ones", () => {
    const plan = planGeneration({
      files,
      problems: [{ kind: "missing", file: "Card.v1.json" }],
      read: disk({
        "generated/catalog.json": "catalog v1\n",
        "generated/schemas/Button.v1.json": '{ "button": 1 }\n',
        "src/button/Button.stories.tsx": `${GENERATED_HEADER}\nbutton\n`,
      }),
      storyFiles: ["src/button/Button.stories.tsx"],
    });

    expect(plan).toEqual({
      ok: true,
      write: [files[0], files[2]],
      keep: [],
      remove: [],
      foreign: [],
    });
  });

  it("never rewrites a committed snapshot", () => {
    const plan = planGeneration({
      files,
      problems: [],
      read: disk({
        "generated/catalog.json": "catalog v2\n",
        // the same contract, formatted differently
        "generated/schemas/Button.v1.json": '{"button":1}',
        "generated/schemas/Card.v1.json": '{ "card": 1 }\n',
        "src/button/Button.stories.tsx": `${GENERATED_HEADER}\nbutton\n`,
      }),
      storyFiles: ["src/button/Button.stories.tsx"],
    });

    expect(plan).toEqual({
      ok: true,
      write: [],
      keep: ["generated/schemas/Button.v1.json"],
      remove: [],
      foreign: [],
    });
  });

  it("deletes only the stale stories that it generated", () => {
    const plan = planGeneration({
      files,
      problems: [],
      read: disk({
        "generated/catalog.json": "catalog v2\n",
        "generated/schemas/Button.v1.json": '{ "button": 1 }\n',
        "generated/schemas/Card.v1.json": '{ "card": 1 }\n',
        "src/button/Button.stories.tsx": `${GENERATED_HEADER}\nbutton\n`,
        "src/old/Old.stories.tsx": `${GENERATED_HEADER}\nold\n`,
        "src/mine/Mine.stories.tsx": "// written by hand\n",
      }),
      storyFiles: [
        "src/button/Button.stories.tsx",
        "src/mine/Mine.stories.tsx",
        "src/old/Old.stories.tsx",
      ],
    });

    expect(plan).toEqual({
      ok: true,
      write: [],
      keep: [],
      remove: ["src/old/Old.stories.tsx"],
      foreign: ["src/mine/Mine.stories.tsx"],
    });
  });
});

describe("sameSnapshot", () => {
  it("compares the JSON, not the formatting or the key order", () => {
    expect(
      sameSnapshot('{"a":1,"b":[1,2]}', '{\n  "b": [1, 2],\n  "a": 1\n}\n')
    ).toBe(true);
    expect(sameSnapshot('{"a":1}', '{"a":2}')).toBe(false);
    expect(sameSnapshot('{"b":[1,2]}', '{"b":[2,1]}')).toBe(false);
    expect(sameSnapshot('{"a":1}', "{")).toBe(false);
  });
});
