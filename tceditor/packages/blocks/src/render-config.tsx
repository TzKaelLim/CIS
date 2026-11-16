import type {
  ComponentConfig,
  Config,
  CustomField,
  SlotComponent,
} from "@tzuchi/tceditor";
import { RichTextContent } from "@tzuchi/tceditor/rsc";
import type { RichTextDoc } from "@tzuchi/tceditor/rules";
import {
  eachField,
  fieldKindOf,
  fieldPathKey,
  toJsonSchema,
  toPuckFields,
} from "@tzuchi/tceditor-spec";
import type {
  AnyBlockSpec,
  BlockProps,
  FieldFactories,
  FieldKind,
  ImageValue,
  SlotItem,
} from "@tzuchi/tceditor-spec";
import { isValidElement, type ComponentType, type ReactNode } from "react";
import type { AssetSource } from "./asset-source";
import type { ResolvedImage } from "./image/view";
import { PageRootView } from "./root/view";
import { blockSpecs } from "./specs";
import { views } from "./views";

/**
 * What a view receives for a value of its spec's output type (spec §7.1): a
 * slot or richtext becomes a ReactNode, an image a ResolvedImage, and lists
 * and groups are mapped field by field. Inline-editable text is a ReactNode in
 * the editor although its type stays string, so views declare it ReactNode.
 */
export type ViewValue<V> = V extends readonly SlotItem[]
  ? ReactNode
  : V extends RichTextDoc
  ? ReactNode
  : V extends ImageValue
  ? ResolvedImage
  : V extends readonly (infer Item)[]
  ? ViewValue<Item>[]
  : V extends object
  ? { [K in keyof V]: ViewValue<V[K]> }
  : V;

/** The props of a block's view: exactly the spec's fields, as ViewValue. */
export type ViewProps<S extends AnyBlockSpec> = {
  [K in keyof BlockProps<S>]: ViewValue<BlockProps<S>[K]>;
};

/** One view per block type, keyed by type. A block without a view fails to compile. */
export type BlockViews<B extends readonly AnyBlockSpec[]> = {
  [S in B[number] as S["type"]]: ComponentType<ViewProps<S>>;
};

// Render never shows fields, but it reads their types to turn slots into
// components and richtext into React (useSlots, useRichtextProps), so the
// render config carries the converted fields too. The image field's widget
// is the editor's business (editor-config.tsx); here it renders nothing.
const renderOnlyImageField: NonNullable<FieldFactories["image"]> = ({
  label,
}) => {
  const field: CustomField<ImageValue> = {
    type: "custom",
    label,
    render: () => <></>,
  };
  return field;
};

const factories: FieldFactories = { image: renderOnlyImageField };

/** Turns one stored value (or what Render made of it) into a view's value. */
type Convert = (value: unknown) => unknown;

/** A spec field, the fields inside it (an object's, or a list's items') and its default. */
type SpecField = {
  name: string;
  kind: FieldKind;
  fields: SpecField[];
  /** The `default` of its JSON Schema node (frozen with the schema); undefined without one. */
  fallback: unknown;
};

/** A field for `picker`: its name, how to convert its value, and its default. */
type PickedField = readonly [name: string, convert: Convert, fallback: unknown];

const passThrough: Convert = (value) => value;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Richtext arrives as React (RichTextContent, or the inline editor). A
 * document that did not, a default filled in by `picker`, goes through the
 * shared renderer too; anything else renders nothing.
 */
function asNode(value: unknown): ReactNode {
  if (isValidElement(value)) return value;
  return isRecord(value) ? <RichTextContent content={value} /> : null;
}

/** A slot is a component once Render or the editor has mapped it; a list item without its slot renders nothing. */
function slotNode(value: unknown): ReactNode {
  if (typeof value !== "function") return null;
  const Slot = value as SlotComponent;
  return <Slot className="tcb-stack" />;
}

function resolveImage(
  value: unknown,
  assets: Pick<AssetSource, "get">
): ResolvedImage {
  const image: Partial<Record<keyof ImageValue, unknown>> = isRecord(value)
    ? value
    : {};
  if (typeof image.assetId !== "string" || image.assetId === "") {
    return { status: "empty" };
  }
  const asset = assets.get(image.assetId);
  if (!asset) return { status: "missing", assetId: image.assetId };
  const decorative = image.decorative === true;
  return {
    status: "ok",
    src: asset.src,
    width: asset.width,
    height: asset.height,
    alt: decorative || typeof image.alt !== "string" ? "" : image.alt,
    decorative,
  };
}

/**
 * The spec's fields as a tree, read from its JSON Schema, with their
 * defaults: at the top level the values of toDefaultProps(spec), in a list's
 * items those of the editor's defaultItemProps, and in a group its fields'.
 */
