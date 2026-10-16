import { describe, expect, it } from "vitest";
import { applyTitleTerms, compileTitleTerms, validateTitleTerms } from "./title-terms";

describe("title term validation", () => {
  it("allows literal terms, regex and empty replacements", () => {
    const rows = [{ search: "MoS2", replace: "MoS₂" }, { search: "/test/gi", replace: "" }];
    expect(validateTitleTerms(rows)).toEqual(rows);
    expect(validateTitleTerms([])).toEqual([]);
  });
  it.each([null, {}, { search: "x" }, { search: " ", replace: "y" }, { search: 1, replace: "y" }, { search: "x", replace: 1 }])("rejects malformed row %j before activation", (row) => {
    expect(() => validateTitleTerms([row])).toThrow("row 1");
  });
  it("rejects malformed regex before a batch touches item fields", () => {
    expect(() => validateTitleTerms([{ search: "/[/g", replace: "x" }])).toThrow(SyntaxError);
  });
  it("reuses compiled global patterns across items without leaking lastIndex", () => {
    const terms = compileTitleTerms([{ search: "/mos2/gi", replace: "MoS2" }]);
    terms[0].pattern.lastIndex = 100;
    expect(applyTitleTerms("mos2 and MOS2", terms)).toBe("MoS2 and MoS2");
    expect(applyTitleTerms("mos2 and MOS2", terms)).toBe("MoS2 and MoS2");
  });
});
