import type { Extensions } from "@tiptap/core";
import { generateJSON } from "@tiptap/html/server";
import { PuckRichText } from "../../components/RichTextEditor/extension";
import { normalizeRichText } from "./normalize";
import { textToRichText } from "./text-to-richtext";
import type { RichTextDoc } from "./types";

// The test v0.23.0's renderer used to decide whether a string was HTML
const LOOKS_LIKE_HTML = /<\/?[a-z][\s\S]*>/i;

/**
 * Converts a legacy richtext HTML string to JSON, the way v0.23.0 rendered
 * it: HTML is parsed with Tiptap's schema (so anything outside the schema is
 * dropped), any other string becomes a plain text paragraph.
 *
 * Runs on the server only, because parsing needs happy-dom. Not part of the
 * main entry; import it from "@tzuchi/tceditor/richtext-migrate".
 */
export function richTextHtmlToJson(html: string): RichTextDoc {
  return parseRichTextHtml(html, [PuckRichText]);
}

/**
 * richTextHtmlToJson with the extensions of one richtext field, so markup the
 * field's editor cannot show (for example bold with `options: { bold: false }`)
 * is dropped the way v0.23.0 dropped it. Alignment in a field with
 * `textAlign: false` is dropped too (textAlign becomes null), although v0.23.0
 * kept it because it ignored that option. Used by migrateRichTextInData.
 */
export function parseRichTextHtml(
  html: string,
  extensions: Extensions
): RichTextDoc {
  if (!LOOKS_LIKE_HTML.test(html)) return textToRichText(html);

  return normalizeRichText(generateJSON(html, extensions));
}
