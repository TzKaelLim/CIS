import type { AnyBlockSpec, PageRootSpec } from "../define";
import { DEFAULT_LIMITS } from "../limits";
import { checkSpecRules } from "../spec-rules";
import type { IssueCode } from "./issues";
import { MESSAGES } from "./messages";
import { blockEntry, rootEntry, type BlockEntry } from "./registry";
import type { ValidateResult, ValidatorLimits } from "./types";
import { walkPage, type WalkContext } from "./walk";

export { DEFAULT_LIMITS, NODE_ID_PATTERN } from "../limits";
export type { Issue, IssueCode } from "./issues";
export { ISSUE_CODES, formatPathText } from "./issues";
export type { ValidateResult, ValidatorLimits } from "./types";

export type PageValidator = {
  /** Does not check the size (the data is already parsed): code that receives a raw request body must use validatePageJson */
  validatePage(data: unknown): ValidateResult;
  /**
   * Checks the size in UTF-8 bytes (strings through TextEncoder), then
   * JSON.parse, then validatePage. A leading byte order mark is ignored, in a
   * string as in bytes (RFC 8259 §8.1, like fetch's Response.json()). The
   * data it returns is within the size limit too (JSON.stringify of `data`),
   * so stored data passes again when it is sent back.
   */
  validatePageJson(raw: string | Uint8Array): ValidateResult;
  blockTypes: readonly string[];
};

const LIMIT_KEYS = ["maxBytes", "maxDepth", "maxBlocks", "maxIssues"] as const;

/** U+FEFF, the byte order mark */
const BOM = 0xfeff;

function resolveLimits(
  overrides: Partial<ValidatorLimits> = {}
): ValidatorLimits {
  const limits: ValidatorLimits = {
    maxBytes: overrides.maxBytes ?? DEFAULT_LIMITS.maxBytes,
    maxDepth: overrides.maxDepth ?? DEFAULT_LIMITS.maxDepth,
    maxBlocks: overrides.maxBlocks ?? DEFAULT_LIMITS.maxBlocks,
    maxIssues: overrides.maxIssues ?? DEFAULT_LIMITS.maxIssues,
  };

  for (const key of LIMIT_KEYS) {
    if (!Number.isSafeInteger(limits[key]) || limits[key] < 1) {
      throw new TypeError(
        `limits.${key} must be a positive integer, got ${String(limits[key])}`
      );
    }
  }

  return Object.freeze(limits);
}

// Cross-realm safe (jest, Node Buffer): instanceof would fail for a
// Uint8Array made in another realm.
const isBytes = (value: unknown): value is Uint8Array =>
  ArrayBuffer.isView(value) &&
  Object.prototype.toString.call(value) === "[object Uint8Array]";

const pageError = (code: IssueCode, message: string): ValidateResult => ({
  ok: false,
  errors: [{ path: [], pathText: "", code, message }],
});

/**
 * Builds the page validator of spec §6.2 for a set of block specs. Throws
 * when the specs break the authoring rules (checkSpecRules).
 */
export function createPageValidator(options: {
  blocks: readonly AnyBlockSpec[];
  root: PageRootSpec;
  limits?: Partial<ValidatorLimits>;
}): PageValidator {
  const violations = checkSpecRules({
    blocks: options.blocks,
    root: options.root,
  });

  if (violations.length > 0) {
    throw new Error(
      [
        "The block specs break the authoring rules:",
        ...violations.map(
          (violation) =>
            `- [${violation.rule}] ${violation.type} ${violation.path}: ${violation.message}`
        ),
      ].join("\n")
    );
  }

  const limits = resolveLimits(options.limits);
  const registry: Record<string, BlockEntry> = Object.create(null);

  for (const spec of options.blocks) {
    registry[spec.type] = blockEntry(spec);
  }

  const context: WalkContext = {
    registry,
    root: rootEntry(options.root),
    limits,
    known: options.blocks
      .filter((spec) => !spec.deprecated)
      .map((spec) => `${spec.label}（${spec.type}）`),
  };
  const encoder = new TextEncoder();
  // A UTF-16 code unit is never less than one UTF-8 byte, so a longer string
  // is too large without encoding it.
  const isTooLarge = (text: string) =>
    text.length > limits.maxBytes ||
    encoder.encode(text).byteLength > limits.maxBytes;
  const tooLarge = (filled = false) =>
    pageError(
      "too_large",
      MESSAGES.too_large({ maxBytes: limits.maxBytes, filled })
    );

  const validatePage = (data: unknown): ValidateResult =>
    walkPage(data, context);

  const validatePageJson = (raw: string | Uint8Array): ValidateResult => {
    let text: string;

    if (typeof raw === "string") {
      if (isTooLarge(raw)) return tooLarge();

      // TextDecoder drops a leading BOM from bytes; do the same for strings
      text = raw.charCodeAt(0) === BOM ? raw.slice(1) : raw;
    } else if (isBytes(raw)) {
      if (raw.byteLength > limits.maxBytes) return tooLarge();

      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(raw);
      } catch {
        return pageError(
          "invalid_json",
          MESSAGES.invalid_json({ reason: "encoding" })
        );
      }
    } else {
      return pageError(
        "invalid_json",
        MESSAGES.invalid_json({ reason: "input" })
      );
    }

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      return pageError(
        "invalid_json",
        MESSAGES.invalid_json({ reason: "syntax" })
      );
    }

    const result = validatePage(data);

    // Filled-in defaults and cleaned rich text can make the data larger than
    // the request: a link sent with only its href gets four more attributes.
    // Data over the limit could be stored but never sent again.
    if (result.ok && isTooLarge(JSON.stringify(result.data))) {
      return tooLarge(true);
    }

    return result;
  };

  return {
    validatePage,
    validatePageJson,
    blockTypes: Object.freeze(options.blocks.map((spec) => spec.type)),
  };
}
