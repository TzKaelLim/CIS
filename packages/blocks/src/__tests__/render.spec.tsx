/** @jest-environment node */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Render as ClientRender, type Data } from "@tzuchi/tceditor";
import { Render } from "@tzuchi/tceditor/rsc";
import {
  fitRichTextToTypes,
  richTextFeaturesToTypes,
  textToRichText,
} from "@tzuchi/tceditor/rules";
import {
  choice,
  defineBlockSpec,
  diffContracts,
  eachField,
  exampleToPageData,
  fieldKindOf,
  image,
  isJsonSchemaNode,
  richText,
  slot,
  slotLocations,
  toDataContract,
  toDefaultProps,
  toJsonSchema,
} from "@tzuchi/tceditor-spec";
import type { BlockNode, JsonSchema, PageData } from "@tzuchi/tceditor-spec";
import { createPageValidator } from "@tzuchi/tceditor-spec/validator";
import { forwardRef, lazy, memo, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as z from "zod";
import { demoAssetSource } from "../demo-assets";
import { createEditorConfig } from "../editor-config";
import type { headingSpec } from "../heading/spec";
import { HeadingView } from "../heading/view";
import type { ResolvedImage } from "../image/view";
import {
  buildRenderConfig,
  createRenderConfig,
  type ViewProps,
} from "../render-config";
import { blockSpecs, pageRootSpec } from "../specs";
import { validatePage } from "../validator";
import { views } from "../views";

const renderConfig = createRenderConfig({ assets: demoAssetSource });

/** Server-renders a page the way the public page does (RSC Render). */
function html(data: PageData, config = renderConfig): string {
  const page: Data = { root: data.root, content: data.content, zones: {} };
  return renderToStaticMarkup(<Render config={config} data={page} />);
}

/** Runs the page through the validator, as publishing does, and returns the stored data. */
function validated(data: unknown): PageData {
  const result = validatePage(data);
  if (!result.ok) throw new Error(JSON.stringify(result.errors, null, 2));
  return result.data;
}

function onePage(...content: BlockNode[]): unknown {
  return { root: { props: {} }, content };
}

/** React's escaping of text and attribute values. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const str = (value: unknown): string =>
  typeof value === "string" ? value : "";
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const children = (value: unknown): BlockNode[] => list(value) as BlockNode[];

/** Every text node and every link href in a richtext document. */
function richTextParts(node: unknown): { texts: string[]; hrefs: string[] } {
  const texts: string[] = [];
  const hrefs: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value !== "object" || value === null) return;
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") texts.push(record.text);
    for (const mark of list(record.marks)) {
      const attrs = (mark as { attrs?: { href?: unknown } }).attrs;
      if (typeof attrs?.href === "string") hrefs.push(attrs.href);
    }
    list(record.content).forEach(visit);
  };
  visit(node);
  return { texts, hrefs };
}

const text = (value: unknown) =>
  str(value) === "" ? [] : [escapeHtml(str(value))];
const href = (value: unknown) =>
  str(value) === "" ? [] : [`href="${escapeHtml(str(value))}"`];
const field = (record: unknown, name: string): unknown =>
  typeof record === "object" && record !== null
    ? (record as Record<string, unknown>)[name]
    : undefined;

/**
 * The pieces of HTML a field's stored value must produce, read from the
 * field's kind in the spec: texts and links show up, slots bring their
 * children's pieces, lists and groups their fields'. Choices, numbers and
 * booleans only pick classes, so they add nothing.
 */
function fragmentsOf(node: JsonSchema, value: unknown): string[] {
  switch (fieldKindOf(node)) {
    case "text":
    case "textarea":
      return text(value);
    case "link":
      return href(value);
    case "richtext": {
      const { texts, hrefs } = richTextParts(value);
      return [...texts.flatMap(text), ...hrefs.flatMap(href)];
    }
    case "slot":
      return children(value).flatMap(expectedFragments);
    case "image": {
      const assetId = str(field(value, "assetId"));
      const asset = demoAssetSource.get(assetId);
      if (!asset) throw new Error(`example uses unknown asset ${assetId}`);
      const decorative = field(value, "decorative") === true;
      const alt = decorative ? "" : escapeHtml(str(field(value, "alt")));
      return [`src="${asset.src}"`, `alt="${alt}"`];
    }
    case "array": {
      const items = node.items;
      return isJsonSchemaNode(items)
        ? list(value).flatMap((item) => fragmentsOf(items, item))
        : [];
    }
    case "object": {
      const properties = isJsonSchemaNode(node.properties)
        ? node.properties
        : {};
      return Object.keys(properties).flatMap((name) => {
        const child = properties[name];
        return isJsonSchemaNode(child)
          ? fragmentsOf(child, field(value, name))
          : [];
      });
    }
    default:
      return [];
  }
}

