import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { rename } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validatePageJson } from "@tzuchi/tceditor-blocks/validator";
import { createActivityHandlers, MAX_BODY_BYTES } from "../activity-api";

// Lets a test make the rename step of the atomic write fail.
jest.mock("node:fs/promises", () => {
  const actual =
    jest.requireActual<typeof import("node:fs/promises")>("node:fs/promises");

  return { ...actual, rename: jest.fn(actual.rename) };
});

const PRESET_PATH = join(__dirname, "../../content/activity.preset.json");
const ORIGIN = "http://127.0.0.1:3010";
const ENDPOINT = `${ORIGIN}/api/activity`;

let dataDir: string;

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), "showcase-api-"));
});

afterEach(() => {
  jest.restoreAllMocks();
  rmSync(dataDir, { recursive: true, force: true });
});

const handlers = () =>
  createActivityHandlers({
    dataDir,
    presetPath: PRESET_PATH,
    validatePageJson,
  });

const publishedFile = () => join(dataDir, "activity.json");

function post(
  body: BodyInit,
  headers: Record<string, string> = {},
  init: { duplex?: "half" } = {}
) {
  return new Request(ENDPOINT, {
    method: "POST",
    body,
    headers: {
      host: "127.0.0.1:3010",
      origin: ORIGIN,
      "content-type": "application/json",
      ...headers,
    },
    ...init,
  } as RequestInit);
}

/** A valid page: a heading and a button. */
const page = (href = "/register", text = "淨灘報名") => ({
  root: { props: { title: "測試頁" } },
  content: [
    { type: "Heading", props: { id: "Heading-1", text } },
    { type: "Button", props: { id: "Button-1", label: "報名", href } },
  ],
  zones: {},
});

describe("GET /api/activity", () => {
  it("returns the preset while nothing is published", async () => {
    const response = await handlers().GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(
      JSON.parse(readFileSync(PRESET_PATH, "utf8"))
    );
  });

  it("returns the published page after a publish", async () => {
    const api = handlers();

    expect((await api.POST(post(JSON.stringify(page())))).status).toBe(200);

    const data = await (await api.GET()).json();

    expect(data.root.props.title).toBe("測試頁");
    expect(data.content[1].props.href).toBe("/register");
  });
});

