import type { TransformedData } from "../rules/tool-update-metadata/services/base-service";
import type { IdentifierCandidate, MetadataDecision, ReviewProposal } from "./policy";

import { normalizeDOI, titlesAgree } from "../rules/tool-update-metadata/policy";
import { firstCreator, isbnEquivalent, normalizeArxiv } from "./policy";

export function hasLocalCorroboration(original: TransformedData): boolean {
  return Boolean(original.title?.trim() && (original.date?.match(/\b\d{4}\b/) || firstCreator(original)));
}

/** PDF references and multiple editions are not resolved by candidate order. */
export function automaticIdentifier(candidates: IdentifierCandidate[]): IdentifierCandidate | undefined {
  const unique = [...new Map(candidates.map(candidate => [`${candidate.kind}:${candidate.value}`, candidate])).values()];
  const explicit = unique.filter(candidate => !candidate.excerpt);
  const source = explicit.length ? explicit : unique;
  for (const kind of ["DOI", "arXiv", "PMID", "PMCID", "ISBN", "Title"] as const) {
    const matches = source.filter(candidate => candidate.kind === kind);
    if (!matches.length)
      continue;
    const first = matches[0];
    const equivalent = (candidate: IdentifierCandidate) => kind === "ISBN" ? isbnEquivalent(first.value, candidate.value) : kind === "DOI" ? normalizeDOI(first.value) === normalizeDOI(candidate.value) : kind === "arXiv" ? normalizeArxiv(first.value) === normalizeArxiv(candidate.value) : first.value === candidate.value;
    return matches.every(equivalent) ? first : undefined;
  }
}

export function automaticSelection(proposal: ReviewProposal, overwrite = false, repairCreators = false): { selection?: MetadataDecision; reason?: "blocked" | "conflict" | "evidence" } {
  if (proposal.blocked)
    return { reason: "blocked" };
  if (proposal.conflicts.length)
    return { reason: "conflict" };
  const originalDOI = normalizeDOI(proposal.original.DOI);
  const returnedDOI = normalizeDOI(proposal.candidate.DOI);
  if (!proposal.preprintURL && originalDOI && returnedDOI && !originalDOI.startsWith("10/") && originalDOI !== returnedDOI)
    return { reason: "conflict" };
  // A title search or PDF excerpt needs independent agreement with existing metadata.
  if (proposal.identifier.kind === "Title" || proposal.identifier.excerpt) {
    const beforeYear = proposal.original.date?.match(/\b\d{4}\b/)?.[0];
    const afterYear = proposal.candidate.date?.match(/\b\d{4}\b/)?.[0];
    const author = firstCreator(proposal.original);
    if (!proposal.original.title || !proposal.candidate.title || !titlesAgree(proposal.original.title, proposal.candidate.title)
      || (!(beforeYear && beforeYear === afterYear) && !(author && author === firstCreator(proposal.candidate)))) {
      return { reason: "evidence" };
    }
  }
  const related = !!proposal.preprintURL;
  const excluded = new Set<string>(proposal.excludedFields);
  const fields = new Set(proposal.changes.filter(change => !excluded.has(change.field)
    && (related || overwrite || (repairCreators && change.field === "creators") || (Array.isArray(change.before) ? !change.before.length : !String(change.before ?? "").trim()))).map(change => change.field));
  return { selection: { proposal, action: related ? "related" : "update", acknowledged: true, fields } };
}
