import { isComponentAllowed } from "@tzuchi/tceditor/rules";
import { NODE_ID_PATTERN } from "../limits";
import type { BlockNode, PageData } from "../page-data";
import type { SlotLocation } from "../slots";
import { fieldAt } from "./describe";
import { formatPathText, IssueList } from "./issues";
import { MESSAGES, type IdProblem } from "./messages";
import { capLists, checkProps, richTextNotices } from "./props";
import { lookupEntry, type BlockEntry, type Entry } from "./registry";
import type { ValidateResult, ValidatorLimits } from "./types";
import {
  eachValueAt,
  hasOwn,
  isRecord,
  own,
  setAt,
  type Segment,
  type UnknownRecord,
} from "./values";

export type WalkContext = {
  /** Null-prototype table of the registered block types */
  registry: Readonly<Record<string, BlockEntry>>;
  root: Entry;
  limits: ValidatorLimits;
  /** "label（type）" of every registered block that is not deprecated, for messages */
  known: readonly string[];
};

/** One concrete slot array of a block, for example columns[1].content. */
type SlotInstance = {
  owner: Visit;
  slot: SlotLocation;
  /** Path inside the owner's props */
  path: Segment[];
  items: unknown[];
  children: Visit[];
};

type Visit = {
  path: Segment[];
  /** Undefined when the type is not registered */
  entry: BlockEntry | undefined;
  props: UnknownRecord;
  id: string;
  /** The slot the block is in; undefined at the top level */
  placement: SlotInstance | undefined;
  slots: SlotInstance[];
  parsed?: UnknownRecord;
  output?: BlockNode;
};

type Pending = {
  value: unknown;
  path: Segment[];
  depth: number;
  placement: SlotInstance | undefined;
  into: Visit[];
};

/**
 * The blocks of `content` or of one slot array that are still to be walked.
 * The walk takes them one at a time, so a long array costs nothing more than
 * the blocks that are walked before the walk stops.
 */
type Frame = {
  items: readonly unknown[];
  /** Index of the next item to walk */
  next: number;
  /** Path of the array from the page root */
  path: Segment[];
  depth: number;
  placement: SlotInstance | undefined;
  into: Visit[];
};

const READ_ONLY = "readOnly";

function checkId(
  props: UnknownRecord,
  path: Segment[],
  entry: BlockEntry | undefined,
  ids: Map<string, string>,
  errors: IssueList
): string {
  const idPath = [...path, "props", "id"];
  const label = entry?.label ?? "區塊";
  const report = (problem: IdProblem) =>
    errors.add(
      "invalid_id",
      idPath,
      MESSAGES.invalid_id({ label, problem }),
      entry?.blockType
    );

  if (!hasOwn(props, "id")) {
    report({ kind: "missing" });
    return "";
  }

  const id = props.id;

  if (typeof id !== "string") {
    report({ kind: "type" });
    return "";
  }

  if (!NODE_ID_PATTERN.test(id)) {
    report({ kind: "format", id });
    return "";
  }

  if (id === "root") {
    report({ kind: "root" });
    return "";
  }

  const first = ids.get(id);

  if (first !== undefined) {
    errors.add(
      "duplicate_id",
      idPath,
      MESSAGES.duplicate_id({ label, id, first }),
      entry?.blockType
    );
  } else {
    ids.set(id, formatPathText(path));
  }

  return id;
}

/** Spec §6.2 #4–#6 for one block. Returns undefined when it is not even an object with props. */
function checkNode(
  pending: Pending,
  context: WalkContext,
  ids: Map<string, string>,
  errors: IssueList
): Visit | undefined {
  const { value, path } = pending;

  if (!isRecord(value)) {
    errors.add("invalid_shape", path, MESSAGES.invalid_shape({ kind: "node" }));
    return undefined;
  }

  const type = own(value, "type");
  const entry =
    typeof type === "string" ? lookupEntry(context.registry, type) : undefined;
  const label = entry?.label ?? "區塊";

  for (const key of Object.keys(value)) {
    if (key !== "type" && key !== "props" && key !== READ_ONLY) {
      errors.add(
        "invalid_shape",
        [...path, key],
        MESSAGES.invalid_shape({ kind: "node-key", label, key }),
        entry?.blockType
      );
    }
  }

  if (typeof type !== "string") {
    errors.add(
      "invalid_shape",
      [...path, "type"],
      MESSAGES.invalid_shape({ kind: "node-type" })
    );
  } else if (entry === undefined) {
    errors.add(
      "unknown_type",
      [...path, "type"],
      MESSAGES.unknown_type({ type, known: context.known })
    );
  }

  const props = own(value, "props");

  if (!isRecord(props)) {
    errors.add(
      "invalid_shape",
      [...path, "props"],
      MESSAGES.invalid_shape({ kind: "node-props", label }),
      entry?.blockType
    );
    return undefined;
  }

  return {
    path,
    entry,
    props,
    id: checkId(props, path, entry, ids, errors),
    placement: pending.placement,
    slots: [],
  };
}

