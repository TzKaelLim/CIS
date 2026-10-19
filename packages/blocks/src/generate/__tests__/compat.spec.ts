import { join } from "node:path";
import * as z from "zod";
import { style, toDataContract } from "@tzuchi/tceditor-spec";
import type { AnyBlockSpec, JsonSchema } from "@tzuchi/tceditor-spec";
import { buttonSpec } from "../../button/spec";
import { blockSpecs } from "../../specs";
import {
  checkContracts,
  describeContractProblem,
  snapshotFileName,
} from "../contracts";
import { readSnapshots } from "../disk";

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
  it("every block matches its snapshot and stays compatible with its older versions", () => {
    const problems = checkContracts(blockSpecs, snapshots);

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
