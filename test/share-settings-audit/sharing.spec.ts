import { assert } from "chai";
import { closeJournalShareDialogs, renderCardCanvas, saveJournalCardImage, shareJournalCard } from "../../src/utils/journal-card-share";

describe("detailed card sharing and settings audit", function () {
  this.timeout(60000);
  const doc = () => Zotero.getMainWindow().document;
  const data = () => ({ doc: doc(), publication: "Nature Photonics / 超长中文期刊标题".repeat(3), displayedRankings: [{ key: "jcr", labelID: "easyscholar-field-jcr", value: "Q1 / 光学与凝聚态物理 TOP".repeat(6) }], rows: [{ label: "ESI 学科", value: "物理学".repeat(24) }], matchBases: ["ISSN: 1749-4893"] });

  before(async function () {
    const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
    (globalThis as any).addon = (Zotero as any).MetaRef;
    (globalThis as any).ztoolkit = (Zotero as any).MetaRef.data.ztoolkit;
    (globalThis as any).rootURI = (await AddonManager.getAddonByID("metaflow@groele"))!.getResourceURI("").spec;
  });

  after(function () {
    return closeJournalShareDialogs();
  });

  it("exports long Chinese and English rows, writes exact PNG bytes, and handles cancellation and failure", async function () {
    const canvas = await renderCardCanvas(doc(), data());
    assert.isNotNull(canvas);
    assert.isAbove(canvas!.height, 700);
    const path = PathUtils.join(PathUtils.tempDir, "metaflow-sharing-audit.png");
    assert.isTrue(await saveJournalCardImage(canvas!, "Nature", async () => path));
    const sample = await renderCardCanvas(doc(), { ...data(), publication: "Nature Photonics", displayedRankings: [{ key: "jcr", labelID: "easyscholar-field-jcr", value: "Q1" }], rows: [{ label: "ESI 学科", value: "物理学" }] });
    await saveJournalCardImage(sample!, "Nature Photonics", async () => PathUtils.join(PathUtils.tempDir, "metaflow-sharing-sample.png"));
    const bytes = await IOUtils.read(path);
    assert.deepEqual([...bytes.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(bytes.length, atob(canvas!.toDataURL("image/png").split(",")[1]).length);
    assert.isFalse(await saveJournalCardImage(canvas!, "Nature", async () => false));
    let rejected = false;
    try {
      await saveJournalCardImage(canvas!, "Nature", async () => PathUtils.tempDir);
    }
    catch { rejected = true; }
    assert.isTrue(rejected);
  });

  it("opens only one preview, traps keyboard focus, and closes with Escape", async function () {
    assert.equal(await shareJournalCard(data(), { mode: "modal" }), "preview");
    assert.equal(await shareJournalCard(data(), { mode: "modal" }), "preview");
    assert.lengthOf(doc().querySelectorAll("#metaflow-share-card-modal"), 1);
    const modal = doc().querySelector("[role='dialog']")!;
    assert.isTrue(modal.contains(doc().activeElement));
    const copy = modal.querySelectorAll<HTMLButtonElement>("button")[1];
    copy.click();
    for (let i = 0; i < 50 && copy.disabled; i++)
      await Zotero.Promise.delay(20);
    assert.isFalse(copy.disabled);
    assert.isNotEmpty(modal.querySelector("[role='status']")!.textContent!);
    const win = Zotero.getMainWindow() as unknown as Window & typeof globalThis;
    doc().dispatchEvent(new win.KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    assert.isTrue(modal.contains(doc().activeElement));
    doc().dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    assert.isNull(doc().getElementById("metaflow-share-card-modal"));
  });

  it("copies only native image and reports failure without text substitution", async function () {
    assert.equal(await shareJournalCard(data(), { mode: "silent", silentFormat: "image" }), "image");
    const clipboard = (Components.classes as any)["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
    assert.isTrue(clipboard.hasDataMatchingFlavors(["application/x-moz-nativeimage", "image/png"], clipboard.kGlobalClipboard));
    assert.isFalse(clipboard.hasDataMatchingFlavors(["text/plain", "text/unicode"], clipboard.kGlobalClipboard), "image mode must not advertise a text representation");
    const old = (globalThis as any).rootURI;
    try {
      (globalThis as any).rootURI = `${old}missing/`;
      assert.equal(await shareJournalCard(data(), { mode: "silent", silentFormat: "image" }), "failed");
      assert.isFalse(clipboard.hasDataMatchingFlavors(["text/plain", "text/unicode"], clipboard.kGlobalClipboard));
    }
    finally { (globalThis as any).rootURI = old; }
  });

  it("exposes journal and sharing as peer modules with one disclosure level and persistent share controls", async function () {
    const entry = (Zotero.PreferencePanes as any).pluginPanes.find((entry: any) => entry.pluginID === "metaflow@groele");
    const win = Zotero.Utilities.Internal.openPreferences(entry.id)! as Window & typeof globalThis;
    const themeKey = "browser.theme.toolbar-theme";
    const oldTheme = Services.prefs.prefHasUserValue(themeKey) ? Services.prefs.getIntPref(themeKey) : undefined;
    const key = "extensions.zotero.metaref.insights.shareMode";
    const old = Zotero.Prefs.get(key, true);
    try {
      for (let i = 0; i < 100 && !win.document.getElementById("metaref-concurrency-status"); i++)
        await Zotero.Promise.delay(50);
      await (win as any).Zotero_Preferences.waitForFirstPaneLoad();
      const pane = win.document.getElementById("metaref")! as HTMLElement;
      await win.document.l10n!.translateFragment(pane);
      assert.lengthOf(pane.querySelectorAll("details details"), 0);
      const share = pane.querySelector("#metaref-journal-share-settings")!;
      assert.equal(share.closest("details")!.parentElement, pane);
      assert.equal(share.closest("details")!.querySelector(":scope > groupbox"), share);
      (share.closest("details") as HTMLDetailsElement).open = true;
      const mode = pane.querySelector("#metaref-insights-share-mode") as HTMLSelectElement;
      for (const value of ["modal", "silent"]) {
        mode.value = value;
        mode.dispatchEvent(new win.Event("change", { bubbles: true }));
        assert.equal(Zotero.Prefs.get(key, true), value);
        assert.equal((pane.querySelector("#metaref-insights-share-format") as HTMLSelectElement).disabled, value === "modal");
      }
      for (const theme of [1, 0]) {
        Services.prefs.setIntPref(themeKey, theme);
        for (const width of [640, 360]) {
          win.resizeTo(width + 320, 800);
          pane.style.width = `${width}px`;
          pane.style.maxWidth = "100%";
          await Zotero.Promise.delay(100);
          assert.equal(win.getComputedStyle(mode)!.fontSize, "14px");
          assert.isAtMost(share.scrollWidth, share.clientWidth + 1);
          share.scrollIntoView({ block: "center" });
          const shot = win.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement;
          shot.width = win.innerWidth;
          shot.height = win.innerHeight;
          (shot.getContext("2d") as any).drawWindow(win, 0, 0, shot.width, shot.height, theme === 0 ? "rgb(32,32,32)" : "white");
          const bytes = Uint8Array.from(atob(shot.toDataURL("image/png").split(",")[1]), char => char.charCodeAt(0));
          await IOUtils.write(PathUtils.join(PathUtils.tempDir, `metaflow-settings-${theme}-${width}.png`), bytes);
        }
      }
      Zotero.Utilities.Internal.openPreferences("zotero-prefpane-general");
      await Zotero.Promise.delay(150);
      Zotero.Utilities.Internal.openPreferences(entry.id);
      await Zotero.Promise.delay(300);
      assert.equal((win.document.querySelector("#metaref-insights-share-mode") as HTMLSelectElement).value, "silent");
    }
    finally {
      Zotero.Prefs.set(key, old as string, true);
      if (oldTheme === undefined)
        Services.prefs.clearUserPref(themeKey);
      else Services.prefs.setIntPref(themeKey, oldTheme);
      win.close();
    }
  });
});
