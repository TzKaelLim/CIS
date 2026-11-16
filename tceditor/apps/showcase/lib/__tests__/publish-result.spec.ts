import type { Config } from "@tzuchi/tceditor";
import type { Issue, IssueCode } from "@tzuchi/tceditor-blocks/validator";
import {
  createPublishResultStore,
  describeIssue,
  findIssueBlockId,
  publishPage,
} from "../publish-result";

const data = {
  root: { props: { title: "頁面" } },
  content: [
    { type: "Heading", props: { id: "Heading-1", text: "標題" } },
    {
      type: "Columns",
      props: {
        id: "Columns-1",
        columns: [
          { content: [] },
          {
            content: [
              {
                type: "Card",
                props: {
                  id: "Card-1",
                  content: [
                    { type: "Button", props: { id: "Button-1", href: "" } },
                  ],
                },
              },
            ],
          },
        ],
      },
    },
  ],
  zones: {},
};

describe("findIssueBlockId", () => {
  it("finds a top-level block", () => {
    expect(findIssueBlockId(data, ["content", 0, "props", "text"])).toBe(
      "Heading-1"
    );
  });

  it("finds the deepest block on the path", () => {
    expect(
      findIssueBlockId(data, [
        "content",
        1,
        "props",
        "columns",
        1,
        "content",
        0,
        "props",
        "content",
        0,
        "props",
        "href",
      ])
    ).toBe("Button-1");
  });

  it("stops at the last block that still exists", () => {
    expect(
      findIssueBlockId(data, ["content", 1, "props", "columns", 5, "content"])
    ).toBe("Columns-1");
  });

  it("returns null for the page root", () => {
    expect(findIssueBlockId(data, ["root", "props", "title"])).toBeNull();
  });

  it("returns undefined when no block is on the path", () => {
    expect(findIssueBlockId(data, [])).toBeUndefined();
    expect(findIssueBlockId(data, ["zones"])).toBeUndefined();
    expect(findIssueBlockId(data, ["content", 9, "props"])).toBeUndefined();
  });

  it("ignores inherited keys", () => {
    expect(
      findIssueBlockId(data, ["content", "__proto__", "constructor"])
    ).toBeUndefined();
    expect(
      findIssueBlockId(data, ["content", 0, "constructor", "prototype"])
    ).toBe("Heading-1");
  });
});

