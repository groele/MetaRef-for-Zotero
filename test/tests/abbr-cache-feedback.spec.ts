import { assert } from "chai";
import { config } from "../../package.json";
import { SemanticScholarService } from "../../src/modules/rules/tool-update-metadata/services/semantic-scholar-service";
import { clearRequestCache, requestServiceGET } from "../../src/utils/http";
import { clearStoredServiceCache, flushServiceCache, resetServiceCacheSession } from "../../src/utils/service-cache-storage";

describe("abbreviations, durable cache and quiet completion in Zotero", function () {
  this.timeout(30_000);
  const plugin = () => (Zotero as any)[config.addonInstance];
  const prefs = new Map<string, unknown>();
  const items: Zotero.Item[] = [];
  const pref = (key: string, value: string | boolean) => {
    const full = `${config.prefsPrefix}.${key}`;
    if (!prefs.has(full))
      prefs.set(full, Zotero.Prefs.get(full, true));
    Zotero.Prefs.set(full, value, true);
  };
  const create = async (publicationTitle: string, abbr = "") => {
    const item = new Zotero.Item("journalArticle");
    item.setField("title", "Abbreviation integration regression");
    item.setField("publicationTitle", publicationTitle);
    item.setField("journalAbbreviation", abbr);
    await item.saveTx();
    items.push(item);
    return item;
  };

  before(function () {
    pref("lint.onAdded", false);
    pref("lint.autoReport", false);
    pref("rule.require-journal-abbr.sourceMode", "auto");
    pref("rule.require-journal-abbr.existingPolicy", "known");
    pref("rule.require-journal-abbr.matchMode", "exact");
    pref("rule.require-journal-abbr.profile", "combined");
    pref("rule.require-journal-abbr.letterCase", "keep");
    pref("rule.require-journal-abbr.withDots", true);
    pref("rule.require-journal-abbr.infer", true);
    pref("rule.require-journal-abbr.customDataPath", "");
  });

  after(async function () {
    clearRequestCache();
    await clearStoredServiceCache();
    for (const item of items)
      await item.eraseTx();
    for (const [key, value] of prefs) {
      if (value === undefined)
        Zotero.Prefs.clear(key, true);
      else
        Zotero.Prefs.set(key, value as string | boolean, true);
    }
  });

  it("writes verified built-in abbreviations and preserves unknown manual values", async function () {
    const known = await create("Nano Research", "Wrong abbreviation");
    const manual = await create("Unlisted Madeup Journal 78291", "My manual abbreviation");
    await plugin().hooks.onLintInBatch(["require-journal-abbr"], [known, manual]);
    assert.equal(known.getField("journalAbbreviation"), "Nano Res.");
    assert.equal(manual.getField("journalAbbreviation"), "My manual abbreviation");
    assert.equal(plugin().runner.lastResult.failed, 0);
    pref("rule.require-journal-abbr.existingPolicy", "blank");
    await plugin().hooks.onLintInBatch(["require-journal-abbr"], [known]);
    assert.equal(known.getField("journalAbbreviation"), "Nano Res.");
    pref("rule.require-journal-abbr.existingPolicy", "known");
  });

  it("infers ISO 4 offline with the production LTWA asset", async function () {
    const original = Zotero.HTTP.request;
    Zotero.HTTP.request = async () => {
      throw new Error("ISO 4 must not use the network");
    };
    try {
      pref("rule.require-journal-abbr.sourceMode", "iso4");
      const item = await create("Journal of Experimental Biology");
      await plugin().hooks.onLintInBatch(["require-journal-abbr"], [item]);
      assert.equal(item.getField("journalAbbreviation"), "J. Exp. Biol.");
      assert.equal(plugin().runner.lastResult.failed, 0);
    }
    finally {
      Zotero.HTTP.request = original;
      pref("rule.require-journal-abbr.sourceMode", "auto");
    }
  });

  it("reuses a real profile cache file across session resets without writing API keys", async function () {
    await clearStoredServiceCache();
    clearRequestCache();
    const original = Zotero.HTTP.request;
    let calls = 0;
    Zotero.HTTP.request = async () => {
      calls++;
      return { status: 200, response: "{\"paperId\":\"durable-fixture\"}", responseText: "{\"paperId\":\"durable-fixture\"}" } as XMLHttpRequest;
    };
    const fetch = () => requestServiceGET("semantic-scholar", "https://example.test/durable-fixture", { headers: { "x-api-key": "fixture-do-not-persist-key" } });
    try {
      await Promise.all([fetch(), fetch(), fetch()]);
      assert.equal(calls, 1);
      await flushServiceCache();
      const path = PathUtils.join((Zotero as any).Profile.dir, "metaflow-api-cache-v1.json");
      const text = await IOUtils.readUTF8(path);
      assert.notInclude(text, "fixture-do-not-persist-key");
      assert.include(text, "durable-fixture");
      clearRequestCache();
      resetServiceCacheSession();
      await fetch();
      assert.equal(calls, 1, "restored response avoids a network request");
      clearRequestCache();
      await clearStoredServiceCache();
      await fetch();
      assert.equal(calls, 2, "explicit clear allows a fresh request");
    }
    finally { Zotero.HTTP.request = original; }
  });

  it("shares Semantic Scholar identifier and metadata requests for the same paper", async function () {
    pref("semanticScholarToken", "semantic-fixture-token");
    const original = Zotero.HTTP.request;
    let calls = 0;
    Zotero.HTTP.request = async () => {
      calls++;
      const response = JSON.stringify({ paperId: "cache-alias-fixture", title: "Alias fixture", externalIds: { DOI: "10.1234/cache-alias-fixture" } });
      return { status: 200, response, responseText: response } as XMLHttpRequest;
    };
    try {
      const identifiers = { DOI: "10.1234/cache-alias-fixture" };
      const ctx = { item: { itemType: "conferencePaper" } as Zotero.Item, identifiers, isPreprint: false, debug: () => {} };
      await SemanticScholarService.updateIdentifiers!(ctx);
      const data = await SemanticScholarService.fetch!(ctx);
      assert.equal(data?.title, "Alias fixture");
      assert.equal(calls, 1);
    }
    finally { Zotero.HTTP.request = original; }
  });

  it("closes a normal success notification after about 1.5 seconds without mouse interaction", async function () {
    pref("lint.notify", true);
    const ui = plugin().runner.ui;
    await ui.init();
    const helper = (ui as any).progressWindow;
    const nativeWindow = helper.lines[2]._itemText.ownerDocument.defaultView;
    try {
      ui.showFinished(1, 0, 0.1, false, 0, 0, { saved: 1, unchanged: 0, notApplicable: 0, warnings: 0 });
      await Zotero.Promise.delay(500);
      assert.isFalse(nativeWindow.closed, "a success stays visible long enough to read");
      await Zotero.Promise.delay(1600);
      assert.isTrue(nativeWindow.closed, "no mouse entry is required to dismiss the notice");
      assert.isFalse(ui.running);
    }
    finally { ui.close(); }
  });
});
