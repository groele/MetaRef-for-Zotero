import type { DuplicateRecord } from "./duplicate-matching";
import { expect, it } from "vitest";
import { duplicateMatchEvents, duplicatePairs } from "./duplicate-matching";

const record = (id: number, doi: string): DuplicateRecord => ({ id, libraryID: 1, preprint: false, data: { itemType: "journalArticle", DOI: doi } });

it("provides scheduling checkpoints during indexing and matching even when no duplicate exists", () => {
  const records = Array.from({ length: 1_000 }, (_, i) => record(i + 1, `10.1234/unique-${i}`));
  const events = [...duplicateMatchEvents(new Set(records.map(item => item.id)), records)];
  expect(events.filter(event => event.kind === "pair")).toHaveLength(0);
  expect(events.flatMap(event => event.kind === "checkpoint" && event.stage === "index" ? [event.processed] : [])).toEqual([250, 500, 750, 1_000]);
  expect(events.filter(event => event.kind === "checkpoint" && event.stage === "match")).toHaveLength(4);
});

it("streams each dense-bucket pair once with deterministic DOI precedence", () => {
  const records = Array.from({ length: 30 }, (_, i) => record(i + 1, "10.1234/dense"));
  const events = [...duplicateMatchEvents(new Set(records.map(item => item.id)), records)];
  const pairs = duplicatePairs(new Set(records.map(item => item.id)), records);
  expect(pairs).toHaveLength(30 * 29 / 2);
  expect(new Set(pairs.map(pair => [pair.left.id, pair.right.id].sort((a, b) => a - b).join(":"))).size).toBe(pairs.length);
  expect(pairs.every(pair => pair.reason === "doi" && pair.mergeable)).toBe(true);
  expect(events.some(event => event.kind === "checkpoint" && event.stage === "match")).toBe(true);
  expect(pairs[0]).toMatchObject({ left: { id: 1 }, right: { id: 2 } });
});
