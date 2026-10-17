import type { ApplyContext, PrepareContext } from "./rules/rule-base";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LintRunner } from "./runner";

vi.mock("./rules", () => ({ Rules: {} }));
vi.mock("./reporter", () => ({ createReporter: vi.fn(async () => {}), ProgressUI: class { async init() {} close() {} updateProgress() {} showFinished() {} } }));
vi.mock("../utils/logger", () => ({ createLogger: () => ({ debug() {}, warn() {}, error() {} }), logger: { debug() {} } }));
vi.mock("../utils/locale", () => ({ getString: (id: string) => id }));

function createItem() {
  const item = {
    id: 1,
    itemType: "journalArticle",
    itemTypeID: 1,
    deleted: false,
    changed: false,
    fields: { title: "Original", itemType: "journalArticle" } as Record<string, string>,
    persisted: {} as Record<string, string>,
    isRegularItem: () => true,
    isEditable: () => true,
    getField(key: string) { return this.fields[key] || ""; },
    setField(key: string, value: string) {
      this.fields[key] = value;
      this.changed = true;
    },
    getDisplayTitle() { return this.fields.title; },
    hasChanged() { return this.changed; },
    toJSON() { return { ...this.fields }; },
    fromJSON(fields: Record<string, string>) { this.fields = { ...fields }; },
    async save() {
      this.persisted = { ...this.fields };
      this.changed = false;
    },
  };
  return item as unknown as Zotero.Item;
}

beforeEach(() => {
  vi.stubGlobal("addon", { data: { alive: true } });
  vi.stubGlobal("Zotero", { Prefs: { get: () => undefined }, getMainWindow: () => ({ AbortController }), DB: { executeTransaction: async (fn: () => Promise<void>) => fn() } });
});
afterEach(() => vi.unstubAllGlobals());

describe("rule-level rollback", () => {
  it.each(["reject", "timeout", "report"])("discards partial %s writes while preserving healthy sibling changes", async (mode) => {
    const runner = new LintRunner();
    const item = createItem();
    await runner.add({ items: [item], silent: true, rules: [
      { id: "healthy-before", scope: "item", apply({ item }: ApplyContext) { item.setField("date", "2026"); } },
      { id: "broken", scope: "item", timeout: 5, async apply({ item, report }: ApplyContext) {
        item.setField("title", "Partial");
        if (mode === "timeout")
          await new Promise(() => {});
        if (mode === "report")
          report({ level: "error", message: "Invalid result" });
        else
          throw new Error("Injected failure");
      } },
      { id: "healthy-after", scope: "item", apply({ item }: ApplyContext) { item.setField("volume", "10"); } },
    ] as any });
    expect(item.getField("title")).toBe("Original");
    expect(item.getField("date")).toBe("2026");
    expect(item.getField("volume")).toBe("10");
    expect((item as any).persisted.title).toBe("Original");
    expect(runner.lastResult).toMatchObject({ failed: 1, saved: 1 });
  });

  it("does not save an item when the only change was rolled back", async () => {
    const runner = new LintRunner();
    const item = createItem();
    await runner.add({ items: [item], silent: true, rules: [{ id: "broken-only", scope: "item", apply({ item }: ApplyContext) {
      item.setField("title", "Partial");
      throw new Error("Failed");
    } }] as any });
    expect(runner.lastResult?.saved).toBe(0);
    expect(item.getField("title")).toBe("Original");
    expect(runner.lastResult?.changes).toEqual([]);
  });
  it("reports unchanged and inapplicable items separately", async () => {
    const runner = new LintRunner();
    await runner.add({ items: [createItem()], silent: true, rules: [{ id: "not-applicable", scope: "item", ignoreItemTypes: ["journalArticle"], apply() {
      throw new Error("Must not run");
    } }] as any });
    expect(runner.lastResult).toMatchObject({ processed: 1, saved: 0, changed: 0, unchanged: 1, notApplicable: 1 });
  });
  it("does not roll back concurrent edits made outside the failed rule", async () => {
    const runner = new LintRunner();
    const item = createItem();
    await runner.add({ items: [item], silent: true, rules: [{ id: "external-edit", scope: "item", async apply({ item: guarded }: ApplyContext) {
      guarded.setField("title", "Partial");
      item.setField("title", "Manual edit");
      item.setField("date", "2026");
      throw new Error("Failed");
    } }] as any });
    expect(item.getField("title")).toBe("Manual edit");
    expect(item.getField("date")).toBe("2026");
    expect(runner.lastResult?.changes).not.toEqual(expect.arrayContaining([expect.objectContaining({ field: "title" })]));
  });
  it("quarantines an item when its failed rule cannot be restored", async () => {
    const runner = new LintRunner();
    const item = createItem();
    (item as any).fromJSON = () => {
      throw new Error("Restore failed");
    };
    (item as any).reload = async () => {
      (item as any).fields = { title: "Original", itemType: "journalArticle" };
    };
    const following = vi.fn();
    await runner.add({ items: [item], silent: true, rules: [
      { id: "broken-restore", scope: "item", apply({ item: target }: ApplyContext) {
        target.setField("title", "Partial");
        throw new Error("Rule failed");
      } },
      { id: "following", scope: "item", apply: following },
    ] as any });
    expect(following).not.toHaveBeenCalled();
    expect(item.getField("title")).toBe("Original");
    expect(runner.lastResult).toMatchObject({ failed: 1, saved: 0 });
  });

  it("settles cancellation during preparation and permits a later batch", async () => {
    const runner = new LintRunner();
    const item = createItem();
    let started!: () => void;
    const entered = new Promise<void>((resolve) => {
      started = resolve;
    });
    let signal: AbortSignal | undefined;
    const pending = runner.add({ items: [item], silent: true, rules: [{ id: "pending-prepare", scope: "item", async prepare(ctx: PrepareContext) {
      signal = ctx.signal;
      started();
      await new Promise(() => {});
    }, apply() {} }] as any });
    await entered;
    runner.cancel();
    await pending;
    expect(signal?.aborted).toBe(true);
    expect(runner.lastResult?.cancelled).toBe(true);
    await runner.add({ items: [item], silent: true, rules: [{ id: "healthy", scope: "item", apply({ item }: ApplyContext) {
      item.setField("title", "Next batch");
    } }] as any });
    expect(item.getField("title")).toBe("Next batch");
  }, 1000);
  it("does not label superseded rule values as saved", async () => {
    const runner = new LintRunner();
    await runner.add({ items: [createItem()], silent: true, rules: [
      { id: "first", scope: "item", apply({ item }: ApplyContext) { item.setField("title", "Intermediate"); } },
      { id: "second", scope: "item", apply({ item }: ApplyContext) { item.setField("title", "Final"); } },
    ] as any });
    expect(runner.lastResult?.changes).toEqual([
      expect.objectContaining({ after: "Intermediate", saved: false }),
      expect.objectContaining({ after: "Final", saved: true }),
    ]);
  });

  it("restores an intervening manual edit when a failed rule writes the same field twice", async () => {
    const runner = new LintRunner();
    const item = createItem();
    await runner.add({ items: [item], silent: true, rules: [{ id: "repeated-write", scope: "item", async apply({ item: guarded }: ApplyContext) {
      guarded.setField("title", "First attempt");
      await Promise.resolve();
      item.setField("title", "Manual edit");
      guarded.setField("title", "Second attempt");
      throw new Error("Failed");
    } }] as any });
    expect(item.getField("title")).toBe("Manual edit");
    expect(runner.lastResult?.changes).toEqual([]);
  });
});
