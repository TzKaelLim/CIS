// Compiled by `pnpm typecheck` (tsc), never run. Each Expect<…> fails to
// compile when the inferred type drifts, and each @ts-expect-error fails when
// the line it marks starts to compile.
import * as z from "zod";
import {
  fitRichTextToTypes,
  richTextFeaturesToTypes,
  textToRichText,
} from "@tzuchi/tceditor/rules";
import type { RichTextDoc } from "@tzuchi/tceditor/rules";
import { defineBlockSpec } from "../define";
import type { BlockProps } from "../define";
import { image, link, richText, slot, style } from "../helpers";
import type { ImageValue, SlotItem } from "../helpers";
import {
  boxSpec,
  kitchenSinkSpec,
  leafSpec,
  pairSpec,
  testRoot,
} from "../__fixtures__/test-specs";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
export type Expect<T extends true> = T;

export type KitchenSinkOutput = Expect<
  Equals<
    BlockProps<typeof kitchenSinkSpec>,
    {
      title: string;
      note: string;
      count: number;
      tone: "calm" | "bright" | "dark" | "warm" | "cool";
      size: "sm" | "md" | "lg";
      space: "16" | "32";
      enabled: boolean;
      href: string;
      moreHref: string;
      body: RichTextDoc;
      items: { label: string }[];
      group: { caption: string; level: number };
      content: { type: string; props: Record<string, unknown> }[];
      picture: { assetId: string; alt: string; decorative: boolean };
    }
  >
>;

export type KitchenSinkInput = Expect<
  Equals<
    z.input<typeof kitchenSinkSpec.props>,
    {
      title?: string | undefined;
      note?: string | undefined;
      count?: number | undefined;
      tone?: "calm" | "bright" | "dark" | "warm" | "cool" | undefined;
      size?: "sm" | "md" | "lg" | undefined;
      space?: "16" | "32" | undefined;
      enabled?: boolean | undefined;
      href?: string | undefined;
      moreHref?: string | undefined;
      body?: RichTextDoc | undefined;
      items?: { label: string }[] | undefined;
      group?:
        | { caption?: string | undefined; level?: number | undefined }
        | undefined;
      content?: { type: string; props: Record<string, unknown> }[] | undefined;
      picture?:
        | { assetId: string; alt: string; decorative: boolean }
        | undefined;
    }
  >
>;

export type LeafOutput = Expect<
  Equals<BlockProps<typeof leafSpec>, { text: string }>
>;
export type BoxOutput = Expect<
  Equals<BlockProps<typeof boxSpec>, { content: SlotItem[] }>
>;
export type PairOutput = Expect<
  Equals<BlockProps<typeof pairSpec>, { columns: { content: SlotItem[] }[] }>
>;
export type RootOutput = Expect<
  Equals<BlockProps<typeof testRoot>, { title: string; description: string }>
>;
export type ImageOutput = Expect<
  Equals<z.output<ReturnType<typeof image>>, ImageValue>
>;
export type RichTextOutput = Expect<
  Equals<z.output<ReturnType<typeof richText>>, RichTextDoc>
>;
export type SlotOutput = Expect<
  Equals<z.output<ReturnType<typeof slot>>, SlotItem[]>
>;
export type KitchenSinkType = Expect<
  Equals<(typeof kitchenSinkSpec)["type"], "KitchenSink">
>;

// Helper results keep accepting the author's chain.
export const chained = {
  size: style("button", "size", ["sm", "md"])
    .default("md")
    .meta({ title: "大小", "x-labels": { sm: "小", md: "中" } }),
  href: link().meta({ title: "連結" }),
  more: link({ optional: true }).meta({ title: "更多" }),
  body: richText({ features: ["bold"] })
    .default(() =>
      fitRichTextToTypes(textToRichText(""), richTextFeaturesToTypes(["bold"]))
    )
    .meta({ title: "內文" }),
  content: slot({ allow: ["Leaf"] }).meta({ title: "內容" }),
  picture: image().meta({ title: "圖片" }),
};

export const typoInExample = defineBlockSpec({
  type: "TypoExample",
  label: "錯字",
  category: "測試",
  description: "",
  version: 1,
  props: z.strictObject({ href: link().meta({ title: "連結" }) }),
  // @ts-expect-error -- examples are checked against z.input of props
  examples: [{ name: "錯字", props: { hreff: "/x" } }],
});

// @ts-expect-error -- the default must be one of the options
export const badDefault = style("button", "size", ["sm", "md"]).default("xl");

// @ts-expect-error -- x-labels values must be strings
export const badLabels = z.string().meta({ title: "t", "x-labels": { a: 1 } });

// @ts-expect-error -- examples in meta must be JSON
export const badExamples = z.string().meta({ title: "t", examples: [() => 1] });

// @ts-expect-error -- richText features are a fixed list
export const badFeature = richText({ features: ["italics"] });

// @ts-expect-error -- a slot takes allow or disallow, not neither
export const badSlot = slot({});

// @ts-expect-error -- only image() writes x-image
export const forgedImage = z.string().meta({ "x-image": true });

// @ts-expect-error -- only the helpers write x-lost-checks
export const forgedChecks = link().meta({ "x-lost-checks": [] });
