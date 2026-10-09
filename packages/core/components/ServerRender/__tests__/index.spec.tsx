import { renderToString } from "react-dom/server.node";
import { Config, Data } from "../../../types";
import { Render } from "../index";

const richText = (...content: object[]) => ({
  type: "doc",
  content: [{ type: "paragraph", attrs: { textAlign: null }, content }],
});

describe("ServerRender", () => {
  it("renders richtext content in dropzones as HTML in RSC mode", () => {
    const config: Config = {
      components: {
        Section: {
          fields: {},
          render: ({ puck }) => (
            <div>{puck.renderDropZone({ zone: "content" })}</div>
          ),
        },
        RichText: {
          fields: {
            content: { type: "richtext" },
          },
          render: ({ content }) => <div>{content}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [{ type: "Section", props: { id: "section-1" } }],
      zones: {
        "section-1:content": [
          {
            type: "RichText",
            props: {
              id: "richtext-1",
              content: richText({ type: "text", text: "Hello world" }),
            },
          },
        ],
      },
    };

    const html = renderToString(<Render config={config} data={data} />);

    expect(html).toContain(
      '<div class="RichTextEditor"><div class="rich-text"><p>Hello world</p></div></div>'
    );
  });

  it("renders richtext and slot content when server config keeps render fields", () => {
    const config: Config = {
      components: {
        Hero: {
          fields: {
            description: { type: "richtext" },
            image: {
              type: "object",
              objectFields: {
                content: { type: "slot" },
              },
            },
          },
          render: ({ description, image }) => (
            <section>
              <div>{description}</div>
              {image?.content ? <image.content /> : null}
            </section>
          ),
        },
        Heading: {
          fields: {
            title: { type: "text" },
          },
          render: ({ title }) => <h2>{title}</h2>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "Hero",
          props: {
            id: "hero-1",
            description: richText(
              { type: "text", text: "Hello " },
              { type: "text", text: "world", marks: [{ type: "bold" }] }
            ),
            image: {
              content: [
                {
                  type: "Heading",
                  props: {
                    id: "heading-1",
                    title: "Nested heading",
                  },
                },
              ],
            },
          },
        },
      ],
    };

    const html = renderToString(<Render config={config} data={data} />);

    expect(html).toContain("<p>Hello <strong>world</strong></p>");
    expect(html).toContain("<h2>Nested heading</h2>");
  });

  it("renders a legacy HTML string as escaped text", () => {
    const config: Config = {
      components: {
        RichText: {
          fields: {
            content: { type: "richtext" },
          },
          render: ({ content }) => <div>{content}</div>,
        },
      },
    };

    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: "RichText",
          props: {
            id: "richtext-1",
            content: '<p>Hello</p><img src=x onerror="alert(1)">',
          },
        },
      ],
    };

    const html = renderToString(<Render config={config} data={data} />);

    expect(html).toContain(
      "<p>&lt;p&gt;Hello&lt;/p&gt;&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>"
    );
    expect(html).not.toContain("<img");
  });
});
