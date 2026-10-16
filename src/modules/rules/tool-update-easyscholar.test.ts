// autocorrect-disable
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EASYSCHOLAR_FIELD_DEFINITIONS } from "../../utils/easyscholar";
import { mergeEasyScholarExtra, summarizeEasyScholarChanges, ToolUpdateEasyScholar } from "./tool-update-easyscholar";

const mocks = vi.hoisted(() => ({ fields: new Set<string>(), fetch: vi.fn(), supplemental: vi.fn() }));
vi.mock("../../utils/prefs", () => ({ getPref: (key: string, fallback: unknown) => key.startsWith("easyscholar.fields.") ? mocks.fields.has(key.slice("easyscholar.fields.".length)) : fallback }));
vi.mock("../../utils/locale", () => ({ getString: (key: string, options?: unknown) => `${key} ${JSON.stringify(options || {})}` }));
vi.mock("../../utils/easyscholar", async original => ({ ...await original<object>(), fetchEasyScholarRank: mocks.fetch }));
vi.mock("../../utils/supplemental-journals", () => ({ fetchSupplementalJournalRank: mocks.supplemental }));

beforeEach(() => {
  vi.useFakeTimers();
  mocks.fields.clear();
  mocks.fetch.mockReset().mockResolvedValue({ status: "success", data: { impactFactor: "2.5" } });
  mocks.supplemental.mockReset().mockResolvedValue({ data: {}, errors: [] });
});
afterEach(() => vi.useRealTimers());

it("fills only blank ranking fields, including legacy aliases and negative membership values", () => {
  const existing = "JCR分区: Q3\nSCI: 是\n影响因子: \nManual note";
  const data = { jcr: "Q1", sci: "否", impactFactor: "8.4" };
  const fields = new Set(["jcr", "sci", "impactFactor"] as const);
  const blank = mergeEasyScholarExtra(existing, data, fields, "blank");
  expect(blank).toContain("JCR分区: Q3");
  expect(blank).toContain("SCI: 是");
  expect(blank).toContain("影响因子: 8.4");
  expect(blank).toContain("Manual note");
  const all = mergeEasyScholarExtra(existing, data, fields, "all");
  expect(all).toContain("JCR 分区: Q1");
  expect(all).not.toContain("JCR分区:");
  expect(all).not.toContain("SCI:");
});

function context() {
  let extra = "Manual note";
  const item = { getField: (key: string) => key === "extra" ? extra : "Journal QA", setField: (_key: string, value: string) => {
    extra = value;
  } };
  return { item: item as unknown as Zotero.Item, options: {}, debug: vi.fn(), report: vi.fn() };
}

it("makes zero source calls when every output field is disabled", async () => {
  const ctx = context();
  const pending = ToolUpdateEasyScholar.apply(ctx);
  await vi.runAllTimersAsync();
  await pending;
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.supplemental).not.toHaveBeenCalled();
  expect(ctx.item.getField("extra")).toBe("Manual note");
});

it("does not query EasyScholar when only a supplemental field is selected", async () => {
  mocks.fields.add("njauCore");
  mocks.supplemental.mockResolvedValue({ data: { njauCore: "local rank" }, errors: [] });
  const ctx = context();
  const pending = ToolUpdateEasyScholar.apply(ctx);
  await vi.runAllTimersAsync();
  await pending;
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(ctx.item.getField("extra")).toContain("local rank");
});

it("keeps supplemental results when EasyScholar ignores cancellation and times out", async () => {
  mocks.fields.add("impactFactor");
  mocks.fields.add("njauCore");
  mocks.fetch.mockImplementation(() => new Promise(() => {}));
  mocks.supplemental.mockResolvedValue({ data: { njauCore: "local rank" }, errors: [] });
  const ctx = context();
  const pending = ToolUpdateEasyScholar.apply(ctx);
  await vi.runAllTimersAsync();
  await pending;
  expect(ctx.item.getField("extra")).toContain("local rank");
  expect(ctx.report.mock.calls.some(([report]) => report.level === "warning")).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it("counts actual key differences rather than returned values", () => {
  expect(summarizeEasyScholarChanges("CCF: A\nEI: 是\nManual note", "CCF: A\nJCI: 1.2\nManual note"))
    .toEqual({ added: 1, updated: 0, removed: 1 });
  expect(summarizeEasyScholarChanges("CCF: A", "CCF: B"))
    .toEqual({ added: 0, updated: 1, removed: 0 });
  expect(summarizeEasyScholarChanges("CCF: A", "CCF: A"))
    .toEqual({ added: 0, updated: 0, removed: 0 });
});

it("each of the 61 field switches writes only its selected result and preserves notes", async () => {
  expect(EASYSCHOLAR_FIELD_DEFINITIONS).toHaveLength(61);
  const data = Object.fromEntries(EASYSCHOLAR_FIELD_DEFINITIONS.map(field => [field.key, "QA-A"]));
  mocks.fetch.mockResolvedValue({ status: "success", data });
  mocks.supplemental.mockResolvedValue({ data, errors: [] });
  for (const field of EASYSCHOLAR_FIELD_DEFINITIONS) {
    mocks.fields.clear();
    mocks.fields.add(field.key);
    const ctx = context();
    const pending = ToolUpdateEasyScholar.apply(ctx);
    await vi.runAllTimersAsync();
    await pending;
    const extra = String(ctx.item.getField("extra"));
    expect(extra, field.key).toContain(`${field.extraKey}: QA-A`);
    expect(extra).toContain("Manual note");
    for (const other of EASYSCHOLAR_FIELD_DEFINITIONS) {
      if (other.key !== field.key && !(field.key === "ccfCustom" && other.key === "ccf"))
        expect(extra.split("\n"), `${field.key} must not write ${other.key}`).not.toContain(`${other.extraKey}: QA-A`);
    }
  }
});
