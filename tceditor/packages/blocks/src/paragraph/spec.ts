import * as z from "zod";
import {
  fitRichTextToTypes,
  richTextFeaturesToTypes,
  textToRichText,
} from "@tzuchi/tceditor/rules";
import { defineBlockSpec, richText, style } from "@tzuchi/tceditor-spec";
import type { BlockProps } from "@tzuchi/tceditor-spec";

const BODY_FEATURES = [
  "bold",
  "italic",
  "link",
  "bulletList",
  "orderedList",
  "hardBreak",
] as const;

export const paragraphSpec = defineBlockSpec({
  type: "Paragraph",
  label: "段落",
  category: "文字",
  description:
    "一段內文，可以在畫布上直接編輯。可用粗體、斜體、連結、項目清單、編號清單與換行；對齊方式由區塊設定，不在文字裡設定。",
  version: 1,
  props: z.strictObject({
    body: richText({ features: BODY_FEATURES })
      // zod returns a default as it is, without richText()'s cleanup, so the
      // default is cleaned here: validating it a second time changes nothing
      .default(() =>
        fitRichTextToTypes(
          textToRichText("請輸入內文。"),
          richTextFeaturesToTypes(BODY_FEATURES)
        )
      )
      .meta({ title: "內文" }),
    align: style("typography", "align", ["start", "center", "end"])
      .default("start")
      .meta({
        title: "對齊",
        "x-labels": { start: "靠左", center: "置中", end: "靠右" },
      }),
  }),
  examples: [
    { name: "只用預設值", props: {} },
    {
      name: "含格式與清單",
      props: {
        body: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "活動當天請" },
                { type: "text", marks: [{ type: "bold" }], text: "準時報到" },
                { type: "text", text: "，並攜帶：" },
              ],
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "環保杯與餐具" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "防曬用品" }],
                    },
                  ],
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "詳細資訊請見" },
                {
                  type: "text",
                  marks: [
                    {
                      type: "link",
                      attrs: {
                        href: "/activity",
                        target: "_blank",
                        rel: "noopener noreferrer nofollow",
                        class: null,
                        title: null,
                      },
                    },
                  ],
                  text: "活動說明",
                },
                { type: "text", text: "。" },
              ],
            },
          ],
        },
      },
    },
  ],
});

export type ParagraphProps = BlockProps<typeof paragraphSpec>;