function specFields(spec: AnyBlockSpec): SpecField[] {
  const top: SpecField[] = [];
  const children = new Map<string, SpecField[]>([["", top]]);
  // eachField visits a field before the fields inside it. A list item's
  // field belongs to the list: ["columns", "[]", "content"] → "columns".
  eachField(toJsonSchema(spec), ({ path, name, node }) => {
    const field: SpecField = {
      name,
      kind: fieldKindOf(node),
      fields: [],
      fallback: Object.prototype.hasOwnProperty.call(node, "default")
        ? node.default
        : undefined,
    };
    const parent = path.slice(0, path[path.length - 2] === "[]" ? -2 : -1);
    children.get(fieldPathKey(parent))?.push(field);
    children.set(fieldPathKey(path), field.fields);
  });
  return top;
}

/**
 * Picks exactly these fields (own properties only) and converts each value.
 * A missing value (undefined or null) becomes the field's default first:
 * pages saved before a compatible change added the field (spec §4.6) lack
 * it, Storybook sets a cleared control to undefined, and Render turns a
 * missing richtext, or a missing list or group around one, into null. The
 * validator never stores null, because specs have no nullable fields.
 */
function picker(
  fields: readonly PickedField[]
): (value: unknown) => Record<string, unknown> {
  return (value) => {
    const record = isRecord(value) ? value : {};
    return Object.fromEntries(
      fields.map(([name, convert, fallback]) => {
        const stored = Object.prototype.hasOwnProperty.call(record, name)
          ? record[name]
          : undefined;
        return [name, convert(stored ?? fallback)];
      })
    );
  };
}

/**
 * Converts an object's fields, or null when no field inside needs
 * converting or has a default.
 */
function objectConverter(
  fields: readonly SpecField[],
  assets: Pick<AssetSource, "get">
): Convert | null {
  const picks = fields.map(
    (field) => [field.name, converterOf(field, assets), field.fallback] as const
  );
  if (
    picks.every(
      ([, convert, fallback]) => convert === null && fallback === undefined
    )
  ) {
    return null;
  }
  return picker(
    picks.map(([name, convert, fallback]) => [
      name,
      convert ?? passThrough,
      fallback,
    ])
  );
}

/** How a field's value reaches the view (spec §7.1); null passes it through. */
function converterOf(
  field: SpecField,
  assets: Pick<AssetSource, "get">
): Convert | null {
  switch (field.kind) {
    case "slot":
      return slotNode;
    case "richtext":
      return asNode;
    case "image":
      return (value) => resolveImage(value, assets);
    case "object":
      return objectConverter(field.fields, assets);
    case "array": {
      const item = objectConverter(field.fields, assets);
      return item && ((value) => (Array.isArray(value) ? value : []).map(item));
    }
    default:
      return null;
  }
}

/** A function or class component, or what memo(), forwardRef() and lazy() return. */
function isComponentType(value: unknown): boolean {
  return (
    typeof value === "function" ||
    (typeof value === "object" &&
      value !== null &&
      typeof (value as { $$typeof?: unknown }).$$typeof === "symbol")
  );
}

function viewOf(
  views: object,
  type: string
): ComponentType<Record<string, unknown>> {
  const view: unknown = Object.prototype.hasOwnProperty.call(views, type)
    ? (views as Record<string, unknown>)[type]
    : undefined;
  if (!isComponentType(view)) {
    throw new TypeError(`buildRenderConfig: block "${type}" has no view`);
  }
  // BlockViews ties each view's props to its spec (ViewProps); the values
  // built by the converters follow the same spec at run time.
  return view as ComponentType<Record<string, unknown>>;
}

/**
 * The Puck config for Render (spec §7.1), built from the specs alone: each
 * block's render picks exactly the spec's fields (never Puck's props, which
 * hold functions such as renderDropZone), fills a missing field with the
 * spec's default (also in list items and groups), turns slots into <Slot />,
 * richtext into React and images into a ResolvedImage with `assets.get`,
 * passes everything else through, and renders the block's view. A slot
 * missing from a list item renders nothing, which looks like an empty one.
 * Server-safe: no "use client", no runtime import of the main
 * @tzuchi/tceditor entry.
 */
export function buildRenderConfig<
  const B extends readonly AnyBlockSpec[]
>(options: {
  blocks: B;
  views: BlockViews<B>;
  assets: Pick<AssetSource, "get">;
}): Config {
  const { blocks, assets } = options;
  const components = Object.fromEntries(
    blocks.map((spec) => {
      const View = viewOf(options.views, spec.type);
      const pickProps = picker(
        specFields(spec).map((field) => [
          field.name,
          converterOf(field, assets) ?? passThrough,
          field.fallback,
        ])
      );
      const component: ComponentConfig = {
        label: spec.label,
        fields: toPuckFields(spec, factories),
        render: (props) => <View {...pickProps(props)} />,
      };
      return [spec.type, component];
    })
  );
  return {
    components,
    root: { render: PageRootView },
  };
}

/**
 * The Puck config of the registered blocks (blockSpecs with their views) for
 * the public page, Storybook and, through createEditorConfig, the editor.
 */
export function createRenderConfig(options: {
  assets: Pick<AssetSource, "get">;
}): Config {
  return buildRenderConfig({
    blocks: blockSpecs,
    views,
    assets: options.assets,
  });
}
