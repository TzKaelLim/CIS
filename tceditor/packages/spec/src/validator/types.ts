import type { PageData } from "../page-data";
import type { Issue } from "./issues";

export type { ValidatorLimits } from "../limits";

export type ValidateResult =
  | { ok: true; data: PageData; notices: Issue[] }
  | { ok: false; errors: Issue[] };
