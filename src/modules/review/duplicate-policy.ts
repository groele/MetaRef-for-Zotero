import type { DuplicatePair, DuplicateRecord } from "./policy";
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
  const edges = new Map<number, Set<number>>();
  for (const pair of pairs) {
    records.set(pair.left.id, pair.left);
    records.set(pair.right.id, pair.right);
    for (const [a, b] of [[pair.left.id, pair.right.id], [pair.right.id, pair.left.id]]) {
      if (!edges.has(a))
        edges.set(a, new Set());
      edges.get(a)!.add(b);
    }
  }
  const visited = new Set<number>();
  const groups: DuplicateRecord[][] = [];
  for (const id of records.keys()) {
    if (visited.has(id))
      continue;
    const queue = [id];
    const group: DuplicateRecord[] = [];
    for (let index = 0; index < queue.length; index++) {
      const current = queue[index];
      if (visited.has(current))
        continue;
      visited.add(current);
      group.push(records.get(current)!);
      queue.push(...edges.get(current) || []);
    }
    groups.push(group);
  }
  return groups;
}
