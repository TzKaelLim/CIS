import type {
  ComponentData,
  Config,
  Content,
  Data,
  Field,
  Fields,
} from "../../types";
import { PuckRichText } from "../../components/RichTextEditor/extension";
import { parseRichTextHtml } from "./html-to-json";

type Props = Record<string, unknown>;

const isRecord = (value: unknown): value is Props =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOwn = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key);

function migrateValue(value: unknown, field: Field, config: Config): unknown {
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
              ? migrateProps(item, field.arrayFields, config)
              : item
          )
        : value;
    case "object":
      return isRecord(value)
        ? migrateProps(value, field.objectFields, config)
        : value;
    case "slot":
      return Array.isArray(value) ? migrateContent(value, config) : value;
    default:
      return value;
  }
}

function migrateProps(props: Props, fields: Fields, config: Config): Props {
  const result: Props = { ...props };

  for (const key of Object.keys(fields)) {
    if (hasOwn(props, key)) {
      result[key] = migrateValue(props[key], fields[key], config);
    }
  }

  return result;
}

function migrateComponent(item: ComponentData, config: Config): ComponentData {
  const componentConfig = hasOwn(config.components, item.type)
    ? config.components[item.type]
    : undefined;

  if (!componentConfig?.fields || !isRecord(item.props)) return item;

  return {
    ...item,
    props: migrateProps(
      item.props,
      componentConfig.fields,
      config
    ) as ComponentData["props"],
  };
}

function migrateContent(content: Content, config: Config): Content {
  return content.map((item) =>
    isRecord(item) ? migrateComponent(item, config) : item
  );
}

/**
 * Converts every legacy HTML string in a richtext field to JSON (see
 * richTextHtmlToJson), parsed with that field's `options` and
 * `tiptap.extensions`. Fields are found through `config`, including richtext
 * inside array and object fields, slots, the root and legacy DropZone zones.
 * Other values are left as they are. Returns a new object; `data` is not
 * modified.
 */
export function migrateRichTextInData<T extends Data>(
  data: T,
  config: Config
): T {
  const rootFields = config.root?.fields;
  const root =
    rootFields && isRecord(data.root.props)
      ? {
          ...data.root,
          props: migrateProps(data.root.props, rootFields, config),
        }
      : data.root;

  // Object.fromEntries creates own properties, so even a zone named
  // "__proto__" is copied like any other
  const zones = data.zones
    ? Object.fromEntries(
        Object.keys(data.zones).map((key) => [
          key,
          migrateContent(data.zones![key], config),
        ])
      )
    : undefined;

  return {
    ...data,
    root,
    content: migrateContent(data.content, config),
    ...(zones ? { zones } : {}),
  };
}
