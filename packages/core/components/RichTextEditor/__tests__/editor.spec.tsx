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

/** The href of every link mark in a document, in document order. */
const linkHrefs = (node: RichTextNode): unknown[] => [
  ...(node.marks ?? [])
    .filter((mark) => mark.type === "link")
    .map((mark) => mark.attrs?.href),
  ...(node.content ?? []).flatMap(linkHrefs),
];

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

  // Tiptap's listItem requires paragraph, so a field can turn paragraph off
  // only together with listItem
  it.each<[string, RichtextField["options"], string]>([
    ["code blocks", { paragraph: false, listItem: false }, "pre"],
    [
      "headings",
      {
        paragraph: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
      },
      "h1",
    ],
  ])(
    "shows paragraphs as %s in a field without paragraphs",
    async (_, options, selector) => {
      const editorDom = await renderEditor(
        doc(p(t("first")), p(t("second", [{ type: "bold" }]))),
        { type: "richtext", options }
      );

      expect(
        Array.from(editorDom.querySelectorAll(selector)).map(
          (el) => el.textContent
        )
      ).toEqual(["first", "second"]);
      expect(warnings()).not.toContainEqual(
        expect.stringContaining("Invalid content")
      );
    }
  );

  it("opens an empty field without paragraphs with an empty code block", async () => {
    const { editor } = await renderEditor("", {
      type: "richtext",
      options: { paragraph: false, listItem: false },
    });

    expect(editor.getJSON()).toEqual({
      type: "doc",
      content: [{ type: "codeBlock", attrs: { language: null } }],
    });
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

  it("only links pasted URLs that published pages keep", async () => {
    const { editor } = await renderEditor(doc(p(t("word"))));

    // Pastes a URL over a selected word, which linkOnPaste turns into a link
    const pasteOverWord = (url: string) => {
      editor.commands.setContent(doc(p(t("word"))));
      editor.commands.setTextSelection({ from: 1, to: 5 });
      // jsdom has no ClipboardEvent, which pasteText would create
      editor.view.pasteText(url, new Event("paste") as ClipboardEvent);

      return {
        text: editor.getText(),
        links: linkHrefs(editor.getJSON() as RichTextNode),
      };
    };

    // Any other URL is pasted as plain text, like text that is not a URL
    for (const url of [
      "ftp://example.com",
      "ftps://example.com",
      "file:///etc/passwd",
    ]) {
      expect(pasteOverWord(url)).toEqual({ text: url, links: [] });
    }

    expect(pasteOverWord("https://example.com")).toEqual({
      text: "word",
      links: ["https://example.com"],
    });
    expect(pasteOverWord("example.com")).toEqual({
      text: "word",
      links: ["http://example.com"],
    });
  });

  it("removes links with an href published pages drop, however they are added", async () => {
    // With this default protocol, linkOnPaste builds "ftp://example.com" from
    // "example.com", which no option that sees only the pasted text can catch
    const { editor } = await renderEditor(doc(p(t("word"))), {
      type: "richtext",
      options: { link: { defaultProtocol: "ftp" } },
    });
    const links = () => linkHrefs(editor.getJSON() as RichTextNode);

    editor.commands.setTextSelection({ from: 1, to: 5 });
    editor.view.pasteText("example.com", new Event("paste") as ClipboardEvent);

    expect(links()).toEqual([]);

    // Commands other than setLink do not check the href
    editor.commands.setTextSelection({ from: 1, to: 5 });
    editor.commands.setMark("link", { href: "ftp://example.com" });

    expect(links()).toEqual([]);

    editor.commands.insertContentAt(editor.state.doc.content.size - 1, [
      {
        type: "text",
        text: " script",
        marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
      },
      {
        type: "text",
        text: " safe",
        marks: [{ type: "link", attrs: { href: "https://example.com" } }],
      },
    ]);

    expect(editor.getText()).toBe("word script safe");
    expect(links()).toEqual(["https://example.com"]);
  });
});
