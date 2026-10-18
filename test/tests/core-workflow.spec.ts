import { assert } from "chai";
import { config } from "../../package.json";
import { EASYSCHOLAR_FIELD_DEFINITIONS } from "../../src/utils/easyscholar";

describe("core command execution and optional costs", function () {
  this.timeout(60_000);
  const plugin = () => (Zotero as any)[config.addonInstance];
  const saved = new Map<string, unknown>();
  const created: number[] = [];
  const pref = (key: string, value: string | boolean) => {
    const full = `${config.prefsPrefix}.${key}`;
    if (!saved.has(full))
      saved.set(full, Zotero.Prefs.get(full, true));
    Zotero.Prefs.set(full, value, true);
  };
  let Search: typeof Zotero.Translate.Search;
  let request: typeof Zotero.HTTP.request;
  let alert: typeof Zotero.alert;
  let translations = 0;
  let requests = 0;
  let response: any;
  const create = async (title = "Core workflow fixture.", doi = "10.1234/core-workflow") => {
    const item = new Zotero.Item("journalArticle");
    item.setField("title", title);
    item.setField("DOI", doi);
    await item.saveTx();
    created.push(item.id);
    return item;
  };
  const dialog = async (selector = "#metaref-metadata-review") => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const win = [...plugin().data.dialogs.values()].find((win: any) => !win.closed && win.document.querySelector(selector)) as Window | undefined;
      if (win)
        return win;
      await Zotero.Promise.delay(25);
    }
    throw new Error("Core metadata review did not open");
  };

  before(function () {
    Search = Zotero.Translate.Search;
    request = Zotero.HTTP.request;
    alert = Zotero.alert;
  });

  beforeEach(function () {
    translations = requests = 0;
    for (const key of ["lint.onAdded", "lint.autoReport", "workflow.updateMetadata", "workflow.remoteAuthorsOnCheck", "workflow.updateJournalRankings", "workflow.reviewDuplicatesOnCheck", "workflow.reviewDuplicatesOnUpdate", "workflow.scanPDF", "workflow.searchTitle", "metadata.updateJournalInfo"])
      pref(key, false);
    pref("workflow.updateBibliographic", true);
    pref("workflow.formatAfterUpdate", true);
    pref("rule.tool-update-metadata.option.mode", "blank");
    pref("rule.no-title-trailing-dot", true);
    pref("rule.no-item-duplication", false);
    response = { itemType: "journalArticle", title: "Core workflow fixture.", DOI: "10.1234/core-workflow", date: "2026", creators: [{ creatorType: "author", firstName: "Jane", lastName: "Doe" }] };
    (Zotero.Translate as any).Search = function () {
      return { setIdentifier() {}, setSearch() {}, getTranslators: async () => ["controlled"], setTranslator() {}, translate: async () => {
        translations++;
        return [structuredClone(response)];
      } };
    };
    (Zotero.HTTP as any).request = async (_method: string, url: string) => {
      requests++;
      assert.include(url, "easyscholar.cc", "fallback searches do not silently contact another service");
      return { status: 200, responseText: JSON.stringify({ code: 200, data: { officialRank: { all: { sci: "Q1" } } } }) };
    };
    (Zotero as any).alert = () => {};
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
    for (const [key, value] of saved) {
      if (value === undefined)
        Zotero.Prefs.clear(key, true);
      else
        Zotero.Prefs.set(key, value as any, true);
    }
    saved.clear();
  });

  it("checks locally without querying identifiers, authors or journal providers", async function () {
    const item = await create();
    await plugin().hooks.onLintInBatch("standard", [item], { core: true });
    assert.equal(item.getField("title"), "Core workflow fixture");
    assert.equal(translations + requests, 0);
  });

  it("combines full metadata and author verification once and coalesces repeated clicks", async function () {
    const item = await create();
    pref("workflow.updateMetadata", true);
    pref("workflow.remoteAuthorsOnCheck", true);
    const first = plugin().hooks.onLintInBatch("standard", [item], { core: true });
    const second = plugin().hooks.onLintInBatch("standard", [item], { core: true });
    const win = await dialog();
    assert.equal(item.getField("title"), "Core workflow fixture.", "formatting waits until review finishes");
    (win.document.getElementById("metaref-review-apply") as HTMLButtonElement).click();
    await Promise.all([first, second]);
    assert.equal(translations, 1);
    assert.equal(item.getField("title"), "Core workflow fixture");
    assert.equal(item.getField("date"), "2026");
    assert.equal(item.getCreators()[0].lastName, "Doe", "the explicit author option takes effect even when the general author switch is off");
    const workflow = plugin().data.lastCoreWorkflow;
    assert.deepEqual(workflow.stages.map((entry: any) => entry.stage), ["metadata", "format"]);
    assert.isTrue(workflow.stages[0].result.changes.some((change: any) => change.field === "date"), "later formatting retains earlier metadata evidence");
  });

  it("stops formatting and journal stages when the core metadata review is cancelled", async function () {
    const item = await create();
    pref("metadata.updateJournalInfo", true);
    const pending = plugin().hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
    const win = await dialog();
    (win.document.getElementById("metaref-review-cancel") as HTMLButtonElement).click();
    const result = await pending;
    assert.isTrue(result.cancelled);
    assert.equal(item.getField("title"), "Core workflow fixture.");
    assert.equal(requests, 0);
  });

  it("formats after an accepted update without adding another metadata or duplicate scan", async function () {
    const item = await create();
    pref("rule.no-item-duplication", true);
    const runner = plugin().runner;
    const original = runner.add;
    const batches: string[][] = [];
    runner.add = function (options: any) {
      batches.push(options.rules.map((rule: any) => rule.id));
      return original.call(this, options);
    };
    try {
      const pending = plugin().hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
      const win = await dialog();
      assert.equal(item.getField("title"), "Core workflow fixture.");
      (win.document.getElementById("metaref-review-apply") as HTMLButtonElement).click();
      await pending;
      assert.equal(item.getField("title"), "Core workflow fixture");
      assert.equal(item.getField("date"), "2026");
      assert.equal(translations, 1);
      assert.lengthOf(batches, 2);
      assert.deepEqual(batches[0], ["tool-review-metadata"]);
      for (const id of ["no-item-duplication", "tool-update-metadata", "correct-doi-long"])
        assert.notInclude(batches[1], id);
      assert.deepEqual(plugin().data.lastCoreWorkflow.stages.map((entry: any) => entry.stage), ["metadata", "format"]);
    }
    finally { runner.add = original; }
  });

  it("updates journal metrics even when bibliographic review and formatting are disabled", async function () {
    const item = await create();
    item.setField("publicationTitle", "Core Workflow Metrics Fixture");
    item.setField("date", "2026");
    await item.saveTx();
    pref("workflow.updateBibliographic", false);
    pref("workflow.formatAfterUpdate", false);
    pref("metadata.updateJournalInfo", true);
    pref("easyscholar.secretKey", "core-workflow-test-key");
    pref("easyscholar.writeToExtra", true);
    pref("insights.natureEnabled", false);
    for (const field of EASYSCHOLAR_FIELD_DEFINITIONS)
      pref(`easyscholar.fields.${field.key}`, field.key === "sci");
    await plugin().hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
    assert.equal(translations, 0);
    assert.equal(requests, 1);
    assert.include(item.getField("extra"), "SCI: 是");
    assert.equal(item.getField("title"), "Core workflow fixture.");
    pref("workflow.updateBibliographic", true);
    const pending = plugin().hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
    const win = await dialog();
    assert.lengthOf(win.document.querySelectorAll(".metaref-review-field"), 0, "bibliographic values are already current");
    (win.document.getElementById("metaref-review-apply") as HTMLButtonElement).click();
    const result = await pending;
    assert.isTrue(result.records.some((record: any) => record.code === "journal-summary"), "unchanged bibliography does not suppress the metrics stage");
    assert.equal(requests, 1, "the second metrics lookup reuses its cached response");
  });

  it("does not search by title or scan PDF caches when both fallback options are disabled", async function () {
    const item = await create("No identifier fixture", "");
    const fixture = Zotero.Prefs.get("metaref.test.fixturePath", true) as string;
    const attachment = await Zotero.Attachments.importFromFile({ file: PathUtils.join(fixture, "pages-three.pdf"), parentItemID: item.id });
    await IOUtils.writeUTF8(Zotero.Fulltext.getItemCacheFile(attachment).path, "DOI: 10.1234/core-pdf-fallback");
    assert.isEmpty(await plugin().api.review.discoverIdentifiers(item, undefined, false));
    translations = requests = 0;
    pref("workflow.formatAfterUpdate", false);
    const pending = plugin().hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
    const win = await dialog();
    assert.lengthOf(win.document.querySelectorAll(".metaref-review-proposal"), 0);
    (win.document.getElementById("metaref-review-apply") as HTMLButtonElement).click();
    await pending;
    assert.equal(translations + requests, 0);
    assert.equal(item.getField("DOI"), "");
  });

  it("enables PDF candidates only when selected and still asks before adopting their DOI", async function () {
    const item = await create("Core workflow fixture.", "");
    const fixture = Zotero.Prefs.get("metaref.test.fixturePath", true) as string;
    const attachment = await Zotero.Attachments.importFromFile({ file: PathUtils.join(fixture, "pages-three.pdf"), parentItemID: item.id });
    await IOUtils.writeUTF8(Zotero.Fulltext.getItemCacheFile(attachment).path, "DOI: 10.1234/core-workflow");
    pref("workflow.scanPDF", true);
    pref("workflow.formatAfterUpdate", false);
    translations = 0;
    const pending = plugin().hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
    const identifier = await dialog("#metaref-review-identifier");
    assert.equal(item.getField("DOI"), "");
    const select = identifier.document.getElementById("metaref-review-identifier") as HTMLSelectElement;
    select.value = "0";
    select.dispatchEvent(new (identifier as any).Event("change", { bubbles: true }));
    (identifier.document.getElementById("metaref-review-inspect") as HTMLButtonElement).click();
    const review = await dialog();
    assert.equal(item.getField("DOI"), "");
    (review.document.getElementById("metaref-review-apply") as HTMLButtonElement).click();
    await pending;
    assert.equal(translations, 1);
    assert.equal(item.getField("DOI"), "10.1234/core-workflow");
  });

  it("only snapshots matching duplicate candidates, retaining full freshness checks", async function () {
    const left = await create("Candidate", "10.1234/core-dupe");
    const right = await create("Candidate", "10.1234/core-dupe");
    const unrelated = await create("Unrelated", "10.1234/core-unrelated");
    const original = unrelated.toJSON;
    unrelated.toJSON = () => {
      throw new Error("An unrelated item's full metadata should not be serialized");
    };
    try {
      const pairs = await plugin().api.review.findDuplicates([left]);
      assert.lengthOf(pairs, 1);
      assert.equal(pairs[0].right.id, right.id);
      assert.equal(pairs[0].left.data.key, left.key, "matching candidates still carry complete snapshots");
    }
    finally { unrelated.toJSON = original; }
  });

  it("allows a title lookup only after its fallback option is enabled", async function () {
    const item = await create("Core workflow fixture.", "");
    pref("workflow.searchTitle", true);
    pref("workflow.formatAfterUpdate", false);
    const pending = plugin().hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
    const win = await dialog();
    assert.equal(translations, 1);
    assert.lengthOf(win.document.querySelectorAll(".metaref-review-proposal"), 1);
    (win.document.getElementById("metaref-review-apply") as HTMLButtonElement).click();
    await pending;
    assert.equal(item.getField("DOI"), "10.1234/core-workflow");
  });

  it("does not look up a linked publication until version lookup is enabled", async function () {
    const item = new Zotero.Item("preprint");
    item.setField("title", "Core workflow fixture.");
    item.setField("url", "https://arxiv.org/abs/2610.65432v1");
    await item.saveTx();
    created.push(item.id);
    pref("workflow.formatAfterUpdate", false);
    (Zotero.HTTP as any).request = async () => ({ status: 200, response: "<feed xmlns=\"http://www.w3.org/2005/Atom\" xmlns:arxiv=\"http://arxiv.org/schemas/atom\"><entry><id>https://arxiv.org/abs/2610.65432v1</id><title>Core workflow fixture.</title><published>2026-10-01</published><arxiv:doi>10.1234/core-workflow</arxiv:doi></entry></feed>" });
    for (const enabled of [false, true]) {
      pref("workflow.updateVersions", enabled);
      const pending = plugin().hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
      const win = await dialog();
      assert.equal(translations, enabled ? 1 : 0);
      assert.lengthOf(win.document.querySelectorAll("option[value='related']"), enabled ? 1 : 0);
      (win.document.getElementById("metaref-review-cancel") as HTMLButtonElement).click();
      await pending;
    }
    assert.equal(item.itemType, "preprint");
  });

  const prepareVersion = async (format = false) => {
    const item = new Zotero.Item("preprint");
    item.setField("title", "Core workflow fixture.");
    item.setField("url", "https://arxiv.org/abs/2610.65432v1");
    item.setCreators([{ creatorType: "author", firstName: "Local", lastName: "Author" }]);
    await item.saveTx();
    created.push(item.id);
    pref("workflow.updateVersions", true);
    pref("workflow.formatAfterUpdate", format);
    pref("metadata.repairCreators", false);
    (Zotero.HTTP as any).request = async () => ({ status: 200, response: "<feed xmlns=\"http://www.w3.org/2005/Atom\" xmlns:arxiv=\"http://arxiv.org/schemas/atom\"><entry><id>https://arxiv.org/abs/2610.65432v1</id><title>Core workflow fixture.</title><published>2026-10-01</published><arxiv:doi>10.1234/core-workflow</arxiv:doi></entry></feed>" });
    const pending = plugin().hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
    const win = await dialog();
    const action = win.document.querySelector<HTMLSelectElement>(".metaref-review-action")!;
    action.value = "related";
    action.dispatchEvent(new (win as any).Event("change", { bubbles: true }));
    const acknowledge = win.document.querySelector<HTMLInputElement>(".metaref-review-acknowledge");
    if (acknowledge)
      acknowledge.click();
    return { item, pending, win };
  };

  it("honors the author switch when creating a related publication and records the saved relationship", async function () {
    const { item, pending, win } = await prepareVersion();
    assert.isNull(win.document.querySelector(".metaref-review-field[value='creators']"));
    (win.document.getElementById("metaref-review-apply") as HTMLButtonElement).click();
    const result = await pending;
    assert.equal(result.failed, 0);
    assert.equal(result.saved, 1);
    assert.equal(result.changed, 1);
    assert.equal(item.itemType, "preprint");
    assert.lengthOf(item.relatedItems, 1);
    const published = Zotero.Items.getByLibraryAndKey(item.libraryID, item.relatedItems[0])!;
    created.push(published.id);
    assert.equal(published.getCreators()[0].lastName, "Author");
    assert.isTrue(result.records.some((record: any) => record.code === "version-related"));
    assert.isTrue(result.changes.some((change: any) => change.field === "relations" && change.saved));
    assert.strictEqual(plugin().data.lastCoreWorkflow.stages[0].result, result);
  });

  it("reports a rejected related-version write and preserves edits made while the review was open", async function () {
    const { item, pending, win } = await prepareVersion();
    item.setField("extra", "An edit made in another window");
    await item.saveTx();
    (win.document.getElementById("metaref-review-apply") as HTMLButtonElement).click();
    const result = await pending;
    assert.equal(result.failed, 1);
    assert.equal(result.passed, 0);
    assert.equal(result.saved, 0);
    assert.isEmpty(item.relatedItems);
    assert.equal(item.getField("extra"), "An edit made in another window");
    assert.isTrue(result.records.some((record: any) => record.code === "version-related-failed" && record.level === "error"));
  });

  it("propagates cancellation during a related-publication lookup and stops following formatting", async function () {
    const { item, pending, win } = await prepareVersion(true);
    const original = Zotero.Search.prototype.search;
    Zotero.Search.prototype.search = async function (...args: Parameters<typeof original>) {
      plugin().runner.cancel();
      return original.apply(this, args);
    };
    try {
      (win.document.getElementById("metaref-review-apply") as HTMLButtonElement).click();
      const result = await pending;
      assert.isTrue(result.cancelled);
      assert.isEmpty(item.relatedItems);
      assert.equal(item.getField("title"), "Core workflow fixture.");
      assert.equal(result.saved, 0);
    }
    finally { Zotero.Search.prototype.search = original; }
  });

  it("retains decisions in the combined report when duplicate review is the only enabled stage", async function () {
    pref("workflow.updateBibliographic", false);
    pref("workflow.formatAfterUpdate", false);
    pref("workflow.reviewDuplicatesOnUpdate", true);
    pref("duplicates.nonDuplicatePairs", "[]");
    const a = await create("Duplicate-only fixture", "10.1234/duplicate-only");
    await create("Duplicate-only fixture", "10.1234/duplicate-only");
    const pending = plugin().hooks.onLintInBatch("tool-update-metadata", [a], { review: true });
    const win = await dialog("#metaref-duplicate-review");
    const action = win.document.getElementById("metaref-duplicate-action") as HTMLSelectElement;
    action.value = "notDuplicate";
    action.dispatchEvent(new (win as any).Event("change", { bubbles: true }));
    (win.document.getElementById("metaref-duplicate-apply") as HTMLButtonElement).click();
    const result = await pending;
    assert.equal(result.processed, 2);
    assert.equal(result.saved, 0);
    assert.isFalse(result.cancelled);
    assert.lengthOf(result.records, 1);
    assert.deepEqual(plugin().data.lastCoreWorkflow.stages.map((entry: any) => entry.stage), ["duplicates"]);
    assert.isEmpty(await plugin().api.review.findDuplicates([a]));
  });

  it("reports cancellation when duplicate review is the only enabled core stage", async function () {
    pref("workflow.updateBibliographic", false);
    pref("workflow.formatAfterUpdate", false);
    pref("workflow.reviewDuplicatesOnUpdate", true);
    const a = await create("Cancelled duplicate fixture", "10.1234/cancelled-duplicate-only");
    await create("Cancelled duplicate fixture", "10.1234/cancelled-duplicate-only");
    const pending = plugin().hooks.onLintInBatch("tool-update-metadata", [a], { review: true });
    const win = await dialog("#metaref-duplicate-review");
    (win.document.getElementById("metaref-review-cancel") as HTMLButtonElement).click();
    const result = await pending;
    assert.isTrue(result.cancelled);
    assert.equal(result.saved, 0);
    assert.equal(result.processed, 0);
    assert.isTrue(result.records.some((record: any) => record.level === "warning"));
  });
});
