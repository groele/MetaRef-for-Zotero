import type { Identifiers } from "./identifiers";
import type { TransformedData } from "./services/base-service";
import { extractDOIFromUrl } from "./identifiers";

export function normalizeDOI(value?: string): string {
  return (extractDOIFromUrl(value || "") || value?.trim().match(/^10\/\S+$/)?.[0] || "").toLowerCase();
}

function normalizedTitle(value?: string): string {
  return (value || "").normalize("NFKC").replace(/<(?:[\w-]+:)?math\b[^>]*>[\s\S]*?<\/(?:[\w-]+:)?math\s*>/gi, math => math.replace(/<[^>]*>/g, "").replace(/\s+/g, "")).replace(/<(sub|sup)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_match, _tag, content: string) => content.replace(/<[^>]*>/g, "").trim()).replace(/<[^>]*>/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function titlesAgree(original: string, candidate: string): boolean {
  const a = normalizedTitle(original);
  const b = normalizedTitle(candidate);
  if (!a || !b)
    return false;
  if (a === b)
    return true;
  const left = new Set(a.split(" "));
  const right = new Set(b.split(" "));
  if (Math.min(left.size, right.size) < 5)
    return false;
  const common = [...left].filter(word => right.has(word)).length;
  return common / Math.max(left.size, right.size) >= 0.9;
}

export function metadataIdentity(
  original: { title?: string; date?: string },
  identifiers: Identifiers,
  candidate: TransformedData,
  lookup?: "identifier" | "url",
): "identifier" | "url" | "title" | false {
  const expected = normalizeDOI(identifiers.DOI);
  const returned = normalizeDOI(candidate.DOI);
  // A title match never overrides a contradictory DOI.
  if (expected && returned)
    return expected === returned ? "identifier" : false;
  if (lookup === "identifier" && [identifiers.DOI, identifiers.PMID, identifiers.PMCID, identifiers.SemanticScholarID, identifiers.arXiv].some(Boolean))
    return "identifier";
  if (lookup === "identifier" && identifiers.URL)
    return "url";
  if (lookup === "url" && identifiers.URL)
    return "url";
  if (!titlesAgree(original.title || "", candidate.title || ""))
    return false;
  const originalYear = original.date?.match(/\b\d{4}\b/)?.[0];
  const candidateYear = candidate.date?.match(/\b\d{4}\b/)?.[0];
  if (originalYear && candidateYear && Math.abs(Number(originalYear) - Number(candidateYear)) > 1)
    return false;
  return "title";
}

/** Earlier trusted services own conflicting fields; later services only fill gaps. */
export function mergeMetadata(current: TransformedData, incoming: TransformedData): TransformedData {
  const result = { ...current };
  for (const [field, value] of Object.entries(incoming)) {
    if (field === "creators") {
      if (!result.creators?.length && incoming.creators?.length)
        result.creators = incoming.creators;
    }
    else if (!result[field as keyof TransformedData] && value) {
      (result as Record<string, unknown>)[field] = value;
    }
  }
  return result;
}

export function metadataMissing(data: TransformedData, original: TransformedData, mode: "blank" | "all", itemType: string): string[] {
  const effective = mode === "blank" ? mergeMetadata(original, data) : mergeMetadata(data, original);
  const required = ["title", "date", "creators"];
  if (itemType === "journalArticle")
    required.push("publicationTitle");
  if (itemType === "conferencePaper")
    required.push("proceedingsTitle");
  return required.filter(field => field === "creators" ? !effective.creators?.length : !effective[field as keyof TransformedData]);
}

export function metadataValuesEqual(field: string, before: unknown, current: unknown): boolean {
  if (JSON.stringify(before ?? "") === JSON.stringify(current ?? ""))
    return true;
  if (field !== "accessDate" || typeof before !== "string" || typeof current !== "string")
    return false;
  const time = (value: string) => Date.parse(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(" ", "T")}Z` : value);
  const previous = time(before);
  return Number.isFinite(previous) && previous === time(current);
}
