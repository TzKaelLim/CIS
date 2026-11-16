import type { IssueCode } from "./issues";

/** The block (or page root) label and the field titles joined with "／". */
export type Place = { label: string; field: string };

export type ShapeProblem =
  | { kind: "page" }
  | { kind: "page-key"; key: string }
  | { kind: "root" }
  | { kind: "root-key"; key: string }
  | { kind: "root-props" }
  | { kind: "content" }
  | { kind: "zones" }
  | { kind: "node" }
  | { kind: "node-key"; label: string; key: string }
  | { kind: "node-type" }
  | { kind: "node-props"; label: string };

export type ValueKind =
  | "text"
  | "number"
  | "integer"
  | "boolean"
  | "list"
  | "object"
  | "richtext"
  | "slot"
  | "image";

export type ValueProblem =
  | { kind: "required" }
  | { kind: "type"; expected: ValueKind; range?: readonly [number, number] }
  | { kind: "too-short"; minimum: number; unit: "字" | "項" }
  | { kind: "too-long"; maximum: number; unit: "字" | "項" }
  | { kind: "too-small"; minimum: number; inclusive: boolean }
  | { kind: "too-big"; maximum: number; inclusive: boolean }
  | { kind: "choice"; options: readonly string[] }
  | { kind: "no-image" }
  | { kind: "image-id" }
  | { kind: "format" }
  | { kind: "other" };

export type IdProblem =
  | { kind: "missing" }
  | { kind: "type" }
  | { kind: "format"; id: string }
  | { kind: "root" };

export type MessageParams = {
  /** `filled`: the request fit, the data with its defaults and cleaned rich text did not */
  too_large: { maxBytes: number; filled?: boolean };
  invalid_json: { reason: "syntax" | "encoding" | "input" };
  invalid_shape: ShapeProblem;
  legacy_zones: { count: number };
  unknown_type: { type: string; known: readonly string[] };
  invalid_id: { label: string; problem: IdProblem };
  duplicate_id: { label: string; id: string; first: string };
  too_deep: { label: string; depth: number; maxDepth: number };
  too_many_blocks: { maxBlocks: number };
  unknown_prop: Place & { key: string };
  invalid_value: Place & { problem: ValueProblem };
  unsafe_href: Place;
  alt_required: Place;
  not_allowed_here: Place & { child: string; allowed: readonly string[] };
  richtext_cleaned: Place;
};

const SHOWN_LENGTH = 64;

/** Shortens a value from the page data so that it cannot blow up a message. */
function quote(text: string): string {
  if (text.length <= SHOWN_LENGTH) return text;

  const code = text.charCodeAt(SHOWN_LENGTH - 1);
  // Do not cut a surrogate pair in half
  const end =
    code >= 0xd800 && code <= 0xdbff ? SHOWN_LENGTH - 1 : SHOWN_LENGTH;

  return `${text.slice(0, end)}…`;
}

/** 2097152 → "2,097,152" */
const groupDigits = (value: number): string =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const MEBIBYTE = 1024 * 1024;

const formatBytes = (bytes: number): string =>
  bytes % MEBIBYTE === 0
    ? `${bytes / MEBIBYTE} MB（${groupDigits(bytes)} 位元組）`
    : `${groupDigits(bytes)} 位元組`;

const at = ({ label, field }: Place): string =>
  field === "" ? label : `${label}的『${field}』`;

const typePhrase = (
  expected: ValueKind,
  range: readonly [number, number] | undefined
): string => {
  switch (expected) {
    case "text":
      return "必須是文字。";
    case "number":
      return range
        ? `必須是 ${range[0]} 到 ${range[1]} 的數字。`
        : "必須是數字。";
    case "integer":
      return range
        ? `必須是 ${range[0]} 到 ${range[1]} 的整數。`
        : "必須是整數。";
    case "boolean":
      return "必須是 true 或 false。";
    case "list":
      return "必須是清單（陣列）。";
    case "object":
      return "必須是物件。";
    case "richtext":
      return '必須是富文字文件（type 為 "doc" 的物件）。';
    case "slot":
      return "必須是區塊陣列。";
    case "image":
      return "必須是圖片物件（含 assetId、alt、decorative）。";
  }
};

const valuePhrase = (problem: ValueProblem): string => {
  switch (problem.kind) {
    case "required":
      return "必須填寫。";
    case "type":
      return typePhrase(problem.expected, problem.range);
    case "too-short":
      return problem.unit === "字" && problem.minimum <= 1
        ? "不能空白。"
        : `至少要 ${problem.minimum} ${problem.unit}。`;
    case "too-long":
      return `最多 ${problem.maximum} ${problem.unit}。`;
    case "too-small":
      return problem.inclusive
        ? `不能小於 ${problem.minimum}。`
        : `必須大於 ${problem.minimum}。`;
    case "too-big":
      return problem.inclusive
        ? `不能大於 ${problem.maximum}。`
        : `必須小於 ${problem.maximum}。`;
    case "choice":
      return `只能是：${problem.options.join("、")}。`;
    case "no-image":
      return "還沒有選擇圖片。";
    case "image-id":
      return "的圖片代號格式不正確。";
    case "format":
      return "格式不正確。";
    case "other":
      return "不正確。";
  }
};

