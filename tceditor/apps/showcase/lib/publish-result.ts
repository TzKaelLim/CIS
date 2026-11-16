import type { Config } from "@tzuchi/tceditor";
import type { Issue, IssueCode } from "@tzuchi/tceditor-blocks/validator";

/**
 * The outcome of the last publish, shown by the 發布檢查 panel. `page` is the
 * data that was sent: the issue paths point into it.
 */
export type PublishResult =
  | { status: "idle" }
  | { status: "publishing" }
  | { status: "published"; notices: Issue[]; page: unknown }
  | { status: "invalid"; errors: Issue[]; page: unknown }
  | { status: "failed"; message: string };

export type PublishResultStore = {
  getSnapshot(): PublishResult;
  subscribe(listener: () => void): () => void;
  set(result: PublishResult): void;
};

/** A minimal external store for useSyncExternalStore. */
export function createPublishResultStore(): PublishResultStore {
  let current: PublishResult = { status: "idle" };
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => current,
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    set(result) {
      current = result;
      listeners.forEach((listener) => listener());
    },
  };
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Sends the page to the publish API and turns the response into a
 * PublishResult. Never throws.
 */
export async function publishPage(
  page: unknown,
  options: { endpoint?: string; fetch?: typeof fetch } = {}
): Promise<PublishResult> {
  const { endpoint = "/api/activity", fetch: fetchImpl = fetch } = options;
  let response: Response;

  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(page),
    });
  } catch {
    return { status: "failed", message: "無法連線到伺服器，頁面沒有發布。" };
  }

  const body: unknown = await response.json().catch(() => null);

  if (
    response.status === 200 &&
    isRecord(body) &&
    Array.isArray(body.notices)
  ) {
    return { status: "published", notices: body.notices as Issue[], page };
  }

  if (response.status === 422 && isRecord(body) && Array.isArray(body.errors)) {
    return { status: "invalid", errors: body.errors as Issue[], page };
  }

  return {
    status: "failed",
    message:
      isRecord(body) && typeof body.message === "string"
        ? body.message
        : `發布失敗（HTTP ${response.status}）。`,
  };
}

const isBlock = (
  value: unknown
): value is { type: string; props: { id: string } } =>
  isRecord(value) &&
  typeof value.type === "string" &&
  isRecord(value.props) &&
  typeof value.props.id === "string";

/**
 * Finds the block an issue points at by following `path` through `page`.
 * Returns the id of the deepest block on the path, null for the page root
 * (`["root", ...]`), and undefined when the path reaches no block. Only own
 * properties are followed.
 */
export function findIssueBlockId(
  page: unknown,
  path: readonly (string | number)[]
): string | null | undefined {
  if (path[0] === "root") return null;
  if (path[0] !== "content") return undefined;

  let current: unknown = page;
  let found: string | undefined;

  for (const segment of path) {
    if (
      (!isRecord(current) && !Array.isArray(current)) ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      break;
    }

    current = (current as UnknownRecord)[segment];

    if (isBlock(current)) found = current.props.id;
  }

  return found;
}

/** What the 發布檢查 panel names for an issue: the block and the field. */
export type IssueLocation = { block: string; field?: string };

/** `object[key]` when it is an own property, else undefined. */
const own = (object: unknown, key: string | number): unknown =>
  isRecord(object) && Object.prototype.hasOwnProperty.call(object, key)
    ? object[key]
    : undefined;

const labelOf = (value: unknown): string | undefined => {
  const label = own(value, "label");

  return typeof label === "string" && label !== "" ? label : undefined;
};

/**
 * The field an issue is about: the key after the last `<index>, "props"`
 * (or `"root", "props"`) of its path, so a nested block's field wins.
 */
function fieldNameOf(path: readonly (string | number)[]): string | undefined {
  for (let i = path.length - 2; i >= 1; i -= 1) {
    const blockProps =
      path[i] === "props" &&
      (typeof path[i - 1] === "number" || (i === 1 && path[0] === "root"));

    if (blockProps) {
      const name = path[i + 1];

      return typeof name === "string" ? name : undefined;
    }
  }

  return undefined;
}

/**
 * Issues about a whole block. Their path ends at the block itself (or at its
 * `type`), so the last field on the path belongs to the block around it and
 * must not be named.
 */
const BLOCK_ISSUES: ReadonlySet<IssueCode> = new Set<IssueCode>([
  "unknown_type",
  "not_allowed_here",
  "too_deep",
  "too_many_blocks",
]);

/**
 * The block label and the field label of an issue, read from the editor
 * config (spec §10.3). An array item or object member is named by its
 * top-level field; a key the config does not know, or an issue about the
 * whole block, gets no field label. Only own properties are read, since
 * types and keys come from page data.
 */
export function describeIssue(config: Config, issue: Issue): IssueLocation {
  const name = BLOCK_ISSUES.has(issue.code)
    ? undefined
    : fieldNameOf(issue.path);
  let block: string;
  let fields: unknown;

  if (issue.path[0] === "root") {
    block = "頁面";
    fields = own(config.root, "fields");
  } else if (issue.blockType === undefined) {
    return { block: "頁面資料" };
  } else {
    const component = own(config.components, issue.blockType);

    block = labelOf(component) ?? issue.blockType;
    fields = own(component, "fields");
  }

  const field = name === undefined ? undefined : labelOf(own(fields, name));

  return field === undefined ? { block } : { block, field };
}
