import type { ApplyContext } from "./rule-base";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataLoader } from "../../utils/data-loader";
import { requestCachedGET } from "../../utils/http";
import { inferJournalAbbreviation } from "../../utils/journal-abbreviation-iso";
import { CorrectDOILong } from "./correct-doi-long";
import { CorrectPagesRange } from "./correct-pages-range";
import { CorrectPublicationTitleAlias } from "./correct-publication-title-alias";
import { CorrectPublicationTitleCase } from "./correct-publication-title-case";
import { CorrectConferenceAbbr, RequireJournalAbbr } from "./require-abbr";
import { RequireDOI } from "./require-doi";
import { RequireUniversityPlace } from "./require-university-place";
import { ToolGetShortDOI } from "./tool-get-short-doi";

vi.mock("../../utils/journal-abbreviation-iso", () => ({ inferJournalAbbreviation: vi.fn() }));
vi.mock("../../utils/http", () => ({ requestCachedGET: vi.fn() }));
vi.mock("../../utils/data-loader", () => ({ DataLoader: { getJournalAbbrMaps: vi.fn(), getConferenceAbbrMap: vi.fn(), load: vi.fn() } }));
vi.mock("../../utils/locale", () => ({ getString: (id: string) => id }));

function context(fields: Record<string, string>) {
  return { item: {
    getField: (field: string) => fields[field] || "",
    setField: (field: string, value: string) => { fields[field] = value; },
  }, report: vi.fn(), debug: vi.fn(), options: {} } as unknown as ApplyContext;
}
beforeEach(() => {
  vi.mocked(requestCachedGET).mockReset();
  vi.mocked(DataLoader.getJournalAbbrMaps).mockResolvedValue({ abbrMap: new Map(), titleMap: new Map() });
  vi.stubGlobal("Zotero", { Utilities: { cleanDOI: (doi: string) => doi }, OpenURL: { createContextObject: () => "title=original" } });
  vi.stubGlobal("addon", { data: { config: { addonID: "test" } } });
  vi.stubGlobal("ztoolkit", { ExtraField: { getExtraField: (item: Zotero.Item, field: string) => item.getField(field), setExtraField: vi.fn(async (item: Zotero.Item, field: string, value: string) => item.setField(field, value)) } });
});
afterEach(() => vi.unstubAllGlobals());

describe("asynchronous field writes", () => {
  it("preserves a manual page range entered while reading PDF pages", async () => {
    const fields = { pages: "10" };
    const ctx = context(fields);
    ctx.item.getBestAttachment = async () => {
      fields.pages = "10-12";
      return { attachmentContentType: "application/pdf", id: 2 } as Zotero.Item;
    };
    vi.stubGlobal("Zotero", { ...Zotero, Fulltext: { getPages: async () => ({ total: 8 }) } });
    await CorrectPagesRange.apply(ctx);
    expect(fields.pages).toBe("10-12");
  });

  it.each(["alias", "case"])("preserves a journal title edited during %s dataset loading", async (rule) => {
    const fields = { publicationTitle: "ORIGINAL JOURNAL" };
    vi.mocked(DataLoader.getJournalAbbrMaps).mockImplementation(async () => {
      fields.publicationTitle = "Manual journal";
      return { abbrMap: new Map(), titleMap: new Map([["originaljournal", "Original Journal"]]) };
    });
    vi.mocked(DataLoader.load).mockImplementation(async () => {
      fields.publicationTitle = "Manual journal";
      return {};
    });
    await (rule === "alias" ? CorrectPublicationTitleAlias : CorrectPublicationTitleCase).apply(context(fields));
    expect(fields.publicationTitle).toBe("Manual journal");
  });

  it("preserves a place edited during university dataset loading", async () => {
    const fields = { university: "University", place: "" };
    vi.mocked(DataLoader.load).mockImplementation(async () => {
      fields.place = "Manual place";
      return { University: "Dataset place" };
    });
    await RequireUniversityPlace.apply(context(fields));
    expect(fields.place).toBe("Manual place");
  });

  it("preserves a conference abbreviation edited during dataset loading", async () => {
    const fields = { conferenceName: "Conference", shortConferenceName: "" };
    vi.mocked(DataLoader.getConferenceAbbrMap).mockImplementation(async () => {
      fields.shortConferenceName = "Manual acronym";
      return new Map([["conference", "CONF"]]);
    });
    const ctx = context(fields);
    await CorrectConferenceAbbr.apply({ ...ctx, options: { customDataPath: "", infer: false, withDots: true, usefull: false, usefullZh: false } });
    expect(fields.shortConferenceName).toBe("Manual acronym");
  });
  it("does not replace a DOI entered during Crossref lookup", async () => {
    const fields = { DOI: "" };
    vi.mocked(requestCachedGET).mockImplementation(async () => {
      fields.DOI = "10.1234/manual";
      return { status: 200, responseXML: { getElementsByTagName: () => [{ getAttribute: () => "resolved", getElementsByTagName: () => [{ textContent: "10.1234/remote" }] }] } } as any;
    });
    await RequireDOI.apply(context(fields));
    expect(fields.DOI).toBe("10.1234/manual");
  });

  it("does not resolve a short DOI over a newer DOI", async () => {
    const fields = { DOI: "10/old" };
    vi.mocked(requestCachedGET).mockImplementation(async () => {
      fields.DOI = "10.1234/manual";
      return { status: 200, response: { responseCode: 1, values: [{ type: "HS_ALIAS", data: { value: "10.1234/old" } }] } } as any;
    });
    await CorrectDOILong.apply(context(fields));
    expect(fields.DOI).toBe("10.1234/manual");
    expect(ztoolkit.ExtraField.setExtraField).not.toHaveBeenCalled();
  });

  it("does not add a short DOI belonging to the previous work", async () => {
    const fields = { DOI: "10.1234/original" };
    vi.mocked(requestCachedGET).mockImplementation(async () => {
      fields.DOI = "10.1234/manual";
      return { status: 200, responseText: JSON.stringify({ DOI: "10.1234/original", ShortDOI: "10/old" }) } as any;
    });
    await ToolGetShortDOI.apply(context(fields));
    expect(ztoolkit.ExtraField.setExtraField).not.toHaveBeenCalled();
  });

  it.each(["publicationTitle", "journalAbbreviation"])("preserves %s edited during abbreviation inference", async (field) => {
    const fields: Record<string, string> = { publicationTitle: "Original journal", journalAbbreviation: "" };
    vi.mocked(inferJournalAbbreviation).mockImplementation(async () => {
      fields[field] = "Manual value";
      return "Orig. J.";
    });
    const ctx = context(fields);
    await RequireJournalAbbr.apply({ ...ctx, options: { customDataPath: "", infer: true, sourceMode: "iso4", withDots: true, usefull: false, usefullZh: false } });
    expect(fields.journalAbbreviation).toBe(field === "journalAbbreviation" ? "Manual value" : "");
  });
});
