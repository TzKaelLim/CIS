import { renderToString } from "react-dom/server.node";
import { Config, Data } from "../../../types";

// @dnd-kit/dom (imported through DropZone) needs ResizeObserver at import time
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserver;

import { Render as ClientRender } from "../index";
import { Render as ServerRender } from "../../ServerRender";

const config: Config = {
  components: {
    Heading: {
      fields: { title: { type: "text" } },
      render: ({ title }) => <h2>{title}</h2>,
    },
    Section: {
      fields: { items: { type: "slot" } },
      render: ({ items: Items, puck }) => (
        <section>
          <Items />
          {puck.renderDropZone({ zone: "legacy" })}
        </section>
      ),
    },
  },
};

const prototypeTypes = ["constructor", "__proto__", "toString"];

const badItems = (prefix: string) =>
  prototypeTypes.map((type, i) => ({
    type,
    props: { id: `${prefix}-${i}`, title: "Should not render" },
  }));

const data: Data = {
  root: { props: {} },
  content: [
    { type: "Heading", props: { id: "heading-1", title: "Before" } },
    ...badItems("content"),
    {
      type: "Section",
      props: {
        id: "section-1",
        items: [
          ...badItems("slot"),
          { type: "Heading", props: { id: "heading-2", title: "In slot" } },
        ],
      },
    },
    { type: "Heading", props: { id: "heading-3", title: "After" } },
  ],
  zones: {
    "section-1:legacy": [
      ...badItems("zone"),
      { type: "Heading", props: { id: "heading-4", title: "In zone" } },
    ],
  },
};

describe.each([
  ["client", ClientRender],
  ["server", ServerRender],
])(
  "%s <Render> with component types named after Object.prototype members",
  (_, Render) => {
    it("skips those components and renders the rest", () => {
      const html = renderToString(<Render config={config} data={data} />);

      expect(html).toContain("<h2>Before</h2>");
      expect(html).toContain("<h2>In slot</h2>");
      expect(html).toContain("<h2>In zone</h2>");
      expect(html).toContain("<h2>After</h2>");
      expect(html).not.toContain("Should not render");
    });
  }
);
