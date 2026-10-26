import { expect, it } from "vitest";
import { rebaseItemSnapshot, rollbackItemChanges } from "./item-recovery";

it("reverts successive plugin writes without mutating the source snapshot", () => {
  const current = { title: "C", extra: "Manual note" };
  expect(rollbackItemChanges(current, [{ field: "title", before: "A", after: "B" }, { field: "title", before: "B", after: "C" }]))
    .toEqual({ title: "A", extra: "Manual note" });
  expect(current.title).toBe("C");
});

it("preserves edits made after a plugin write and between two plugin writes", () => {
  const changes = [{ field: "title", before: "A", after: "B" }, { field: "title", before: "Manual edit", after: "C" }];
  expect(rollbackItemChanges({ title: "C", abstractNote: "Manual abstract" }, changes))
    .toEqual({ title: "Manual edit", abstractNote: "Manual abstract" });
  expect(rollbackItemChanges({ title: "Latest edit" }, changes)).toEqual({ title: "Latest edit" });
});

it("restores removed values and removes fields newly introduced by a failed batch", () => {
  expect(rollbackItemChanges({ volume: "7" }, [{ field: "volume", before: null, after: "7" }])).toEqual({});
  expect(rollbackItemChanges({}, [{ field: "extra", before: "Manual note", after: null }])).toEqual({ extra: "Manual note" });
});

it("merges independent retry edits while keeping current bookkeeping", () => {
  const base = { title: "Old", extra: "Old note", version: 1 };
  const local = { title: "Formatted", extra: "Old note", version: 1 };
  const current = { title: "Old", extra: "Manual note", version: 2, dateModified: "now" };
  expect(rebaseItemSnapshot(base, local, current)).toEqual({ data: { title: "Formatted", extra: "Manual note", version: 2, dateModified: "now" }, conflicts: [] });
  expect(base.title).toBe("Old");
  expect(current.title).toBe("Old");
});

it("retains concurrent creator edits and identifies atomic same-field conflicts", () => {
  const base = { creators: [{ name: "Before" }], title: "Original" };
  const local = { creators: [{ name: "Remote author" }], title: "Formatted" };
  const current = { creators: [{ name: "Manual author" }], title: "Original" };
  expect(rebaseItemSnapshot(base, local, current)).toEqual({ data: { creators: current.creators, title: "Formatted" }, conflicts: ["creators"] });
});

it("does not apply a type migration over concurrent edits or obsolete fields after an external type change", () => {
  const base = { itemType: "journalArticle", title: "Before" };
  const local = { itemType: "webpage", title: "Before" };
  const current = { itemType: "journalArticle", title: "Before", publicationTitle: "New journal" };
  expect(rebaseItemSnapshot(base, local, current)).toEqual({ data: current, conflicts: ["itemType"] });
  expect(rebaseItemSnapshot(base, { ...base, title: "Formatted" }, local)).toEqual({ data: local, conflicts: ["itemType"] });
});

it("preserves deletions, explicit null values and already-committed changes", () => {
  expect(rebaseItemSnapshot({ extra: "Old", note: "Old" }, { note: null }, { extra: "Old", note: "Old" }))
    .toEqual({ data: { note: null }, conflicts: [] });
  expect(rebaseItemSnapshot({ title: "Old" }, { title: "New" }, { title: "New" }).conflicts).toEqual([]);
});
