import { typographyVariants } from "@heroui/styles";
import type { ImageProps } from "./spec";

/** The image prop after `assets.get` (render-config.tsx resolves it on the server). */
export type ResolvedImage =
  | { status: "empty" }
  | { status: "missing"; assetId: string }
  | {
      status: "ok";
      src: string;
      width: number;
      height: number;
      alt: string;
      decorative: boolean;
    };

const PLACEHOLDER_TEXT = {
  empty: "尚未選擇圖片",
  missing: "圖片已不存在",
} as const;

/** Written out in full so the class test can find them in blocks.css. */
const PLACEHOLDER_CLASS = {
  empty: "tcb-image-placeholder--empty",
  missing: "tcb-image-placeholder--missing",
} as const;

/** "auto" keeps the picture's own ratio; the others crop it to fill (object-fit: cover). */
function ratioClass(ratio: ImageProps["ratio"]): string {
  switch (ratio) {
    case "16:9":
      return "tcb-ratio-16-9";
    case "4:3":
      return "tcb-ratio-4-3";
    case "1:1":
      return "tcb-ratio-1-1";
    default:
      return "";
  }
}

function Picture({ image, ratio }: { image: ResolvedImage; ratio: string }) {
  if (image.status === "ok") {
    const classes = [
      "tcb-image-img",
      ratio,
      ratio ? "tcb-image-img--cover" : "",
    ];
    return (
      // A plain <img>: the views render the same in Next, Storybook and the editor.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={classes.filter(Boolean).join(" ")}
        src={image.src}
        width={image.width}
        height={image.height}
        alt={image.decorative ? "" : image.alt}
        loading="lazy"
      />
    );
  }
  const text = PLACEHOLDER_TEXT[image.status];
  const classes = [
    "tcb-image-placeholder",
    PLACEHOLDER_CLASS[image.status],
    ratio,
  ];
  return (
    <div
      role="img"
      aria-label={text}
      className={classes.filter(Boolean).join(" ")}
    >
      {text}
    </div>
  );
}

/** <figure> with the picture (or a placeholder box) and an optional caption (spec §8.8). */
export function ImageView({
  image,
  ratio,
  caption,
}: {
  image: ResolvedImage;
  ratio: ImageProps["ratio"];
  caption: string;
}) {
  return (
    <figure className="tcb-image">
      <Picture image={image} ratio={ratioClass(ratio)} />
      {caption === "" ? null : (
        <figcaption className={typographyVariants({ type: "body-sm" }).base()}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
