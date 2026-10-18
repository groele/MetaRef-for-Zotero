import { assert } from "chai";
import { config } from "../../package.json";

describe("plural selection APIs and duplicate settings scope", function () {
  this.timeout(30_000);
  const plugin = () => (Zotero as any)[config.addonInstance];
  let win: Window & typeof globalThis;
  let pane: any;
  let libraries: any;
  let collections: any;
  let singularLibrary: any;
  let singularCollection: any;
  let auto: any;
  const created: number[] = [];
  const removed = () => {
    throw new Error("Removed singular selection API");
  };

  before(async function () {
    auto = Zotero.Prefs.get(`${config.prefsPrefix}.lint.onAdded`, true);
    Zotero.Prefs.set(`${config.prefsPrefix}.lint.onAdded`, false, true);
    pane = Zotero.getActiveZoteroPane()!;
    libraries = pane.getSelectedLibraryIDs;
    collections = pane.getSelectedCollections;
    singularLibrary = pane.getSelectedLibraryID;
    singularCollection = pane.getSelectedCollection;
    const entry = (Zotero.PreferencePanes as any).pluginPanes.find((entry: any) => entry.pluginID === config.addonID);
    win = Zotero.Utilities.Internal.openPreferences(entry.id)! as Window & typeof globalThis;
    for (let attempt = 0; attempt < 200 && !win.document.querySelector("#metaref-duplicates-master input"); attempt++)
      await Zotero.Promise.delay(25);
  });

  afterEach(function () {
    pane.getSelectedLibraryIDs = libraries;
    pane.getSelectedCollections = collections;
    pane.getSelectedLibraryID = singularLibrary;
    pane.getSelectedCollection = singularCollection;
  });

  after(async function () {
    for (const id of created.reverse()) {
      const item = await Zotero.Items.getAsync(id);
      if (item)
        await item.eraseTx();
    }
    Zotero.Prefs.set(`${config.prefsPrefix}.lint.onAdded`, auto, true);
    win.close();
  });

  const run = async (id: string) => {
    const status = win.document.getElementById("metaref-duplicates-status")!;
    status.textContent = "";
    const button = win.document.getElementById(`metaref-duplicates-${id}`) as HTMLButtonElement;
    button.dispatchEvent(new win.Event("command", { bubbles: true }));
    for (let attempt = 0; attempt < 200 && button.disabled; attempt++)
      await Zotero.Promise.delay(25);
    assert.isFalse(button.disabled);
    return status.textContent;
  };

  it("refreshes the selected library using the plural API without calling a removed stub", async function () {
    let reads = 0;
    pane.getSelectedLibraryIDs = () => {
      reads++;
      return [Zotero.Libraries.userLibraryID];
    };
    pane.getSelectedLibraryID = removed;
    const status = await run("refresh");
    assert.equal(reads, 1);
    assert.isNotEmpty(status!);
    assert.notInclude(status!, "Removed");
  });

  it("rejects ambiguous multi-library bulk operations before opening confirmation", async function () {
    pane.getSelectedLibraryIDs = () => [Zotero.Libraries.userLibraryID, 999999];
    pane.getSelectedLibraryID = removed;
    const dialogs = plugin().data.dialogs.size;
    const status = await run("bulk");
    assert.isNotEmpty(status!);
    assert.notInclude(status!, "Removed");
    assert.notInclude(status!, "999999");
    assert.equal(plugin().data.dialogs.size, dialogs);
  });

  it("resolves the legacy collection command through plural collection selection", async function () {
    const a = new Zotero.Item("journalArticle");
    a.setField("title", "Selected collection item.");
    await a.saveTx();
    created.push(a.id);
    const b = new Zotero.Item("journalArticle");
    b.setField("title", "Unselected item.");
    await b.saveTx();
    created.push(b.id);
    pane.getSelectedCollections = () => [{ getChildItems: () => [a] }];
    pane.getSelectedCollection = removed;
    await plugin().hooks.onLintInBatch("no-title-trailing-dot", "collection");
    assert.equal(a.getField("title"), "Selected collection item");
    assert.equal(b.getField("title"), "Unselected item.");
  });
});
