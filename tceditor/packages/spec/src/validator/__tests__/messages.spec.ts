import * as z from "zod";
import { testBlocks, testRoot } from "../../__fixtures__/test-specs";
import { defineBlockSpec } from "../../define";
import {
  box,
  chain,
  jsonOfBytes,
  kitchenSink,
  leaf,
  page,
  pair,
  validator,
} from "../__helpers__/pages";
import {
  createPageValidator,
  ISSUE_CODES,
  type Issue,
  type IssueCode,
  type ValidateResult,
} from "../index";

const firstError = (result: ValidateResult): Issue => {
  if (result.ok) throw new Error("Expected the page to fail");

  return result.errors[0];
};

const firstNotice = (result: ValidateResult): Issue => {
  if (!result.ok) throw new Error(JSON.stringify(result.errors, null, 2));

  return result.notices[0];
};

const sinkError = (props: Record<string, unknown>) =>
  firstError(validator.validatePage(page([kitchenSink("k", props)])));

const leaves = (count: number) =>
  Array.from({ length: count }, (_, i) => leaf(`l${i}`));

const byCode: [IssueCode, () => Issue, string | RegExp][] = [
  [
    "too_large",
    () => firstError(validator.validatePageJson(jsonOfBytes(2_097_153))),
    "頁面資料超過上限：最多 2 MB（2,097,152 位元組），以 UTF-8 計算。",
  ],
  [
    "invalid_json",
    () => firstError(validator.validatePageJson("{")),
    "頁面資料不是合法的 JSON。",
  ],
  [
    "invalid_shape",
    () =>
      firstError(validator.validatePage(page([{ ...leaf("a"), zones: {} }]))),
    "葉只能有 type 與 props，不能有『zones』。",
  ],
  [
    "legacy_zones",
    () =>
      firstError(
        validator.validatePage(page([], { zones: { "b:content": [] } }))
      ),
    "頁面含有舊格式的 zones（1 個 DropZone）。請把這些區塊改放在區塊的放置區欄位裡。",
  ],
  [
    "unknown_type",
    () =>
      firstError(
        validator.validatePage(page([{ type: "Button", props: { id: "a" } }]))
      ),
    "區塊類型『Button』不存在。可以用的類型：全欄位（KitchenSink）、盒子（Box）、葉（Leaf）、兩欄（Pair）。",
  ],
  [
    "invalid_id",
    () => firstError(validator.validatePage(page([leaf("root")]))),
    "葉的 id 不能是「root」。",
  ],
  [
    "duplicate_id",
    () =>
      firstError(
        validator.validatePage(page([leaf("a"), box("b", [leaf("a")])]))
      ),
    "葉的 id『a』和 content[0] 重複；同一頁的 id 不能重複。",
  ],
  [
    "too_deep",
    () => firstError(validator.validatePage(page([chain(33)]))),
    "葉位在第 33 層放置區，最多只能有 32 層。",
  ],
  [
    "too_many_blocks",
    () => firstError(validator.validatePage(page(leaves(5001)))),
    "頁面最多只能有 5,000 個區塊。",
  ],
  ["unknown_prop", () => sinkError({ foo: 1 }), "全欄位沒有『foo』這個欄位。"],
  [
    "invalid_value",
    () => sinkError({ title: "" }),
    "全欄位的『標題』不能空白。",
  ],
  [
    "unsafe_href",
    () => sinkError({ href: "javascript:alert(1)" }),
    "全欄位的『連結網址』只接受 http、https、mailto、tel 或站內路徑。",
  ],
  [
    "alt_required",
    () => sinkError({ picture: { assetId: "a", alt: "", decorative: false } }),
    /^全欄位的『圖片／[^』]+』不能空白；只有裝飾用圖片可以不填。$/,
  ],
  [
    "not_allowed_here",
    () => sinkError({ content: [box("b")] }),
    "全欄位的『內容』不能放盒子（Box）。可以放：葉（Leaf）。",
  ],
  [
    "richtext_cleaned",
    () =>
      firstNotice(
        validator.validatePage(
          page([
            kitchenSink("k", {
              body: {
                type: "doc",
                content: [
                  {
                    type: "heading",
                    attrs: { level: 1 },
                    content: [{ type: "text", text: "標" }],
                  },
                ],
              },
            }),
          ])
        )
      ),
    "全欄位的『內文』已依這個欄位允許的格式自動整理：不支援的格式與不安全的連結只保留文字，對齊方式會移除，缺少的屬性會補上預設值。",
  ],
];

