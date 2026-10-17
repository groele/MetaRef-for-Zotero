import { EASYSCHOLAR_EXTRA_ALIASES, EASYSCHOLAR_FIELD_DEFINITIONS, getEasyScholarFieldMessageID } from "./easyscholar";

/** Read persisted rankings without querying a network service or changing item metadata. */
export function journalRankingRows(extra: string) {
  const values = readJournalRankingValues(extra);
  return EASYSCHOLAR_FIELD_DEFINITIONS.flatMap((field) => {
    const value = values.get(field.key);
    return value ? [{ key: field.key, labelID: getEasyScholarFieldMessageID(field.key), value }] : [];
  });
}

export function readJournalRankingValues(extra: string) {
  const values = new Map<string, string>();
  for (const line of extra.split(/\r?\n/)) {
    const separator = line.search(/[:：]/);
    if (separator < 0)
      continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (value && !values.has(key))
      values.set(key, value);
  }
  return new Map(EASYSCHOLAR_FIELD_DEFINITIONS.flatMap((field) => {
    const value = [field.extraKey, ...EASYSCHOLAR_EXTRA_ALIASES[field.key] || []].map(key => values.get(key)).find(Boolean);
    return value ? [[field.key, value] as const] : [];
  }));
}
