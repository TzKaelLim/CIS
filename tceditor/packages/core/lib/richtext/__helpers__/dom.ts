import { getSchema } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { PuckRichText } from "../../../components/RichTextEditor/extension";
import type { RichTextDoc } from "../types";

const extensions = [PuckRichText];

/** What Tiptap renders for this JSON (the browser build of @tiptap/html). */
export const tiptapHtml = (value: RichTextDoc) =>
  generateHTML(value, extensions);

/** The shape editor.getJSON() would give for this JSON. */
export const canonicalize = (value: RichTextDoc) =>
  ProseMirrorNode.fromJSON(getSchema(extensions), value).toJSON();

/**
 * Parses HTML into a DOM fragment and rewrites every style attribute through
 * CSSStyleDeclaration, so `text-align:center` and `text-align: center;` match.
 */
export const parseHtml = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    el.setAttribute("style", el.style.cssText);
  });
  template.content.normalize();

  return template.content;
};

export const isSameDom = (a: string, b: string) =>
  parseHtml(a).isEqualNode(parseHtml(b));
