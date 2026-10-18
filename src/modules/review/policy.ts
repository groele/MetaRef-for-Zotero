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

export interface MetadataDecision {
  proposal: ReviewProposal;
  fields: Set<string>;
  acknowledged: boolean;
  action: "skip" | "update" | "related";
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

export function firstCreator(data: TransformedData): string {
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
