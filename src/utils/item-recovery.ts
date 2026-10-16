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