const shapeMessage = (problem: ShapeProblem): string => {
  switch (problem.kind) {
    case "page":
      return "頁面資料必須是物件，包含 root 與 content。";
    case "page-key":
      return `頁面資料只能有 root、content、zones，不能有『${quote(
        problem.key
      )}』。`;
    case "root":
      return "root 必須是物件，而且只有 props。";
    case "root-key":
      return `root 只能有 props，不能有『${quote(problem.key)}』。`;
    case "root-props":
      return "root.props 必須是物件。";
    case "content":
      return "content 必須是區塊陣列。";
    case "zones":
      return "zones 只能省略，或是空物件。";
    case "node":
      return "每個區塊都必須是物件，包含 type 與 props。";
    case "node-key":
      return `${problem.label}只能有 type 與 props，不能有『${quote(
        problem.key
      )}』。`;
    case "node-type":
      return "區塊缺少 type，或 type 不是文字。";
    case "node-props":
      return `${problem.label}的 props 必須是物件。`;
  }
};

const idMessage = (label: string, problem: IdProblem): string => {
  switch (problem.kind) {
    case "missing":
      return `${label}缺少 id。`;
    case "type":
      return `${label}的 id 必須是文字。`;
    case "format":
      return `${label}的 id『${quote(
        problem.id
      )}』不合規則：只能用英文字母、數字、底線與連字號，長度 1 到 64 字。`;
    case "root":
      return `${label}的 id 不能是「root」。`;
  }
};

// The notice covers every change normalize and the field's types make: content
// the field does not allow becomes text, alignment is removed, and missing
// attributes (a link's target and rel, a heading's level) get their defaults.
const RICHTEXT_CLEANED =
  "已依這個欄位允許的格式自動整理：不支援的格式與不安全的連結只保留文字，對齊方式會移除，缺少的屬性會補上預設值。";

/** One message builder per issue code. */
export const MESSAGES: {
  readonly [Code in IssueCode]: (params: MessageParams[Code]) => string;
} = {
  too_large: ({ maxBytes, filled }) =>
    filled
      ? `頁面資料補上預設值、整理富文字之後超過上限：最多 ${formatBytes(
          maxBytes
        )}，以 UTF-8 計算。請減少一些內容。`
      : `頁面資料超過上限：最多 ${formatBytes(maxBytes)}，以 UTF-8 計算。`,
  invalid_json: ({ reason }) =>
    reason === "encoding"
      ? "頁面資料不是合法的 UTF-8 文字。"
      : reason === "input"
      ? "頁面資料必須是 JSON 字串或 UTF-8 位元組。"
      : "頁面資料不是合法的 JSON。",
  invalid_shape: shapeMessage,
  legacy_zones: ({ count }) =>
    `頁面含有舊格式的 zones（${count} 個 DropZone）。請把這些區塊改放在區塊的放置區欄位裡。`,
  unknown_type: ({ type, known }) =>
    `區塊類型『${quote(type)}』不存在。可以用的類型：${known.join("、")}。`,
  invalid_id: ({ label, problem }) => idMessage(label, problem),
  duplicate_id: ({ label, id, first }) =>
    `${label}的 id『${quote(id)}』和 ${first} 重複；同一頁的 id 不能重複。`,
  too_deep: ({ label, depth, maxDepth }) =>
    `${label}位在第 ${depth} 層放置區，最多只能有 ${maxDepth} 層。`,
  too_many_blocks: ({ maxBlocks }) =>
    `頁面最多只能有 ${groupDigits(maxBlocks)} 個區塊。`,
  unknown_prop: (params) =>
    `${at(params)}沒有『${quote(params.key)}』這個欄位。`,
  invalid_value: (params) => `${at(params)}${valuePhrase(params.problem)}`,
  unsafe_href: (params) =>
    `${at(params)}只接受 http、https、mailto、tel 或站內路徑。`,
  alt_required: (params) => `${at(params)}不能空白；只有裝飾用圖片可以不填。`,
  not_allowed_here: (params) =>
    params.allowed.length === 0
      ? `${at(params)}不能放${params.child}，這裡不能放任何區塊。`
      : `${at(params)}不能放${params.child}。可以放：${params.allowed.join(
          "、"
        )}。`,
  richtext_cleaned: (params) => `${at(params)}${RICHTEXT_CLEANED}`,
};
