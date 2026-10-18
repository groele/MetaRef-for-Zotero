import { assert } from "chai";
import { config } from "../../package.json";

describe("journal abbreviation integration and safe custom matching", function () {
  this.timeout(30_000);
  const plugin = () => (Zotero as any)[config.addonInstance];
  const items: Zotero.Item[] = [];
  const files: string[] = [];
  const prefs = new Map<string, unknown>();
  const pref = (key: string, value: string | boolean) => {
    const full = `${config.prefsPrefix}.${key}`;
    if (!prefs.has(full))
      prefs.set(full, Zotero.Prefs.get(full, true));
    Zotero.Prefs.set(full, value, true);
  };
  const abbrPref = (key: string, value: string | boolean) => pref(`rule.require-journal-abbr.${key}`, value);
  const create = async (title: string, abbr = "", type: "journalArticle" | "conferencePaper" = "journalArticle") => {
    const item = new Zotero.Item(type);
    item.setField("title", "Custom abbreviation regression");
    item.setField(type === "journalArticle" ? "publicationTitle" : "conferenceName", title);
    if (type === "journalArticle")
      item.setField("journalAbbreviation", abbr);
    await item.saveTx();
    items.push(item);
    return item;
  };
  const customFile = async (content: string, extension = "json") => {
    const path = PathUtils.join(PathUtils.tempDir, `metaref-abbr-integration-${Date.now()}-${files.length}.${extension}`);
    files.push(path);
    await IOUtils.writeUTF8(path, content);
    abbrPref("customDataPath", path);
    return path;
  };
  const run = (selected: Zotero.Item[], rules = ["require-journal-abbr"]) => plugin().hooks.onLintInBatch(rules, selected);

  before(function () {
    pref("lint.onAdded", false);
  });

  beforeEach(function () {
    for (const [key, value] of Object.entries({ sourceMode: "auto", profile: "combined", matchMode: "exact", existingPolicy: "known", letterCase: "keep", withDots: true, infer: false, tagSource: false, usefull: false, usefullZh: false, customDataPath: "" }))
      abbrPref(key, value);
  });

  after(async function () {
    for (const item of items)
      await item.eraseTx();
    for (const file of files)
      await IOUtils.remove(file, { ignoreAbsent: true });
    for (const [key, value] of prefs) {
      if (value === undefined)
        Zotero.Prefs.clear(key, true);
      else
        Zotero.Prefs.set(key, value as string | boolean, true);
    }
  });

  it("saves two punctuation-distinct custom names and preserves an ambiguous existing abbreviation", async function () {
    await customFile("{\"A-B Journal\":\"AB. J.\",\"A B Journal\":\"A. B. J.\"}");
    const hyphen = await create("A-B Journal");
    const space = await create("A B Journal");
    await run([hyphen, space]);
    assert.equal(hyphen.getField("journalAbbreviation"), "AB. J.");
    assert.equal(space.getField("journalAbbreviation"), "A. B. J.");
    assert.equal(plugin().runner.lastResult.saved, 2);
    abbrPref("matchMode", "flexible");
    abbrPref("existingPolicy", "replace");
    abbrPref("infer", true);
    const ambiguous = await create("A:B Journal", "Manual value");
    await run([ambiguous]);
    await ambiguous.reload(["itemData"], true);
    assert.equal(ambiguous.getField("journalAbbreviation"), "Manual value");
    assert.isAbove(plugin().runner.lastResult.warnings, 0);
    assert.equal(plugin().runner.lastResult.saved, 0);
  });

  it("reads a BOM semicolon CSV containing quoted commas and reloads edited mappings", async function () {
    const path = await customFile("\uFEFF\"Special, Journal\";\"Spec. J.\"\n\"Special, Journal\";\"Spec. J.\"\n", "CSV");
    const item = await create("Special, Journal");
    await run([item]);
    assert.equal(item.getField("journalAbbreviation"), "Spec. J.");
    await IOUtils.writeUTF8(path, "\"Special, Journal\";\"Updated J.\"\n");
    await run([item]);
    assert.equal(item.getField("journalAbbreviation"), "Updated J.");
    assert.equal(plugin().runner.lastResult.failed, 0);
  });

  it("rejects genuine duplicate-name conflicts without replacing a manually entered value", async function () {
    await customFile("\"Nature\",\"Nature\"\n\"NATURE\",\"Nat.\"\n", "csv");
    abbrPref("sourceMode", "custom");
    const item = await create("Nature", "Manual Nature");
    await run([item]);
    assert.equal(item.getField("journalAbbreviation"), "Manual Nature");
    assert.isAbove(plugin().runner.lastResult.warnings, 0);
    assert.equal(plugin().runner.lastResult.saved, 0);
  });

  it("applies source profiles, formatting and source tags without repeat writes or unrelated changes", async function () {
    abbrPref("sourceMode", "builtin");
    const item = await create("Acta Automatica Sinica");
    item.addTag("user-topic");
    item.setField("extra", "Manual note");
    await item.saveTx();
    await run([item]);
    assert.equal(item.getField("journalAbbreviation"), "Acta Autom. Sin.");
    abbrPref("profile", "ams");
    abbrPref("letterCase", "upper");
    abbrPref("withDots", false);
    abbrPref("tagSource", true);
    await run([item]);
    assert.equal(item.getField("journalAbbreviation"), "ACTA AUTOMAT SINICA");
    assert.isTrue(item.hasTag("abbr"));
    assert.isTrue(item.hasTag("user-topic"));
    assert.equal(item.getField("extra"), "Manual note");
    await run([item]);
    assert.equal(plugin().runner.lastResult.saved, 0);
    assert.isFalse(item.hasChanged());
  });

  it("preserves values in blank-only mode and keeps conference custom abbreviation support", async function () {
    await customFile("{\"Nano Research\":\"Custom Nano\",\"International Conference on Widgets\":\"ICW\"}");
    abbrPref("existingPolicy", "blank");
    const protectedItem = await create("Nano Research", "Manual");
    const conference = await create("32nd International Conference on Widgets", "", "conferencePaper");
    await run([protectedItem, conference], ["require-journal-abbr", "correct-conference-abbr"]);
    assert.equal(protectedItem.getField("journalAbbreviation"), "Manual");
    assert.include(conference.getField("extra"), "ICW");
    assert.equal(conference.getField("conferenceName"), "32nd International Conference on Widgets");
    assert.equal(plugin().runner.lastResult.failed, 0);
  });
});
