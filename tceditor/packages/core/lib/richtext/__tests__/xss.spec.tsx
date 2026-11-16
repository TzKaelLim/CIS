import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server.node";
import { RichTextContent } from "../../../components/RichTextEditor/components/RichTextContent";
import { parseHtml } from "../__helpers__/dom";
import {
  expectSafe,
  legacyHtml,
  linkDoc,
  tamperedJson,
} from "../__helpers__/xss-payloads";

const renderBothWays = (content: unknown) => {
  const serverHtml = renderToString(<RichTextContent content={content} />);
  const { container } = render(<RichTextContent content={content} />);

  return { serverHtml, server: parseHtml(serverHtml), client: container };
};

describe("rich text XSS regression", () => {
  afterEach(cleanup);

  describe.each(Object.keys(tamperedJson))("tampered JSON: %s", (name) => {
    it("renders only allowed elements and attributes", () => {
      const { serverHtml, server, client } = renderBothWays(tamperedJson[name]);

      expect(serverHtml).not.toMatch(/<script/i);
      expectSafe(server);
      expectSafe(client);
    });
  });

  describe.each(Object.keys(legacyHtml))("legacy HTML string: %s", (name) => {
    it("renders the string as plain text", () => {
      const payload = legacyHtml[name];
      const { serverHtml, server, client } = renderBothWays(payload);

      expect(serverHtml).not.toMatch(/<script/i);

      for (const root of [server, client]) {
        expectSafe(root);

        const paragraphs = root.querySelectorAll(".rich-text > p");

        expect(paragraphs).toHaveLength(1);
        expect(paragraphs[0].children).toHaveLength(0);
        expect(paragraphs[0].textContent).toBe(payload);
      }
    });
  });

  it("keeps the text of removed links", () => {
    const { client } = renderBothWays(linkDoc("javascript:alert(1)"));

    expect(client.querySelector("a")).toBeNull();
    expect(client.textContent).toBe("click");
  });

  it("keeps safe links", () => {
    const { client } = renderBothWays(linkDoc("https://example.com"));

    expect(client.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com"
    );
  });
});
