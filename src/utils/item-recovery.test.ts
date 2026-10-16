import { expect, it } from "vitest";
import { rollbackItemChanges } from "./item-recovery";

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
