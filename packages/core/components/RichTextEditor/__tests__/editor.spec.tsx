import { act, cleanup, render, waitFor } from "@testing-library/react";
import { Mark, type Editor as TiptapEditor } from "@tiptap/core";
import { appStoreContext, createAppStore } from "../../../store";
import { RichtextField } from "../../../types";
import { Editor } from "../components/Editor";
import { EditorProps } from "../types";
import { doc } from "../../../lib/richtext/__helpers__/fixtures";
import type { RichTextNode } from "../../../lib/richtext/types";

const p = (...content: RichTextNode[]): RichTextNode => ({
  type: "paragraph",
  attrs: { textAlign: null },
  content,
});

const t = (text: string, marks?: RichTextNode["marks"]): RichTextNode =>
  marks ? { type: "text", marks, text } : { type: "text", text };

/** Renders the editor and waits for Tiptap to load. */
const renderEditor = async (
  content: EditorProps["content"],
  field: RichtextField = { type: "richtext" }
) => {
  const { container } = render(
    <appStoreContext.Provider value={createAppStore()}>
      <Editor
        content={content}
        onChange={() => {}}
        field={field}
        id="richtext-1"
        name="body"
      />
    </appStoreContext.Provider>
  );

  await waitFor(() => {
    expect(container.querySelector(".ProseMirror")).not.toBeNull();
  });

  return container.querySelector(".ProseMirror") as HTMLElement & {
    editor: TiptapEditor;
  };
};

describe("Editor", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    warn.mockRestore();
  });

  const warnings = () => warn.mock.calls.map(([message]) => String(message));

  it("keeps the text of content the field turned off", async () => {
    const editorDom = await renderEditor(
      doc(
        {
          type: "heading",
          attrs: { textAlign: null, level: 2 },
          content: [t("Title")],
        },
        p(
          t("bold", [{ type: "bold" }]),
          t(" and "),
          t("link", [
            {
              type: "link",
              attrs: {
                href: "https://example.com",
                target: "_blank",
                rel: "noopener noreferrer nofollow",
                class: null,
                title: null,
              },
            },
          ])
        ),
        { type: "codeBlock", attrs: { language: null }, content: [t("code")] }
      ),
      {
        type: "richtext",
        options: { bold: false, codeBlock: false, heading: false, link: false },
      }
    );

    expect(
      Array.from(editorDom.querySelectorAll("p")).map((el) => el.textContent)
    ).toEqual(["Title", "bold and link", "code"]);
    expect(editorDom.querySelector("h2, strong, a, pre")).toBeNull();
    expect(warnings()).not.toContainEqual(
      expect.stringContaining("Invalid content")
    );
  });

  it("warns about types from tiptap.extensions and shows only their text", async () => {
    const Highlight = Mark.create({
      name: "highlight",
      parseHTML: () => [{ tag: "mark" }],
      renderHTML: ({ HTMLAttributes }) => ["mark", HTMLAttributes, 0],
    });

    const editorDom = await renderEditor(
      doc(p(t("marked", [{ type: "highlight" }]))),
      { type: "richtext", tiptap: { extensions: [Highlight] } }
    );

    expect(editorDom.querySelector("mark")).toBeNull();
    expect(editorDom.textContent).toBe("marked");
    expect(warnings()).toEqual([
      expect.stringContaining(
        "the richtext types highlight come from tiptap.extensions"
      ),
    ]);
  });

  it("keeps its document when the same content comes back with reordered keys", async () => {
    const store = createAppStore();
    const editorFor = (content: EditorProps["content"]) => (
      <appStoreContext.Provider value={store}>
        <Editor
          content={content}
          onChange={() => {}}
          field={{ type: "richtext" }}
          id="richtext-1"
          name="body"
        />
      </appStoreContext.Provider>
    );
    const { container, rerender } = render(editorFor(doc(p(t("Hello world")))));

    await waitFor(() => {
      expect(container.querySelector(".ProseMirror")).not.toBeNull();
    });

    const { editor } = container.querySelector(
      ".ProseMirror"
    ) as HTMLElement & {
      editor: TiptapEditor;
    };
    const shownDoc = editor.state.doc;

    // Postgres jsonb returns object keys ordered by length, then bytewise
    rerender(
      editorFor(
        JSON.parse(
          '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"text":"Hello world","type":"text"}]}]}'
        )
      )
    );
    await act(async () => {});

    // A boolean, because jest cannot report a failed toBe on ProseMirror nodes
    expect(editor.state.doc === shownDoc).toBe(true);
  });

  it("only creates the links that published pages keep", async () => {
    const { editor } = await renderEditor(doc(p(t("link"))));

    editor.commands.selectAll();

    for (const href of [
      "sms:+886212345678",
      "ftp://example.com",
      "javascript:alert(1)",
    ]) {
      expect(editor.commands.setLink({ href })).toBe(false);
    }

    expect(editor.isActive("link")).toBe(false);
    expect(editor.commands.setLink({ href: "https://example.com" })).toBe(true);
    expect(editor.isActive("link")).toBe(true);
  });
});
