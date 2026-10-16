import { expect, it } from "vitest";
import { detectCSVDelimiter } from "./csv";

it.each([
  ["\"Special, Journal\";\"Spec. J.\"\n", ";"],
  ["\uFEFF\n\"Journal; Part A\",\"J. A.\"\r\n", ","],
  ["\"Journal, \"\"Quoted\"\"; Name\"\t\"J. Name\"\n", "\t"],
  ["\"Journal\nPart, A\";\"J. A.\"\n", ";"],
  ["title,issn,category\n", ","],
  ["title|abbr\n", "|"],
  ["", ","],
])("detects the actual separator in %s", (text, expected) => {
  expect(detectCSVDelimiter(text)).toBe(expected);
});