describe("messages", () => {
  it("has a case for every issue code", () => {
    expect(byCode.map(([code]) => code)).toEqual([...ISSUE_CODES]);
  });

  it.each(byCode)("writes a Chinese message for %s", (code, run, expected) => {
    const issue = run();

    expect(issue.code).toBe(code);
    expect(issue.message).toMatch(expected);
    expect(issue.message).toMatch(/[一-鿿]/);
    expect(issue.message).not.toMatch(/Invalid|expected|received/);
  });

  it.each([
    [{ title: "a".repeat(41) }, "全欄位的『標題』最多 40 字。"],
    [{ note: "a".repeat(201) }, "全欄位的『備註』最多 200 字。"],
    [{ count: 11 }, "全欄位的『數量』不能大於 10。"],
    [{ count: 0 }, "全欄位的『數量』不能小於 1。"],
    [{ count: 1.5 }, "全欄位的『數量』必須是 1 到 10 的整數。"],
    [{ count: "3" }, "全欄位的『數量』必須是 1 到 10 的整數。"],
    [
      { tone: "loud" },
      "全欄位的『色調』只能是：沉穩（calm）、明亮（bright）、深色（dark）、暖色（warm）、冷色（cool）。",
    ],
    [{ size: "xl" }, "全欄位的『大小』只能是：小（sm）、中（md）、大（lg）。"],
    [{ enabled: "yes" }, "全欄位的『啟用』必須是 true 或 false。"],
    [{ href: "" }, "全欄位的『連結網址』不能空白。"],
    [
      { moreHref: "javascript:x" },
      "全欄位的『更多連結』只接受 http、https、mailto、tel 或站內路徑。",
    ],
    [{ items: [] }, "全欄位的『項目』至少要 1 項。"],
    [
      { items: [1, 2, 3, 4, 5, 6].map((n) => ({ label: String(n) })) },
      "全欄位的『項目』最多 5 項。",
    ],
    [{ items: [{ label: "" }] }, "全欄位的『項目／名稱』不能空白。"],
    [{ items: [{}] }, "全欄位的『項目／名稱』必須填寫。"],
    [{ group: { level: 5 } }, "全欄位的『群組／層級』不能大於 3。"],
    [{ group: { x: 1 } }, "全欄位的『群組』沒有『x』這個欄位。"],
    [
      { body: "文字" },
      '全欄位的『內文』必須是富文字文件（type 為 "doc" 的物件）。',
    ],
    [{ content: "x" }, "全欄位的『內容』必須是區塊陣列。"],
    [
      { picture: { assetId: "", alt: "圖", decorative: false } },
      "全欄位的『圖片』還沒有選擇圖片。",
    ],
    [
      { picture: { assetId: "bad id", alt: "圖", decorative: false } },
      "全欄位的『圖片』的圖片代號格式不正確。",
    ],
    [
      { picture: "demo-1" },
      "全欄位的『圖片』必須是圖片物件（含 assetId、alt、decorative）。",
    ],
  ])("explains %j", (props, message) => {
    expect(sinkError(props).message).toBe(message);
  });

  it("names nested slots, other blocks and the page root", () => {
    expect(
      firstError(
        validator.validatePage(page([pair("p", [[pair("q", [[], []])], []])]))
      ).message
    ).toBe(
      "兩欄的『欄／內容』不能放兩欄（Pair）。可以放：全欄位（KitchenSink）、盒子（Box）、葉（Leaf）。"
    );
    expect(
      firstError(validator.validatePage(page([pair("p", [[]])]))).message
    ).toBe("兩欄的『欄』至少要 2 項。");
    expect(
      firstError(
        validator.validatePage(
          page([{ type: "Leaf", props: { id: "l", text: 5 } }])
        )
      ).message
    ).toBe("葉的『文字』必須是文字。");
    expect(
      firstError(
        validator.validatePage({ root: { props: { title: "" } }, content: [] })
      ).message
    ).toBe("頁面的『頁面標題』不能空白。");
  });

  it("shortens long values from the page data", () => {
    const issue = firstError(
      validator.validatePage(
        page([{ type: "x".repeat(10_000), props: { id: "a" } }])
      )
    );

    expect(issue.message.length).toBeLessThan(200);
    expect(issue.message).toContain(`『${"x".repeat(64)}…』`);
  });

  it("does not suggest deprecated blocks", () => {
    const oldLeafSpec = defineBlockSpec({
      type: "OldLeaf",
      label: "舊葉",
      category: "測試",
      description: "已停用的測試區塊。",
      version: 1,
      deprecated: true,
      props: z.strictObject({
        text: z.string().max(20).default("").meta({ title: "文字" }),
      }),
      examples: [{ name: "預設", props: {} }],
    });
    const withOld = createPageValidator({
      blocks: [...testBlocks, oldLeafSpec],
      root: testRoot,
    });
    const result = withOld.validatePage(
      page([
        { type: "OldLeaf", props: { id: "o" } },
        { type: "Gone", props: { id: "g" } },
        pair("p", [[pair("q", [[], []])], []]),
      ])
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((issue) => issue.code)).toEqual([
      "unknown_type",
      "not_allowed_here",
    ]);
    expect(result.errors.map((issue) => issue.message).join("\n")).not.toMatch(
      /OldLeaf|舊葉/
    );
  });

  it("uses a per-call error map and leaves zod's global config alone", () => {
    // z.config() returns zod's live global config object; this test only
    // reads it, which the "do not change zod's global config" rule cannot tell
    // apart from a write.
    // eslint-disable-next-line no-restricted-syntax
    const config = z.config();
    const before = { ...config };

    validator.validatePage(page([kitchenSink("k", { title: "" })]));

    expect({ ...config }).toEqual(before);
    expect(config.customError).toBeUndefined();
    expect(z.string().safeParse(1).error?.issues[0].message).toBe(
      "Invalid input: expected string, received number"
    );
  });
});