/** The pieces of HTML a block's stored props must produce, children included. */
function expectedFragments(node: BlockNode): string[] {
  const spec = blockSpecs.find((candidate) => candidate.type === node.type);
  if (!spec) throw new Error(`${node.type} is not in blockSpecs`);
  return fragmentsOf(toJsonSchema(spec), node.props);
}

const exampleCases = blockSpecs.flatMap((spec) =>
  spec.examples.map((example, index) => ({
    title: `${spec.type}：${example.name}`,
    spec,
    index,
  }))
);

describe("block views through RSC Render", () => {
  it.each(exampleCases)(
    "$title renders its texts and links without inline styles",
    ({ spec, index }) => {
      const data = validated(exampleToPageData(spec, index));
      const markup = html(data);
      for (const fragment of data.content.flatMap(expectedFragments)) {
        expect(markup).toContain(fragment);
      }
      expect(markup).not.toMatch(/\sstyle=/);
    }
  );

  it.each(["h1", "h2", "h3", "h4"] as const)(
    "renders Heading level %s as that tag",
    (level) => {
      const markup = html(
        validated(
          onePage({
            type: "Heading",
            props: {
              id: "Heading-1",
              text: "淨灘活動",
              level,
              align: "center",
            },
          })
        )
      );
      expect(markup).toBe(
        `<main class="tcb-page tcb-stack"><${level} class="typography typography--align-center typography--color-default typography--${level}">淨灘活動</${level}></main>`
      );
    }
  );

  // Render must not trust its data: a page that never went through the
  // validator (a draft preview, a stored page edited by hand) must not pick
  // the element a view renders.
  it.each(["script", "img", "__proto__", "constructor", 2])(
    "renders a Heading whose level is %p as h2, never as that element",
    (level) => {
      const raw = onePage({
        type: "Heading",
        props: {
          id: "Heading-1",
          text: "alert(document.domain)",
          level,
          align: "start",
        },
      });
      expect(validatePage(raw).ok).toBe(false);
      expect(html(raw as PageData)).toBe(
        '<main class="tcb-page tcb-stack"><h2 class="typography typography--align-start typography--color-default typography--h2">alert(document.domain)</h2></main>'
      );
    }
  );

  it.each(blockSpecs.map((spec) => ({ type: spec.type, spec })))(
    "$type takes no element from a choice field",
    ({ spec }) => {
      const props: Record<string, unknown> = {
        ...toDefaultProps(spec),
        id: `${spec.type}-1`,
      };
      eachField(toJsonSchema(spec), ({ path, name, node }) => {
        if (path.length === 1 && fieldKindOf(node) === "choice") {
          props[name] = "script";
        }
      });
      const markup = html(
        onePage({
          type: spec.type,
          props: props as BlockNode["props"],
        }) as PageData
      );
      expect(markup).not.toMatch(/<script/i);
    }
  );

  it("renders Button as a link with uikit's button classes", () => {
    const markup = html(
      validated(
        onePage(
          {
            type: "Button",
            props: { id: "Button-1", label: "立即報名", href: "/register" },
          },
          {
            type: "Button",
            props: {
              id: "Button-2",
              label: "了解更多",
              href: "https://www.tzuchi.org.tw/",
              variant: "outline",
              size: "lg",
              fullWidth: true,
            },
          }
        )
      )
    );
    expect(markup).toContain(
      '<a href="/register" class="button button--md button--primary">立即報名</a>'
    );
    expect(markup).toContain(
      '<a href="https://www.tzuchi.org.tw/" class="button button--full-width button--lg button--outline">了解更多</a>'
    );
    expect(markup).not.toContain("<button");
  });

  it("renders Section and Columns with token classes, not inline styles", () => {
    const markup = html(
      validated(
        onePage({
          type: "Section",
          props: {
            id: "Section-1",
            background: "default",
            paddingY: "64",
            content: [
              {
                type: "Columns",
                props: { id: "Columns-1", gap: "32" },
              },
            ],
          },
        })
      )
    );
    expect(markup).toBe(
      '<main class="tcb-page tcb-stack"><section class="surface surface--default tcb-py-64 tcb-section tcb-section--inset"><div class="tcb-stack"><div class="tcb-columns tcb-columns--2 tcb-gap-32"><div class="tcb-columns-column"><div class="tcb-stack"></div></div><div class="tcb-columns-column"><div class="tcb-stack"></div></div></div></div></section></main>'
    );
  });

  it("renders columns whose content was emptied", () => {
    const data = validated(
      onePage({
        type: "Columns",
        props: {
          id: "Columns-1",
          columns: [
            {
              content: [
                { type: "Heading", props: { id: "Heading-1", text: "左欄" } },
              ],
            },
            { content: [] },
            {},
          ],
        },
      })
    );
    const columns = data.content[0].props.columns as { content: unknown[] }[];
    expect(columns.map((column) => column.content)).toEqual([
      [expect.objectContaining({ type: "Heading" })],
      [],
      [],
    ]);
    const markup = html(data);
    expect(markup).toContain(
      '<div class="tcb-columns tcb-columns--3 tcb-gap-24">'
    );
    expect(markup.match(/class="tcb-columns-column"/g)).toHaveLength(3);
    expect(markup).toContain("左欄");
    expect(
      markup.match(
        /<div class="tcb-columns-column"><div class="tcb-stack"><\/div><\/div>/g
      )
    ).toHaveLength(2);
  });

  it("renders a column that reaches Render without content", () => {
    const raw: PageData = {
      root: { props: {} },
      content: [
        {
          type: "Columns",
          props: { id: "Columns-1", columns: [{}, { content: [] }], gap: "16" },
        },
      ],
    };
    expect(html(raw)).toBe(
      '<main class="tcb-page tcb-stack"><div class="tcb-columns tcb-columns--2 tcb-gap-16"><div class="tcb-columns-column"></div><div class="tcb-columns-column"><div class="tcb-stack"></div></div></div></main>'
    );
  });

  it("shows placeholders for a missing or unselected image", () => {
    // Unselected: the editor's default value. The validator rejects it, but
    // the editor canvas and Storybook render it.
    const unselected: PageData = {
      root: { props: {} },
      content: [
        {
          type: "Image",
          props: {
            id: "Image-1",
            image: { assetId: "", alt: "", decorative: false },
            ratio: "auto",
            caption: "",
          },
        },
      ],
    };
    expect(html(unselected)).toBe(
      '<main class="tcb-page tcb-stack"><figure class="tcb-image"><div role="img" aria-label="尚未選擇圖片" class="tcb-image-placeholder tcb-image-placeholder--empty">尚未選擇圖片</div></figure></main>'
    );

    // Missing: the asset was removed after the page was published.
    const missing = html(
      validated(
        onePage({
          type: "Image",
          props: {
            id: "Image-2",
            image: {
              assetId: "removed-1",
              alt: "已刪除的圖",
              decorative: false,
            },
            ratio: "4:3",
            caption: "活動照片",
          },
        })
      )
    );
    expect(missing).toBe(
      '<main class="tcb-page tcb-stack"><figure class="tcb-image"><div role="img" aria-label="圖片已不存在" class="tcb-image-placeholder tcb-image-placeholder--missing tcb-ratio-4-3">圖片已不存在</div><figcaption class="typography typography--align-start typography--color-default typography--body-sm">活動照片</figcaption></figure></main>'
    );
  });

  it('renders a picture with its size and lazy loading, and alt="" when decorative', () => {
    const markup = html(
      validated(
        onePage(
          {
            type: "Image",
            props: {
              id: "Image-1",
              image: {
                assetId: "demo-2",
                alt: "海面與夕陽",
                decorative: false,
              },
            },
          },
          {
            type: "Image",
            props: {
              id: "Image-2",
              image: {
                assetId: "demo-3",
                alt: "不該出現的文字",
                decorative: true,
              },
              ratio: "1:1",
            },
          }
        )
      )
    );
    expect(markup).toContain(
      '<img class="tcb-image-img" src="/demo-assets/demo-2.svg" width="1200" height="900" alt="海面與夕陽" loading="lazy"/>'
    );
    expect(markup).toContain(
      '<img class="tcb-image-img tcb-ratio-1-1 tcb-image-img--cover" src="/demo-assets/demo-3.svg" width="1200" height="1200" alt="" loading="lazy"/>'
    );
    expect(markup).not.toContain("不該出現的文字");
  });

  it("stacks the page's blocks in the client Render too (interactive preview)", () => {
    const data = validated(
      onePage(
        {
          type: "Heading",
          props: { id: "Heading-1", text: "淨灘活動", level: "h2" },
        },
        {
          type: "Button",
          props: { id: "Button-1", label: "立即報名", href: "/register" },
        }
      )
    );
    const page: Data = { root: data.root, content: data.content, zones: {} };
    const markup = renderToStaticMarkup(
      <ClientRender config={renderConfig} data={page} />
    );
    // The client Render wraps the page's blocks in an unclassed <div>
    expect(markup).toMatch(/^<main class="tcb-page tcb-stack"><div><h2 /);
    const css = readFileSync(join(__dirname, "..", "blocks.css"), "utf8");
    expect(css).toContain(
      ".tcb-stack,\n.tcb-page > [data-puck-dropzone],\n.tcb-page > div:not([class]) {\n  display: flex;\n  flex-direction: column;"
    );
  });

  it("renders the same HTML with the editor config (spec §7.3)", () => {
    const editorConfig = createEditorConfig({ assets: demoAssetSource });
    for (const { spec, index } of exampleCases) {
      const data = validated(exampleToPageData(spec, index));
      expect(html(data, editorConfig)).toBe(html(data));
    }
  });
});

