/** @jest-environment node */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Render as ClientRender, type Data } from "@tzuchi/tceditor";
import { Render } from "@tzuchi/tceditor/rsc";
import {
  defineBlockSpec,
  exampleToPageData,
  fieldKindOf,
  image,
  isJsonSchemaNode,
  slot,
  toJsonSchema,
} from "@tzuchi/tceditor-spec";
import type { BlockNode, JsonSchema, PageData } from "@tzuchi/tceditor-spec";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as z from "zod";
import { demoAssetSource } from "../demo-assets";
import { createEditorConfig } from "../editor-config";
import type { ResolvedImage } from "../image/view";
import { buildRenderConfig, createRenderConfig } from "../render-config";
import { blockSpecs } from "../specs";
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
