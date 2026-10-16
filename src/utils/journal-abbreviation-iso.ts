import { AbbrevIso } from "../vendor/abbrev-iso";
import { DataLoader } from "./data-loader";

let engine: Promise<AbbrevIso> | undefined;
export async function inferJournalAbbreviation(title: string): Promise<string | undefined> {
  engine ||= Promise.all([
    DataLoader.load("txt", `${rootURI}data/journal-abbr/ltwa.tsv`),
    DataLoader.load("txt", `${rootURI}data/journal-abbr/shortwords.txt`),
  ]).then(([ltwa, words]) => new AbbrevIso(ltwa, words)).catch((error) => {
    engine = undefined;
    throw error;
  });
  const value = (await engine).makeAbbreviation(title);
  return value?.trim() || undefined;
}
