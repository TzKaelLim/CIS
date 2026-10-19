import { stableStringify } from "@tzuchi/tceditor/rules";
import { diffContracts, toDataContract } from "@tzuchi/tceditor-spec";
import type {
  AnyBlockSpec,
  ContractBreak,
  JsonSchema,
} from "@tzuchi/tceditor-spec";

/** File name of a data contract snapshot in generated/schemas. */
export const SNAPSHOT_FILE_PATTERN =
  /^([A-Z][A-Za-z0-9]{0,26})\.v([1-9][0-9]*)\.json$/;

export function snapshotFileName(spec: AnyBlockSpec): string {
  return `${spec.type}.v${spec.version}.json`;
}

export type ContractProblem =
  /** No snapshot for the spec's current version yet: gen:blocks writes it. */
  | { kind: "missing"; file: string }
  /** The contract differs from the snapshot of the same version. */
  | { kind: "changed-without-bump"; file: string }
  /** An older version's contract accepts data the current one rejects. */
  | { kind: "incompatible"; file: string; breaks: ContractBreak[] }
  /** A snapshot that belongs to no spec version. */
  | { kind: "orphan"; file: string; reason: string };

/**
 * Compares each spec's current data contract with the committed snapshots
 * (file name → parsed JSON). Snapshots are written once per block version and
 * never change: a contract change needs a version bump, and every older
 * version's contract must stay compatible with the current one (spec §4.6).
 */
export function checkContracts(
  specs: readonly AnyBlockSpec[],
  snapshots: Readonly<Record<string, unknown>>
): ContractProblem[] {
  const has = (file: string) =>
    Object.prototype.hasOwnProperty.call(snapshots, file);
  const specsByType: Record<string, AnyBlockSpec> = Object.create(null);
  const current: Record<string, JsonSchema> = Object.create(null);
  const problems: ContractProblem[] = [];

  for (const spec of specs) {
    specsByType[spec.type] = spec;
    current[spec.type] = toDataContract(spec);

    const file = snapshotFileName(spec);

    if (!has(file)) {
      problems.push({ kind: "missing", file });
    } else if (
      stableStringify(snapshots[file]) !== stableStringify(current[spec.type])
    ) {
      problems.push({ kind: "changed-without-bump", file });
    }
  }

  for (const file of Object.keys(snapshots).sort()) {
    const match = SNAPSHOT_FILE_PATTERN.exec(file);

    if (!match) {
      problems.push({
        kind: "orphan",
        file,
        reason: "the name is not <Type>.v<version>.json",
      });
      continue;
    }

    const [, type, versionText] = match;
    const version = Number(versionText);
    const spec = type in specsByType ? specsByType[type] : undefined;

    if (!spec) {
      problems.push({
        kind: "orphan",
        file,
        reason: `no block spec has type "${type}" (never remove a block type; set deprecated: true instead)`,
      });
    } else if (version > spec.version) {
      problems.push({
        kind: "orphan",
        file,
        reason: `the spec is at version ${spec.version}`,
      });
    } else if (version < spec.version) {
      const breaks = diffContracts(
        snapshots[file] as JsonSchema,
        current[type]
      );

      if (breaks.length > 0)
        problems.push({ kind: "incompatible", file, breaks });
    }
  }

  return problems;
}

/** One line per problem, for gen:blocks and test failures. */
export function describeContractProblem(problem: ContractProblem): string {
  switch (problem.kind) {
    case "missing":
      return `${problem.file}: no snapshot yet (pnpm gen:blocks writes it)`;
    case "changed-without-bump":
      return `${problem.file}: the data contract changed but the version did not. Bump the spec's version (compatible changes only, spec §4.6), then run pnpm gen:blocks. Never edit generated/schemas by hand.`;
    case "incompatible":
      return `${
        problem.file
      }: the current spec rejects data this version accepted: ${problem.breaks
        .map((item) => `${item.kind} at ${item.path} (${item.detail})`)
        .join("; ")}. Add a new block type and deprecate this one instead.`;
    case "orphan":
      return `${problem.file}: ${problem.reason}`;
  }
}
