import { assert } from "chai";
import { config } from "../../package.json";

const prefix = `${config.prefsPrefix}.`;

describe("abstract normalization", function () {
  this.timeout(30_000);
  const plugin = () => (Zotero as any)[config.addonInstance];
  const preferences = new Map<string, unknown>();
  const items: Zotero.Item[] = [];
  const original = "ABSTRACT\n\n  Polarization   in WSe\n 2\n /CuInP\n 2\n S\n 6\n and Cu\n +\n ions.";
  const expected = "Polarization in WSe2/CuInP2S6 and Cu+ ions.";
  function pref(key: string, value: boolean) {
    if (!preferences.has(key))
      preferences.set(key, Zotero.Prefs.get(prefix + key, true));
    Zotero.Prefs.set(prefix + key, value, true);
  }
  async function create() {
    pref("lint.onAdded", false);
    const item = new Zotero.Item("journalArticle");
    item.setField("title", "Abstract formatting regression");
    item.setField("abstractNote", original);
    await item.saveTx();
    items.push(item);
    return item;
  }

  before(function () {
    pref("metadata.autoUpdateOnAdded", false);
    pref("easyscholar.autoUpdateOnAdded", false);
    pref("workflow.updateMetadata", false);
    pref("workflow.remoteAuthorsOnCheck", false);
    pref("workflow.updateJournalRankings", false);
    pref("workflow.reviewDuplicatesOnCheck", false);
    pref("duplicates.showStats", false);
    // Keep the test focused on this rule and avoid unrelated import dialogs.
    for (const key of Services.prefs.getChildList(`${prefix}rule.`)) {
      if (typeof Zotero.Prefs.get(key, true) === "boolean" && !key.slice((`${prefix}rule.`).length).includes("."))
        pref(key.slice(prefix.length), false);
    }
  });

  after(async function () {
    pref("lint.onAdded", false);
    for (const item of items)
      await item.eraseTx();
    for (const [key, value] of preferences) {
      if (value === undefined)
        Zotero.Prefs.clear(prefix + key, true);
      else
        Zotero.Prefs.set(prefix + key, value as boolean, true);
    }
  });

  it("persists manual normalization through the runner", async function () {
    const item = await create();
    await plugin().hooks.onLintInBatch("correct-abstract-format", [item]);
    await item.reload(["itemData"], true);
    assert.equal(item.getField("abstractNote"), expected);
  });

  it("honors the setting during standard checks", async function () {
    const item = await create();
    pref("rule.correct-abstract-format", false);
    await plugin().hooks.onLintInBatch("standard", [item]);
    assert.equal(item.getField("abstractNote"), original);
    pref("rule.correct-abstract-format", true);
    await plugin().hooks.onLintInBatch("standard", [item]);
    assert.equal(item.getField("abstractNote"), expected);
  });

  it("automatically normalizes added items only when both switches are enabled", async function () {
    const item = await create();
    pref("rule.correct-abstract-format", true);
    await plugin().hooks.onNotify("add", "item", [item.id], {});
    assert.equal(item.getField("abstractNote"), original);
    pref("lint.onAdded", true);
    pref("rule.correct-abstract-format", false);
    await plugin().hooks.onNotify("add", "item", [item.id], {});
    assert.equal(item.getField("abstractNote"), original);
    pref("rule.correct-abstract-format", true);
    await plugin().hooks.onNotify("add", "item", [item.id], {});
    await item.reload(["itemData"], true);
    assert.equal(item.getField("abstractNote"), expected);
  });
});
