import type { BlockNode } from "@tzuchi/tceditor-spec";
import { storyPage } from "../story-helpers";

const card = () =>
  storyPage("Card", {
    title: "淨灘",
    content: [{ type: "Button", props: { label: "報名", href: "/r" } }],
  });

describe("storyPage", () => {
  it("gives the block and its nested blocks the ids an example would get", () => {
    const [block] = card().content;
    const [button] = block.props.content as BlockNode[];

    expect(block.props.id).toBe("Card-ex1");
    expect(button.props.id).toBe("Card-ex1-content-0");
  });

  it("fills in the defaults of nested blocks when the page is valid", () => {
    const [block] = card().content;

    expect(block.props.content).toEqual([
      {
        type: "Button",
        props: {
          id: "Card-ex1-content-0",
          label: "報名",
          href: "/r",
          variant: "primary",
          size: "md",
          fullWidth: false,
        },
      },
    ]);
  });

  it("is deterministic", () => {
    expect(card()).toEqual(card());
  });

  it("renders props that cannot be published yet as given", () => {
    const args = {
      label: "立即報名",
      href: "",
      variant: "primary",
      size: "md",
      fullWidth: false,
    };

    expect(storyPage("Button", args).content).toEqual([
      { type: "Button", props: { id: "Button-ex1", ...args } },
    ]);
  });

  it("rejects types that are not registered blocks", () => {
    expect(() => storyPage("constructor", {})).toThrow(TypeError);
    expect(() => storyPage("Root", {})).toThrow(TypeError);
  });
});