describe("buildRenderConfig", () => {
  /** A block that exists only in this test: a new spec, a new view, nothing else. */
  const featureSpec = defineBlockSpec({
    type: "Feature",
    label: "特色",
    category: "內容",
    description: "只在測試中使用：證明新區塊只要規格與畫面。",
    version: 1,
    props: z.strictObject({
      heading: z.string().max(80).default("特色").meta({ title: "標題" }),
      picture: image().meta({ title: "圖片" }),
      body: slot({ allow: ["Heading"] }).meta({ title: "內容" }),
      notes: z
        .array(
          z.strictObject({
            content: slot({ allow: ["Heading"] }).meta({ title: "內容" }),
          })
        )
        .max(3)
        .default(() => [])
        .meta({ title: "附註" }),
    }),
    examples: [{ name: "預設", props: {} }],
  });

  const received: string[][] = [];

  function FeatureView(props: {
    heading: ReactNode;
    picture: ResolvedImage;
    body: ReactNode;
    notes: { content: ReactNode }[];
  }) {
    received.push(Object.keys(props).sort());
    const { heading, picture, body, notes } = props;
    return (
      <section>
        <h2>{heading}</h2>
        <p>
          {picture.status === "ok"
            ? `${picture.src} ${picture.width}x${picture.height} ${picture.alt}`
            : picture.status}
        </p>
        {body}
        {notes.map((note, index) => (
          <aside key={index}>{note.content}</aside>
        ))}
      </section>
    );
  }

  beforeEach(() => {
    received.length = 0;
  });

  it("maps a new block from its spec, with no other code", () => {
    const config = buildRenderConfig({
      blocks: [...blockSpecs, featureSpec],
      views: { ...views, Feature: FeatureView },
      assets: demoAssetSource,
    });
    const heading = (id: string, text: string) => ({
      type: "Heading",
      props: { id, text, level: "h3", align: "start" },
    });
    const markup = html(
      {
        root: { props: {} },
        content: [
          {
            type: "Feature",
            props: {
              id: "Feature-1",
              heading: "淨灘 & 植樹",
              picture: { assetId: "demo-3", alt: "同心圓", decorative: false },
              body: [heading("Heading-1", "活動內容")],
              notes: [{ content: [heading("Heading-2", "附註一")] }, {}],
            },
          },
        ],
      },
      config
    );
    const h3 = (text: string) =>
      `<h3 class="typography typography--align-start typography--color-default typography--h3">${text}</h3>`;
    expect(markup).toBe(
      `<main class="tcb-page tcb-stack"><section><h2>淨灘 &amp; 植樹</h2><p>/demo-assets/demo-3.svg 1200x1200 同心圓</p><div class="tcb-stack">${h3(
        "活動內容"
      )}</div><aside><div class="tcb-stack">${h3(
        "附註一"
      )}</div></aside><aside></aside></section></main>`
    );
    // Exactly the spec's fields: no id, no puck, no editMode
    expect(received).toEqual([["body", "heading", "notes", "picture"]]);
    expect(config.components.Feature.label).toBe("特色");
  });

  it("needs a view for every block", () => {
    expect(() =>
      buildRenderConfig({
        blocks: [featureSpec],
        // @ts-expect-error -- Feature has no view, which TypeScript rejects too
        views: {},
        assets: demoAssetSource,
      })
    ).toThrow(new TypeError('buildRenderConfig: block "Feature" has no view'));
    expect(() =>
      buildRenderConfig({
        blocks: [featureSpec],
        // @ts-expect-error -- an object without $$typeof is not a component
        views: { Feature: { render: FeatureView } },
        assets: demoAssetSource,
      })
    ).toThrow(new TypeError('buildRenderConfig: block "Feature" has no view'));
  });

  it("accepts views made with memo, forwardRef and lazy", () => {
    const heading = onePage({
      type: "Heading",
      props: { id: "Heading-1", text: "淨灘活動", level: "h3" },
    });
    const expected = html(validated(heading));
    const Forwarded = forwardRef<HTMLElement, ViewProps<typeof headingSpec>>(
      (props, _ref) => <HeadingView {...props} />
    );
    Forwarded.displayName = "Forwarded";

    for (const Heading of [memo(HeadingView), Forwarded]) {
      const config = buildRenderConfig({
        blocks: blockSpecs,
        views: { ...views, Heading },
        assets: demoAssetSource,
      });
      expect(html(validated(heading), config)).toBe(expected);
    }

    // lazy() needs Suspense to render; building the config must accept it
    const config = buildRenderConfig({
      blocks: blockSpecs,
      views: {
        ...views,
        Heading: lazy(async () => ({ default: HeadingView })),
      },
      assets: demoAssetSource,
    });
    expect(config.components.Heading.label).toBe("標題");
  });
});

