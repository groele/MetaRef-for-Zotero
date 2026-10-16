import { describe, expect, it } from "vitest";
import { mergeMetadata, metadataIdentity, metadataMissing, normalizeDOI, titlesAgree } from "./policy";

describe("metadata identity and completion", () => {
  it("normalizes resolver forms and rejects a different DOI even for an identical title", () => {
    expect(normalizeDOI("https://doi.org/10.1234/ABC")).toBe("10.1234/abc");
    expect(metadataIdentity({ title: "Same title" }, { DOI: "10.1234/abc" }, { title: "Same title", DOI: "10.9999/wrong" }, "identifier")).toBe(false);
    expect(metadataIdentity({}, { DOI: "10.1234/ABC" }, { DOI: "https://doi.org/10.1234/abc" })).toBe("identifier");
  });
  it("accepts an exact identifier lookup without a returned DOI, but rejects unanchored responses", () => {
    expect(metadataIdentity({}, { PMID: "123" }, { title: "Result" }, "identifier")).toBe("identifier");
    expect(metadataIdentity({ title: "Original" }, {}, { title: "Unrelated" })).toBe(false);
    expect(metadataIdentity({}, {}, { title: "Unrelated" }, "identifier")).toBe(false);
  });
  it("allows documented identifier enrichment to provide the expected published DOI", () => {
    expect(metadataIdentity({ title: "Preprint" }, { arXiv: "2401.12345", DOI: "10.1234/published" }, { DOI: "10.1234/published", title: "Published work" }, "identifier")).toBe("identifier");
  });
  it("requires a strong title match and compatible year for metadata search", () => {
    expect(titlesAgree("Spin dynamics in MoS2", "SPIN dynamics in MoS2.")).toBe(true);
    expect(titlesAgree("Spin dynamics in MoS2", "Spin dynamics in WS2")).toBe(false);
    expect(metadataIdentity({ title: "Same title", date: "2020" }, {}, { title: "Same title", date: "2025" })).toBe(false);
  });
  it("fills missing fields without letting a later service overwrite earlier data", () => {
    expect(mergeMetadata({ title: "First", creators: [] }, { title: "Second", date: "2026", creators: [{ creatorType: "author", lastName: "Doe" }] }))
      .toEqual({ title: "First", date: "2026", creators: [{ creatorType: "author", lastName: "Doe" }] });
    expect(metadataMissing({ DOI: "10.1234/a" }, { title: "Original" }, "blank", "journalArticle"))
      .toEqual(["date", "creators", "publicationTitle"]);
  });
});
