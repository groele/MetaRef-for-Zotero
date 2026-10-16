import { beforeEach, expect, it, vi } from "vitest";
import { apiESICategories, resolveJournalSources } from "./journal-insights";

const values = vi.hoisted(() => new Map<string, unknown>());
vi.mock("./prefs", () => ({ getPref: (key: string, fallback: unknown) => values.get(key) ?? fallback }));
vi.mock("./data-loader", () => ({ DataLoader: {} }));
const local = { categories: ["PHYSICS"], esi: "物理学", natureIndex: true, esiSource: "builtin" as const, natureSource: "builtin" as const };
const api = { status: "success" as const, data: { esi: "Chemistry", natureIndex: "否", natureIndexDataset: "145 种自然指数统计期刊" } };
beforeEach(() => values.clear());

it("uses API first independently and respects an explicit API nonmember result", () => {
  values.set("insights.esiSourcePriority", "api-first");
  values.set("insights.natureSourcePriority", "api-first");
  expect(resolveJournalSources(local, api)).toMatchObject({ categories: ["CHEMISTRY"], esiSource: "api", natureIndex: false, natureSource: "api" });
});
it("keeps local positive matches first and falls back to API for local misses", () => {
  values.set("insights.esiSourcePriority", "local-first");
  values.set("insights.natureSourcePriority", "local-first");
  expect(resolveJournalSources(local, api)).toMatchObject({ categories: ["PHYSICS"], natureIndex: true });
  expect(resolveJournalSources({ ...local, categories: [], natureIndex: false }, api)).toMatchObject({ categories: ["CHEMISTRY"], natureIndex: false, natureSource: "api" });
});
it("shows fallback provenance for missing API fields and never treats absent membership as false", () => {
  values.set("insights.esiSourcePriority", "api-first");
  values.set("insights.natureSourcePriority", "api-only");
  expect(resolveJournalSources(local, { status: "success", data: {} })).toMatchObject({ categories: ["PHYSICS"], esiSource: "builtin", esiAPIWarning: "journal-insights-api-fallback", natureIndex: undefined, natureError: "journal-insights-api-missing" });
});
it("only-API rejects a local answer while only-local ignores cached API answers", () => {
  values.set("insights.esiSourcePriority", "api-only");
  values.set("insights.natureSourcePriority", "local-only");
  expect(resolveJournalSources(local, { status: "error", message: "offline" })).toMatchObject({ categories: [], esi: "", esiError: "journal-insights-api-missing", natureIndex: true, natureSource: "builtin" });
});
it("normalizes actual ESI disciplines and rejects unrelated category labels", () => {
  expect(apiESICategories("物理学;Chemistry;SOCIAL SCIENCES, GENERAL")).toEqual(["PHYSICS", "CHEMISTRY", "SOCIAL SCIENCES, GENERAL"]);
  expect(apiESICategories("ENVIRONMENT/ECOLOGY")).toEqual(["ENVIRONMENT/ECOLOGY"]);
  expect(apiESICategories("Q1;是;Top 1%")).toEqual([]);
});
