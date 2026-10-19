import { assert } from "chai";
import { config } from "../../package.json";

describe("paged metadata reports", function () {
  this.timeout(30_000);

  it("handles a native stop event during many synchronous rules and saves only completed changes", async function () {
    const plugin = (Zotero as any)[config.addonInstance];
    const key = `${config.prefsPrefix}.lint.onAdded`;
    const previous = Zotero.Prefs.get(key, true);
    Zotero.Prefs.set(key, false, true);
    const item = new Zotero.Item("journalArticle");
    item.setField("title", "Before cooperative cancellation");
    let timer: number | undefined;
    let applied = 0;
    try {
      await item.saveTx();
      const rules = Array.from({ length: 200 }, (_, index) => ({ id: `native-checkpoint-${index}`, scope: "item", apply({ item: target }: { item: Zotero.Item }) {
        timer ??= Zotero.getMainWindow().setTimeout(() => plugin.runner.cancel(), 0);
        target.setField("title", `Completed rule ${++applied}`);
      } }));
      const result = await plugin.runner.add({ items: [item], rules, silent: true });
      assert.isTrue(result.cancelled);
      assert.isAbove(applied, 0);
      assert.isBelow(applied, 200);
      assert.equal(result.saved, 1);
      await item.reload(["itemData"], true);
      assert.equal(item.getField("title"), `Completed rule ${applied}`);
    }
    finally {
      if (timer !== undefined)
        Zotero.getMainWindow().clearTimeout(timer);
      if (item.id)
        await item.eraseTx();
      Zotero.Prefs.set(key, previous as boolean, true);
    }
  });

  it("pages, filters and searches native report cards while exporting the complete evidence", async function () {
    const plugin = (Zotero as any)[config.addonInstance];
    const infos = Array.from({ length: 61 }, (_, index) => ({ itemID: 900_000 + index, title: `Report fixture ${index}`, ruleID: "test-report", level: index % 2 ? "error" as const : "warning" as const, message: index === 60 ? "Unique message" : "Fixture message" }));
    const changes = [{ itemID: 900_060, ruleID: "test-report", field: "title", before: "Before", after: "After", saved: true }];
    const previousResult = plugin.runner.lastResult;
    plugin.runner.lastResult = { ...previousResult, records: infos, changes };
    const entry = (Zotero.PreferencePanes as any).pluginPanes.find((entry: any) => entry.pluginID === config.addonID);
    const preferences = Zotero.Utilities.Internal.openPreferences(entry.id)!;
    let win: Window | undefined;
    try {
      for (let attempt = 0; attempt < 100 && !preferences.document.getElementById("metaref-last-batch-report"); attempt++)
        await Zotero.Promise.delay(50);
      await (preferences as any).Zotero_Preferences.waitForFirstPaneLoad();
      preferences.document.getElementById("metaref-last-batch-report")!.dispatchEvent(new (preferences as any).Event("command", { bubbles: true }));
      for (let attempt = 0; attempt < 200; attempt++) {
        win = [...plugin.data.dialogs.values()].find((window: any) => !!window.document.getElementById("metaref-report-search")) as Window | undefined;
        if (win)
          break;
        await Zotero.Promise.delay(25);
      }
      assert.exists(win, "native report opens");
      const doc = win!.document;
      const cards = () => doc.querySelectorAll("[data-metaref-report-item]");
      const next = doc.getElementById("metaref-report-next") as HTMLButtonElement;
      assert.lengthOf(cards(), 25);
      next.click();
      assert.equal(cards()[0].getAttribute("data-metaref-report-item"), "900025");
      next.click();
      assert.lengthOf(cards(), 11);
      assert.isTrue(next.disabled);
      const search = doc.getElementById("metaref-report-search") as HTMLInputElement;
      search.value = "unique";
      search.dispatchEvent(new (win as any).Event("input", { bubbles: true }));
      assert.lengthOf(cards(), 1);
      assert.equal(cards()[0].getAttribute("data-metaref-report-item"), "900060");
      const filter = doc.getElementById("metaref-report-filter") as HTMLSelectElement;
      filter.value = "error";
      filter.dispatchEvent(new (win as any).Event("change", { bubbles: true }));
      assert.lengthOf(cards(), 0);
      search.value = "";
      filter.value = "changed";
      filter.dispatchEvent(new (win as any).Event("change", { bubbles: true }));
      assert.lengthOf(cards(), 1);
      assert.exists(cards()[0].querySelector("details"));
      assert.equal(doc.getElementById("metaref-report-page")!.getAttribute("aria-live"), "polite");
      const toolkit = plugin.data.ztoolkit;
      const picker = toolkit.FilePicker;
      let exported = "";
      const write = Zotero.File.putContentsAsync;
      try {
        toolkit.FilePicker = class {
          async open() { return "report-fixture.json"; }
        };
        Zotero.File.putContentsAsync = (async (_path: string, data: string) => {
          exported = data;
        }) as typeof write;
        (doc.getElementById("metaref-report-export") as HTMLButtonElement).click();
        await Zotero.Promise.delay(25);
        assert.lengthOf(JSON.parse(exported).reports, 61);
        assert.lengthOf(JSON.parse(exported).changes, 1);
      }
      finally {
        toolkit.FilePicker = picker;
        Zotero.File.putContentsAsync = write;
      }
    }
    finally {
      win?.close();
      preferences.close();
      plugin.runner.lastResult = previousResult;
    }
  });
});
