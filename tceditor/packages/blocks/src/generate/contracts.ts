import { stableStringify } from "@tzuchi/tceditor/rules";
import { diffContracts, toDataContract } from "@tzuchi/tceditor-spec";
import type {
  AnyBlockSpec,
  ContractBreak,
  JsonSchema,
  PageRootSpec,
} from "@tzuchi/tceditor-spec";

/** A spec with a versioned data contract: a block or the page root. */
export type ContractSpec = AnyBlockSpec | PageRootSpec;

/**
 * The page root's name in snapshot file names. defineBlockSpec rejects
 * "Root" as a block type, so it never names a block's snapshot.
 */
export const ROOT_CONTRACT_NAME = "Root";

/** File name of a data contract snapshot in generated/schemas. */
export const SNAPSHOT_FILE_PATTERN =
  /^([A-Z][A-Za-z0-9]{0,26})\.v([1-9][0-9]*)\.json$/;

/** The block's type, or "Root" for the page root. */
export function contractName(spec: ContractSpec): string {
  return spec.kind === "root" ? ROOT_CONTRACT_NAME : spec.type;
}

/** `<Type>.v<version>.json`, or `Root.v<version>.json` for the page root. */
export function snapshotFileName(spec: ContractSpec): string {
  return `${contractName(spec)}.v${spec.version}.json`;
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
 * Compares the current data contract of each spec (the blocks and the page
 * root) with the committed snapshots (file name → parsed JSON). Snapshots are
 * written once per version and never change: a contract change needs a
 * version bump, and every older version's contract must stay compatible with
 * the current one (spec §4.6).
 */
export function checkContracts(
  specs: readonly ContractSpec[],
  snapshots: Readonly<Record<string, unknown>>
): ContractProblem[] {
  const has = (file: string) =>
    Object.prototype.hasOwnProperty.call(snapshots, file);
  const specsByName: Record<string, ContractSpec> = Object.create(null);
  const current: Record<string, JsonSchema> = Object.create(null);
  const problems: ContractProblem[] = [];

  for (const spec of specs) {
    const name = contractName(spec);

    specsByName[name] = spec;
    current[name] = toDataContract(spec);

    const file = snapshotFileName(spec);

    if (!has(file)) {
      problems.push({ kind: "missing", file });
    } else if (
      stableStringify(snapshots[file]) !== stableStringify(current[name])
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

    const [, name, versionText] = match;
    const version = Number(versionText);
    const spec = name in specsByName ? specsByName[name] : undefined;

    if (!spec) {
      problems.push({
        kind: "orphan",
        file,
        reason:
          name === ROOT_CONTRACT_NAME
            ? "the page root's spec was not checked"
            : `no block spec has type "${name}" (never remove a block type; set deprecated: true instead)`,
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
        current[name]
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
        .join("; ")}. ${
        problem.file.startsWith(`${ROOT_CONTRACT_NAME}.`)
          ? "Make the change compatible: the page root cannot be replaced."
          : "Add a new block type and deprecate this one instead."
      }`;
    case "orphan":
      return `${problem.file}: ${problem.reason}`;
  }
}
