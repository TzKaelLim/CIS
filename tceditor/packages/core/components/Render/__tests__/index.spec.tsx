import { act, cleanup, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server.node";
import { Config, Data } from "../../../types";
import { allTypicalContent } from "../../../lib/richtext/__helpers__/fixtures";
import {
  expectSafe,
  xssPayloads,
} from "../../../lib/richtext/__helpers__/xss-payloads";

// Rendering rich text must not need a DOM implementation or Tiptap's HTML
// utilities, so these modules throw if anything loads them.
jest.mock("happy-dom", () => {
  throw new Error("happy-dom must not be loaded while rendering");
});
jest.mock("@tiptap/html", () => {
  throw new Error("@tiptap/html must not be loaded while rendering");
});

// @dnd-kit/dom reads ResizeObserver when it is imported
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserver;

import { Render } from "../index";
import { Render as ServerRender } from "../../ServerRender";

const richText = (text: string) => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: { textAlign: "center" },
      content: [{ type: "text", text }],
    },
  ],
});

const config: Config = {
  root: {
    fields: { intro: { type: "richtext" } },
    render: ({ intro, children }) => (
      <main>
        <header>{intro}</header>
        {children}
      </main>
    ),
  },
  components: {
    RichText: {
      fields: { body: { type: "richtext" } },
      render: ({ body }) => <article>{body}</article>,
    },
    Cards: {
      fields: {
        cards: { type: "array", arrayFields: { body: { type: "richtext" } } },
        footer: {
          type: "object",
          objectFields: { note: { type: "richtext" } },
        },
      },
      render: ({ cards, footer }) => (
        <section>
          {cards.map(({ body }: { body: unknown }, index: number) => (
            <div key={index}>{body as React.ReactNode}</div>
          ))}
          <footer>{footer.note}</footer>
        </section>
      ),
    },
  },
};

const data = (body: unknown): Data => ({
  root: { props: { intro: richText("Intro") } },
  content: [{ type: "RichText", props: { id: "richtext-1", body } }],
});

const parse = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;

  return template.content;
};

/**
 * Checks the rich text in a page rendered from data(body): it passes
 * expectSafe, a legacy string is one plain text paragraph, and a tampered
 * document still shows its text.
 */
const expectSafePage = (root: ParentNode, body: unknown) => {
  for (const richText of Array.from(root.querySelectorAll(".RichTextEditor"))) {
    expectSafe(richText);
  }

  const blocks = root.querySelectorAll("article .rich-text > *");

  if (typeof body === "string") {
    expect(blocks).toHaveLength(1);
    expect(blocks[0].tagName).toBe("P");
    expect(blocks[0].children).toHaveLength(0);
    expect(blocks[0].textContent).toBe(body);
  } else {
    expect(blocks.length).toBeGreaterThan(0);
  }
};

describe.each([
  ["Render", Render],
  ["ServerRender", ServerRender],
])("%s on the server", (_, Component) => {
  it("renders richtext JSON in components and in the root", () => {
    const html = renderToString(
      <Component config={config} data={data(richText("Body"))} />
    );

    expect(html).toContain(
      '<header><div class="RichTextEditor"><div class="rich-text"><p style="text-align:center">Intro</p></div></div></header>'
    );
    expect(html).toContain(
      '<article><div class="RichTextEditor"><div class="rich-text"><p style="text-align:center">Body</p></div></div></article>'
    );
  });

  it("renders a legacy HTML string as plain text", () => {
    const html = renderToString(
      <Component
        config={config}
        data={data('<p>Hi</p><img src=x onerror="alert(1)">')}
      />
    );

    expect(html).toContain(
      "<p>&lt;p&gt;Hi&lt;/p&gt;&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>"
    );
    expect(html).not.toContain("<img");
  });

  it("renders richtext inside array and object fields", () => {
    const html = renderToString(
      <Component
        config={config}
        data={{
          root: { props: {} },
          content: [
            {
              type: "Cards",
              props: {
                id: "cards-1",
                cards: [{ body: richText("First") }, { body: "<b>Second</b>" }],
                footer: { note: richText("Note") },
              },
            },
          ],
        }}
      />
    );

    expect(html).toContain(
      '<div><div class="RichTextEditor"><div class="rich-text"><p style="text-align:center">First</p></div></div></div>'
    );
    expect(html).toContain(
      '<div><div class="RichTextEditor"><div class="rich-text"><p>&lt;b&gt;Second&lt;/b&gt;</p></div></div></div>'
    );
    expect(html).toContain(
      '<footer><div class="RichTextEditor"><div class="rich-text"><p style="text-align:center">Note</p></div></div></footer>'
    );
  });

  it.each(xssPayloads)("renders %s safely", (_, body) => {
    const html = renderToString(
      <Component config={config} data={data(body)} />
    );

    expect(html).not.toMatch(/<script/i);
    expectSafePage(parse(html), body);
  });
});

describe("Render on the client", () => {
  afterEach(cleanup);

  it("hydrates the server-rendered page without a mismatch", async () => {
    const page = <Render config={config} data={data(allTypicalContent)} />;
    const container = document.createElement("div");

    container.innerHTML = renderToString(page);
    document.body.appendChild(container);

    const serverDom = container.innerHTML;
    const errors: unknown[] = [];
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation((...args) => errors.push(args));

    const root = await act(async () =>
      hydrateRoot(container, page, {
        onRecoverableError: (error) => errors.push(error),
      })
    );

    consoleError.mockRestore();

    expect(errors).toEqual([]);
    expect(container.innerHTML).toBe(serverDom);

    act(() => root.unmount());
    container.remove();
  });

  it.each(xssPayloads)("renders %s safely", (_, body) => {
    const { container } = render(<Render config={config} data={data(body)} />);

    expectSafePage(container, body);
  });
});
