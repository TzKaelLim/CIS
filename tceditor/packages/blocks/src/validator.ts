import { createPageValidator } from "@tzuchi/tceditor-spec/validator";
import type { PageValidator } from "@tzuchi/tceditor-spec/validator";
import { blockSpecs, pageRootSpec } from "./specs";

const validator = createPageValidator({
  blocks: blockSpecs,
  root: pageRootSpec,
});

/** Validates a parsed page against the 8 blocks and the page root. */
export const validatePage: PageValidator["validatePage"] = (data) =>
  validator.validatePage(data);

/** Checks the UTF-8 size, parses the JSON, then runs validatePage. */
export const validatePageJson: PageValidator["validatePageJson"] = (raw) =>
  validator.validatePageJson(raw);

export const blockTypes: readonly string[] = validator.blockTypes;

export {
  DEFAULT_LIMITS,
  ISSUE_CODES,
  formatPathText,
} from "@tzuchi/tceditor-spec/validator";
export type {
  Issue,
  IssueCode,
  ValidateResult,
} from "@tzuchi/tceditor-spec/validator";
