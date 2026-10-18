import type { TransformedData } from "../rules/tool-update-metadata/services/base-service";
import { normalizeDOI, titlesAgree } from "../rules/tool-update-metadata/policy";

export const REVIEW_FIELDS = ["title", "creators", "date", "publicationTitle", "proceedingsTitle", "journalAbbreviation", "volume", "issue", "pages", "DOI", "ISBN", "publisher", "place", "edition", "language", "url", "abstractNote"] as const;
export type ReviewField = typeof REVIEW_FIELDS[number];
export interface IdentifierCandidate {
  kind: "DOI" | "arXiv" | "ISBN" | "Title" | "PMID" | "PMCID";
  value: string;
  source: string;
  excerpt?: string;
}
export interface ReviewChange {
  field: ReviewField | "itemType";
  before: unknown;
  after: unknown;
}
export interface ReviewProposal {
  itemID: number;
  original: TransformedData;
  candidate: TransformedData;
  identifier: IdentifierCandidate;
  source: string;
  conflicts: string[];
  blocked: boolean;
  changes: ReviewChange[];
  preprintURL?: string;
  excludedFields?: ReviewField[];
}

export function normalizeArxiv(value: string): string {
  return value.trim().match(/^(?:https?:\/\/(?:export\.)?arxiv\.org\/(?:abs|pdf|html)\/|(?:doi:|https?:\/\/doi\.org\/)?10\.48550\/arxiv\.|arxiv:\s*)?((?:\d{4}\.\d{4,5}|[a-z.-]+\/\d{7})(?:v[1-9]\d*)?)(?:\.pdf)?(?:[?#].*)?$/i)?.[1].toLowerCase() || "";
}

export function normalizeISBN(value: string): string {
  const isbn = value.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const sum = [...isbn].reduce((total, digit, index) => total + (digit === "X" ? 10 : Number(digit)) * (10 - index), 0);
    return sum % 11 === 0 ? isbn : "";
  }
  if (/^97[89]\d{10}$/.test(isbn)) {
    const sum = [...isbn].reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1), 0);
    return sum % 10 === 0 ? isbn : "";
  }
  return "";
}

export function isbnEquivalent(a: string, b: string): boolean {
  const canonical = (value: string) => {
    const normalized = normalizeISBN(value);
    return normalized.length === 10 ? `978${normalized.slice(0, 9)}` : normalized.slice(0, 12);
  };
  return !!normalizeISBN(a) && !!normalizeISBN(b) && canonical(a) === canonical(b);
}

