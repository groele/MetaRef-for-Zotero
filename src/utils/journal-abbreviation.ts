import type { JournalLookupMaps } from "./data-loader";
import { normalizeKey } from "./str";

export function journalTitleKey(value: string): string {
  return value.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
}

export function buildJournalMaps(data: Record<string, string> | Iterable<readonly [string, string]>): JournalLookupMaps {
  const abbrMap = new Map<string, string>();
  const titleMap = new Map<string, string>();
  const exactAbbrMap = new Map<string, string>();
  const ambiguousKeys = new Set<string>();
  const exactAmbiguousKeys = new Set<string>();
  const rows = Symbol.iterator in data ? data : Object.entries(data);
  for (const [title, abbr] of rows) {
    const exact = journalTitleKey(title);
    const normalized = normalizeKey(exact);
    if (abbrMap.has(normalized) && abbrMap.get(normalized) !== abbr)
      ambiguousKeys.add(normalized);
    if (exactAbbrMap.has(exact) && exactAbbrMap.get(exact) !== abbr)
      exactAmbiguousKeys.add(exact);
    if (!abbrMap.has(normalized))
      abbrMap.set(normalized, abbr);
    if (!titleMap.has(normalized))
      titleMap.set(normalized, title);
    if (!exactAbbrMap.has(exact))
      exactAbbrMap.set(exact, abbr);
  }
  for (const key of ambiguousKeys) {
    abbrMap.delete(key);
    titleMap.delete(key);
  }
  for (const key of exactAmbiguousKeys)
    exactAbbrMap.delete(key);
  return { abbrMap, titleMap, exactAbbrMap, ambiguousKeys, exactAmbiguousKeys };
}

export function lookupJournalAbbreviation(title: string, maps: JournalLookupMaps, flexible = false) {
  const exact = journalTitleKey(title);
  if (maps.exactAmbiguousKeys?.has(exact))
    return { ambiguous: true };
  const abbr = maps.exactAbbrMap?.get(exact);
  if (abbr)
    return { abbr };
  if (!flexible && maps.exactAbbrMap)
    return {};
  const normalized = normalizeKey(exact);
  return maps.ambiguousKeys?.has(normalized) ? { ambiguous: true } : { abbr: maps.abbrMap.get(normalized) };
}

export function styleJournalAbbreviation(value: string, style = "keep"): string {
  if (style === "upper")
    return value.toLocaleUpperCase();
  if (style === "lower")
    return value.toLocaleLowerCase();
  if (style === "title")
    return value.replace(/\p{L}[\p{L}\p{M}]*/gu, word => word[0].toLocaleUpperCase() + word.slice(1).toLocaleLowerCase());
  if (style === "initials")
    return (value.match(/\p{L}[\p{L}\p{M}]*/gu) || []).map(word => word[0].toLocaleUpperCase()).join("");
  return value;
}
