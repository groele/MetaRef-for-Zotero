import type { TransformedData } from "../rules/tool-update-metadata/services/base-service";
import { normalizeDOI } from "../rules/tool-update-metadata/policy";
import { firstCreator, normalizeArxiv } from "./policy";

export interface DuplicateRecord {
  id: number;
  libraryID: number;
  data: TransformedData;
  preprint: boolean;
}
export interface DuplicatePair {
  left: DuplicateRecord;
  right: DuplicateRecord;
  reason: "doi" | "title" | "arxiv";
  mergeable: boolean;
}

export type DuplicateMatchEvent = { kind: "checkpoint"; stage: "index" | "match"; processed: number } | { kind: "pair"; pair: DuplicatePair };

function titleKey(data: TransformedData): string {
  const title = (data.title || "").normalize("NFKC").replace(/<[^>]*>/g, "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  const year = data.date?.match(/\b\d{4}\b/)?.[0] || "";
  const creator = firstCreator(data);
  return title.length >= 12 && year && creator ? `${title}:${year}:${creator}` : "";
}

export function duplicatePairs(selected: Set<number>, records: DuplicateRecord[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  for (const event of duplicateMatchEvents(selected, records)) {
    if (event.kind === "pair")
      pairs.push(event.pair);
  }
  return pairs;
}

export interface DuplicateMatchOptions {
  compact?: boolean;
  accept?: (pair: DuplicatePair) => boolean;
  merge?: (pair: DuplicatePair) => boolean;
}

export function* duplicateMatchEvents(selected: Set<number>, records: DuplicateRecord[], options: DuplicateMatchOptions = {}): Generator<DuplicateMatchEvent> {
  const indexed: { record: DuplicateRecord; doi: string; arxiv: string; keys: string[] }[] = [];
  const buckets = new Map<string, typeof indexed>();
  for (const record of records) {
    const doi = normalizeDOI(record.data.DOI);
    const title = titleKey(record.data);
    const arxiv = normalizeArxiv(record.data.url || "") || normalizeArxiv(record.data.DOI || "");
    const keys = [doi && `doi:${doi}`, title && `title:${title}`, arxiv && `arxiv:${arxiv.replace(/v\d+$/, "")}`].filter(Boolean).map(key => `${record.libraryID}:${key}`);
    const entry = { record, doi, arxiv, keys };
    indexed.push(entry);
    for (const key of entry.keys) {
      if (!buckets.has(key))
        buckets.set(key, []);
      buckets.get(key)!.push(entry);
    }
    if (indexed.length % 250 === 0)
      yield { kind: "checkpoint", stage: "index", processed: indexed.length };
  }
  const seen = new Set<string>();
  let processed = 0;
  if (options.compact) {
    // Preserve both candidate and mergeable connected components without storing
    // every edge of dense groups. Exclusions must participate in traversal.
    for (const kind of [":doi:", ":arxiv:", ":title:"]) {
      for (const [key, entries] of buckets) {
        if (!key.includes(kind) || entries.length < 2)
          continue;
        for (const mergeOnly of [false, true]) {
          const remaining = new Set(entries);
          const roots = new Set(entries.filter(entry => selected.has(entry.record.id)));
          for (const root of roots) {
            remaining.delete(root);
            roots.delete(root);
            const queue = [root];
            for (let head = 0; head < queue.length; head++) {
              const a = queue[head];
              const candidates = selected.has(a.record.id) ? remaining : roots;
              for (const b of candidates) {
                if (++processed % 250 === 0)
                  yield { kind: "checkpoint", stage: "match", processed };
                const pair: DuplicatePair = {
                  left: a.record,
                  right: b.record,
                  reason: kind === ":doi:" ? "doi" : kind === ":arxiv:" ? "arxiv" : "title",
                  mergeable: a.record.data.itemType === b.record.data.itemType && a.record.preprint === b.record.preprint && !(a.doi && b.doi && a.doi !== b.doi) && !(a.arxiv && b.arxiv && a.arxiv !== b.arxiv),
                };
                if (options.accept && !options.accept(pair))
                  continue;
                if (mergeOnly && !(options.merge ? options.merge(pair) : pair.mergeable))
                  continue;
                remaining.delete(b);
                roots.delete(b);
                queue.push(b);
                const pairKey = a.record.id < b.record.id ? `${a.record.id}:${b.record.id}` : `${b.record.id}:${a.record.id}`;
                if (!seen.has(pairKey)) {
                  seen.add(pairKey);
                  yield { kind: "pair", pair };
                }
              }
            }
          }
        }
      }
    }
    return;
  }
  for (const a of indexed) {
    const left = a.record;
    if (!selected.has(left.id))
      continue;
    for (const key of a.keys) {
      for (const b of buckets.get(key) || []) {
        if (++processed % 250 === 0)
          yield { kind: "checkpoint", stage: "match", processed };
        const right = b.record;
        if (left.id === right.id)
          continue;
        const pairKey = [left.id, right.id].sort((a, b) => a - b).join(":");
        if (seen.has(pairKey))
          continue;
        seen.add(pairKey);
        yield { kind: "pair", pair: {
          left,
          right,
          reason: key.includes(":doi:") ? "doi" : key.includes(":arxiv:") ? "arxiv" : "title",
          mergeable: left.data.itemType === right.data.itemType && left.preprint === right.preprint && !(a.doi && b.doi && a.doi !== b.doi)
            && !(a.arxiv && b.arxiv && a.arxiv !== b.arxiv),
        } };
      }
    }
  }
}