describe("buildRenderConfig with pages saved before a compatible change", () => {
  const LABEL = z.string().min(1).max(20).meta({ title: "文字" });
  const BODY_TYPES = richTextFeaturesToTypes(["bold"]);

  /** A block that exists only in this test, before the change. */
  const noticeV1 = defineBlockSpec({
    type: "Notice",
    label: "公告",
    category: "內容",
    description: "只在測試中使用：相容修改之前的版本。",
    version: 1,
    props: z.strictObject({
      title: z.string().min(1).max(40).default("公告").meta({ title: "標題" }),
      items: z
        .array(z.strictObject({ label: LABEL }))
        .max(5)
        .default(() => [{ label: "第一則" }])
        .meta({ title: "項目" }),
    }),
    examples: [{ name: "預設", props: {} }],
  });

  /**
   * Version 2 (spec §4.6): new fields with defaults, at the top level (a
   * list, a richtext and a choice) and inside the list items (a text and a
   * choice).
   */
  const noticeV2 = defineBlockSpec({
    type: "Notice",
    label: "公告",
    category: "內容",
    description: "只在測試中使用：相容修改之後的版本。",
    version: 2,
    props: z.strictObject({
      title: noticeV1.props.shape.title,
      items: z
        .array(
          z.strictObject({
            label: LABEL,
            note: z
              .string()
              .max(40)
              .default("詳情另行公告")
              .meta({ title: "說明" }),
            tone: choice(["info", "warning"])
              .default("info")
              .meta({ title: "語氣" }),
          })
        )
        .max(5)
        .default(() => [
          { label: "第一則", note: "詳情另行公告", tone: "info" as const },
        ])
        .meta({ title: "項目" }),
      tags: z
        .array(z.strictObject({ label: LABEL }))
        .max(3)
        .default(() => [{ label: "新" }])
        .meta({ title: "標籤" }),
      body: richText({ features: ["bold"] })
        .default(() =>
          fitRichTextToTypes(textToRichText("補充說明"), BODY_TYPES)
        )
        .meta({ title: "內文" }),
      size: choice(["md", "lg"]).default("md").meta({ title: "大小" }),
    }),
    examples: [{ name: "預設", props: {} }],
  });

  function NoticeView({
    title,
    items,
    tags,
    body,
    size,
  }: ViewProps<typeof noticeV2>) {
    return (
      <section className={size}>
        <h2>{title}</h2>
        <ul>
          {items.map((item, index) => (
            <li key={index} className={item.tone}>
              {`${item.label}：${item.note}`}
            </li>
          ))}
        </ul>
        <p>{tags.map((tag) => tag.label).join("、")}</p>
        {body}
      </section>
    );
  }

  const v1 = createPageValidator({ blocks: [noticeV1], root: pageRootSpec });
  const v2 = createPageValidator({ blocks: [noticeV2], root: pageRootSpec });
  const config = buildRenderConfig({
    blocks: [noticeV2],
    views: { Notice: NoticeView },
    assets: demoAssetSource,
  });

  /** A page stored under version 1: the validator filled v1's defaults only. */
  const stored = (() => {
    const result = v1.validatePage(
      onePage({
        type: "Notice",
        props: {
          id: "Notice-1",
          items: [{ label: "停車資訊" }, { label: "交通接駁" }],
        },
      })
    );
    if (!result.ok) throw new Error(JSON.stringify(result.errors, null, 2));
    return result.data;
  })();

  /** The same page with version 2's defaults filled in, as saving it again would store it. */
  function filled(data: PageData): PageData {
    const result = v2.validatePage(data);
    if (!result.ok) throw new Error(JSON.stringify(result.errors, null, 2));
    return result.data;
  }

  it("is a compatible change", () => {
    expect(
      diffContracts(toDataContract(noticeV1), toDataContract(noticeV2))
    ).toEqual([]);
    expect(stored.content[0].props).toEqual({
      id: "Notice-1",
      title: "公告",
      items: [{ label: "停車資訊" }, { label: "交通接駁" }],
    });
  });

  it("renders the old page like the same page with the new defaults", () => {
    const markup = html(stored, config);
    expect(markup).toBe(html(filled(stored), config));
    // RichTextContent's outer class is core's hashed CSS module name
    expect(markup).toMatch(
      /^<main class="tcb-page tcb-stack"><section class="md"><h2>公告<\/h2><ul><li class="info">停車資訊：詳情另行公告<\/li><li class="info">交通接駁：詳情另行公告<\/li><\/ul><p>新<\/p><div class="[^"]+"><div class="rich-text"><p>補充說明<\/p><\/div><\/div><\/section><\/main>$/
    );
  });

  it("uses the defaults for values a Storybook control or Render left empty", () => {
    const props = stored.content[0].props;
    const emptied: PageData = {
      ...stored,
      content: [
        {
          type: "Notice",
          props: {
            ...props,
            title: undefined,
            items: [{ label: "停車資訊", note: undefined, tone: null }],
            body: null,
          },
        },
      ],
    };
    expect(html(emptied, config)).toBe(
      html(
        filled({
          ...stored,
          content: [
            {
              type: "Notice",
              props: { id: "Notice-1", items: [{ label: "停車資訊" }] },
            },
          ],
        }),
        config
      )
    );
  });

  it.each(
    blockSpecs
      // A slot inside a list item that Render did not map renders nothing,
      // where an empty one renders an empty <div class="tcb-stack">
      .filter((spec) =>
        slotLocations(spec).every((location) => !location.path.includes("[]"))
      )
      .map((spec) => ({ type: spec.type, spec }))
  )("renders a $type that has only its id with toDefaultProps", ({ spec }) => {
    const id = `${spec.type}-1`;
    expect(html(onePage({ type: spec.type, props: { id } }) as PageData)).toBe(
      html(
        onePage({
          type: spec.type,
          props: { ...toDefaultProps(spec), id },
        }) as PageData
      )
    );
  });
});

describe("tcb- classes", () => {
  it("names only classes that blocks.css defines", () => {
    const src = join(__dirname, "..");
    const css = readFileSync(join(src, "blocks.css"), "utf8");
    const files = readdirSync(src, { recursive: true })
      .map(String)
      .filter(
        (file) =>
          file.endsWith(".tsx") &&
          !file.includes("__tests__") &&
          !file.endsWith(".stories.tsx")
      );
    const names = new Set<string>();
    const built: string[] = [];
    for (const file of files) {
      const source = readFileSync(join(src, file), "utf8");
      for (const match of source.matchAll(/\btcb-[a-z0-9-]*[a-z0-9]\b/g)) {
        names.add(match[0]);
      }
      // A class name built in a template literal would escape this check
      if (/tcb-[a-z0-9-]*\$\{/.test(source)) built.push(file);
    }
    expect(built).toEqual([]);
    expect(names.size).toBeGreaterThan(20);
    const undefinedNames = [...names].filter(
      (name) => !new RegExp(`\\.${name}(?![\\w-])`).test(css)
    );
    expect(undefinedNames).toEqual([]);
  });
});
