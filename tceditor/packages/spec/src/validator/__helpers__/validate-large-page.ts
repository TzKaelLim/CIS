/**
 * Run by memory.spec.ts in a child process with a small heap:
 *
 *   node --max-old-space-size=96 --import <tsx> validate-large-page.ts <shape>
 *
 * Validates a page of almost DEFAULT_LIMITS.maxBytes whose only block has a
 * rich text body made of very many tiny nodes, and prints the result's
 * outline as JSON. A comparison that copies the document per node runs out
 * of memory here (the final review's F04).
 */
import { DEFAULT_LIMITS } from "../../limits";
import { kitchenSink, page, validator } from "./pages";

/** One node of the body, repeated until the page is almost maxBytes. */
const NODES: Record<string, string> = {
  // The densest valid JSON: cleaning drops every one of them
  empty: "{}",
  // Needs no cleaning, so the comparison walks the whole document
  paragraphs: '{"type":"paragraph"}',
};

const shape = process.argv[2] ?? "";

if (!Object.prototype.hasOwnProperty.call(NODES, shape)) {
  throw new Error(`Unknown shape "${shape}"`);
}

const node = NODES[shape];
const shell = JSON.stringify(page([kitchenSink("k", { body: "BODY" })]));
// Room for the body's brackets and for the defaults the validator fills in:
// the data it returns must fit the limit too
const room = DEFAULT_LIMITS.maxBytes - shell.length - 1024;
const count = Math.floor(room / (node.length + 1));
const json = shell.replace(
  '"BODY"',
  `{"type":"doc","content":[${new Array(count).fill(node).join(",")}]}`
);
const result = validator.validatePageJson(json);

process.stdout.write(
  JSON.stringify({
    bytes: new TextEncoder().encode(json).byteLength,
    nodes: count,
    ok: result.ok,
    codes: (result.ok ? result.notices : result.errors).map(
      (issue) => issue.code
    ),
  })
);