describe("describeIssue", () => {
  const config = {
    root: { fields: { title: { type: "text", label: "頁面標題" } } },
    components: {
      Button: {
        label: "按鈕",
        fields: { href: { type: "text", label: "連結網址" } },
        render: () => null,
      },
      TagList: {
        label: "標籤列",
        fields: {
          tags: {
            type: "array",
            label: "標籤",
            arrayFields: { label: { type: "text", label: "文字" } },
          },
        },
        render: () => null,
      },
      Section: {
        label: "區段",
        fields: { content: { type: "slot", label: "內容" } },
        render: () => null,
      },
    },
  } as unknown as Config;

  const issue = (
    path: (string | number)[],
    blockType?: string,
    code: IssueCode = "invalid_value"
  ): Issue => ({
    path,
    pathText: "",
    ...(blockType === undefined ? {} : { blockType }),
    code,
    message: "",
  });

  it("names the block and the field", () => {
    expect(
      describeIssue(config, issue(["content", 1, "props", "href"], "Button"))
    ).toEqual({ block: "按鈕", field: "連結網址" });
  });

  it("names the deepest block's field on a nested path", () => {
    expect(
      describeIssue(
        config,
        issue(
          [
            "content",
            1,
            "props",
            "columns",
            1,
            "content",
            0,
            "props",
            "content",
            0,
            "props",
            "href",
          ],
          "Button"
        )
      )
    ).toEqual({ block: "按鈕", field: "連結網址" });
  });

  it("names an array item by its array field", () => {
    expect(
      describeIssue(
        config,
        issue(["content", 0, "props", "tags", 2, "label"], "TagList")
      )
    ).toEqual({ block: "標籤列", field: "標籤" });
  });

  it("names the page root's fields", () => {
    expect(describeIssue(config, issue(["root", "props", "title"]))).toEqual({
      block: "頁面",
      field: "頁面標題",
    });
  });

  it("leaves out a field the config does not have", () => {
    expect(
      describeIssue(config, issue(["content", 0, "props", "colour"], "Button"))
    ).toEqual({ block: "按鈕" });
    expect(
      describeIssue(config, issue(["content", 0, "props", "id"], "Button"))
    ).toEqual({ block: "按鈕" });
  });

  it("falls back to the type for blocks and keys the config lacks", () => {
    expect(
      describeIssue(config, issue(["content", 0, "props", "text"], "Quote"))
    ).toEqual({ block: "Quote" });
    expect(
      describeIssue(
        config,
        issue(["content", 0, "props", "constructor"], "constructor")
      )
    ).toEqual({ block: "constructor" });
    expect(
      describeIssue(
        config,
        issue(["content", 0, "props", "toString"], "Button")
      )
    ).toEqual({ block: "按鈕" });
    expect(describeIssue(config, issue(["content", 0]))).toEqual({
      block: "頁面資料",
    });
  });

  it("names only the block for an issue about the whole block", () => {
    // A Section dropped into a Card's 內容: the path ends at the Section, and
    // the Section's own 內容 field is not at fault.
    const path = ["content", 0, "props", "content", 1];

    expect(
      describeIssue(config, issue(path, "Section", "not_allowed_here"))
    ).toEqual({ block: "區段" });
    expect(describeIssue(config, issue(path, "Section", "too_deep"))).toEqual({
      block: "區段",
    });
    expect(
      describeIssue(config, issue([...path, "props", "content"], "Section"))
    ).toEqual({ block: "區段", field: "內容" });
  });
});

describe("publishPage", () => {
  const respond = (status: number, body: unknown) =>
    jest.fn(async () => Response.json(body, { status }));

  it("posts the page as JSON", async () => {
    const fetchImpl = respond(200, { notices: [] });

    await publishPage(data, { fetch: fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  });

  it("maps 200 to published with the notices", async () => {
    const notice = {
      path: [],
      pathText: "",
      code: "richtext_cleaned",
      message: "已清理",
    };

    expect(
      await publishPage(data, { fetch: respond(200, { notices: [notice] }) })
    ).toEqual({ status: "published", notices: [notice], page: data });
  });

  it("maps 422 to invalid with the errors", async () => {
    const error = {
      path: ["content", 0, "props", "href"],
      pathText: "content[0].props.href",
      blockType: "Button",
      code: "unsafe_href",
      message: "按鈕的『連結網址』只接受 http、https、mailto、tel 或站內路徑。",
    };

    expect(
      await publishPage(data, { fetch: respond(422, { errors: [error] }) })
    ).toEqual({ status: "invalid", errors: [error], page: data });
  });

  it("maps other responses to failed with the server's message", async () => {
    expect(
      await publishPage(data, {
        fetch: respond(413, { error: "too_large", message: "太大了" }),
      })
    ).toEqual({ status: "failed", message: "太大了" });
    expect(
      await publishPage(data, {
        fetch: jest.fn(async () => new Response("oops", { status: 502 })),
      })
    ).toEqual({ status: "failed", message: "發布失敗（HTTP 502）。" });
  });

  it("maps a network error to failed", async () => {
    const fetchImpl = jest.fn(async () => {
      throw new TypeError("fetch failed");
    });

    expect(await publishPage(data, { fetch: fetchImpl })).toEqual({
      status: "failed",
      message: "無法連線到伺服器，頁面沒有發布。",
    });
  });
});

describe("createPublishResultStore", () => {
  it("notifies subscribers and returns the latest result", () => {
    const store = createPublishResultStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    expect(store.getSnapshot()).toEqual({ status: "idle" });

    store.set({ status: "publishing" });
    unsubscribe();
    store.set({ status: "failed", message: "x" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual({ status: "failed", message: "x" });
  });
});
