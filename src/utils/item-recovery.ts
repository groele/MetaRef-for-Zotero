import type { ItemFieldChange } from "./item-mutation-journal";

/** Undo plugin-owned writes in reverse order while retaining intervening edits. */
export function rollbackItemChanges(current: Record<string, unknown>, changes: readonly ItemFieldChange[]) {
  const restored = { ...current };
  for (const change of [...changes].reverse()) {
    if (JSON.stringify(restored[change.field] ?? null) !== JSON.stringify(change.after ?? null))
      continue;
    if (change.before === undefined || change.before === null)
      delete restored[change.field];
    else
      restored[change.field] = change.before;
  }
  return restored;
}

/** Reapply a failed transaction's edits without replacing another writer's fields. */
export function rebaseItemSnapshot(base: Record<string, unknown>, desired: Record<string, unknown>, current: Record<string, unknown>) {
  const data = { ...current };
  const conflicts: string[] = [];
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const bookkeeping = new Set(["key", "version", "dateAdded", "dateModified"]);
  const fields = [...new Set([...Object.keys(base), ...Object.keys(desired), ...Object.keys(current)])].filter(field => !bookkeeping.has(field));
  // Type changes can erase fields or remap creator roles. A concurrent edit
  // requires a new review rather than a speculative partial type migration.
  if ((!same(base.itemType, desired.itemType) || !same(base.itemType, current.itemType))
    && fields.some(field => !same(base[field], current[field]))
    && fields.some(field => !same(desired[field], current[field]))) {
    return { data, conflicts: ["itemType"] };
  }
  for (const field of fields) {
    if (same(desired[field], base[field]))
      continue;
    if (!same(current[field], base[field]) && !same(current[field], desired[field])) {
      conflicts.push(field);
      continue;
    }
    if (Object.hasOwn(desired, field))
      data[field] = desired[field];
    else
      delete data[field];
  }
  return { data, conflicts };
}
