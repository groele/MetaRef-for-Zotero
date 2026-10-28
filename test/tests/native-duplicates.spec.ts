import { assert } from "chai";
import { config } from "../../package.json";

describe("native duplicate pane batch merge", function () {
  this.timeout(60_000);
  const api = () => (Zotero as any)[config.addonInstance].api.review;
  const ids: number[] = [];
  const collections: number[] = [];
  const prefs = new Map<string, unknown>();
  const win = () => Zotero.getMainWindow() as unknown as Window & typeof globalThis & { ZoteroPane: any };
  const noticeDoc = (): Document | undefined => {
    const windows = Services.wm.getEnumerator("");
    while (windows.hasMoreElements()) {
      const popup = windows.getNext() as Window;
      if (popup.document.documentElement?.hasAttribute("data-metaref-native-duplicates"))
        return popup.document;
    }
  };
  const confirmationReady = () => (noticeDoc()?.getElementById("metaref-native-duplicates-confirm") as HTMLButtonElement | null)?.hidden === false;
  const pref = (key: string, value: string | boolean) => {
    const full = `${config.prefsPrefix}.${key}`;
    if (!prefs.has(full))
      prefs.set(full, Zotero.Prefs.get(full, true));
    Zotero.Prefs.set(full, value, true);
  };
  const create = async (group: string, type: "book" | "journalArticle" | "conferencePaper" = "journalArticle") => {
    const item = new Zotero.Item(type);
    item.setField("title", `Native batch ${group}`);
    if (type === "book")
      item.setField("ISBN", "9780306406157");
    else
      item.setField("DOI", `10.1234/native-${group}`);
    await item.saveTx();
    ids.push(item.id);
    return item;
  };
  const plan = () => api().planNativeDuplicates(Zotero.Libraries.userLibraryID);
  const merge = (p: any, signal = new (win().AbortController)().signal, update?: (result: any) => void) => (Zotero as any)[config.addonInstance].runner.exclusive(() => api().mergeNativeDuplicates(p, signal, update));
  const wait = async (check: () => boolean, message = "native batch UI reached the expected state") => {
    for (let attempt = 0; attempt < 400 && !check(); attempt++)
      await Zotero.Promise.delay(25);
    assert.isTrue(check(), `${message}: mode=${win().ZoteroPane.itemPane.mode}; status=${win().document.getElementById("metaref-native-duplicates-status")?.textContent}`);
  };

  before(function () {
    pref("lint.onAdded", false);
    pref("duplicates.masterStrategy", "oldest");
    pref("duplicates.nonDuplicatePairs", "[]");
  });

  afterEach(async function () {
    const cancel = noticeDoc()?.getElementById("metaref-native-duplicates-cancel") as HTMLButtonElement;
    cancel?.click();
    await (Zotero as any)[config.addonInstance].runner.exclusive(async () => {});
    for (const id of ids.splice(0).reverse()) {
      const item = await Zotero.Items.getAsync(id);
      if (item)
        await item.eraseTx();
    }
    for (const id of collections.splice(0)) {
      const collection = await Zotero.Collections.getAsync(id);
      if (collection)
        await collection.eraseTx();
    }
    pref("duplicates.nonDuplicatePairs", "[]");
  });

  after(function () {
    for (const [key, value] of prefs) {
      if (value === undefined)
        Zotero.Prefs.clear(key, true);
      else
        Zotero.Prefs.set(key, value as any, true);
    }
  });

  it("uses native ISBN groups and releases the detector's temporary tables", async function () {
    const a = await create("isbn-a", "book");
    const b = await create("isbn-b", "book");
    const sql = "SELECT COUNT(*) FROM sqlite_temp_master WHERE name LIKE ?";
    const before = await Zotero.DB.valueQueryAsync(sql, ["tmpDuplicates_%"]);
    const p = await plan();
    assert.isTrue(p.groups.some((group: any) => group.ids.includes(a.id) && group.ids.includes(b.id)));
    assert.equal(await Zotero.DB.valueQueryAsync(sql, ["tmpDuplicates_%"]), before);
    const result = await merge(p);
    assert.equal(result.merged, 1);
    assert.isTrue(b.deleted);
  });

  it("merges every group while preserving children, collections, tags, relations and master conflicts", async function () {
    const a = await create("preserve-a");
    const b = await create("preserve-a");
    await create("preserve-b");
    await create("preserve-b");
    const related = await create("unrelated");
    a.setField("dateAdded", "2020-01-01 00:00:00");
    a.setField("volume", "1");
    a.setField("extra", "Master extra");
    b.setField("volume", "2");
    b.setField("issue", "42");
    b.setField("extra", "Other extra");
    b.addTag("donor tag");
    b.addRelatedItem(related);
    const collection = new Zotero.Collection();
    collection.name = "Native batch collection";
    await collection.saveTx();
    collections.push(collection.id);
    b.addToCollection(collection.id);
    await a.saveTx();
    await b.saveTx();
    const note = new Zotero.Item("note");
    note.parentItemID = b.id;
    note.setNote("<p>Preserved batch note</p>");
    await note.saveTx();
    ids.push(note.id);
    const attachment = await Zotero.Attachments.linkFromURL({ parentItemID: b.id, url: "https://example.invalid/native-batch", title: "Preserved attachment" });
    ids.push(attachment.id);
    const result = await merge(await plan());
    assert.equal(result.total, 2);
    assert.equal(result.merged, 2);
    assert.isEmpty(result.errors);
    assert.isFalse(a.deleted);
    assert.isTrue(b.deleted);
    assert.equal(a.getField("volume"), "1");
    assert.equal(a.getField("issue"), "42");
    assert.include(a.getField("extra"), "Master extra");
    assert.include(a.getField("extra"), "Other extra");
    assert.equal(note.parentItemID, a.id);
    assert.equal(attachment.parentItemID, a.id);
    assert.isTrue(a.hasTag("donor tag"));
    assert.include(a.getCollections(), collection.id);
    assert.include(a.relatedItems, related.key);
  });

  it("skips changed groups and explicit non-duplicate decisions", async function () {
    const a = await create("stale");
    const b = await create("stale");
    const c = await create("excluded");
    const d = await create("excluded");
    const p = await plan();
    b.setField("volume", "unsaved change");
    api().markNonDuplicate(c, d);
    const result = await merge(p);
    assert.equal(result.skipped, 2);
    assert.equal(result.merged, 0);
    assert.isFalse(a.deleted);
    assert.isFalse(b.deleted);
    assert.equal(b.getField("volume"), "unsaved change");
    await b.reload(["itemData"], true);
  });

  it("skips mixed item types even when the native detector connects their DOI", async function () {
    await create("mixed");
    await create("mixed", "conferencePaper");
    const p = await plan();
    assert.lengthOf(p.groups, 1);
    const result = await merge(p);
    assert.equal(result.skipped, 1);
    assert.equal(result.merged, 0);
  });

  it("stops between groups and does not start subsequent merges", async function () {
    for (const group of ["stop-a", "stop-b", "stop-c"]) {
      await create(group);
      await create(group);
    }
    const controller = new (win().AbortController)();
    const result = await merge(await plan(), controller.signal, (state: any) => {
      if (state.completed === 1)
        controller.abort();
    });
    assert.isTrue(result.cancelled);
    assert.equal(result.completed, 1);
    assert.equal(result.merged, 1);
    assert.lengthOf(ids.map(id => Zotero.Items.get(id)).filter(item => item && item.deleted), 1);
  });

  it("restores failed metadata changes and continues with the next group", async function () {
    const a = await create("fail-a");
    const b = await create("fail-a");
    b.setField("volume", "42");
    await b.saveTx();
    await create("fail-b");
    await create("fail-b");
    const original = Zotero.Items.merge;
    let calls = 0;
    Zotero.Items.merge = async (master, others) => {
      if (calls++ === 0)
        throw new Error("Controlled native batch failure");
      return original.call(Zotero.Items, master, others);
    };
    try {
      const result = await merge(await plan());
      assert.equal(result.completed, 2);
      assert.equal(result.merged, 1);
      assert.lengthOf(result.errors, 1);
      assert.isFalse(a.deleted);
      assert.isFalse(b.deleted);
      assert.isFalse(a.hasChanged());
      assert.equal(a.getField("volume"), "");
    }
    finally { Zotero.Items.merge = original; }
  });

  it("mounts one localized keyboard-accessible button next to the native merge button", async function () {
    const w = win();
    const hooks = (Zotero as any)[config.addonInstance].hooks;
    await hooks.onMainWindowLoad(w);
    await hooks.onMainWindowLoad(w);
    await wait(() => !!w.document.getElementById("metaref-native-duplicates-merge-all"));
    assert.lengthOf(w.document.querySelectorAll("#metaref-native-duplicates"), 1);
    const button = w.document.getElementById("metaref-native-duplicates-merge-all") as HTMLButtonElement;
    assert.isTrue(!!button.closest("duplicates-merge-pane"));
    assert.match(button.textContent!, /Merge all|一键合并/);
    assert.equal(button.type, "button");
    assert.isNull(w.document.getElementById("metaref-native-duplicates-status"));
    await hooks.onMainWindowUnload(w);
    assert.isNull(w.document.getElementById("metaref-native-duplicates"));
    await hooks.onMainWindowLoad(w);
  });

  it("runs all library groups from the real pane button and rejects double clicks", async function () {
    const a = await create("ui-a");
    const b = await create("ui-a");
    await create("ui-b");
    await create("ui-b");
    const w = win();
    await w.ZoteroPane.setVirtual(a.libraryID, "duplicates", true, true);
    await w.ZoteroPane.collectionsView.selectByID(`D${a.libraryID}`);
    await w.ZoteroPane.itemsView.selectItems([a.id, b.id]);
    await wait(() => w.ZoteroPane.itemPane.mode === "duplicates", "selected the native duplicate group");
    const button = w.document.getElementById("metaref-native-duplicates-merge-all") as HTMLButtonElement;
    assert.equal(w.getComputedStyle(button)!.fontSize, "14px");
    button.click();
    button.click();
    await wait(confirmationReady, "opened native popup confirmation");
    const popupDoc = noticeDoc()!;
    const confirm = popupDoc.getElementById("metaref-native-duplicates-confirm") as HTMLButtonElement;
    assert.isTrue(button.disabled);
    assert.match(popupDoc.getElementById("metaref-native-duplicates-status")!.textContent!, /2/);
    assert.equal(popupDoc.getElementById("metaref-native-duplicates-status")!.getAttribute("role"), "status");
    confirm.click();
    await wait(() => !button.disabled);
    const feedback = popupDoc.getElementById("metaref-native-duplicates-feedback")!;
    assert.isNull(w.document.getElementById("metaref-native-duplicates-feedback"));
    assert.notEqual(popupDoc.defaultView, w);
    assert.isFalse((feedback as HTMLElement).hidden);
    assert.lengthOf(ids.map(id => Zotero.Items.get(id)).filter(item => item && item.deleted), 2);
  });

  it("cancels confirmation and cleans up a pending operation when its window unloads", async function () {
    await create("cancel-ui");
    await create("cancel-ui");
    const w = win();
    const button = w.document.getElementById("metaref-native-duplicates-merge-all") as HTMLButtonElement;
    button.click();
    await wait(confirmationReady);
    (noticeDoc()!.getElementById("metaref-native-duplicates-cancel") as HTMLButtonElement).click();
    await wait(() => !button.disabled);
    assert.isTrue(ids.every((id) => {
      const item = Zotero.Items.get(id);
      return item && !item.deleted;
    }));
    button.click();
    await wait(confirmationReady);
    const hooks = (Zotero as any)[config.addonInstance].hooks;
    await hooks.onMainWindowUnload(w);
    await (Zotero as any)[config.addonInstance].runner.exclusive(async () => {});
    assert.isNull(w.document.getElementById("metaref-native-duplicates-feedback"));
    assert.isUndefined(noticeDoc());
    assert.isTrue(ids.every((id) => {
      const item = Zotero.Items.get(id);
      return item && !item.deleted;
    }));
    await hooks.onMainWindowLoad(w);
  });

  it("cancels without merging when the native notification is closed", async function () {
    await create("close-popup");
    await create("close-popup");
    const button = win().document.getElementById("metaref-native-duplicates-merge-all") as HTMLButtonElement;
    button.click();
    await wait(confirmationReady);
    noticeDoc()!.defaultView!.close();
    await wait(() => !button.disabled);
    assert.isTrue(ids.every((id) => {
      const item = Zotero.Items.get(id);
      return item && !item.deleted;
    }));
    assert.isNull(win().document.getElementById("metaref-native-duplicates-feedback"));
  });

  it("keeps the native notification readable in light/dark and normal/narrow windows", async function () {
    await create("popup-visual");
    await create("popup-visual");
    const w = win();
    const themeKey = "browser.theme.toolbar-theme";
    const originalTheme = Services.prefs.prefHasUserValue(themeKey) ? Services.prefs.getIntPref(themeKey) : undefined;
    const width = w.outerWidth;
    const height = w.outerHeight;
    const directory = PathUtils.join(PathUtils.parent(PathUtils.parent(Zotero.Prefs.get("metaref.test.fixturePath", true) as string)!)!, ".scaffold", "qa", "native-duplicate-popup");
    await IOUtils.makeDirectory(directory, { ignoreExisting: true, createAncestors: true });
    try {
      for (const theme of ["light", "dark"]) {
        Services.prefs.setIntPref(themeKey, theme === "dark" ? 0 : 1);
        await wait(() => w.matchMedia("(prefers-color-scheme: dark)")!.matches === (theme === "dark"));
        for (const size of [1280, 860]) {
          w.resizeTo(size, 820);
          (w.document.getElementById("metaref-native-duplicates-merge-all") as HTMLButtonElement).click();
          await wait(confirmationReady);
          const popupDoc = noticeDoc()!;
          const popup = popupDoc.defaultView!;
          await Zotero.Promise.delay(300);
          const feedback = popupDoc.getElementById("metaref-native-duplicates-feedback") as HTMLElement;
          assert.isAtMost(feedback.scrollWidth, feedback.clientWidth + 1);
          assert.equal(popup.getComputedStyle(feedback)!.fontSize, "14px");
          assert.isAtLeast(popup.screenX, w.screenX);
          assert.isAtLeast(popup.screenY, w.screenY);
          assert.isAtMost(Math.abs(popup.screenX + popup.outerWidth - w.screenX - w.outerWidth), 40);
          assert.isAtMost(Math.abs(popup.screenY + popup.outerHeight - w.screenY - w.outerHeight), 60);
          const canvas = popupDoc.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement;
          canvas.width = popup.innerWidth;
          canvas.height = popup.innerHeight;
          (canvas.getContext("2d") as any).drawWindow(popup, 0, 0, canvas.width, canvas.height, theme === "dark" ? "rgb(32,32,32)" : "white");
          await IOUtils.write(PathUtils.join(directory, `${theme}-${size}.png`), Uint8Array.from(w.atob(canvas.toDataURL().split(",")[1]), c => c.charCodeAt(0)));
          popup.close();
          await wait(() => !(w.document.getElementById("metaref-native-duplicates-merge-all") as HTMLButtonElement).disabled);
        }
      }
    }
    finally {
      if (originalTheme === undefined)
        Services.prefs.clearUserPref(themeKey);
      else
        Services.prefs.setIntPref(themeKey, originalTheme);
      w.resizeTo(width, height);
    }
  });
});
