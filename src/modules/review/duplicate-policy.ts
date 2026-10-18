import type { DuplicatePair, DuplicateRecord } from "./duplicate-matching";
import { normalizeDOI } from "../rules/tool-update-metadata/policy";
import { normalizeArxiv } from "./policy";

export type MasterStrategy = "oldest" | "newest" | "modified" | "detailed";
export type DefaultDuplicateAction = "keep" | "discard" | "cancel" | "ask";

export function duplicateConcurrency(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 8 ? value : 3;
}

export function chooseMaster(records: DuplicateRecord[], strategy: MasterStrategy): DuplicateRecord {
  const date = (record: DuplicateRecord, field: string) => String((record.data as Record<string, unknown>)[field] || "");
  const score = (record: DuplicateRecord) => Object.entries(record.data).reduce((total, [field, value]) => total + (!["key", "version", "dateAdded", "dateModified", "itemType"].includes(field) && value ? Array.isArray(value) ? value.length : 1 : 0), 0);
  return [...records].sort((a, b) => {
    if (strategy === "detailed")
      return score(b) - score(a) || a.id - b.id;
    const field = strategy === "modified" ? "dateModified" : "dateAdded";
    const order = date(a, field).localeCompare(date(b, field)) || a.id - b.id;
    return strategy === "oldest" ? order : -order;
  })[0];
}

export function canMergePair(pair: DuplicatePair, differentTypes = false): boolean {
  if (pair.mergeable)
    return true;
  const left = normalizeDOI(pair.left.data.DOI);
  const right = normalizeDOI(pair.right.data.DOI);
  const a = normalizeArxiv(pair.left.data.url || "") || normalizeArxiv(pair.left.data.DOI || "");
  const b = normalizeArxiv(pair.right.data.url || "") || normalizeArxiv(pair.right.data.DOI || "");
  return differentTypes && !!left && left === right && pair.left.preprint === pair.right.preprint && !(a && b && a !== b);
}

export function duplicateGroups(pairs: DuplicatePair[]): DuplicateRecord[][] {
  const records = new Map<number, DuplicateRecord>();
  const parents = new Map<number, number>();
  const sizes = new Map<number, number>();
  const root = (id: number): number => {
    let current = id;
    while (parents.get(current) !== current) {
      const parent = parents.get(current)!;
      parents.set(current, parents.get(parent)!);
      current = parents.get(current)!;
    }
    return current;
  };
  for (const pair of pairs) {
    for (const record of [pair.left, pair.right]) {
      records.set(record.id, record);
      if (!parents.has(record.id)) {
        parents.set(record.id, record.id);
        sizes.set(record.id, 1);
      }
    }
    let a = root(pair.left.id);
    let b = root(pair.right.id);
    if (a !== b) {
      if (sizes.get(a)! < sizes.get(b)!)
        [a, b] = [b, a];
      parents.set(b, a);
      sizes.set(a, sizes.get(a)! + sizes.get(b)!);
      sizes.delete(b);
    }
  }
  const groups = new Map<number, DuplicateRecord[]>();
  for (const record of records.values()) {
    const id = root(record.id);
    if (!groups.has(id))
      groups.set(id, []);
    groups.get(id)!.push(record);
  }
  return [...groups.values()];
}
