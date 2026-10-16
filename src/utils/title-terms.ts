import { DataLoader } from "./data-loader";
import { convertToRegex } from "./str";

export interface CompiledTitleTerm {
  pattern: RegExp;
  replace: string;
}

export function compileTitleTerms(rows: { search: string; replace: string }[]): CompiledTitleTerm[] {
  return rows.map(row => ({ pattern: convertToRegex(row.search), replace: row.replace }));
}

export function applyTitleTerms(title: string, terms: CompiledTitleTerm[]): string {
  for (const { pattern, replace } of terms) {
    pattern.lastIndex = 0;
    title = title.replace(pattern, replace);
  }
  return title;
}

export function validateTitleTerms(rows: unknown[]): { search: string; replace: string }[] {
  return rows.map((value, index) => {
    const row = value as { search?: unknown; replace?: unknown } | null;
    if (!row || typeof row.search !== "string" || !row.search.trim() || typeof row.replace !== "string")
      throw new TypeError(`Invalid title term at row ${index + 1}: expected a search term and a text replacement`);
    convertToRegex(row.search);
    return { search: row.search, replace: row.replace };
  });
}

export async function loadTitleTerms(path: string) {
  if (!/\.csv$/i.test(path))
    throw new TypeError("Expected a CSV title terms file");
  return validateTitleTerms(await DataLoader.load("csv", path, { headers: ["search", "replace"] }));
}