/**
 * Spec §6.2 #4–#7: walks every block with an explicit stack of frames (no
 * recursion), in document order. Blocks deeper than maxDepth are reported and
 * not entered; the walk stops at the first block over maxBlocks or when
 * maxIssues errors are collected.
 */
function walkBlocks(
  content: unknown[],
  context: WalkContext,
  errors: IssueList
): { visits: Visit[]; top: Visit[] } {
  const { maxDepth, maxBlocks } = context.limits;
  const visits: Visit[] = [];
  const top: Visit[] = [];
  const ids = new Map<string, string>();
  const stack: Frame[] = [
    {
      items: content,
      next: 0,
      path: ["content"],
      depth: 1,
      placement: undefined,
      into: top,
    },
  ];
  let count = 0;

  while (stack.length > 0 && !errors.full) {
    const frame = stack[stack.length - 1];

    if (frame.next >= frame.items.length) {
      stack.pop();
      continue;
    }

    const index = frame.next;

    frame.next += 1;

    const pending: Pending = {
      value: frame.items[index],
      path: [...frame.path, index],
      depth: frame.depth,
      placement: frame.placement,
      into: frame.into,
    };

    count += 1;

    if (count > maxBlocks) {
      errors.add(
        "too_many_blocks",
        pending.path,
        MESSAGES.too_many_blocks({ maxBlocks })
      );
      break;
    }

    if (pending.depth > maxDepth) {
      const type = isRecord(pending.value)
        ? own(pending.value, "type")
        : undefined;
      const entry =
        typeof type === "string"
          ? lookupEntry(context.registry, type)
          : undefined;

      errors.add(
        "too_deep",
        pending.path,
        MESSAGES.too_deep({
          label: entry?.label ?? "區塊",
          depth: pending.depth,
          maxDepth,
        }),
        entry?.blockType
      );
      continue;
    }

    const visit = checkNode(pending, context, ids, errors);

    if (visit === undefined) continue;

    visits.push(visit);
    pending.into.push(visit);

    if (visit.entry === undefined) continue;

    // Slots in the items of a list: zod checks the list only up to one item
    // past its maximum (capLists), and so does the walk
    const props = capLists(visit.entry, visit.props);

    for (const slot of visit.entry.slots) {
      eachValueAt(props, slot.path, (found, path) => {
        if (Array.isArray(found)) {
          visit.slots.push({
            owner: visit,
            slot,
            path,
            items: found,
            children: [],
          });
        }
      });
    }

    // Pushed in reverse so that the first slot is walked first
    for (let s = visit.slots.length - 1; s >= 0; s--) {
      const instance = visit.slots[s];

      stack.push({
        items: instance.items,
        next: 0,
        path: [...visit.path, "props", ...instance.path],
        depth: pending.depth + 1,
        placement: instance,
        into: instance.children,
      });
    }
  }

  return { visits, top };
}

/** Spec §6.2 #10 */
function checkPlacement(
  visit: Visit,
  entry: BlockEntry,
  context: WalkContext,
  errors: IssueList
): void {
  const instance = visit.placement;

  if (instance === undefined || instance.owner.entry === undefined) return;

  const { rule } = instance.slot;

  if (isComponentAllowed(entry.blockType, rule)) return;

  const owner = instance.owner.entry;
  const allowed = Object.keys(context.registry)
    .filter(
      (type) =>
        !context.registry[type].deprecated && isComponentAllowed(type, rule)
    )
    .map((type) => `${context.registry[type].label}（${type}）`);

  errors.add(
    "not_allowed_here",
    visit.path,
    MESSAGES.not_allowed_here({
      label: owner.label,
      field: fieldAt(owner.schema, instance.path).field,
      child: `${entry.label}（${entry.blockType}）`,
      allowed,
    }),
    entry.blockType
  );
}

