import { describe, expect, it } from "vitest";
import { extractArxivID, isUnconvertedArxivPreprint } from "./journal-pane";

function mockItem(fields: Record<string, string>, itemType = "preprint", regular = true): Zotero.Item {
  return {
    itemType,
    isRegularItem: () => regular,
    getField: (field: string) => fields[field] || "",
  } as unknown as Zotero.Item;
}

describe("extractArxivID", () => {
  it("extracts from arXiv abs/pdf/html URLs", () => {
    expect(extractArxivID(mockItem({ url: "https://arxiv.org/abs/2401.12345" }))).toBe("2401.12345");
    expect(extractArxivID(mockItem({ url: "https://arxiv.org/pdf/2401.12345.pdf" }))).toBe("2401.12345");
    expect(extractArxivID(mockItem({ url: "https://arxiv.org/html/2401.12345v2" }))).toBe("2401.12345v2");
  });

  it("extracts from arXiv DOI", () => {
    expect(extractArxivID(mockItem({ DOI: "10.48550/arXiv.2401.12345" }))).toBe("2401.12345");
    expect(extractArxivID(mockItem({ extra: "DOI: 10.48550/arXiv.2401.12345" }))).toBe("2401.12345");
  });

  it("extracts from extra field and archiveID", () => {
    expect(extractArxivID(mockItem({ extra: "arXiv: 2401.12345 [cs.CV]" }))).toBe("2401.12345");
    expect(extractArxivID(mockItem({ archiveID: "2401.12345v1" }))).toBe("2401.12345v1");
  });

  it("returns undefined for non-arXiv preprints or ordinary publications", () => {
    expect(extractArxivID(mockItem({ url: "https://www.biorxiv.org/content/10.1101/2024.01.01.573822v1", DOI: "10.1101/2024.01.01.573822" }))).toBeUndefined();
    expect(extractArxivID(mockItem({ DOI: "10.1038/s41586-024-00000-0", publicationTitle: "Nature" }))).toBeUndefined();
    expect(extractArxivID(mockItem({}, "attachment", false))).toBeUndefined();
  });
});

describe("isUnconvertedArxivPreprint", () => {
  it("recognizes unconverted preprints with arXiv ID", () => {
    const item = mockItem({ url: "https://arxiv.org/abs/2401.12345" }, "preprint");
    expect(isUnconvertedArxivPreprint(item)).toBe(true);
  });

  it("ignores non-arXiv preprints", () => {
    const item = mockItem({ url: "https://www.biorxiv.org/content/10.1101/123", DOI: "10.1101/123" }, "preprint");
    expect(isUnconvertedArxivPreprint(item)).toBe(false);
  });

  it("recognizes journalArticles that are actually unconverted arXiv entries", () => {
    const itemWithArxivDOI = mockItem({ DOI: "10.48550/arXiv.2401.12345" }, "journalArticle");
    expect(isUnconvertedArxivPreprint(itemWithArxivDOI)).toBe(true);

    const itemWithArxivPub = mockItem({ url: "https://arxiv.org/abs/2401.12345", publicationTitle: "arXiv" }, "journalArticle");
    expect(isUnconvertedArxivPreprint(itemWithArxivPub)).toBe(true);
  });

  it("does not treat established journal articles as unconverted even if they reference an arXiv preprint", () => {
    const publishedItem = mockItem({
      DOI: "10.1038/s41586-024-01234-5",
      publicationTitle: "Nature",
      extra: "arXiv: 2401.12345",
    }, "journalArticle");
    expect(isUnconvertedArxivPreprint(publishedItem)).toBe(false);
  });

  it("does not treat already converted items as unconverted", () => {
    const convertedItem = mockItem({
      DOI: "10.1145/1234567.8901234",
      publicationTitle: "Communications of the ACM",
      extra: "MetaFlow preprint identifier: 2401.12345\nMetaFlow preprint URL: https://arxiv.org/abs/2401.12345",
    }, "journalArticle");
    expect(isUnconvertedArxivPreprint(convertedItem)).toBe(false);
  });
});
