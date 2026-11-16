/**
 * Every object anywhere in a JSON Schema that has `key` as an own property.
 * The tests that collect fields with eachField compare their findings with
 * this, so a field that eachField does not reach cannot go unchecked.
 */
export function nodesWithKey(schema: unknown, key: string): object[] {
  const found: object[] = [];
  const stack: unknown[] = [schema];
  while (stack.length > 0) {
    const value = stack.pop();
    if (typeof value !== "object" || value === null) continue;
    if (
      !Array.isArray(value) &&
      Object.prototype.hasOwnProperty.call(value, key)
    ) {
      found.push(value);
    }
    stack.push(...Object.values(value));
  }
  return found;
}