/** Cached PDF text is evidence for a candidate, never authority to overwrite an item. */
export function identifiersFromText(text: string, source: string): IdentifierCandidate[] {
  const result: IdentifierCandidate[] = [];
  const seen = new Set<string>();
  const add = (kind: IdentifierCandidate["kind"], value: string, offset: number) => {
    const key = `${kind}:${value}`;
    if (!value || seen.has(key) || result.length >= 20)
      return;
    seen.add(key);
    result.push({ kind, value, source, excerpt: text.slice(Math.max(0, offset - 50), offset + value.length + 70).replace(/\s+/g, " ") });
  };
  for (const match of text.matchAll(/\b10\.\d{4,9}\/[^\s<>"?#]+/g)) {
    let doi = match[0].replace(/[.,;:]+$/, "");
    while (doi.endsWith(")") && (doi.match(/\)/g)?.length || 0) > (doi.match(/\(/g)?.length || 0))
      doi = doi.slice(0, -1);
    add("DOI", normalizeDOI(doi), match.index!);
  }
  for (const match of text.matchAll(/(?:arxiv\s*:\s*|arxiv\.org\/(?:abs|pdf)\/)((?:\d{4}\.\d{4,5}|[a-z.-]+\/\d{7})(?:v[1-9]\d*)?)/gi))
    add("arXiv", normalizeArxiv(match[1]), match.index!);
  return result;
}

export function reviewChanges(original: TransformedData, candidate: TransformedData, includeType = false): ReviewChange[] {
  const fields: (ReviewField | "itemType")[] = [...REVIEW_FIELDS, ...includeType ? ["itemType" as const] : []];
  return fields.flatMap((field) => {
    const after = candidate[field as keyof TransformedData];
    const before = original[field as keyof TransformedData];
    if (!after || (Array.isArray(after) && !after.length) || JSON.stringify(before ?? "") === JSON.stringify(after))
      return [];
    return [{ field, before: before ?? "", after }];
  });
}

function firstCreator(data: TransformedData): string {
  const creator = data.creators?.[0];
  return creator ? (("name" in creator ? creator.name : creator.lastName) || "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") : "";
}

export function identityConflicts(original: TransformedData, candidate: TransformedData, allowYearChange = false): string[] {
  const conflicts: string[] = [];
  if (original.title && candidate.title && !titlesAgree(original.title, candidate.title))
    conflicts.push("title");
  const beforeYear = original.date?.match(/\b\d{4}\b/)?.[0];
  const afterYear = candidate.date?.match(/\b\d{4}\b/)?.[0];
  if (!allowYearChange && beforeYear && afterYear && beforeYear !== afterYear)
    conflicts.push("date");
  if (firstCreator(original) && firstCreator(candidate) && firstCreator(original) !== firstCreator(candidate))
    conflicts.push("creators");
  return conflicts;
}

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

function titleKey(data: TransformedData): string {
  const title = (data.title || "").normalize("NFKC").replace(/<[^>]*>/g, "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  const year = data.date?.match(/\b\d{4}\b/)?.[0] || "";
  const creator = firstCreator(data);
  return title.length >= 12 && year && creator ? `${title}:${year}:${creator}` : "";
}

export function duplicatePairs(selected: Set<number>, records: DuplicateRecord[]): DuplicatePair[] {
  const buckets = new Map<string, DuplicateRecord[]>();
  const keys = (record: DuplicateRecord) => {
    const doi = normalizeDOI(record.data.DOI);
    const title = titleKey(record.data);
    const arxiv = normalizeArxiv(record.data.url || "") || normalizeArxiv(record.data.DOI || "");
    return [doi && `doi:${doi}`, title && `title:${title}`, arxiv && `arxiv:${arxiv.replace(/v\d+$/, "")}`].filter(Boolean).map(key => `${record.libraryID}:${key}`);
  };
  for (const record of records) {
    for (const key of keys(record)) {
      if (!buckets.has(key))
        buckets.set(key, []);
      buckets.get(key)!.push(record);
    }
  }
  const pairs = new Map<string, DuplicatePair>();
  for (const left of records.filter(record => selected.has(record.id))) {
    for (const key of keys(left)) {
      for (const right of buckets.get(key) || []) {
        if (left.id === right.id)
          continue;
        const pairKey = [left.id, right.id].sort((a, b) => a - b).join(":");
        if (pairs.has(pairKey))
          continue;
        const leftDOI = normalizeDOI(left.data.DOI);
        const rightDOI = normalizeDOI(right.data.DOI);
        const leftArxiv = normalizeArxiv(left.data.url || "") || normalizeArxiv(left.data.DOI || "");
        const rightArxiv = normalizeArxiv(right.data.url || "") || normalizeArxiv(right.data.DOI || "");
        pairs.set(pairKey, {
          left,
          right,
          reason: key.includes(":doi:") ? "doi" : key.includes(":arxiv:") ? "arxiv" : "title",
          mergeable: left.data.itemType === right.data.itemType && left.preprint === right.preprint && !(leftDOI && rightDOI && leftDOI !== rightDOI)
            && !(leftArxiv && rightArxiv && leftArxiv !== rightArxiv),
        });
      }
    }
  }
  return [...pairs.values()];
}
