import { expect, it } from "vitest";
import { journalRankingRows } from "./journal-ranking-rows";

it("reads persisted rankings and leaves unrelated notes out of the pane", () => {
  const extra = ["Manual note", "CCF: A", "Custom: keep", ["JCR 分区", String.fromCharCode(58), " Q1"].join("")].join("\n");
  expect(journalRankingRows(extra).map(row => [row.key, row.value])).toEqual([["jcr", "Q1"], ["ccf", "A"]]);
});

it("reads legacy keys, prefers canonical values and keeps values as plain text", () => {
  const rows = journalRankingRows("JCR\u5206\u533A: Q3\nJCR 分区：Q1\nSWUPL：<b>A</b>: retained");
  expect(rows.find(row => row.key === "jcr")?.value).toBe("Q1");
  expect(rows.find(row => row.key === "swupl")?.value).toBe("<b>A</b>: retained");
  expect(journalRankingRows("notes only\nCCF: ")).toEqual([]);
});
