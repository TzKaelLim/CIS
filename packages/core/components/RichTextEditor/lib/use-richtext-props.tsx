import { useMemo } from "react";
import { BaseField, Fields, WithPuckProps } from "../../../types";
import { RichTextContent } from "../components/RichTextContent";
import { mapDeep } from "./mapDeep";

export function useRichtextProps(
  fields:
    | Fields<any, {}>
    | Fields<any, { type: string } & BaseField>
    | undefined,
  props: WithPuckProps<{
    [x: string]: any;
  }>
) {
  const findAllRichtextPaths = (
    fields:
      | Fields<any, {}>
      | Fields<any, { type: string } & BaseField>
      | undefined,
    path: string[] = []
  ): string[][] => {
    if (!fields) return [];

    const result: string[][] = [];

    for (const [key, field] of Object.entries(fields)) {
      const currentPath = [...path, key];

      if (field.type === "richtext") {
        result.push(currentPath);
      }

      if (field.type === "array" && "arrayFields" in field) {
        result.push(...findAllRichtextPaths(field.arrayFields, currentPath));
      }

      if (field.type === "object" && "objectFields" in field) {
        result.push(...findAllRichtextPaths(field.objectFields, currentPath));
      }
    }

    return result;
  };

  const richtextPaths = useMemo(() => findAllRichtextPaths(fields), [fields]);

  const richtextProps = useMemo(() => {
    if (!richtextPaths?.length) return {};

    let result = { ...props };

    for (const path of richtextPaths) {
      result = mapDeep(result, path, (content) => (
        // Deterministic key to avoid hydration mismatch. No array index needed
        // because mapDeep places each element in a separate array object, not as siblings.
        <RichTextContent key={path.join(".")} content={content} />
      ));
    }

    return result;
  }, [richtextPaths, props]);

  return richtextProps;
}
