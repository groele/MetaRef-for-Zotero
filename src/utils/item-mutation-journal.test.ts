import { expect, it, vi } from "vitest";
import { ItemMutationJournal } from "./item-mutation-journal";

it("avoids exporting items when a rule has made no writes", () => {
  const item = { toJSON: vi.fn(), fromJSON: vi.fn() };
  const journal = new ItemMutationJournal(item as unknown as Pick<Zotero.Item, "toJSON" | "fromJSON">);
  for (let i = 0; i < 1000; i++) {
    expect(journal.changes()).toEqual([]);
    journal.restore();
  }
  expect(item.toJSON).not.toHaveBeenCalled();
  expect(item.fromJSON).not.toHaveBeenCalled();
});

it("tracks writes and preserves subsequent external edits during rollback", () => {
  let data = { title: "Original", extra: "Note" };
  const item = { toJSON: () => ({ ...data }), fromJSON: (value: any) => {
    data = { ...value };
  } };
  const journal = new ItemMutationJournal(item as unknown as Pick<Zotero.Item, "toJSON" | "fromJSON">);
  journal.capture(() => {
    data.title = "Formatted";
  });
  expect(journal.changes()).toEqual([{ field: "title", before: "Original", after: "Formatted" }]);
  data.extra = "External note";
  journal.restore();
  expect(data).toEqual({ title: "Original", extra: "External note" });
  data.title = "Later edit";
  journal.restore();
  expect(data.title).toBe("Later edit");
});
