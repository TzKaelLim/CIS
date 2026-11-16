import type {
  ComponentData,
  Config,
  Content,
  Data,
  Field,
  Fields,
  RootData,
} from "../../types";
import { PuckRichText } from "../../components/RichTextEditor/extension";
import { lookupComponentConfig } from "../lookup-component-config";
import { parseRichTextHtml } from "./html-to-json";

type Props = Record<string, unknown>;

export type MigrateRichTextOptions = {
  /**
   * Returns the fields of the root (`isRoot: true`) or of one component
   * (`isRoot: false`), for example the fields its `resolveFields` would add.
   * Must be synchronous: returning a promise throws a TypeError. Its result
   * replaces that item's static `fields`; `undefined` keeps the static
   * `fields` from `config`.
   *
   * It is also called for types that `config` does not list, such as
   * `constructor` or `__proto__`; look up configs with an own-key check (for
   * example `lookupComponentConfig`).
   */
  getFields?: (
    item: ComponentData | RootData,
    ctx: { isRoot: boolean }
  ) => Fields | undefined;
};

type Context = {
  config: Config;
  getFields: MigrateRichTextOptions["getFields"];
};

const isRecord = (value: unknown): value is Props =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOwn = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key);

// getFields must be synchronous: a promise (for example from an async
// resolveFields) has no own keys, so nothing would be converted
const callGetFields = (
  getFields: MigrateRichTextOptions["getFields"],
  item: ComponentData | RootData,
  isRoot: boolean
): Fields | undefined => {
  const fields = getFields?.(item, { isRoot });

  if (fields && typeof (fields as { then?: unknown }).then === "function") {
    throw new TypeError(
      "migrateRichTextInData: options.getFields must be synchronous"
    );
  }

  return fields;
};

function migrateValue(value: unknown, field: Field, context: Context): unknown {
  switch (field.type) {
    case "richtext":
      // Parse with the field's own extensions, like v0.23.0's renderer, so
      // the result only uses what the field's editor can show
      return typeof value === "string"
        ? parseRichTextHtml(value, [
            PuckRichText.configure(field.options),
            ...(field.tiptap?.extensions ?? []),
          ])
        : value;
    case "array":
      return Array.isArray(value)
        ? value.map((item) =>
            isRecord(item)
              ? migrateProps(item, field.arrayFields, context)
              : item
          )
        : value;
    case "object":
      return isRecord(value)
        ? migrateProps(value, field.objectFields, context)
        : value;
    case "slot":
      return Array.isArray(value) ? migrateContent(value, context) : value;
    default:
      return value;
  }
}

function migrateProps(props: Props, fields: Fields, context: Context): Props {
  const result: Props = { ...props };

  for (const key of Object.keys(fields)) {
    if (hasOwn(props, key)) {
      result[key] = migrateValue(props[key], fields[key], context);
    }
  }

  return result;
}

function migrateComponent(
  item: ComponentData,
  context: Context
): ComponentData {
  if (!isRecord(item.props)) return item;

  const fields =
    callGetFields(context.getFields, item, false) ??
    lookupComponentConfig(context.config, item.type)?.fields;

  if (!fields) return item;

  return {
    ...item,
    props: migrateProps(item.props, fields, context) as ComponentData["props"],
  };
}

function migrateContent(content: Content, context: Context): Content {
  return content.map((item) =>
    isRecord(item) ? migrateComponent(item, context) : item
  );
}

/**
 * Converts every legacy HTML string in a richtext field to JSON (see
 * richTextHtmlToJson), parsed with that field's `options` and
 * `tiptap.extensions`. Fields are found through `config`, including richtext
 * inside array and object fields, slots, the root and legacy DropZone zones.
 * Other values are left as they are. Returns a new object; `data` is not
 * modified.
 *
 * Only the static `fields` in `config` are known here, so a richtext field
 * that only `resolveFields` adds is skipped: `resolveFields` may be async and
 * needs the editor's state, and this function never calls it. To convert such
 * fields, pass `options.getFields`, a synchronous function called once for the
 * root and once for every component (in slots and zones too) that returns
 * that item's fields. Throws a TypeError if `getFields` returns a promise.
 */
export function migrateRichTextInData<T extends Data>(
  data: T,
  config: Config,
  options: MigrateRichTextOptions = {}
): T {
  const context: Context = { config, getFields: options.getFields };

  const rootFields = isRecord(data.root.props)
    ? callGetFields(options.getFields, data.root, true) ?? config.root?.fields
    : undefined;
  const root =
    rootFields && isRecord(data.root.props)
      ? {
          ...data.root,
          props: migrateProps(data.root.props, rootFields, context),
        }
      : data.root;

  const content = migrateContent(data.content, context);

  // Object.fromEntries creates own properties, so even a zone named
  // "__proto__" is copied like any other
  const zones = data.zones
    ? Object.fromEntries(
        Object.keys(data.zones).map((key) => [
          key,
          migrateContent(data.zones![key], context),
        ])
      )
    : undefined;

  return {
    ...data,
    root,
    content,
    ...(zones ? { zones } : {}),
  };
}
