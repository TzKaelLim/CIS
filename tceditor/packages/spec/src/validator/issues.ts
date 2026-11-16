/**
 * The codes the page validator reports, in the order of the checks in spec
 * §6.2. richtext_cleaned only appears in notices.
 */
export const ISSUE_CODES = [
  "too_large",
  "invalid_json",
  "invalid_shape",
  "legacy_zones",
  "unknown_type",
  "invalid_id",
  "duplicate_id",
  "too_deep",
  "too_many_blocks",
  "unknown_prop",
  "invalid_value",
  "unsafe_href",
  "alt_required",
  "not_allowed_here",
  "richtext_cleaned",
] as const;

export type IssueCode = (typeof ISSUE_CODES)[number];

export type Issue = {
  /** From the page root, for example ["content", 0, "props", "href"] */
  path: (string | number)[];
  /** The same path as text, for example "content[0].props.href" */
  pathText: string;
  /** The registered type of the block the issue is in */
  blockType?: string;
  code: IssueCode;
  /** In Chinese; names the block and the field */
  message: string;
};

const SIMPLE_KEY = /^[A-Za-z_$][\w$-]*$/;

/**
 * ["content", 0, "props", "href"] → "content[0].props.href". Keys that are
 * not simple names are written as quoted brackets, for example ["a b"].
 */
export function formatPathText(path: readonly (string | number)[]): string {
  let text = "";

  for (const segment of path) {
    if (typeof segment === "number") {
      text += `[${segment}]`;
    } else if (SIMPLE_KEY.test(segment)) {
      text += text === "" ? segment : `.${segment}`;
    } else {
      text += `[${JSON.stringify(segment)}]`;
    }
  }

  return text;
}

/** Collects issues until `limit` is reached; later issues are dropped. */
export class IssueList {
  readonly items: Issue[] = [];
  private readonly limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  get full(): boolean {
    return this.items.length >= this.limit;
  }

  add(
    code: IssueCode,
    path: (string | number)[],
    message: string,
    blockType?: string
  ): void {
    if (this.full) return;

    const pathText = formatPathText(path);

    this.items.push(
      blockType === undefined
        ? { path, pathText, code, message }
        : { path, pathText, blockType, code, message }
    );
  }
}
