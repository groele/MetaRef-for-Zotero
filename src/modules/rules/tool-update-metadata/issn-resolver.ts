import { requestCachedGET } from "../../../utils/http";
import { normalizeDOI } from "./policy";

/**
 * Normalizes a raw ISSN string or value into standard format: XXXX-XXXX (e.g. 1359-6454).
 * Returns undefined if the string does not represent a valid 8-character ISSN.
 */
export function normalizeISSN(raw?: unknown): string | undefined {
  if (!raw || typeof raw !== "string")
    return undefined;

  const cleaned = raw.trim().toUpperCase().replace(/[^0-9X]/g, "");
  if (cleaned.length !== 8)
    return undefined;

  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export interface ResolveISSNOptions {
  doi?: string;
  publicationTitle?: string;
  signal?: AbortSignal;
  debug?: (msg: string) => void;
}

export interface ResolveISSNResult {
  issn: string;
  source: "OpenAlex" | "Crossref";
}

/**
 * Query OpenAlex for journal ISSN via DOI or publicationTitle.
 */
export async function fetchISSNFromOpenAlex(opts: ResolveISSNOptions): Promise<string | undefined> {
  const { doi, publicationTitle, signal, debug } = opts;
  const cleanDOI = normalizeDOI(doi);

  // 1. Query by DOI
  if (cleanDOI) {
    try {
      const url = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDOI)}?select=primary_location`;
      debug?.(`[OpenAlex] Fetching work by DOI: ${cleanDOI}`);
      const res = await requestCachedGET(url, {
        headers: { "User-Agent": "Zotero MetaFlow (mailto:contact@zotero-flow.org)" },
        timeout: 10_000,
      }, signal);
      if (res && (res.status === 200 || res.status === undefined)) {
        const body = JSON.parse(res.response || res.responseText || "{}");
        const source = body.primary_location?.source;
        const candidate = source?.issn_l || source?.issn?.[0];
        const normalized = normalizeISSN(candidate);
        if (normalized) {
          debug?.(`[OpenAlex] Resolved ISSN via DOI: ${normalized}`);
          return normalized;
        }
      }
    }
    catch (e) {
      debug?.(`[OpenAlex] Work query failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 2. Query by publicationTitle
  if (publicationTitle?.trim()) {
    try {
      const url = `https://api.openalex.org/sources?search=${encodeURIComponent(publicationTitle.trim())}&per-page=1&select=issn_l,issn`;
      debug?.(`[OpenAlex] Searching source by publicationTitle: ${publicationTitle}`);
      const res = await requestCachedGET(url, {
        headers: { "User-Agent": "Zotero MetaFlow (mailto:contact@zotero-flow.org)" },
        timeout: 10_000,
      }, signal);
      if (res && (res.status === 200 || res.status === undefined)) {
        const body = JSON.parse(res.response || res.responseText || "{}");
        const source = body.results?.[0];
        const candidate = source?.issn_l || source?.issn?.[0];
        const normalized = normalizeISSN(candidate);
        if (normalized) {
          debug?.(`[OpenAlex] Resolved ISSN via publicationTitle: ${normalized}`);
          return normalized;
        }
      }
    }
    catch (e) {
      debug?.(`[OpenAlex] Source search failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return undefined;
}

/**
 * Query Crossref for journal ISSN via DOI or publicationTitle.
 */
export async function fetchISSNFromCrossref(opts: ResolveISSNOptions): Promise<string | undefined> {
  const { doi, publicationTitle, signal, debug } = opts;
  const cleanDOI = normalizeDOI(doi);

  // 1. Query by DOI
  if (cleanDOI) {
    try {
      const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDOI)}?select=ISSN,issn-type`;
      debug?.(`[Crossref] Fetching work by DOI: ${cleanDOI}`);
      const res = await requestCachedGET(url, {
        headers: { "User-Agent": "Zotero MetaFlow (mailto:contact@zotero-flow.org)" },
        timeout: 10_000,
      }, signal);
      if (res && (res.status === 200 || res.status === undefined)) {
        const body = JSON.parse(res.response || res.responseText || "{}");
        const message = body.message;
        const candidate = message?.ISSN?.[0] || message?.["issn-type"]?.[0]?.value;
        const normalized = normalizeISSN(candidate);
        if (normalized) {
          debug?.(`[Crossref] Resolved ISSN via DOI: ${normalized}`);
          return normalized;
        }
      }
    }
    catch (e) {
      debug?.(`[Crossref] Work query failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 2. Query by publicationTitle
  if (publicationTitle?.trim()) {
    try {
      const url = `https://api.crossref.org/journals?query=${encodeURIComponent(publicationTitle.trim())}&rows=1`;
      debug?.(`[Crossref] Searching journal by title: ${publicationTitle}`);
      const res = await requestCachedGET(url, {
        headers: { "User-Agent": "Zotero MetaFlow (mailto:contact@zotero-flow.org)" },
        timeout: 10_000,
      }, signal);
      if (res && (res.status === 200 || res.status === undefined)) {
        const body = JSON.parse(res.response || res.responseText || "{}");
        const journal = body.message?.items?.[0];
        const candidate = journal?.ISSN?.[0] || journal?.["issn-type"]?.[0]?.value;
        const normalized = normalizeISSN(candidate);
        if (normalized) {
          debug?.(`[Crossref] Resolved ISSN via publicationTitle: ${normalized}`);
          return normalized;
        }
      }
    }
    catch (e) {
      debug?.(`[Crossref] Journal query failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return undefined;
}

/**
 * Main resolver: tries OpenAlex first, falls back to Crossref.
 */
export async function resolveMissingISSN(opts: ResolveISSNOptions): Promise<ResolveISSNResult | null> {
  // 1. Try OpenAlex
  const openAlexISSN = await fetchISSNFromOpenAlex(opts);
  if (openAlexISSN) {
    return { issn: openAlexISSN, source: "OpenAlex" };
  }

  // 2. Fall back to Crossref
  const crossrefISSN = await fetchISSNFromCrossref(opts);
  if (crossrefISSN) {
    return { issn: crossrefISSN, source: "Crossref" };
  }

  return null;
}
