import { afterEach, expect, it, vi } from "vitest";

const stored = vi.hoisted(() => ({ value: undefined as any, writes: 0 }));
vi.mock("./logger", () => ({ createLogger: () => ({ warn: vi.fn(), error: vi.fn() }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  stored.value = undefined;
  stored.writes = 0;
});

async function setup() {
  vi.stubGlobal("Zotero", { Profile: { dir: "profile" } });
  vi.stubGlobal("PathUtils", { join: (...parts: string[]) => parts.join("/") });
  vi.stubGlobal("IOUtils", {
    exists: async () => stored.value !== undefined,
    readJSON: async () => stored.value,
    writeJSON: async (_path: string, value: unknown) => {
      stored.value = value;
      stored.writes++;
    },
  });
  return import("./journal-ranking-index");
}

function item(title = "Journal QA", issn = "1234-5678") {
  return { itemType: "journalArticle", getField: (key: string) => key === "publicationTitle" ? title : key === "ISSN" ? issn : "" } as unknown as Zotero.Item;
}

it("persists selected values by ISSN and title and reloads them for another item", async () => {
  const index = await setup();
  await index.loadJournalRankingIndex();
  await index.saveJournalRankingIndex(item(), { jcr: "Q1", impactFactor: "34.9" }, new Set(["jcr", "impactFactor"]));
  await index.flushJournalRankingIndex();
  expect(stored.writes).toBe(1);
  vi.resetModules();
  const reloaded = await import("./journal-ranking-index");
  await reloaded.loadJournalRankingIndex();
  expect(reloaded.readJournalRankingIndex(item())).toEqual(new Map([["jcr", "Q1"], ["impactFactor", "34.9"]]));
  expect(reloaded.readJournalRankingIndex(item("Journal QA", "8765-4321")).get("impactFactor")).toBe("34.9");
});

it("preserves existing index values in blank mode and removes negative membership markers", async () => {
  const index = await setup();
  await index.saveJournalRankingIndex(item(), { jcr: "Q1", sci: "是" }, new Set(["jcr", "sci"]));
  await index.saveJournalRankingIndex(item(), { jcr: "Q2", sci: "否" }, new Set(["jcr", "sci"]), "blank");
  expect(index.readJournalRankingIndex(item())).toMatchObject(new Map([["jcr", "Q1"], ["sci", "是"]]));
  await index.saveJournalRankingIndex(item(), { sci: "否" }, new Set(["sci"]));
  expect(index.readJournalRankingIndex(item()).has("sci")).toBe(false);
  await index.flushJournalRankingIndex();
});
