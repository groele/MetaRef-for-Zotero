import { assert } from "chai";
import { ToolUpdateMetadata } from "../../src/modules/rules/tool-update-metadata";
import { fetchISSNFromCrossref } from "../../src/modules/rules/tool-update-metadata/issn-resolver";
import { services } from "../../src/modules/rules/tool-update-metadata/services";
import { renderCardCanvas, shareJournalCard } from "../../src/utils/journal-card-share";

describe("iSSN and card sharing in isolated Zotero", function () {
  this.timeout(90000);

  before(async function () {
    const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
    const installed = await AddonManager.getAddonByID("metaflow@groele");
    (globalThis as any).rootURI = installed!.getResourceURI("").spec;
  });

  it("renders the packaged plugin icon into the exported card", async function () {
    const canvas = await renderCardCanvas(Zotero.getMainWindow().document, { doc: Zotero.getMainWindow().document, publication: "Nature Photonics", displayedRankings: [], rows: [], matchBases: [] });
    assert.isNotNull(canvas);
    const ctx = canvas!.getContext("2d") as unknown as CanvasRenderingContext2D;
    const pixels = ctx.getImageData(44, 42, 36, 36).data;
    assert.isTrue(Array.from(pixels).some((value, index) => index % 4 !== 3 && value < 180));
    const bytes = Uint8Array.from(atob(canvas!.toDataURL("image/png").split(",")[1]), char => char.charCodeAt(0));
    await IOUtils.write(PathUtils.join(PathUtils.tempDir, "metaflow-card-plugin-icon.png"), bytes);
  });

  it("resolves live Crossref DOI and journal-name ISSNs", async function () {
    assert.equal(await fetchISSNFromCrossref({ doi: "10.1038/nature12373" }), "0028-0836");
    assert.equal(await fetchISSNFromCrossref({ publicationTitle: "Nature" }), "0028-0836");
  });

  it("fills and persists ISSN even without successful article services", async function () {
    (globalThis as any).ztoolkit = (Zotero as any).MetaRef.data.ztoolkit;
    const old = services.splice(0);
    const item = new Zotero.Item("journalArticle");
    const pref = "extensions.zotero.metaref.lint.onAdded";
    const previous = Zotero.Prefs.get(pref, true);
    Zotero.Prefs.set(pref, false, true);
    try {
      item.setField("publicationTitle", "Nature");
      item.setField("DOI", "10.1038/nature12373");
      await item.saveTx();
      await ToolUpdateMetadata.apply({ item, options: { mode: "blank", allowTypeChanged: false }, debug: () => {}, report: () => {} });
      assert.equal(item.getField("ISSN"), "0028-0836");
      await item.saveTx();
      await item.reload(["primaryData", "itemData"], true);
      assert.equal(item.getField("ISSN"), "0028-0836");
    }
    finally {
      services.push(...old);
      if (item.id)
        await item.eraseTx();
      Zotero.Prefs.set(pref, previous as boolean, true);
    }
  });

  it("copies exactly the configured image or text format", async function () {
    const itemData = { doc: Zotero.getMainWindow().document, publication: "Nature", displayedRankings: [], rows: [], matchBases: [] };
    const pref = "extensions.zotero.metaref.insights.shareSilentFormat";
    const previous = Zotero.Prefs.get(pref, true);
    const clipboard = (Components.classes as any)["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
    try {
      Zotero.Prefs.set(pref, "image", true);
      const result = await shareJournalCard(itemData);
      assert.equal(result, "image");
      assert.isTrue(clipboard.hasDataMatchingFlavors(["application/x-moz-nativeimage", "image/png"], clipboard.kGlobalClipboard));
      assert.isFalse(clipboard.hasDataMatchingFlavors(["text/plain"], clipboard.kGlobalClipboard));
      Zotero.Prefs.set(pref, "text", true);
      assert.equal(await shareJournalCard(itemData), "text");
      assert.isFalse(clipboard.hasDataMatchingFlavors(["application/x-moz-nativeimage", "image/png"], clipboard.kGlobalClipboard));
      assert.isTrue(clipboard.hasDataMatchingFlavors(["text/plain"], clipboard.kGlobalClipboard));
    }
    finally {
      Zotero.Prefs.set(pref, previous as string, true);
    }
  });

  it("renders an accessible share button and completes its pending state", async function () {
    const item = new Zotero.Item("journalArticle");
    const pref = "extensions.zotero.metaref.insights.shareSilentFormat";
    const previous = Zotero.Prefs.get(pref, true);
    Zotero.Prefs.set(pref, "image", true);
    try {
      item.setField("title", "Share UI test");
      item.setField("publicationTitle", "Physical Review Letters");
      item.setField("ISSN", "0031-9007");
      await item.saveTx();
      const win = Zotero.getMainWindow();
      await win.ZoteroPane.selectItem(item.id);
      const section = win.document.querySelector("item-pane-custom-section[data-pane*='metaref-journal-insights']") as any;
      await section._handleRefresh();
      const button = section.querySelector("[data-journal-share]") as HTMLButtonElement;
      assert.isNotNull(button);
      assert.isNotEmpty(button.getAttribute("aria-label")!);
      assert.equal(win.getComputedStyle(button)!.width, "30px");
      button.click();
      assert.isTrue(button.disabled);
      for (let i = 0; button.disabled && i < 40; i++)
        await Zotero.Promise.delay(50);
      assert.isFalse(button.disabled);
      assert.isFalse(button.hasAttribute("aria-busy"));
      assert.isNotNull(button.querySelector("polyline"));
      assert.isTrue(button.hasAttribute("data-share-success"));
      const successColor = win.getComputedStyle(button)!.color;
      await Zotero.Promise.delay(1850);
      assert.isFalse(button.hasAttribute("data-share-success"));
      assert.isNull(button.querySelector("polyline"));
      assert.isNotNull(button.querySelector("path"));
      assert.notEqual(win.getComputedStyle(button)!.color, successColor);
    }
    finally {
      if (item.id)
        await item.eraseTx();
      Zotero.Prefs.set(pref, previous as string, true);
    }
  });

  it("fills Nano Letters ISSN through the actual Update Metadata menu hook", async function () {
    const prefix = "extensions.zotero.metaref.";
    const preferences: Record<string, boolean> = { "workflow.updateBibliographic": true, "workflow.formatAfterUpdate": false, "metadata.updateJournalInfo": false, "workflow.reviewDuplicatesOnUpdate": false, "workflow.scanPDF": false, "workflow.searchTitle": false, "lint.onAdded": false };
    const previous = Object.fromEntries(Object.keys(preferences).map(key => [key, Zotero.Prefs.get(prefix + key, true)]));
    const item = new Zotero.Item("journalArticle");
    try {
      for (const [key, value] of Object.entries(preferences))
        Zotero.Prefs.set(prefix + key, value, true);
      item.setField("title", "ISSN menu reproduction");
      item.setField("publicationTitle", "Nano Letters");
      await item.saveTx();
      await (Zotero as any).MetaRef.hooks.onLintInBatch(["tool-update-metadata"], [item], { review: true });
      assert.equal(item.getField("ISSN"), "1530-6984");
      await item.reload(["primaryData", "itemData"], true);
      assert.equal(item.getField("ISSN"), "1530-6984");
    }
    finally {
      if (item.id)
        await item.eraseTx();
      for (const [key, value] of Object.entries(previous))
        Zotero.Prefs.set(prefix + key, value as boolean, true);
    }
  });
});
