import { join } from "node:path";
import * as z from "zod";
import { definePageRoot, style, toDataContract } from "@tzuchi/tceditor-spec";
import type { AnyBlockSpec, JsonSchema } from "@tzuchi/tceditor-spec";
import { buttonSpec } from "../../button/spec";
import { blockSpecs, pageRootSpec } from "../../specs";
import {
  checkContracts,
  describeContractProblem,
  snapshotFileName,
} from "../contracts";
import { readSnapshots } from "../disk";
import { contractSpecs } from "../files";

const snapshots = readSnapshots(join(__dirname, "../../../generated/schemas"));

/** buttonSpec whose variant no longer offers "outline": an incompatible change. */
const narrowedButton: AnyBlockSpec = {
  ...buttonSpec,
  props: z.strictObject({
    ...buttonSpec.props.shape,
    variant: style("button", "variant", ["primary", "secondary"])
      .default("primary")
      .meta({ title: "樣式" }),
  }),
};

describe("data contracts (spec §4.6)", () => {
  it("every block and the page root match their snapshots and stay compatible with their older versions", () => {
    expect(contractSpecs).toEqual([...blockSpecs, pageRootSpec]);

    const problems = checkContracts(contractSpecs, snapshots);

    expect(problems.map(describeContractProblem)).toEqual([]);
  });

  it("detects a contract change without a version bump", () => {
    const file = snapshotFileName(buttonSpec);

    expect(
      checkContracts([narrowedButton], { [file]: toDataContract(buttonSpec) })
    ).toEqual([{ kind: "changed-without-bump", file }]);
  });

  it("detects an incompatible change across versions", () => {
    const v1 = snapshotFileName(buttonSpec);
    const bumped: AnyBlockSpec = {
      ...narrowedButton,
      version: buttonSpec.version + 1,
    };
    const problems = checkContracts([bumped], {
      [v1]: toDataContract(buttonSpec),
      [snapshotFileName(bumped)]: toDataContract(bumped),
    });

    expect(problems).toEqual([
      {
        kind: "incompatible",
        file: v1,
        breaks: [expect.objectContaining({ kind: "enum-value-removed" })],
      },
    ]);
  });

  it("accepts a compatible change with a version bump", () => {
    const widened: AnyBlockSpec = {
      ...buttonSpec,
      version: buttonSpec.version + 1,
      props: z.strictObject({
        ...buttonSpec.props.shape,
        variant: style("button", "variant", [
          "primary",
          "secondary",
          "outline",
          "ghost",
        ])
          .default("primary")
          .meta({ title: "樣式" }),
      }),
    };

    expect(
      checkContracts([widened], {
        [snapshotFileName(buttonSpec)]: toDataContract(buttonSpec),
        [snapshotFileName(widened)]: toDataContract(widened),
      })
    ).toEqual([]);
  });

  it("reports missing snapshots and snapshots that belong to no spec version", () => {
    const contract: JsonSchema = toDataContract(buttonSpec);

    expect(
      checkContracts([buttonSpec], {
        "Gone.v1.json": contract,
        "Button.v9.json": contract,
        "button.json": contract,
      })
    ).toEqual([
      { kind: "missing", file: snapshotFileName(buttonSpec) },
      {
        kind: "orphan",
        file: "Button.v9.json",
        reason: `the spec is at version ${buttonSpec.version}`,
      },
      {
        kind: "orphan",
        file: "Gone.v1.json",
        reason:
          'no block spec has type "Gone" (never remove a block type; set deprecated: true instead)',
      },
      {
        kind: "orphan",
        file: "button.json",
        reason: "the name is not <Type>.v<version>.json",
      },
    ]);
  });
});

describe("the page root's data contract (spec §4.6)", () => {
  const ROOT_V1 = "Root.v1.json";

  /** pageRootSpec at `version` with other title limits. */
  const rootWithTitle = (version: number, title: z.ZodType) =>
    definePageRoot({
      version,
      props: z.strictObject({ ...pageRootSpec.props.shape, title }),
    });

  /** A page title of at most 40 characters instead of 80: an incompatible change. */
  const shortTitle = z
    .string()
    .min(1)
    .max(40)
    .default("未命名頁面")
    .meta({ title: "頁面標題" });

  it("is stored as Root.v<version>.json", () => {
    expect(snapshotFileName(pageRootSpec)).toBe(ROOT_V1);
    expect(pageRootSpec.version).toBe(1);
  });

  it("detects a change without a version bump", () => {
    expect(
      checkContracts([rootWithTitle(1, shortTitle)], {
        [ROOT_V1]: toDataContract(pageRootSpec),
      })
    ).toEqual([{ kind: "changed-without-bump", file: ROOT_V1 }]);
  });

  it("detects a tightened limit and a new field without a default across versions", () => {
    const tightened = rootWithTitle(2, shortTitle);
    const withSlug = definePageRoot({
      version: 2,
      props: z.strictObject({
        ...pageRootSpec.props.shape,
        slug: z.string().min(1).max(40).meta({ title: "網址代稱" }),
      }),
    });

    for (const [next, kind] of [
      [tightened, "limit-tightened"],
      [withSlug, "new-required"],
    ] as const) {
      expect(
        checkContracts([next], {
          [ROOT_V1]: toDataContract(pageRootSpec),
          "Root.v2.json": toDataContract(next),
        })
      ).toEqual([
        {
          kind: "incompatible",
          file: ROOT_V1,
          breaks: [expect.objectContaining({ kind })],
        },
      ]);
    }
  });

  it("accepts a compatible change with a version bump", () => {
    const widened = rootWithTitle(
      2,
      z
        .string()
        .min(1)
        .max(120)
        .default("未命名頁面")
        .meta({ title: "頁面標題" })
    );

    expect(
      checkContracts([widened], {
        [ROOT_V1]: toDataContract(pageRootSpec),
        "Root.v2.json": toDataContract(widened),
      })
    ).toEqual([]);
  });

  it("reports the root's snapshots when the page root is not checked", () => {
    expect(
      checkContracts(blockSpecs, {
        ...Object.fromEntries(
          blockSpecs.map((spec) => [
            snapshotFileName(spec),
            toDataContract(spec),
          ])
        ),
        [ROOT_V1]: toDataContract(pageRootSpec),
      })
    ).toEqual([
      {
        kind: "orphan",
        file: ROOT_V1,
        reason: "the page root's spec was not checked",
      },
    ]);
  });
});
