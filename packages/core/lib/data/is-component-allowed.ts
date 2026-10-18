/** The allow and disallow lists of a slot or a DropZone. */
export type ComponentAllowRules = {
  allow?: readonly string[];
  disallow?: readonly string[];
};

/**
 * Checks whether a component type may be placed in a zone with the given
 * allow/disallow lists. An unset componentType is always accepted.
 *
 * Imports nothing, so the React-free `@tzuchi/tceditor/rules` entry can
 * export it.
 */
export const isComponentAllowed = (
  componentType: string | null | undefined,
  { allow, disallow }: ComponentAllowRules
): boolean => {
  if (!componentType) {
    return true;
  }

  const allowed = new Set(allow);
  const disallowed = new Set(disallow);

  if (disallow) {
    // Always allow a component that is explicitly allowed, even if disallowed.
    if (disallowed.has(componentType) && allowed.has(componentType)) {
      disallowed.delete(componentType);
    }

    return !disallowed.has(componentType);
  } else if (allow) {
    // If allow is set, only allow components that are explicitly allowed.
    return allowed.has(componentType);
  }

  return true;
};
