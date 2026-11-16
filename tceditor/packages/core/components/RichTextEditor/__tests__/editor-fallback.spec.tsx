import { cleanup, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server.node";
import { appStoreContext, createAppStore } from "../../../store";
import { Editor } from "../components/Editor";
import { EditorFallback } from "../components/EditorFallback";
import { EditorProps } from "../types";
import { allTypicalContent } from "../../../lib/richtext/__helpers__/fixtures";
import { isSameDom, parseHtml } from "../../../lib/richtext/__helpers__/dom";
import {
  expectSafe,
  xssPayloads,
} from "../../../lib/richtext/__helpers__/xss-payloads";

const renderWithStore = (ui: React.ReactNode) =>
  render(
    <appStoreContext.Provider value={createAppStore()}>
      {ui}
    </appStoreContext.Provider>
  );

const props = (content: EditorProps["content"]): EditorProps => ({
  content,
  onChange: () => {},
  field: { type: "richtext" },
  id: "richtext-1",
  name: "body",
});

/** The content DOM of the loaded editor, without ProseMirror's editing aids. */
const editorContent = async (content: EditorProps["content"]) => {
  const { container } = renderWithStore(<Editor {...props(content)} />);

  await waitFor(() => {
    expect(container.querySelector(".ProseMirror")).not.toBeNull();
  });

  const editorDom = container.querySelector(".ProseMirror")!.cloneNode(true);

  (editorDom as Element)
    .querySelectorAll("br.ProseMirror-trailingBreak")
    .forEach((br) => br.remove());

  return (editorDom as Element).innerHTML;
};

const fallbackContent = (content: EditorProps["content"]) => {
  const { container } = renderWithStore(<EditorFallback {...props(content)} />);

  return container.querySelector(".rich-text")!.innerHTML;
};

describe("EditorFallback", () => {
  afterEach(cleanup);

  it("shows the same content the editor shows once it has loaded", async () => {
    const fallback = fallbackContent(allTypicalContent);
    const editor = await editorContent(allTypicalContent);

    expect({ same: isSameDom(fallback, editor), fallback, editor }).toEqual({
      same: true,
      fallback,
      editor,
    });
  });

  it("shows a legacy HTML string as the same plain text as the editor", async () => {
    const payload = '<p>Hi</p><img src=x onerror="alert(1)">';

    expect(
      isSameDom(fallbackContent(payload), await editorContent(payload))
    ).toBe(true);
  });

  it("is not editable before the editor loads", () => {
    const { container } = renderWithStore(
      <EditorFallback {...props(allTypicalContent)} />
    );

    expect(container.querySelector("[contenteditable]")).toBeNull();
  });

  it.each(xssPayloads)(
    "shows %s safely, the same as the loaded editor",
    async (_, payload) => {
      const content = payload as EditorProps["content"];
      const serverHtml = renderToString(
        <appStoreContext.Provider value={createAppStore()}>
          <EditorFallback {...props(content)} />
        </appStoreContext.Provider>
      );
      const fallback = fallbackContent(content);

      expect(serverHtml).not.toMatch(/<script/i);
      expectSafe(parseHtml(serverHtml).querySelector(".rich-text")!);
      expectSafe(parseHtml(fallback));
      expect(isSameDom(fallback, await editorContent(content))).toBe(true);
    }
  );
});
