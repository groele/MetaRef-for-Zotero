import { assert } from "chai";
import { config } from "../../package.json";
import { selectedLibraryIDs } from "../../src/utils/selection";

describe("integrated duplicate settings", function () {
  this.timeout(60_000);
  const plugin = () => (Zotero as any)[config.addonInstance];
  const created: number[] = [];
  const previous = new Map<string, unknown>();
  const pref = (key: string, value: boolean | string | number) => {
    const full = `${config.prefsPrefix}.${key}`;
    if (!previous.has(full))
      previous.set(full, Zotero.Prefs.get(full, true));
    Zotero.Prefs.set(full, value, true);
  };
  const create = async (doi: string, type: "journalArticle" | "conferencePaper" = "journalArticle") => {
    const item = new Zotero.Item(type);
    item.setField("title", "Integrated duplicate fixture");
    item.setField("DOI", doi);
    await item.saveTx();
    created.push(item.id);
    return item;
  };

  before(function () {
    pref("lint.onAdded", false);
    pref("duplicates.defaultAction", "cancel");
    pref("duplicates.masterStrategy", "oldest");
    pref("duplicates.mergeDifferentTypes", false);
    pref("duplicates.nonDuplicatePairs", "[]");
  });

  afterEach(async function () {
    pref("lint.onAdded", false);
    for (const id of created.splice(0).reverse()) {
      const item = await Zotero.Items.getAsync(id);
      if (item)
        await item.eraseTx();
    }
  });

  after(function () {
    for (const [key, value] of previous) {
      if (value === undefined)
        Zotero.Prefs.clear(key, true);
      else
        Zotero.Prefs.set(key, value as any, true);
    }
  });

  it("translates and persists all default-action, master, concurrency, type and view controls", async function () {
    const entry = (Zotero.PreferencePanes as any).pluginPanes.find((pane: any) => pane.pluginID === config.addonID);
    const win = Zotero.Utilities.Internal.openPreferences(entry.id)! as Window & typeof globalThis;
    try {
      for (let attempt = 0; attempt < 200 && !win.document.querySelector("#metaref-duplicates-master input"); attempt++)
        await Zotero.Promise.delay(25);
      const pane = win.document.getElementById(config.addonRef)!;
      await win.document.l10n!.translateFragment(pane);
      const host = pane.querySelector("#metaref-duplicate-settings")!;
      assert.lengthOf(host.querySelectorAll("input[type='radio']"), 8);
      const strategy = host.querySelector<HTMLInputElement>("input[value='detailed']")!;
      strategy.checked = true;
      strategy.dispatchEvent(new win.Event("change", { bubbles: true }));
      assert.equal(Zotero.Prefs.get(`${config.prefsPrefix}.duplicates.masterStrategy`, true), "detailed");
      const concurrency = host.querySelector<HTMLInputElement>("#metaref-duplicates-concurrency")!;
      concurrency.value = "9";
      concurrency.dispatchEvent(new win.Event("change", { bubbles: true }));
      assert.equal(Zotero.Prefs.get(`${config.prefsPrefix}.duplicates.concurrency`, true), 3);
      assert.equal(concurrency.getAttribute("aria-invalid"), "true");
      concurrency.value = "2";
      concurrency.dispatchEvent(new win.Event("change", { bubbles: true }));
      assert.equal(Zotero.Prefs.get(`${config.prefsPrefix}.duplicates.concurrency`, true), 2);
      for (const id of ["review", "bulk", "pause", "cancel", "refresh", "export", "import"])
        assert.isNotEmpty(host.querySelector(`#metaref-duplicates-${id}`)!.textContent?.trim());
    }
    finally { win.close(); }
  });

  it("merges each group once and fills missing metadata while preserving Extra", async function () {
    const a = await create("10.1234/bulk-group-a");
    const b = await create("10.1234/bulk-group-a");
    const c = await create("10.1234/bulk-group-a");
    const d = await create("10.1234/bulk-group-b");
    const e = await create("10.1234/bulk-group-b");
    a.setField("extra", "Manual A");
    b.setField("extra", "Manual B");
    c.setField("volume", "42");
    await a.saveTx();
    await b.saveTx();
    await c.saveTx();
    const pairs = await plugin().api.review.findDuplicates([a, b, c, d, e]);
    const result = await plugin().runner.exclusive((signal: AbortSignal) => plugin().api.review.bulkMergeDuplicates(pairs, signal));
    assert.deepEqual(result.errors, []);
    assert.equal(result.total, 2);
    assert.equal(result.completed, 2);
    assert.equal(result.merged, 3);
    const survivors = [a, b, c].filter(item => !item.deleted);
    assert.lengthOf(survivors, 1);
    assert.equal(survivors[0].getField("volume"), "42");
    assert.include(survivors[0].getField("extra"), "Manual A");
    assert.include(survivors[0].getField("extra"), "Manual B");
  });

  it("exports and imports stable non-duplicate decisions and rejects malformed records", async function () {
    const a = await create("10.1234/nonduplicate");
    const b = await create("10.1234/nonduplicate");
    const pane = Zotero.getActiveZoteroPane()!;
    await pane.setVirtual(a.libraryID, "duplicates", true, true);
    await plugin().api.review.refreshDuplicateStats(a.libraryID);
    const row = Array.from({ length: pane.collectionsView.rowCount }, (_, index) => pane.collectionsView.getRow(index)).find(row => row.isDuplicates());
    assert.isDefined(row);
    assert.match(row!.getName(), /1\/2$/);
    plugin().api.review.markNonDuplicate(a, b);
    assert.notMatch(row!.getName(), /1\/2$/, "excluding a pair immediately invalidates the old label");
    assert.isEmpty(await plugin().api.review.findDuplicates([a]));
    const exported = plugin().api.review.exportNonDuplicates();
    assert.equal(exported.format, "zoplicate-nonduplicates");
    assert.equal(exported.libraries[0].pairs[0].key1, a.key);
    plugin().api.review.clearNonDuplicates();
    assert.lengthOf(await plugin().api.review.findDuplicates([a]), 1);
    assert.equal((await plugin().api.review.importNonDuplicates(exported)).imported, 1);
    assert.isEmpty(await plugin().api.review.findDuplicates([a]));
    let rejected = false;
    try {
      await plugin().api.review.importNonDuplicates({ format: "zoplicate-nonduplicates", version: 1, libraries: [{ libraryType: "user", pairs: [{ key1: "../bad", key2: b.key }] }] });
    }
    catch { rejected = true; }
    assert.isTrue(rejected);
    assert.equal(plugin().api.review.exportNonDuplicates().libraries[0].pairs.length, 1);
  });

  it("requires the type setting and preserves incompatible fields when merging different types", async function () {
    const a = await create("10.1234/cross-type");
    const b = await create("10.1234/cross-type", "conferencePaper");
    a.setField("publicationTitle", "Journal title");
    b.setField("proceedingsTitle", "Conference proceedings");
    await a.saveTx();
    await b.saveTx();
    const pair = (await plugin().api.review.findDuplicates([a])).find((pair: any) => pair.right.id === b.id);
    pref("duplicates.mergeDifferentTypes", true);
    try {
      await plugin().api.review.applyDuplicateDecision({ pair, action: "merge", masterID: a.id, donors: new Map() });
      assert.isTrue(b.deleted);
      assert.include(a.getField("extra"), "Conference proceedings");
      assert.equal(a.getField("publicationTitle"), "Journal title");
    }
    finally { pref("duplicates.mergeDifferentTypes", false); }
  });

  it("inherits non-duplicate decisions and prevents a transitive bulk merge", async function () {
    plugin().api.review.clearNonDuplicates();
    pref("duplicates.masterStrategy", "oldest");
    const a = await create("10.1234/exclusion-chain");
    const b = await create("10.1234/exclusion-chain");
    const c = await create("10.1234/exclusion-chain");
    for (const [index, item] of [a, b, c].entries()) {
      item.setField("dateAdded", `${2020 + index}-01-01 00:00:00`);
      await item.saveTx();
    }
    plugin().api.review.markNonDuplicate(b, c);
    const pairs = await plugin().api.review.findDuplicates([a, b, c]);
    const connects = (pair: any, item: Zotero.Item) => [pair.left.id, pair.right.id].includes(a.id) && [pair.left.id, pair.right.id].includes(item.id);
    const ab = pairs.find((pair: any) => connects(pair, b));
    const ac = pairs.find((pair: any) => connects(pair, c));
    assert.isDefined(ab);
    assert.isDefined(ac);
    const result = await plugin().runner.exclusive((signal: AbortSignal) => plugin().api.review.bulkMergeDuplicates([ab, ac], signal));
    assert.deepEqual(result.errors, []);
    assert.equal(result.merged, 1);
    assert.equal(result.skipped, 1);
    assert.isTrue(b.deleted);
    assert.isFalse(a.deleted);
    assert.isFalse(c.deleted);
    assert.isEmpty(await plugin().api.review.findDuplicates([a, c]));
    const exported = plugin().api.review.exportNonDuplicates();
    assert.lengthOf(exported.libraries[0].pairs, 1);
    assert.sameMembers(Object.values(exported.libraries[0].pairs[0]), [a.key, c.key]);
  });

  it("keeps exclusions attached to the original items when the host merge fails", async function () {
    plugin().api.review.clearNonDuplicates();
    const a = await create("10.1234/failed-exclusion");
    const b = await create("10.1234/failed-exclusion");
    const c = await create("10.1234/failed-exclusion");
    plugin().api.review.markNonDuplicate(b, c);
    const original = Zotero.Items.merge;
    const pair = (await plugin().api.review.findDuplicates([a])).find((entry: any) => entry.right.id === b.id);
    (Zotero.Items as any).merge = async () => {
      throw new Error("Controlled host merge failure");
    };
    try {
      let error = "";
      try {
        await plugin().api.review.applyDuplicateDecision({ pair, action: "merge", masterID: a.id, donors: new Map() });
      }
      catch (caught) { error = String(caught); }
      assert.include(error, "Controlled host merge failure");
      assert.isFalse(b.deleted);
      const exported = plugin().api.review.exportNonDuplicates();
      assert.sameMembers(Object.values(exported.libraries[0].pairs[0]), [b.key, c.key]);
    }
    finally { Zotero.Items.merge = original; }
  });

  it("omits trashed exclusions from portable exports without erasing recoverable decisions", async function () {
    plugin().api.review.clearNonDuplicates();
    const a = await create("10.1234/trashed-exclusion");
    const b = await create("10.1234/trashed-exclusion");
    plugin().api.review.markNonDuplicate(a, b);
    b.deleted = true;
    await b.saveTx();
    assert.isEmpty(plugin().api.review.exportNonDuplicates().libraries);
    b.deleted = false;
    await b.saveTx();
    assert.lengthOf(plugin().api.review.exportNonDuplicates().libraries[0].pairs, 1);
    assert.isEmpty(await plugin().api.review.findDuplicates([a]));
  });

  it("coalesces collection redraws when several exclusion decisions change together", async function () {
    plugin().api.review.clearNonDuplicates();
    await Zotero.Promise.delay(0);
    const a = await create("10.1234/redraw-exclusion");
    const b = await create("10.1234/redraw-exclusion");
    const c = await create("10.1234/redraw-exclusion");
    let redraws = 0;
    const observer = Zotero.Notifier.registerObserver({ notify(event: string, type: string) {
      if (event === "redraw" && type === "collection")
        redraws++;
    } }, ["collection"], "metaflow-exclusion-redraw-test");
    try {
      plugin().api.review.markNonDuplicate(a, b);
      plugin().api.review.markNonDuplicate(a, c);
      await Zotero.Promise.delay(0);
      assert.equal(redraws, 1);
      plugin().api.review.markNonDuplicate(a, b);
      await Zotero.Promise.delay(0);
      assert.equal(redraws, 1, "an unchanged decision does not repaint or invalidate the cache");
    }
    finally { Zotero.Notifier.unregisterObserver(observer); }
  });

  it("preserves decisions made by another dialog while an import resolves item keys", async function () {
    plugin().api.review.clearNonDuplicates();
    const a = await create("10.1234/import-race");
    const b = await create("10.1234/import-race");
    const c = await create("10.1234/import-race");
    const original = Zotero.Items.getByLibraryAndKeyAsync;
    let competingWrite = false;
    Zotero.Items.getByLibraryAndKeyAsync = async function (...args: Parameters<typeof original>) {
      const item = await original.apply(this, args);
      if (!competingWrite) {
        competingWrite = true;
        plugin().api.review.markNonDuplicate(b, c);
      }
      return item;
    };
    try {
      const result = await plugin().api.review.importNonDuplicates({ format: "zoplicate-nonduplicates", version: 1, libraries: [{ libraryType: "user", groupID: null, pairs: [{ key1: a.key, key2: b.key }] }] });
      assert.equal(result.imported, 1);
      assert.lengthOf(plugin().api.review.exportNonDuplicates().libraries[0].pairs, 2);
      assert.lengthOf(await plugin().api.review.findDuplicates([a, b, c]), 1);
    }
    finally { Zotero.Items.getByLibraryAndKeyAsync = original; }
  });

  it("keeps both imported records by default and honors an explicitly selected Keep New action", async function () {
    const old = await create("10.1234/import-duplicate");
    const incoming = await create("10.1234/import-duplicate");
    pref("lint.onAdded", true);
    await plugin().hooks.onNotify("add", "item", [incoming.id], {});
    assert.isFalse(old.deleted);
    assert.isFalse(incoming.deleted);
    pref("duplicates.defaultAction", "keep");
    await plugin().hooks.onNotify("add", "item", [incoming.id], {});
    assert.isTrue(old.deleted);
    assert.isFalse(incoming.deleted);
    pref("duplicates.defaultAction", "cancel");
  });

  it("pauses between duplicate groups, resumes and stops before starting the next group", async function () {
    const beforeConcurrency = Zotero.Prefs.get(`${config.prefsPrefix}.duplicates.concurrency`, true) as number;
    pref("duplicates.concurrency", 1);
    const items: Zotero.Item[] = [];
    for (let group = 0; group < 3; group++) {
      items.push(await create(`10.1234/pause-stop-${group}`));
      items.push(await create(`10.1234/pause-stop-${group}`));
    }
    const entry = (Zotero.PreferencePanes as any).pluginPanes.find((pane: any) => pane.pluginID === config.addonID);
    const win = Zotero.Utilities.Internal.openPreferences(entry.id)! as Window & typeof globalThis;
    for (let attempt = 0; attempt < 200 && !win.document.querySelector("#metaref-duplicates-master input"); attempt++)
      await Zotero.Promise.delay(25);
    const bulk = win.document.getElementById("metaref-duplicates-bulk") as HTMLButtonElement;
    const pause = win.document.getElementById("metaref-duplicates-pause") as HTMLButtonElement;
    const cancel = win.document.getElementById("metaref-duplicates-cancel") as HTMLButtonElement;
    const original = Zotero.Items.merge;
    let merged = 0;
    Zotero.Items.merge = async function (...args: Parameters<typeof original>) {
      const result = await original.apply(this, args);
      merged++;
      (merged === 1 ? pause : cancel).dispatchEvent(new win.Event("command", { bubbles: true }));
      return result;
    };
    try {
      bulk.dispatchEvent(new win.Event("command", { bubbles: true }));
      assert.isTrue(bulk.disabled, "the initialized bulk button must enter its running state");
      let confirm: Window | undefined;
      for (let attempt = 0; attempt < 200 && !confirm; attempt++) {
        confirm = [...plugin().data.dialogs.values()].find((dialog: any) => !dialog.closed && dialog.document.getElementById("metaref-duplicate-bulk-apply")) as Window | undefined;
        if (!confirm)
          await Zotero.Promise.delay(25);
      }
      assert.isDefined(confirm, JSON.stringify({ status: win.document.getElementById("metaref-duplicates-status")?.textContent, selectedLibraries: selectedLibraryIDs(Zotero.getActiveZoteroPane()), connected: bulk.isConnected, disabled: bulk.disabled, dialogs: [...plugin().data.dialogs.values()].map((dialog: any) => ({ closed: dialog.closed, url: dialog.location.href })) }));
      (confirm!.document.getElementById("metaref-duplicate-bulk-apply") as HTMLButtonElement).click();
      for (let attempt = 0; attempt < 200; attempt++) {
        if (merged >= 1)
          break;
        await Zotero.Promise.delay(25);
      }
      assert.equal(merged, 1);
      await Zotero.Promise.delay(100);
      assert.equal(merged, 1, "a paused batch must not start the next group");
      assert.isTrue(bulk.disabled);
      pause.dispatchEvent(new win.Event("command", { bubbles: true }));
      for (let attempt = 0; attempt < 300 && bulk.disabled; attempt++)
        await Zotero.Promise.delay(25);
      assert.isFalse(bulk.disabled, "stopping releases the operation queue and its button");
      assert.equal(merged, 2, "the third group remains untouched after stop");
      assert.lengthOf(items.filter(item => item.deleted), 2);
      assert.lengthOf(items.filter(item => !item.deleted), 4);
    }
    finally {
      cancel.dispatchEvent(new win.Event("command", { bubbles: true }));
      for (let attempt = 0; attempt < 300 && bulk.disabled; attempt++)
        await Zotero.Promise.delay(25);
      Zotero.Items.merge = original;
      pref("duplicates.concurrency", beforeConcurrency);
      win.close();
    }
  });
});
