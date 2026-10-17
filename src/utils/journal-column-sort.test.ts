import { expect, it } from "vitest";
import { journalNumericDisplayValue, journalNumericSortValue } from "./journal-column-sort";

it("sorts numeric metrics and decimals while preserving their exact displayed text", () => {
  const values = ["34.9", "9.8", "9.11", "100", "0", "2.5"];
  const compare = new Intl.Collator("en").compare;
  const sorted = values.map(journalNumericSortValue).sort(compare).map(journalNumericDisplayValue);
  expect(sorted).toEqual(["0", "2.5", "9.11", "9.8", "34.9", "100"]);
  for (const value of [...values, "", "unknown", "<b>34.9</b>"])
    expect(journalNumericDisplayValue(journalNumericSortValue(value))).toBe(value);
});
