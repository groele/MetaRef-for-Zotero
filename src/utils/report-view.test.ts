import { describe, expect, it } from "vitest";
import { reportPage } from "./report-view";

const entries = Array.from({ length: 61 }, (_, id) => ({
  id,
  search: `${id} reference title doi metadata ${id === 60 ? "unique" : ""}`,
  infos: [{ level: id % 2 ? "error" : "warning" }],
  changes: id === 60 ? [{ field: "title" }] : [],
}));

describe("bounded report views", () => {
  it("keeps item order and reaches the final page without dropping evidence", () => {
    expect(reportPage(entries)).toMatchObject({ total: 61, page: 0, pageCount: 3 });
    const all = [0, 1, 2].flatMap(page => reportPage(entries, "", "all", page).entries);
    expect(all).toEqual(entries);
    expect(reportPage(entries).entries).toHaveLength(25);
  });
  it("combines multiword Unicode-normalized search with item severity", () => {
    expect(reportPage(entries, "\uFF24\uFF2F\uFF29 unique", "warning").entries.map(entry => entry.id)).toEqual([60]);
    expect(reportPage(entries, "unique", "error").total).toBe(0);
    expect(reportPage(entries, "", "changed").entries.map(entry => entry.id)).toEqual([60]);
  });
  it("clamps pages after filtering and handles empty reports", () => {
    expect(reportPage(entries, "unique", "all", 2)).toMatchObject({ page: 0, total: 1 });
    expect(reportPage([], "", "all", -2)).toMatchObject({ page: 0, pageCount: 1, total: 0, entries: [] });
    expect(reportPage(entries, "", "all", Number.NaN).page).toBe(0);
  });
});