const outputOf = (visit: Visit): BlockNode => {
  if (visit.output === undefined) {
    throw new Error(`No output for the block at ${formatPathText(visit.path)}`);
  }

  return visit.output;
};

/** Builds the cleaned page from the parsed props, children first. */
function assemble(
  visits: Visit[],
  top: Visit[],
  rootProps: UnknownRecord
): PageData {
  for (let i = visits.length - 1; i >= 0; i--) {
    const visit = visits[i];

    if (visit.entry === undefined || visit.parsed === undefined) {
      throw new Error(`Unchecked block at ${formatPathText(visit.path)}`);
    }

    const props: BlockNode["props"] = { id: visit.id, ...visit.parsed };

    for (const instance of visit.slots) {
      setAt(props, instance.path, instance.children.map(outputOf));
    }

    visit.output = { type: visit.entry.blockType, props };
  }

  return { root: { props: rootProps }, content: top.map(outputOf) };
}

/** Spec §6.2 #3: returns root.props when the root is an object with props. */
function checkRoot(
  data: UnknownRecord,
  errors: IssueList
): UnknownRecord | undefined {
  if (!hasOwn(data, "root") || !isRecord(data.root)) {
    errors.add(
      "invalid_shape",
      ["root"],
      MESSAGES.invalid_shape({ kind: "root" })
    );
    return undefined;
  }

  const root = data.root;

  for (const key of Object.keys(root)) {
    if (key !== "props" && key !== READ_ONLY) {
      errors.add(
        "invalid_shape",
        ["root", key],
        MESSAGES.invalid_shape({ kind: "root-key", key })
      );
    }
  }

  const props = own(root, "props");

  if (!isRecord(props)) {
    errors.add(
      "invalid_shape",
      ["root", "props"],
      MESSAGES.invalid_shape({ kind: "root-props" })
    );
    return undefined;
  }

  return props;
}

/** validatePage: spec §6.2 #3–#12 on data that is already parsed. */
export function walkPage(data: unknown, context: WalkContext): ValidateResult {
  const errors = new IssueList(context.limits.maxIssues);
  const notices = new IssueList(context.limits.maxIssues);

  if (!isRecord(data)) {
    errors.add("invalid_shape", [], MESSAGES.invalid_shape({ kind: "page" }));
    return { ok: false, errors: errors.items };
  }

  for (const key of Object.keys(data)) {
    if (key !== "root" && key !== "content" && key !== "zones") {
      errors.add(
        "invalid_shape",
        [key],
        MESSAGES.invalid_shape({ kind: "page-key", key })
      );
    }
  }

  const rootProps = checkRoot(data, errors);

  if (hasOwn(data, "zones")) {
    const zones = data.zones;

    if (!isRecord(zones)) {
      errors.add(
        "invalid_shape",
        ["zones"],
        MESSAGES.invalid_shape({ kind: "zones" })
      );
    } else if (Object.keys(zones).length > 0) {
      errors.add(
        "legacy_zones",
        ["zones"],
        MESSAGES.legacy_zones({ count: Object.keys(zones).length })
      );
    }
  }

  const content = own(data, "content");
  let walked: { visits: Visit[]; top: Visit[] } = { visits: [], top: [] };

  if (Array.isArray(content)) {
    walked = walkBlocks(content, context, errors);
  } else {
    errors.add(
      "invalid_shape",
      ["content"],
      MESSAGES.invalid_shape({ kind: "content" })
    );
  }

  for (const visit of walked.visits) {
    if (errors.full) break;

    const { entry } = visit;

    if (entry === undefined) continue;

    const base = [...visit.path, "props"];
    const parsed = checkProps(entry, visit.props, base, errors, true);

    if (parsed !== undefined) {
      visit.parsed = parsed;
      richTextNotices(entry, visit.props, parsed, base, notices);
    }

    checkPlacement(visit, entry, context, errors);
  }

  let rootParsed: UnknownRecord | undefined;

  if (rootProps !== undefined && !errors.full) {
    const base = ["root", "props"];

    rootParsed = checkProps(context.root, rootProps, base, errors, false);

    if (rootParsed !== undefined) {
      richTextNotices(context.root, rootProps, rootParsed, base, notices);
    }
  }

  if (errors.items.length > 0 || rootParsed === undefined) {
    return { ok: false, errors: errors.items };
  }

  return {
    ok: true,
    data: assemble(walked.visits, walked.top, rootParsed),
    notices: notices.items,
  };
}
