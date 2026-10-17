const SEPARATOR = "\u001F";

/** Zotero sorts custom columns as strings; keep numeric order separate from cell text. */
export function journalNumericSortValue(value: string): string {
  const match = value.trim().match(/^(\d{1,20})(?:\.(\d+))?$/);
  if (!match)
    return value;
  return `${match[1].padStart(20, "0")}.${(match[2] || "").padEnd(20, "0")}${SEPARATOR}${value}`;
}

export function journalNumericDisplayValue(value: string): string {
  const separator = value.indexOf(SEPARATOR);
  return separator < 0 ? value : value.slice(separator + 1);
}
