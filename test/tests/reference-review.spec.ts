import { assert } from "chai";
import { config } from "../../package.json";
import { Rules } from "../../src/modules/rules";

describe("reference verification, versions and duplicate decisions", function () {
  this.timeout(60_000);
  const plugin = () => (Zotero as any)[config.addonInstance];
  const created: number[] = [];
  const prefs = new Map<string, unknown>();
  let Search: typeof Zotero.Translate.Search;
  let request: typeof Zotero.HTTP.request;
  let alert: typeof Zotero.alert;
  let response: any;
  let arxivXML = "";
  let messages: string[] = [];
  const xml = (id = "2610.12345v2", doi = "10.1234/metaflow-published") => `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom"><entry><id>https://arxiv.org/abs/${id}</id><title>Optical response of layered materials</title><published>2025-10-01T00:00:00Z</published><summary>A controlled response.</summary><author><name>Jane Doe</name></author><arxiv:doi>${doi}</arxiv:doi></entry></feed>`;
  const create = async (title: string, type: "journalArticle" | "preprint" | "book" = "journalArticle") => {
    const item = new Zotero.Item(type);
    item.setField("title", title);
    await item.saveTx();
    created.push(item.id);
    return item;
  };
  const selection = (proposal: any, action = "update", fields = proposal.changes.map((change: any) => change.field)) => ({ proposal, action, fields: new Set(fields), acknowledged: true });
  const apply = (item: Zotero.Item, choice: any) => plugin().runner.add({ items: [item], rules: [{ id: "tool-review-metadata", category: "tool", scope: "item", apply: ({ item, report }: any) => plugin().api.review.applyReviewedMetadata(item, choice, report) }], silent: true });
  const dialog = async (selector: string) => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const win = [...plugin().data.dialogs.values()].find((win: any) => !win.closed && win.document.querySelector(selector)) as Window | undefined;
      if (win)
        return win;
      await Zotero.Promise.delay(25);
    }
    throw new Error(`Review dialog did not open: ${selector}`);
  };
  const changeSelect = (win: Window, element: HTMLSelectElement, value: string) => {
    element.value = value;
    element.dispatchEvent(new (win as any).Event("change", { bubbles: true }));
  };

  before(function () {
    Search = Zotero.Translate.Search;
    request = Zotero.HTTP.request;
    alert = Zotero.alert;
    for (const key of ["lint.onAdded", "lint.autoReport", "workflow.formatAfterUpdate", "metadata.updateJournalInfo"]) {
      prefs.set(key, Zotero.Prefs.get(`${config.prefsPrefix}.${key}`, true));
      Zotero.Prefs.set(`${config.prefsPrefix}.${key}`, false, true);
    }
    prefs.set("metadata.repairCreators", Zotero.Prefs.get(`${config.prefsPrefix}.metadata.repairCreators`, true));
    Zotero.Prefs.set(`${config.prefsPrefix}.metadata.repairCreators`, true, true);
  });

  beforeEach(function () {
    response = { itemType: "journalArticle", title: "Optical response of layered materials", DOI: "10.1234/metaflow-published", date: "2026", publicationTitle: "Test Journal", creators: [{ creatorType: "author", firstName: "Jane", lastName: "Doe" }], url: "https://doi.org/10.1234/metaflow-published" };
    arxivXML = xml();
    messages = [];
    (Zotero.Translate as any).Search = function () {
      return { setIdentifier() {}, getTranslators: async () => ["controlled"], setTranslator() {}, translate: async () => [structuredClone(response)] };
    };
    (Zotero.HTTP as any).request = async (method: string, url: string, options: unknown) => {
      if (url.startsWith("https://export.arxiv.org/api/query"))
        return { status: 200, response: arxivXML };
      return request.call(Zotero.HTTP, method as any, url, options as any);
    };
    (Zotero as any).alert = (_win: Window, _title: string, message: string) => messages.push(message);
  });

  afterEach(async function () {
    (Zotero.Translate as any).Search = Search;
    Zotero.HTTP.request = request;
    Zotero.alert = alert;
    for (const win of plugin().data.dialogs.values())
      win.close();
    await plugin().runner.add({ items: [], rules: [], silent: true });
    for (const id of created.splice(0).reverse()) {
      const item = await Zotero.Items.getAsync(id);
      if (item)
        await item.eraseTx();
    }
  });

  after(function () {
    for (const [key, value] of prefs) {
      if (value === undefined)
        Zotero.Prefs.clear(`${config.prefsPrefix}.${key}`, true);
      else
        Zotero.Prefs.set(`${config.prefsPrefix}.${key}`, value as boolean, true);
    }
  });

  it("blocks a returned DOI mismatch without changing the item", async function () {
    const item = await create("Current title");
    item.setField("DOI", "10.1234/current");
    await item.saveTx();
    const proposal = await plugin().api.review.inspectMetadata(item, { kind: "DOI", value: "10.1234/current", source: "item" }, item.toJSON());
    assert.isTrue(proposal.blocked);
    await apply(item, selection(proposal));
    assert.equal(item.getField("title"), "Current title");
    assert.equal(item.getField("DOI"), "10.1234/current");
  });

  it("reviews actual dialog controls and only persists selected fields", async function () {
    const item = await create("Optical response of layered materials");
    item.setField("DOI", response.DOI);
    item.setField("publicationTitle", "My manually corrected journal");
    await item.saveTx();
    const pending = plugin().hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
    const win = await dialog("#metaref-metadata-review");
    const manual = win.document.querySelector("input[value='publicationTitle']") as HTMLInputElement;
    assert.isFalse(manual.checked, "existing fields are not selected for overwrite");
    assert.isTrue((win.document.querySelector("input[value='date']") as HTMLInputElement).checked);
    (win.document.getElementById("metaref-review-apply") as HTMLButtonElement).click();
    await pending;
    await item.reload(["itemData", "creators"], true);
    assert.equal(item.getField("publicationTitle"), "My manually corrected journal");
    assert.equal(item.getField("date"), "2026");
    assert.equal(item.getCreators()[0].lastName, "Doe");
    assert.isFalse(item.hasChanged());
  });

  it("cancels review without writing metadata", async function () {
    const item = await create("Optical response of layered materials");
    item.setField("DOI", response.DOI);
    await item.saveTx();
    const pending = plugin().hooks.onLintInBatch("tool-review-metadata", [item]);
    const win = await dialog("#metaref-metadata-review");
    (win.document.getElementById("metaref-review-cancel") as HTMLButtonElement).click();
    await pending;
    assert.equal(item.getField("date"), "");
    assert.isFalse(item.hasChanged());
  });

  it("rejects stale review snapshots and preserves edits made during review", async function () {
    const item = await create("Optical response of layered materials");
    item.setField("DOI", response.DOI);
    await item.saveTx();
    const proposal = await plugin().api.review.inspectMetadata(item, { kind: "DOI", value: response.DOI, source: "item" }, item.toJSON());
    item.setField("title", "Manual edit while reviewing");
    await item.saveTx();
    const result = await apply(item, selection(proposal));
    assert.equal(result.failed, 1);
    assert.equal(item.getField("title"), "Manual edit while reviewing");
    assert.equal(item.getField("date"), "");
  });

  it("validates ISBN edition identity and enriches a book through the runner", async function () {
    const item = await create("The C programming language", "book");
    item.setField("ISBN", "9780131103627");
    await item.saveTx();
    response = { itemType: "book", title: "The C programming language", ISBN: "0131103628", publisher: "Prentice Hall", date: "1988" };
    const candidates = await plugin().api.review.discoverIdentifiers(item);
    assert.equal(candidates[0].kind, "ISBN");
    const proposal = await plugin().api.review.inspectMetadata(item, candidates[0], item.toJSON());
    assert.isFalse(proposal.blocked);
    await apply(item, selection(proposal, "update", ["publisher", "date"]));
    await item.reload(["itemData"], true);
    assert.equal(item.getField("publisher"), "Prentice Hall");
    assert.equal(item.getField("ISBN").replace(/-/g, ""), "9780131103627");
  });

  it("reads identifier candidates from an existing PDF cache without modifying the item", async function () {
    const item = await create("PDF discovery");
    const fixture = Zotero.Prefs.get("metaref.test.fixturePath", true) as string;
    const attachment = await Zotero.Attachments.importFromFile({ file: PathUtils.join(fixture, "pages-three.pdf"), parentItemID: item.id });
    const path = Zotero.Fulltext.getItemCacheFile(attachment).path;
    await IOUtils.writeUTF8(path, "Header DOI: 10.1234/header\nReferences DOI: 10.1234/reference");
    const candidates = await plugin().api.review.discoverIdentifiers(item);
    assert.deepEqual(candidates.map((candidate: any) => candidate.value), ["10.1234/header", "10.1234/reference"]);
    assert.include(candidates[1].excerpt, "References");
    assert.equal(item.getField("DOI"), "");
  });

  it("checks an explicit arXiv version and rejects a different returned record", function () {
    assert.throws(() => plugin().api.review.parseArxiv(xml("2610.54321v2"), "2610.12345v1", true));
    assert.throws(() => plugin().api.review.parseArxiv(xml(), "2610.12345v1", false));
    assert.equal(plugin().api.review.parseArxiv(xml(), "2610.12345v1", true).id, "2610.12345v2");
  });

  it("updates a preprint in place while retaining ID, provenance, attachments and notes", async function () {
    const item = await create("Optical response of layered materials", "preprint");
    item.setField("url", "https://arxiv.org/abs/2610.12345v1");
    item.setField("archiveID", "arXiv:2610.12345v1");
    item.setField("repository", "arXiv");
    item.setField("extra", "Manual note: keep");
    await item.saveTx();
    const note = new Zotero.Item("note");
    note.parentItemID = item.id;
    note.setNote("Keep preprint notes");
    await note.saveTx();
    const attachment = await Zotero.Attachments.linkFromURL({ url: "https://arxiv.org/pdf/2610.12345v1", parentItemID: item.id, title: "Annotated preprint" });
    const id = item.id;
    const pending = plugin().hooks.onLintInBatch("tool-review-preprint", [item]);
    const win = await dialog("#metaref-metadata-review");
    changeSelect(win, win.document.querySelector(".metaref-review-action") as HTMLSelectElement, "update");
    (win.document.getElementById("metaref-review-apply") as HTMLButtonElement).click();
    await pending;
    await item.reload(["primaryData", "itemData", "childItems"], true);
    assert.equal(item.id, id);
    assert.equal(item.itemType, "journalArticle");
    assert.equal(item.getField("DOI"), response.DOI);
    assert.include(item.getField("extra"), "Manual note: keep");
    assert.include(item.getField("extra"), "2610.12345v1");
    assert.include(item.getNotes(), note.id);
    assert.include(item.getAttachments(), attachment.id);
  });

  it("creates a related publication without altering preprint metadata, then reuses it", async function () {
    const item = await create("Optical response of layered materials", "preprint");
    item.setField("url", "https://arxiv.org/abs/2610.12345v1");
    await item.saveTx();
    const proposal = await plugin().api.review.inspectPreprint(item, { kind: "arXiv", value: "2610.12345v1", source: "item" }, item.toJSON());
    const published = await plugin().runner.exclusive((signal: AbortSignal) => plugin().api.review.createRelatedVersion(item, selection(proposal, "related"), signal));
    created.push(published.id);
    assert.equal(item.itemType, "preprint");
    assert.equal(item.getField("DOI"), "");
    assert.include(item.relatedItems, published.key);
    assert.include(published.relatedItems, item.key);
    const fresh = { ...proposal, original: structuredClone(item.toJSON()) };
    const reused = await plugin().api.review.createRelatedVersion(item, selection(fresh, "related"));
    assert.equal(reused.id, published.id);
  });

  it("does not mislabel an existing publication DOI as a preprint DOI during type migration", async function () {
    const item = await create("Optical response of layered materials", "preprint");
    item.setField("url", "https://arxiv.org/abs/2610.12345v1");
    item.setField("DOI", response.DOI);
    await item.saveTx();
    const proposal = await plugin().api.review.inspectPreprint(item, { kind: "arXiv", value: "2610.12345v1", source: "item" }, item.toJSON());
    await apply(item, selection(proposal));
    assert.equal(item.itemType, "journalArticle");
    assert.equal(item.getField("DOI"), response.DOI);
    assert.include(item.getField("extra"), "MetaFlow preprint identifier: 2610.12345v1");
    assert.notInclude(item.getField("extra"), `MetaFlow preprint DOI: ${response.DOI}`);
  });

  it("rechecks a preprint after entering its transaction without discarding a pending edit", async function () {
    const item = await create("Optical response of layered materials", "preprint");
    item.setField("url", "https://arxiv.org/abs/2610.12345v1");
    await item.saveTx();
    const proposal = await plugin().api.review.inspectPreprint(item, { kind: "arXiv", value: "2610.12345v1", source: "item" }, item.toJSON());
    const original = Zotero.DB.executeTransaction;
    let intervened = false;
    (Zotero.DB as any).executeTransaction = function (...args: any[]) {
      if (!intervened) {
        intervened = true;
        item.setField("extra", "A pending edit while waiting for the transaction");
      }
      return (original as any).apply(this, args);
    };
    let rejected = false;
    try {
      await plugin().api.review.createRelatedVersion(item, selection(proposal, "related"));
    }
    catch { rejected = true; }
    finally { Zotero.DB.executeTransaction = original; }
    assert.isTrue(rejected);
    assert.isEmpty(item.relatedItems);
    assert.equal(item.getField("extra"), "A pending edit while waiting for the transaction");
    assert.isTrue(item.hasChanged(), "the competing unsaved edit remains editable");
  });

  it("rolls back failed relationship writes while retaining unrelated manual changes", async function () {
    const item = await create("Optical response of layered materials", "preprint");
    item.setField("url", "https://arxiv.org/abs/2610.12345v1");
    await item.saveTx();
    const proposal = await plugin().api.review.inspectPreprint(item, { kind: "arXiv", value: "2610.12345v1", source: "item" }, item.toJSON());
    const original = Zotero.Item.prototype.save;
    let publicationSaves = 0;
    Zotero.Item.prototype.save = async function (...args: Parameters<typeof original>) {
      if (this.itemType === "journalArticle" && this.getField("DOI") === response.DOI && ++publicationSaves === 2) {
        item.setField("extra", "Manual edit during the failed save");
        throw new Error("Controlled publication save failure");
      }
      return original.apply(this, args);
    };
    let error = "";
    try {
      await plugin().api.review.createRelatedVersion(item, selection(proposal, "related"));
    }
    catch (caught) { error = String(caught); }
    finally { Zotero.Item.prototype.save = original; }
    assert.include(error, "Controlled publication save failure");
    assert.isEmpty(item.relatedItems);
    assert.equal(item.getField("extra"), "Manual edit during the failed save");
    assert.isTrue(item.hasChanged());
    const search = new Zotero.Search({ libraryID: item.libraryID });
    search.addCondition("DOI", "is", response.DOI);
    assert.isEmpty(await search.search(), "the rolled-back publication must not remain in the database");
  });

  it("requires identity conflict acknowledgement before replacing fields", async function () {
    const item = await create("A different reference");
    item.setField("DOI", response.DOI);
    await item.saveTx();
    const proposal = await plugin().api.review.inspectMetadata(item, { kind: "DOI", value: response.DOI, source: "item" }, item.toJSON());
    await apply(item, { ...selection(proposal), acknowledged: false });
    assert.equal(item.getField("title"), "A different reference");
    assert.equal(item.getField("date"), "");
  });

  it("merges only after a native decision dialog and retains notes, tags and collections", async function () {
    const left = await create("Duplicate optical response");
    const right = await create("Duplicate optical response");
    for (const item of [left, right]) {
      item.setField("DOI", "10.1234/metaflow-duplicate");
      await item.saveTx();
    }
    right.setField("volume", "42");
    right.addTag("keep-source-tag");
    await right.saveTx();
    const note = new Zotero.Item("note");
    note.parentItemID = right.id;
    note.setNote("Source note");
    await note.saveTx();
    const fixture = Zotero.Prefs.get("metaref.test.fixturePath", true) as string;
    const attachment = await Zotero.Attachments.importFromFile({ file: PathUtils.join(fixture, "pages-three.pdf"), parentItemID: right.id });
    const collection = new Zotero.Collection();
    collection.name = "MetaFlow merge collection";
    await collection.saveTx();
    right.addToCollection(collection.id);
    await right.saveTx();
    const pending = plugin().hooks.onLintInBatch("tool-review-duplicates", [left]);
    const win = await dialog("#metaref-duplicate-review");
    assert.include(win.document.body!.textContent!, String(right.id));
    changeSelect(win, win.document.getElementById("metaref-duplicate-action") as HTMLSelectElement, "merge");
    const volume = win.document.querySelector(`select[aria-label='${Zotero.ItemFields.getLocalizedString("volume")}']`) as HTMLSelectElement;
    changeSelect(win, volume, String(right.id));
    (win.document.getElementById("metaref-duplicate-apply") as HTMLButtonElement).click();
    await pending;
    await left.reload(["itemData", "tags", "childItems", "collections"], true);
    assert.isTrue(right.deleted, JSON.stringify(messages));
    assert.equal(left.getField("volume"), "42");
    assert.isTrue(left.hasTag("keep-source-tag"));
    assert.include(left.getNotes(), note.id);
    assert.include(left.getAttachments(), attachment.id);
    assert.include(left.getCollections(), collection.id);
    await collection.eraseTx();
    assert.isNotEmpty(messages);
  });

  it("relates different publication versions and rejects stale merge decisions", async function () {
    const left = await create("Optical response of layered materials");
    const right = await create("Optical response of layered materials");
    for (const [item, doi] of [[left, "10.1234/version-a"], [right, "10.1234/version-b"]] as const) {
      item.setField("DOI", doi);
      item.setField("date", "2026");
      item.setCreators([{ creatorType: "author", lastName: "Doe" }]);
      await item.saveTx();
    }
    const pair = (await plugin().api.review.findDuplicates([left])).find((pair: any) => pair.right.id === right.id);
    assert.isFalse(pair.mergeable);
    let rejected = false;
    try {
      await plugin().api.review.applyDuplicateDecision({ pair, action: "merge", masterID: left.id, donors: new Map() });
    }
    catch { rejected = true; }
    assert.isTrue(rejected);
    await plugin().api.review.applyDuplicateDecision({ pair, action: "relate", masterID: left.id, donors: new Map() });
    assert.isFalse(left.deleted);
    assert.isFalse(right.deleted);
    assert.include(left.relatedItems, right.key);
    let stale = false;
    try {
      await plugin().api.review.applyDuplicateDecision({ pair, action: "relate", masterID: left.id, donors: new Map() });
    }
    catch { stale = true; }
    assert.isTrue(stale);
  });

  it("shows only the two core context-menu commands in compact mode", async function () {
    const item = await create("Compact menu reference");
    const win = Zotero.getMainWindow();
    const key = `${config.prefsPrefix}.menu.compact`;
    const previous = Zotero.Prefs.get(key, true);
    const popup = win.document.getElementById("zotero-itemmenu") as any;
    try {
      Zotero.Prefs.set(key, true, true);
      await win.ZoteroPane.selectItem(item.id);
      await win.ZoteroPane.buildItemContextMenu();
      popup.openPopup(win.document.getElementById("zotero-items-tree"), "after_start", 0, 0, true);
      for (let attempt = 0; attempt < 100 && popup.state !== "open"; attempt++)
        await Zotero.Promise.delay(20);
      const entries = [...popup.querySelectorAll(":scope > menuitem[data-l10n-id^='metaref-']")].filter((element: any) => !element.hidden);
      assert.sameMembers(entries.map((element: any) => element.getAttribute("data-l10n-id")), ["metaref-menuitem-stdFormatFlow", "metaref-rule-tool-update-metadata-menu-item"]);
      assert.isTrue(popup.querySelector("menu[data-l10n-id='metaref-menuitem-label']").hidden);
    }
    finally {
      popup.hidePopup();
      Zotero.Prefs.set(key, previous as boolean, true);
    }
  });

  it("measures local checking against identifier lookup without issuing any implicit network requests", async function () {
    const previous = new Map<string, unknown>();
    const pref = (key: string, value: boolean) => {
      const full = `${config.prefsPrefix}.${key}`;
      if (!previous.has(full))
        previous.set(full, Zotero.Prefs.get(full, true));
      Zotero.Prefs.set(full, value, true);
    };
    let requests = 0;
    const samples: Zotero.Item[] = [];
    try {
      for (const rule of Rules.getStandard())
        pref(`rule.${rule.id}`, rule.id === "require-doi");
      for (const key of ["workflow.updateMetadata", "workflow.updateJournalRankings", "workflow.remoteAuthorsOnCheck", "metadata.autoUpdateOnAdded", "easyscholar.autoUpdateOnAdded"])
        pref(key, false);
      for (let index = 0; index < 40; index++) {
        const item = await create(`Measured local checking reference ${index}`);
        item.setField("date", "2026");
        item.setField("language", "en");
        item.setField("publicationTitle", "Test Journal");
        await item.saveTx();
        samples.push(item);
      }
      (Zotero.HTTP as any).request = async (method: string, url: string, options: unknown) => {
        if (!url.startsWith("https://www.crossref.org/openurl"))
          return request.call(Zotero.HTTP, method as any, url, options as any);
        requests++;
        await Zotero.Promise.delay(15);
        return { status: 200, responseXML: new (Zotero.getMainWindow() as any).DOMParser().parseFromString("<query status=\"unresolved\"/>", "text/xml") };
      };
      const baseline = Date.now();
      await plugin().hooks.onLintInBatch("require-doi", samples);
      const lookupMs = Date.now() - baseline;
      const lookupRequests = requests;
      requests = 0;
      const local = Date.now();
      const result = await plugin().hooks.onLintInBatch("standard", samples);
      const localMs = Date.now() - local;
      assert.equal(lookupRequests, 40);
      assert.equal(requests, 0);
      assert.equal(result.warnings, 40);
      assert.isNumber(result.durationMs);
      pref("lint.onAdded", true);
      await plugin().hooks.onNotify("add", "item", [samples[0].id], {});
      for (let attempt = 0; attempt < 200 && !plugin().data.lastAutomaticWorkflow?.finishedAt; attempt++)
        await Zotero.Promise.delay(20);
      assert.isDefined(plugin().data.lastAutomaticWorkflow?.finishedAt);
      assert.equal(requests, 0, "automatic local checking stays offline");
      const fixture = Zotero.Prefs.get("metaref.test.fixturePath", true) as string;
      await Zotero.File.putContentsAsync(PathUtils.join(PathUtils.parent(PathUtils.parent(fixture)!)!, ".scaffold", "qa", "workflow-performance.json"), JSON.stringify({ zoteroVersion: Zotero.version, items: 40, controlledLatencyMs: 15, explicitDOILookup: { requests: lookupRequests, durationMs: lookupMs }, localCheck: { requests, durationMs: localMs }, automaticOffline: true }, null, 2));
    }
    finally {
      for (const [key, value] of previous) {
        if (value === undefined)
          Zotero.Prefs.clear(key, true);
        else
          Zotero.Prefs.set(key, value as boolean, true);
      }
    }
  });
});
