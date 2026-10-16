import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToolUpdateMetadata } from "./index";
import { services } from "./services";

vi.mock("./services", () => ({ services: [] }));
vi.mock("./identifiers", async importOriginal => ({ ...await importOriginal<typeof import("./identifiers")>(), extractIdentifiers: (item: any) => ({ DOI: item.getField("DOI") }), isPreprint: () => false }));
vi.mock("../../../utils/locale", () => ({ getString: (id: string) => id }));
vi.mock("../../../utils/zotero", () => ({ isFieldValidForItemType: (field: string) => ["title", "date", "publicationTitle", "DOI", "volume"].includes(field) }));

function createItem() {
  const fields: Record<string, any> = { itemType: "journalArticle", title: "Original title", DOI: "10.1234/original", creators: [] };
  return {
    itemType: "journalArticle",
    itemTypeID: 1,
    getField: (field: string) => fields[field] || "",
    setField: vi.fn((field: string, value: string) => { fields[field] = value; }),
    getCreators: () => fields.creators,
    setCreators: vi.fn((creators: unknown[]) => { fields.creators = creators; }),
    toJSON: () => structuredClone(fields),
  };
}
const response = (name: string, data: Record<string, any>, fetch = async () => data) => ({ id: name, name, lookup: "identifier" as const, cooldown: 0, shouldApply: () => true, fetch, transform: (data: any) => data });
function run(item: ReturnType<typeof createItem>, mode: "blank" | "all" = "blank") {
  const report = vi.fn();
  return { report, pending: ToolUpdateMetadata.apply({ item: item as unknown as Zotero.Item, options: { mode, allowTypeChanged: false }, debug: vi.fn(), report }) };
}
beforeEach(() => {
  services.splice(0);
  vi.stubGlobal("Zotero", { CreatorTypes: { getID: () => 1, isValidForItemType: () => true } });
});
afterEach(() => vi.unstubAllGlobals());

describe("trusted metadata update workflow", () => {
  it("rejects contradictory DOI results and tries the next source", async () => {
    services.push(response("wrong", { DOI: "10.9999/wrong", title: "Unrelated" }), response("right", { DOI: "10.1234/original", title: "Verified title" }));
    const item = createItem();
    const { report, pending } = run(item, "all");
    await pending;
    expect(item.getField("DOI")).toBe("10.1234/original");
    expect(item.getField("title")).toBe("Verified title");
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ message: "rule-tool-update-metadata-identity-conflict" }));
  });

  it("continues past an echoed DOI and fills gaps from a later response", async () => {
    const complete = vi.fn(async () => ({ title: "Server title", date: "2026", publicationTitle: "Journal", creators: [{ creatorType: "author", lastName: "Doe" }] }));
    services.push(response("sparse", { DOI: "10.1234/original" }), response("complete", {}, complete));
    const item = createItem();
    await run(item).pending;
    expect(complete).toHaveBeenCalledOnce();
    expect(item.getField("title")).toBe("Original title");
    expect(item.getField("date")).toBe("2026");
    expect(item.getCreators()[0].lastName).toBe("Doe");
  });

  it("merges missing fields while preserving the earlier trusted source's values", async () => {
    services.push(response("first", { title: "First title", volume: "10" }), response("second", { title: "Second title", volume: "20", date: "2026", publicationTitle: "Journal" }));
    const item = createItem();
    await run(item, "all").pending;
    expect(item.getField("title")).toBe("First title");
    expect(item.getField("volume")).toBe("10");
    expect(item.getField("date")).toBe("2026");
  });

  it("preserves a manual edit made while the network response is pending", async () => {
    const item = createItem();
    services.push(response("editing", {}, async () => {
      item.setField("title", "Edited while waiting");
      return { title: "Server title", date: "2026" };
    }));
    const { report, pending } = run(item, "all");
    await pending;
    expect(item.getField("title")).toBe("Edited while waiting");
    expect(item.getField("date")).toBe("2026");
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ message: "rule-tool-update-metadata-edited" }));
  });
});
