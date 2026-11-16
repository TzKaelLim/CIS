import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEMO_ASSETS } from "@tzuchi/tceditor-blocks/demo-assets";
import { validatePage } from "@tzuchi/tceditor-blocks/validator";

const preset: unknown = JSON.parse(
  readFileSync(join(__dirname, "../../content/activity.preset.json"), "utf8")
);

type Node = { type: string; props: Record<string, unknown> };

/** Every block of the page, depth first, including blocks inside slots. */
function collectBlocks(value: unknown, found: Node[] = []): Node[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectBlocks(item, found));
  } else if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;

    if (typeof record.type === "string" && typeof record.props === "object") {
      found.push(record as Node);
    }

    Object.values(record).forEach((item) => collectBlocks(item, found));
  }

  return found;
}

/** Every mark type used in a richtext document. */
function markTypes(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => markTypes(item, found));
  } else if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.marks)) {
      record.marks.forEach((mark: { type?: unknown }) => {
        if (typeof mark.type === "string") found.add(mark.type);
      });
    }

    Object.values(record).forEach((item) => markTypes(item, found));
  }

  return found;
}

describe("content/activity.preset.json", () => {
  it("passes the page validator without notices", () => {
    const result = validatePage(preset);

    expect(result).toEqual(expect.objectContaining({ ok: true, notices: [] }));
  });

  it("is already in the stored form (defaults filled, richtext clean)", () => {
    const result = validatePage(preset);

    if (!result.ok) throw new Error(JSON.stringify(result.errors, null, 2));
    // The validator removes textAlign from paragraphs (Task 2), so the
    // preset's paragraphs have no attrs at all.
    expect(result.data).toEqual(preset);
  });

  it("uses the eight demo block types", () => {
    // Spec §10.4. Written out instead of taken from blockTypes, so that
    // registering a new block never requires editing the preset.
    const demoBlockTypes = [
      "Heading",
      "Paragraph",
      "Button",
      "Card",
      "TagList",
      "Section",
      "Columns",
      "Image",
    ];
    const types = new Set(collectBlocks(preset).map((node) => node.type));

    expect([...types].sort()).toEqual([...demoBlockTypes].sort());
  });

  it("nests a Card with a Button and a TagList inside Columns inside a Section", () => {
    const section = collectBlocks(preset).find(
      (node) => node.type === "Section"
    );
    const inSection = collectBlocks(section?.props.content);
    const card = inSection.find(
      (node) =>
        node.type === "Card" &&
        collectBlocks(node.props.content).some((n) => n.type === "Button") &&
        collectBlocks(node.props.content).some((n) => n.type === "TagList")
    );

    expect(inSection.some((node) => node.type === "Columns")).toBe(true);
    expect(card).toBeDefined();
  });

  it("formats a paragraph with bold text and a link", () => {
    const marks = markTypes(
      collectBlocks(preset)
        .filter((node) => node.type === "Paragraph")
        .map((node) => node.props.body)
    );

    expect([...marks]).toEqual(expect.arrayContaining(["bold", "link"]));
  });

  it("only uses demo assets that exist", () => {
    const ids = new Set(DEMO_ASSETS.map((asset) => asset.id));
    const used = collectBlocks(preset)
      .filter((node) => node.type === "Image")
      .map((node) => (node.props.image as { assetId: string }).assetId);

    expect(used.length).toBeGreaterThan(0);
    used.forEach((id) => expect(ids.has(id)).toBe(true));
  });
});
