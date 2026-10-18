import { assert } from "chai";
import { config } from "../../package.json";
import { createReporter } from "../../src/modules/reporter";

describe("metadata safety regressions", function () {
  this.timeout(30_000);
  const plugin = () => (Zotero as any)[config.addonInstance];
  const created: Zotero.Item[] = [];
  let previous: unknown;

  before(function () {
    previous = Zotero.Prefs.get(`${config.prefsPrefix}.lint.onAdded`, true);
    Zotero.Prefs.set(`${config.prefsPrefix}.lint.onAdded`, false, true);
  });

  after(async function () {
    for (const item of created)
      await item.eraseTx();
    Zotero.Prefs.set(`${config.prefsPrefix}.lint.onAdded`, previous as boolean, true);
  });
  async function create(fields: Record<string, string>) {
    const item = new Zotero.Item("journalArticle");
    for (const [field, value] of Object.entries(fields))
      item.setField(field, value);
    await item.saveTx();
    created.push(item);
    return item;
  }

  it("preserves valid ranges, archive codes, literal titles and curated short titles after saving", async function () {
    const item = await create({ title: "None", volume: "10-12", issue: "20-25", pages: "100-110", archiveLocation: "Q1", shortTitle: "中文简称" });
    await plugin().hooks.onLintInBatch(["no-volume-extra-zeros", "no-issue-extra-zeros", "no-pages-extra-zeros", "no-field-misuse", "no-value-nullish"], [item]);
    await item.reload(["itemData"], true);
    for (const [field, value] of Object.entries({ title: "None", volume: "10-12", issue: "20-25", pages: "100-110", archiveLocation: "Q1", shortTitle: "中文简称" }))
      assert.equal(item.getField(field), value);
    item.setField("title", "A long title: Subtitle");
    await item.saveTx();
    await plugin().hooks.onLintInBatch("require-short-title", [item]);
    await item.reload(["itemData"], true);
    assert.equal(item.getField("shortTitle"), "中文简称");
  });

  for (const failure of ["throw", "timeout", "report"]) {
    it(`rolls back ${failure} changes including type and creators while saving healthy rules`, async function () {
      const item = await create({ title: "Original title", volume: "42" });
      item.setCreators([{ creatorType: "author", lastName: "Original author" }]);
      await item.saveTx();
      await plugin().runner.add({ items: [item], silent: true, rules: [
        { id: "safety-before", scope: "item", apply({ item: target }: { item: Zotero.Item }) { target.setField("date", "2026"); } },
        { id: "safety-failure", scope: "item", timeout: 20, async apply({ item: target, report }: { item: Zotero.Item; report: (info: { level: string; message: string }) => void }) {
          target.setType(Zotero.ItemTypes.getID("webpage") as number);
          target.setField("title", "Partial title");
          target.setCreators([{ creatorType: "author", lastName: "Partial author" }]);
          if (failure === "timeout")
            await new Promise(() => {});
          if (failure === "report")
            report({ level: "error", message: "Invalid metadata" });
          else
            throw new Error("Injected partial update");
        } },
        { id: "safety-after", scope: "item", apply({ item: target }: { item: Zotero.Item }) { target.setField("issue", "7"); } },
      ] });
      assert.equal(plugin().runner.lastResult.failed, 1);
      assert.equal(plugin().runner.lastResult.saved, 1);
      await item.reload(["primaryData", "itemData", "creators"], true);
      assert.equal(item.itemType, "journalArticle");
      assert.equal(item.getField("title"), "Original title");
      assert.equal(item.getField("volume"), "42");
      assert.equal(item.getField("date"), "2026");
      assert.equal(item.getField("issue"), "7");
      assert.equal(item.getCreators()[0].lastName, "Original author");
    });
  }

  it("keeps results closed after a run and exports saved field changes on request", async function () {
    const item = await create({ title: "Before export" });
    const picker = plugin().data.ztoolkit.FilePicker.prototype;
    const open = picker.open;
    const dialogs = new Set(plugin().data.dialogs.keys());
    const path = PathUtils.join(PathUtils.tempDir, `metaflow-report-${Date.now()}.json`);
    picker.open = async () => path;
    try {
      await plugin().runner.add({ items: [item], rules: [{ id: "safety-export", scope: "item", apply({ item: target, report }: { item: Zotero.Item; report: (info: { level: string; message: string }) => void }) {
        target.setField("title", "After export");
        report({ level: "warning", message: "Review saved change" });
      } }] });
      assert.equal(plugin().data.dialogs.size, dialogs.size, "a completed run does not open its detailed report");
      const reportPromise = createReporter(plugin().runner.lastResult.records, plugin().runner.lastResult.changes);
      const findReport = () => [...plugin().data.dialogs.values()].find((window: any) => window.document.body?.textContent?.includes("Review saved change")) as Window | undefined;
      for (let attempt = 0; attempt < 100 && !findReport(); attempt++)
        await Zotero.Promise.delay(30);
      const report = findReport()!;
      assert.exists(report, "the actual results window opens");
      const button = report.document.getElementById("metaref-report-export") as HTMLButtonElement;
      assert.exists(button);
      button.click();
      for (let attempt = 0; attempt < 100 && !(await IOUtils.exists(path)); attempt++)
        await Zotero.Promise.delay(30);
      const exported = JSON.parse(await IOUtils.readUTF8(path));
      assert.isTrue(exported.changes.some((change: any) => change.field === "title" && change.before === "Before export" && change.after === "After export" && change.saved));
      report.close();
      await reportPromise;
    }
    finally {
      picker.open = open;
      for (const report of plugin().data.dialogs.values())
        report.close();
      await IOUtils.remove(path, { ignoreAbsent: true });
    }
  });

  it("cancels a real open tool dialog and releases the preparation queue", async function () {
    const item = await create({ title: "Cancel tool preparation", language: "en" });
    for (const window of plugin().data.dialogs.values())
      window.close();
    for (let attempt = 0; attempt < 100 && plugin().data.dialogs.size; attempt++)
      await Zotero.Promise.delay(30);
    const pending = plugin().hooks.onLintInBatch("tool-set-language", [item]);
    for (let attempt = 0; attempt < 100 && !plugin().data.dialogs.size; attempt++)
      await Zotero.Promise.delay(30);
    assert.isAbove(plugin().data.dialogs.size, 0);
    plugin().runner.cancel();
    await pending;
    assert.isTrue(plugin().runner.lastResult.cancelled);
    assert.equal(plugin().runner.lastResult.saved, 0);
    assert.equal(item.getField("language"), "en");
    for (let attempt = 0; attempt < 100 && plugin().data.dialogs.size; attempt++)
      await Zotero.Promise.delay(30);
    assert.equal(plugin().data.dialogs.size, 0);
  });

  it("marks only the final committed field value as saved", async function () {
    const item = await create({ title: "Original before two rules" });
    await plugin().runner.add({ items: [item], silent: true, rules: [
      { id: "safety-intermediate", scope: "item", apply({ item: target }: { item: Zotero.Item }) { target.setField("title", "Intermediate value"); } },
      { id: "safety-final", scope: "item", apply({ item: target }: { item: Zotero.Item }) { target.setField("title", "Final value"); } },
    ] });
    const changes = plugin().runner.lastResult.changes;
    assert.isFalse(changes.find((change: any) => change.after === "Intermediate value").saved);
    assert.isTrue(changes.find((change: any) => change.after === "Final value").saved);
    await item.reload(["itemData"], true);
    assert.equal(item.getField("title"), "Final value");
  });

  it("restores a manual edit between two failed rule writes after reloading", async function () {
    const item = await create({ title: "Repeated original" });
    await plugin().runner.add({ items: [item], silent: true, rules: [{ id: "safety-repeated", scope: "item", async apply({ item: target }: { item: Zotero.Item }) {
      target.setField("title", "First write");
      await Zotero.Promise.delay(5);
      item.setField("title", "Intervening manual value");
      target.setField("title", "Second write");
      throw new Error("Injected repeated-write failure");
    } }] });
    assert.equal(item.getField("title"), "Intervening manual value");
    await item.reload(["itemData"], true);
    assert.equal(item.getField("title"), "Intervening manual value");
  });
});
