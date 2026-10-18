/**
 * JSON.stringify with object keys sorted, so documents that differ only in key
 * order (for example after a round trip through Postgres jsonb) compare equal.
 */
export const stableStringify = (value: unknown): string =>
  JSON.stringify(value, (_key, item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;

    const record = item as Record<string, unknown>;
    // No prototype, so a "__proto__" key is copied like any other key
    const sorted: Record<string, unknown> = Object.create(null);

    for (const key of Object.keys(record).sort()) {
      sorted[key] = record[key];
    }

    return sorted;
  }) ?? "";