describe("POST /api/activity", () => {
  it("validates, fills defaults and writes the page", async () => {
    const response = await handlers().POST(post(JSON.stringify(page())));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ notices: [] });

    const written = JSON.parse(readFileSync(publishedFile(), "utf8"));

    expect(Object.keys(written).sort()).toEqual(["content", "root"]);
    expect(written.root.props).toEqual({ title: "測試頁", description: "" });
    expect(written.content[1].props).toEqual({
      id: "Button-1",
      label: "報名",
      href: "/register",
      variant: "primary",
      size: "md",
      fullWidth: false,
    });
  });

  it("returns notices for richtext it had to clean", async () => {
    const data = {
      root: { props: {} },
      content: [
        {
          type: "Paragraph",
          props: {
            id: "Paragraph-1",
            body: {
              type: "doc",
              content: [
                {
                  type: "heading",
                  attrs: { level: 2, textAlign: null },
                  content: [{ type: "text", text: "段落裡的標題" }],
                },
              ],
            },
          },
        },
      ],
    };

    const response = await handlers().POST(post(JSON.stringify(data)));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.notices).toEqual([
      expect.objectContaining({
        code: "richtext_cleaned",
        path: ["content", 0, "props", "body"],
      }),
    ]);

    const written = JSON.parse(readFileSync(publishedFile(), "utf8"));

    expect(written.content[0].props.body.content[0].type).toBe("paragraph");
  });

  it("returns 422 with the issues for a javascript: link and writes nothing", async () => {
    const response = await handlers().POST(
      post(JSON.stringify(page("javascript:alert(1)")))
    );

    expect(response.status).toBe(422);
    expect((await response.json()).errors).toEqual([
      expect.objectContaining({
        code: "unsafe_href",
        path: ["content", 1, "props", "href"],
        pathText: "content[1].props.href",
        blockType: "Button",
      }),
    ]);
    expect(() => readFileSync(publishedFile())).toThrow();
  });

  it("returns 413 for a body over 2 MB of Chinese text", async () => {
    // 700,000 Chinese characters are 2,100,000 UTF-8 bytes, although the
    // string is shorter than 2,097,152 characters.
    const body = JSON.stringify(page("/register", "淨".repeat(700_000)));

    expect(body.length).toBeLessThan(MAX_BODY_BYTES);
    expect(Buffer.byteLength(body)).toBeGreaterThan(MAX_BODY_BYTES);

    const response = await handlers().POST(post(body));

    expect(response.status).toBe(413);
    expect((await response.json()).error).toBe("too_large");
    expect(() => readFileSync(publishedFile())).toThrow();
  });

  it("stops reading a body as soon as it passes 2 MB", async () => {
    const chunk = new Uint8Array(64 * 1024).fill(0x20);
    let pulled = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(chunk);
      },
    });

    const response = await handlers().POST(
      post(endless, {}, { duplex: "half" })
    );

    expect(response.status).toBe(413);
    // 2 MB is 32 chunks of 64 KB; the stream may have queued one more.
    expect(pulled).toBeLessThanOrEqual(34);
  });

  it("rejects a declared Content-Length over 2 MB before reading", async () => {
    const response = await handlers().POST(
      post(JSON.stringify(page()), {
        "content-length": String(MAX_BODY_BYTES + 1),
      })
    );

    expect(response.status).toBe(413);
  });

  it("accepts a body of exactly 2,097,152 bytes", async () => {
    const json = JSON.stringify(page());
    const body = json + " ".repeat(MAX_BODY_BYTES - Buffer.byteLength(json));

    expect(Buffer.byteLength(body)).toBe(MAX_BODY_BYTES);
    expect((await handlers().POST(post(body))).status).toBe(200);
  });

  it("accepts application/json with a charset", async () => {
    const response = await handlers().POST(
      post(JSON.stringify(page()), {
        "content-type": "application/json; charset=utf-8",
      })
    );

    expect(response.status).toBe(200);
  });

  it.each(["text/plain", "application/x-www-form-urlencoded", ""])(
    "returns 415 for Content-Type %j",
    async (contentType) => {
      const response = await handlers().POST(
        post(JSON.stringify(page()), { "content-type": contentType })
      );

      expect(response.status).toBe(415);
      expect((await response.json()).error).toBe("unsupported_media_type");
      expect(() => readFileSync(publishedFile())).toThrow();
    }
  );

  it.each([
    ["Origin is missing", { origin: undefined }],
    ["Origin is another site", { origin: "http://evil.example" }],
    ["Origin is another port", { origin: "http://127.0.0.1:3000" }],
    ["Origin uses https", { origin: "https://127.0.0.1:3010" }],
    [
      "Host is another site's name (DNS rebinding)",
      { origin: "http://evil.example:3010", host: "evil.example:3010" },
    ],
  ])("returns 403 when %s", async (_label, headers) => {
    const request = post(JSON.stringify(page()));

    for (const [name, value] of Object.entries(headers)) {
      if (value === undefined) request.headers.delete(name);
      else request.headers.set(name, value);
    }

    const response = await handlers().POST(request);

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("forbidden_origin");
    expect(() => readFileSync(publishedFile())).toThrow();
  });

  // The checks run in the order 403 → 415 → 413 → 422: each request below
  // breaks every check from its own on, so only the first check may answer.
  // A refused origin or Content-Type must not read any of the body.
  describe("check order", () => {
    const FOREIGN = { origin: "http://evil.example" };
    const TEXT = { "content-type": "text/plain" };

    /** A body that is not JSON and never ends; counts the chunks read. */
    function endlessBody() {
      const read = { chunks: 0 };
      const chunk = new TextEncoder().encode("x".repeat(64 * 1024));
      const stream = new ReadableStream<Uint8Array>(
        {
          pull(controller) {
            read.chunks += 1;
            controller.enqueue(chunk);
          },
        },
        // Nothing is pulled until someone reads
        { highWaterMark: 0 }
      );

      return { read, stream };
    }

    it.each<[string, number, string, Record<string, string>]>([
      ["a foreign origin", 403, "forbidden_origin", { ...FOREIGN, ...TEXT }],
      ["a wrong Content-Type", 415, "unsupported_media_type", TEXT],
    ])(
      "answers %s with %i before reading the body",
      async (_label, status, error, headers) => {
        const { read, stream } = endlessBody();
        const response = await handlers().POST(
          post(stream, headers, { duplex: "half" })
        );

        expect(response.status).toBe(status);
        expect((await response.json()).error).toBe(error);
        expect(read.chunks).toBe(0);
        expect(() => readFileSync(publishedFile())).toThrow();
      }
    );

    it("answers a body over 2 MB with 413 before validating it", async () => {
      const { read, stream } = endlessBody();
      const response = await handlers().POST(
        post(stream, {}, { duplex: "half" })
      );

      expect(response.status).toBe(413);
      expect((await response.json()).error).toBe("too_large");
      expect(read.chunks).toBeGreaterThan(0);
      expect(() => readFileSync(publishedFile())).toThrow();
    });

    it("answers a body within 2 MB that is not JSON with 422", async () => {
      const response = await handlers().POST(post("x".repeat(64 * 1024)));

      expect(response.status).toBe(422);
      expect((await response.json()).errors).toEqual([
        expect.objectContaining({ code: "invalid_json" }),
      ]);
      expect(() => readFileSync(publishedFile())).toThrow();
    });
  });

  it.each(["localhost:3010", "127.0.0.1:3019"])(
    "accepts a same-origin publish to %s",
    async (host) => {
      const response = await handlers().POST(
        post(JSON.stringify(page()), { host, origin: `http://${host}` })
      );

      expect(response.status).toBe(200);
    }
  );

  it("keeps the previous page when the write fails", async () => {
    const api = handlers();

    expect((await api.POST(post(JSON.stringify(page("/first"))))).status).toBe(
      200
    );

    const before = readFileSync(publishedFile(), "utf8");

    jest
      .mocked(rename)
      .mockRejectedValueOnce(Object.assign(new Error("EIO"), { code: "EIO" }));
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await api.POST(post(JSON.stringify(page("/second"))));

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe("write_failed");
    expect(readFileSync(publishedFile(), "utf8")).toBe(before);
    expect(JSON.parse(before).content[1].props.href).toBe("/first");
    // The temporary file was removed.
    expect(readdirSync(dataDir)).toEqual(["activity.json"]);
  });

  it("creates the data directory on the first publish", async () => {
    rmSync(dataDir, { recursive: true, force: true });

    const response = await handlers().POST(post(JSON.stringify(page())));

    expect(response.status).toBe(200);
    expect(JSON.parse(readFileSync(publishedFile(), "utf8")).root).toEqual({
      props: { title: "測試頁", description: "" },
    });
  });
});

describe("app/api/activity/route.ts", () => {
  const savedDataDir = process.env.SHOWCASE_DATA_DIR;

  afterEach(() => {
    if (savedDataDir === undefined) delete process.env.SHOWCASE_DATA_DIR;
    else process.env.SHOWCASE_DATA_DIR = savedDataDir;
  });

  it("publishes into SHOWCASE_DATA_DIR and serves the page from there", async () => {
    process.env.SHOWCASE_DATA_DIR = dataDir;

    type RouteModule = typeof import("../../app/api/activity/route");
    let route: RouteModule | undefined;

    // route.ts reads SHOWCASE_DATA_DIR when it is loaded.
    jest.isolateModules(() => {
      route = jest.requireActual<RouteModule>("../../app/api/activity/route");
    });

    if (!route) throw new Error("route.ts did not load");

    expect((await route.POST(post(JSON.stringify(page())))).status).toBe(200);
    expect(readdirSync(dataDir)).toEqual(["activity.json"]);
    expect((await (await route.GET()).json()).root.props.title).toBe("測試頁");
  });
});
