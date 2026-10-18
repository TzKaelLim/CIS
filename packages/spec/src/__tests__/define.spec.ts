import * as z from "zod";
import { defineBlockSpec, definePageRoot } from "../define";

const props = z.strictObject({
  text: z.string().default("字").meta({ title: "文字" }),
});

const valid = {
  type: "Sample",
  label: "範例",
  category: "測試",
  description: "說明",
  version: 1,
  props,
  examples: [{ name: "預設", props: {} }],
} as const;

describe("defineBlockSpec", () => {
  it("returns a frozen spec with deprecated defaulting to false", () => {
    const spec = defineBlockSpec(valid);

    expect(spec).toEqual({
      kind: "block",
      type: "Sample",
      label: "範例",
      category: "測試",
      description: "說明",
      version: 1,
      deprecated: false,
      props,
      examples: [{ name: "預設", props: {} }],
    });
    expect(Object.isFrozen(spec)).toBe(true);
    expect(Object.isFrozen(spec.examples)).toBe(true);
    expect(defineBlockSpec({ ...valid, deprecated: true }).deprecated).toBe(
      true
    );
  });

  it("accepts type names of 1 to 27 characters", () => {
    expect(defineBlockSpec({ ...valid, type: "A" }).type).toBe("A");
    expect(
      defineBlockSpec({ ...valid, type: `A${"b".repeat(26)}` }).type
    ).toHaveLength(27);
  });

  it.each([
    ["a lowercase first letter", "button"],
    ["a dash", "My-Block"],
    ["28 characters", `A${"b".repeat(27)}`],
    ["an empty name", ""],
  ])("rejects a type name with %s", (_case, type) => {
    expect(() => defineBlockSpec({ ...valid, type })).toThrow(
      /defineBlockSpec: type .* must match/
    );
  });

  it("reserves Root for the page root", () => {
    expect(() => defineBlockSpec({ ...valid, type: "Root" })).toThrow(
      'type "Root" is reserved'
    );
  });

  it("rejects an empty label or category", () => {
    expect(() => defineBlockSpec({ ...valid, label: " " })).toThrow(
      "label must not be empty"
    );
    expect(() => defineBlockSpec({ ...valid, category: "" })).toThrow(
      "category must not be empty"
    );
  });

  it("limits the description to 4,096 characters", () => {
    expect(
      defineBlockSpec({ ...valid, description: "字".repeat(4096) }).description
    ).toHaveLength(4096);
    expect(() =>
      defineBlockSpec({ ...valid, description: "字".repeat(4097) })
    ).toThrow("description must be a string of at most 4096 characters");
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects version %p", (version) => {
    expect(() => defineBlockSpec({ ...valid, version })).toThrow(
      "version must be a positive integer"
    );
  });

  it("needs at least one example", () => {
    expect(() =>
      defineBlockSpec({
        ...valid,
        examples: [] as unknown as typeof valid.examples,
      })
    ).toThrow("at least one example is required");
  });

  it.each([
    ["z.object", z.object({ text: z.string().meta({ title: "文字" }) })],
    [
      "z.looseObject",
      z.looseObject({ text: z.string().meta({ title: "文字" }) }),
    ],
  ])("rejects props built with %s", (_case, loose) => {
    expect(() =>
      defineBlockSpec({
        ...valid,
        props: loose,
        examples: [{ name: "x", props: { text: "a" } }],
      })
    ).toThrow("props must be a z.strictObject");
  });

  it("throws TypeError", () => {
    expect(() => defineBlockSpec({ ...valid, type: "x" })).toThrow(TypeError);
  });
});

describe("definePageRoot", () => {
  it("defaults the label to 頁面", () => {
    const root = definePageRoot({ props });

    expect(root).toEqual({ kind: "root", label: "頁面", props });
    expect(Object.isFrozen(root)).toBe(true);
    expect(definePageRoot({ label: "活動頁", props }).label).toBe("活動頁");
  });

  it("rejects an empty label and non-strict props", () => {
    expect(() => definePageRoot({ label: "", props })).toThrow(TypeError);
    expect(() => definePageRoot({ props: z.object({}) })).toThrow(
      "props must be a z.strictObject"
    );
  });
});
