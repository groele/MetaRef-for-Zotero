import { assert } from "chai";
import { config } from "../../package.json";
import { Rules } from "../../src/modules/rules";
import { SemanticScholarService } from "../../src/modules/rules/tool-update-metadata/services/semantic-scholar-service";
import { fetchEasyScholarRank } from "../../src/utils/easyscholar";

describe("settings panel layout and validation in Zotero", function () {
  this.timeout(30_000);
  let win: Window & typeof globalThis;
  let pane: HTMLElement;
  let previousConcurrency: number;
  const pref = (key: string) => `${config.prefsPrefix}.${key}`;
  const find = (key: string) => pane.querySelector<HTMLElement>(`[preference='${pref(key)}']`)!;

  before(async function () {
    previousConcurrency = Zotero.Prefs.get(pref("lint.numConcurrent"), true) as number;
    const entry = (Zotero.PreferencePanes as any).pluginPanes.find((entry: any) => entry.pluginID === config.addonID);
    win = Zotero.Utilities.Internal.openPreferences(entry.id)! as Window & typeof globalThis;
    for (let attempt = 0; attempt < 100 && !win.document.getElementById("metaref-concurrency-status"); attempt++)
      await Zotero.Promise.delay(50);
    await (win as any).Zotero_Preferences.waitForFirstPaneLoad();
    pane = win.document.getElementById("metaref") as HTMLElement;
    await win.document.l10n!.translateFragment(pane);
    await Zotero.Promise.delay(50);
  });

  after(function () {
    Zotero.Prefs.set(pref("lint.numConcurrent"), previousConcurrency, true);
    win?.close();
  });

  it("initializes once and omits the removed search, section jump and global disclosure controls", function () {
    const actions = pane.querySelectorAll(".metaref-shortcut-action").length;
    pane.dispatchEvent(new win.Event("load"));
    pane.dispatchEvent(new win.Event("load"));
    assert.equal(pane.querySelectorAll(".metaref-shortcut-action").length, actions);
    assert.isAbove(actions, 0);
    assert.isNull(pane.querySelector(".metaref-settings-search, .metaref-settings-jump, .metaref-settings-disclosure, .metaref-settings-rule-actions"));
  });

  it("persists every available checkbox binding and connects standard rule switches to the runner", function () {
    const controls = [...pane.querySelectorAll<HTMLInputElement>("input[type='checkbox'][preference]")];
    const saved = new Map(controls.map(control => [control.getAttribute("preference")!, { value: Zotero.Prefs.get(control.getAttribute("preference")!, true), checked: control.checked }]));
    let checked = 0;
    try {
      for (const control of controls.filter(control => !control.getAttribute("preference")!.includes(".easyscholar."))) {
        const key = control.getAttribute("preference")!;
        const parents = controls.filter(parent => key.startsWith(`${parent.getAttribute("preference")}.`)).sort((a, b) => a.getAttribute("preference")!.length - b.getAttribute("preference")!.length);
        for (const parent of parents) {
          if (!parent.checked)
            parent.click();
        }
        assert.isFalse(control.disabled, `${key} is usable after its parent is enabled`);
        const previous = control.checked;
        control.click();
        assert.equal(Zotero.Prefs.get(key, true), !previous, `${key} persists an actual click`);
        const ruleID = key.replace(`${config.prefsPrefix}.rule.`, "");
        const rule = Rules.getByID(ruleID as ID);
        if (rule?.category !== "tool" && rule)
          assert.equal(Rules.getEnabledStandard().some(entry => entry.id === ruleID), !previous, `${key} controls standard execution`);
        control.click();
        assert.equal(Zotero.Prefs.get(key, true), previous, `${key} can be restored`);
        checked++;
      }
      assert.isAbove(checked, 70, "the audit covers ordinary, rule, workflow and menu switches");
    }
    finally {
      for (const control of controls) {
        const key = control.getAttribute("preference")!;
        const original = saved.get(key)!;
        if (original.value === undefined)
          Zotero.Prefs.clear(key, true);
        else
          Zotero.Prefs.set(key, original.value as boolean, true);
        control.checked = original.checked;
      }
      pane.dispatchEvent(new win.Event("change", { bubbles: true }));
    }
  });

  it("persists service credentials from their actual inputs and uses them in provider requests", async function () {
    const keys = ["easyscholar.secretKey", "semanticScholarToken"];
    const previous = new Map(keys.map(key => [key, Zotero.Prefs.get(pref(key), true)]));
    const inputs = keys.map(key => find(key) as HTMLInputElement);
    const request = Zotero.HTTP.request;
    let easyScholarCalls = 0;
    let semanticCalls = 0;
    Zotero.HTTP.request = (async (method: string, url: string, options: any) => {
      const parsed = new URL(url);
      if (parsed.hostname === "www.easyscholar.cc") {
        easyScholarCalls++;
        assert.equal(parsed.searchParams.get("secretKey"), "settings-audit-es-key");
        return { status: 200, responseText: JSON.stringify({ code: 200, data: { officialRank: { all: { sci: "Q1" } } } }) };
      }
      if (parsed.hostname === "api.semanticscholar.org") {
        semanticCalls++;
        assert.equal(options.headers["x-api-key"], "settings-audit-semantic-key");
        const response = JSON.stringify({ paperId: "settings-audit-paper", title: "Settings audit" });
        return { status: 200, response, responseText: response };
      }
      return request(method, url, options);
    }) as any;
    try {
      for (const [index, value] of ["  settings-audit-es-key  ", "  settings-audit-semantic-key  "].entries()) {
        inputs[index].value = value;
        inputs[index].dispatchEvent(new win.Event("change", { bubbles: true }));
        assert.equal(Zotero.Prefs.get(pref(keys[index]), true), value);
      }
      assert.equal((await fetchEasyScholarRank("Settings audit journal")).status, "success");
      await fetchEasyScholarRank("Settings audit journal");
      assert.equal(easyScholarCalls, 1, "an ordinary cached query uses the saved key once");
      await SemanticScholarService.fetch!({ identifiers: { DOI: "10.1234/settings-audit" }, debug() {} } as any);
      assert.equal(semanticCalls, 1);
      const button = pane.querySelector("#metaref-easyscholar-test")!;
      button.dispatchEvent(new win.Event("command", { bubbles: true }));
      for (let attempt = 0; attempt < 100; attempt++) {
        if (easyScholarCalls >= 2 && button.parentElement!.getAttribute("data-busy") !== "true")
          break;
        await Zotero.Promise.delay(50);
      }
      assert.equal(easyScholarCalls, 2, "the connection test deliberately makes a fresh request");
      assert.isNotEmpty(pane.querySelector("#metaref-easyscholar-test-status")!.textContent!);
    }
    finally {
      Zotero.HTTP.request = request;
      for (const [index, key] of keys.entries()) {
        const value = previous.get(key);
        if (value === undefined)
          Zotero.Prefs.clear(pref(key), true);
        else
          Zotero.Prefs.set(pref(key), value as string, true);
        inputs[index].value = String(value || "");
      }
    }
  });

  it("uses one card style for every section and links workflow modules to existing rule switches", async function () {
    assert.lengthOf(pane.querySelectorAll(":scope > .metaref-section-card"), 8);
    assert.lengthOf(pane.querySelectorAll("checkbox[preference]"), 0, "all preference checkboxes use the same visible native control");
    for (const card of pane.querySelectorAll(":scope > .metaref-section-card"))
      assert.isNotNull(card.querySelector(":scope > summary"));
    for (const label of pane.querySelectorAll(".metaref-check-option"))
      assert.isNotEmpty(label.textContent!.trim(), "every native checkbox has a readable label");
    const titleRules = Rules.getStandard().filter(rule => /title/.test(rule.id) && !/publication/.test(rule.id));
    const before = new Map(titleRules.map(rule => [rule.id, Zotero.Prefs.get(pref(`rule.${rule.id}`), true)]));
    const module = pane.querySelector<HTMLInputElement>("#metaref-workflow-title")!;
    try {
      module.checked = false;
      module.click();
      for (const rule of titleRules)
        assert.isTrue(Zotero.Prefs.get(pref(`rule.${rule.id}`), true));
      module.click();
      for (const rule of titleRules)
        assert.isFalse(Zotero.Prefs.get(pref(`rule.${rule.id}`), true));
    }
    finally {
      for (const [id, value] of before) {
        Zotero.Prefs.set(pref(`rule.${id}`), value as boolean, true);
        (find(`rule.${id}`) as HTMLInputElement).checked = value as boolean;
      }
      pane.dispatchEvent(new win.Event("command", { bubbles: true }));
    }
    const cards = [...pane.querySelectorAll<HTMLDetailsElement>(":scope > .metaref-section-card")];
    const initial = cards.map(card => card.open);
    try {
      cards.forEach(card => card.open = false);
      win.resizeTo(920, 800);
      pane.scrollIntoView({ block: "start" });
      await Zotero.Promise.delay(100);
      const canvas = win.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement;
      canvas.width = win.innerWidth;
      canvas.height = win.innerHeight;
      (canvas.getContext("2d") as any).drawWindow(win, 0, 0, canvas.width, canvas.height, "rgb(245,245,245)");
      await IOUtils.write(PathUtils.join(PathUtils.tempDir, "metaref-unified-settings-overview.png"), Uint8Array.from(win.atob(canvas.toDataURL("image/png").split(",")[1]), char => char.charCodeAt(0)));
    }
    finally {
      cards.forEach((card, index) => card.open = initial[index]);
    }
  });

  it("saves metadata update policy in preferences and never reopens the mode dialog", async function () {
    const modeKey = "rule.tool-update-metadata.option.mode";
    const typeKey = "rule.tool-update-metadata.option.allow-type-changed";
    const legacyKey = "rule.tool-update-metadata.option.slient";
    const previous = new Map([modeKey, typeKey, legacyKey].map(key => [key, Zotero.Prefs.get(pref(key), true)]));
    const mode = find(modeKey) as any;
    const allowType = find(typeKey) as HTMLInputElement;
    const plugin = (Zotero as any)[config.addonInstance];
    const dialogs = plugin.data.dialogs.size;
    const rule = Rules.getByID("tool-update-metadata")!;
    assert.isNull(pane.querySelector(`[preference='${pref(legacyKey)}']`));
    try {
      Zotero.Prefs.set(pref(legacyKey), false, true);
      for (const value of ["blank", "all"]) {
        mode.value = value;
        mode.dispatchEvent(new win.Event("command", { bubbles: true }));
        await Zotero.Promise.delay(50);
        assert.equal(Zotero.Prefs.get(pref(modeKey), true), value);
        for (const enabled of [false, true]) {
          if (allowType.checked !== enabled)
            allowType.click();
          assert.equal(Zotero.Prefs.get(pref(typeKey), true), enabled);
          const options = await rule.prepare!({ items: [], debug() {} } as any);
          assert.deepEqual(options, { mode: value, allowTypeChanged: enabled, repairCreators: Zotero.Prefs.get(pref("metadata.repairCreators"), true) === true });
          assert.equal(plugin.data.dialogs.size, dialogs, "legacy prompt preference cannot reopen the mode dialog");
        }
      }
    }
    finally {
      for (const [key, value] of previous)
        Zotero.Prefs.set(pref(key), value as string | boolean, true);
      mode.value = previous.get(modeKey);
      allowType.checked = previous.get(typeKey) as boolean;
    }
  });

  it("tests EasyScholar connections inline, prevents duplicate requests and redacts keys", async function () {
    const input = pane.querySelector<HTMLInputElement>("#metaref-easyscholar-key")!;
    const button = pane.querySelector<HTMLButtonElement>("#metaref-easyscholar-test")!;
    const status = pane.querySelector<HTMLElement>("#metaref-easyscholar-test-status")!;
    const previousValue = input.value;
    const request = Zotero.HTTP.request;
    let requests = 0;
    let accepted = true;
    try {
      input.value = "connection-fixture-key";
      Zotero.HTTP.request = (async (method: string, url: string, options: any) => {
        if (new URL(url).hostname !== "www.easyscholar.cc")
          return request(method, url, options);
        requests++;
        assert.equal(new URL(url).searchParams.get("publicationName"), "Nature");
        await Zotero.Promise.delay(50);
        return { responseText: JSON.stringify(accepted ? { code: 200 } : { code: 403, msg: "Rejected connection-fixture-key" }) };
      }) as any;
      const run = async () => {
        button.dispatchEvent(new win.Event("command", { bubbles: true }));
        assert.isTrue(button.disabled);
        button.dispatchEvent(new win.Event("command", { bubbles: true }));
        for (let attempt = 0; attempt < 200 && button.disabled; attempt++)
          await Zotero.Promise.delay(25);
        assert.isFalse(button.disabled);
        assert.isNotEmpty(status.textContent!.trim());
      };
      await run();
      const success = status.textContent;
      assert.equal(requests, 1);
      accepted = false;
      await run();
      assert.equal(requests, 2);
      assert.notEqual(status.textContent, success);
      assert.notInclude(status.textContent!, "connection-fixture-key");
      assert.include(status.textContent!, "[redacted]");
      input.value = "";
      await run();
      assert.equal(requests, 2, "an empty key makes no request");
    }
    finally {
      Zotero.HTTP.request = request;
      input.value = previousValue;
    }
  });

  it("links the hidden menu location to visibility and preserves the last visible location", function () {
    const key = "tool-update-easyscholar";
    const visible = Zotero.Prefs.get(pref(`menu.${key}`), true);
    const primary = Zotero.Prefs.get(pref(`menu.primary.${key}`), true);
    const checkbox = find(`menu.${key}`) as HTMLInputElement;
    const select = checkbox.closest(".metaref-menu-placement-row")!.querySelector("select")!;
    const initial = select.value;
    try {
      assert.isNotNull(select.querySelector("option[value='none']"));
      select.value = "primary";
      select.dispatchEvent(new win.Event("change", { bubbles: true }));
      assert.isTrue(checkbox.checked);
      select.value = "none";
      select.dispatchEvent(new win.Event("change", { bubbles: true }));
      assert.isFalse(Zotero.Prefs.get(pref(`menu.${key}`), true));
      assert.isFalse(checkbox.checked);
      checkbox.click();
      assert.equal(select.value, "primary");
      checkbox.click();
      assert.equal(select.value, "none");
      select.value = "nested";
      select.dispatchEvent(new win.Event("change", { bubbles: true }));
      assert.isTrue(Zotero.Prefs.get(pref(`menu.${key}`), true));
      assert.isFalse(Zotero.Prefs.get(pref(`menu.primary.${key}`), true));
      assert.isTrue(checkbox.checked);
    }
    finally {
      for (const [name, value] of [[`menu.${key}`, visible], [`menu.primary.${key}`, primary]] as const) {
        if (value === undefined)
          Zotero.Prefs.clear(pref(name), true);
        else
          Zotero.Prefs.set(pref(name), value as boolean, true);
      }
      checkbox.checked = visible as boolean;
      select.value = initial;
    }
  });

  it("keeps identifier controls inset from card edges at both window widths", async function () {
    const input = find("rule.no-doi-prefix");
    const card = input.closest("details") as HTMLDetailsElement;
    const states = new Map<HTMLDetailsElement, boolean>();
    for (let ancestor: Element | null = card; ancestor; ancestor = ancestor.parentElement) {
      if (ancestor.localName === "details") {
        states.set(ancestor as HTMLDetailsElement, (ancestor as HTMLDetailsElement).open);
        (ancestor as HTMLDetailsElement).open = true;
      }
    }
    try {
      assert.isNotNull(input.closest(".metaref-card-body"));
      for (const width of [920, 780]) {
        win.resizeTo(width, 800);
        card.scrollIntoView({ block: "center" });
        await Zotero.Promise.delay(100);
        const rect = card.getBoundingClientRect();
        const control = input.getBoundingClientRect();
        assert.isAtLeast(control.left - rect.left, 13, "checkbox clears the border");
        const heading = card.querySelector(":scope > summary")!.firstElementChild!.getBoundingClientRect();
        assert.closeTo(control.left, heading.left, 1, "checkbox aligns with its heading");
        assert.isAtLeast(rect.right - control.right, 13);
        assert.isAtMost(pane.scrollWidth, pane.clientWidth + 1);
      }
      const rect = card.getBoundingClientRect();
      const canvas = win.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement;
      canvas.width = Math.ceil(rect.width);
      canvas.height = Math.ceil(rect.height);
      (canvas.getContext("2d") as any).drawWindow(win, rect.left, rect.top, rect.width, rect.height, "rgb(245,245,245)");
      await IOUtils.write(PathUtils.join(PathUtils.tempDir, "metaref-card-inset.png"), Uint8Array.from(win.atob(canvas.toDataURL("image/png").split(",")[1]), char => char.charCodeAt(0)));
    }
    finally {
      for (const [detail, open] of states)
        detail.open = open;
    }
  });

  it("retains warnings without an automatic report and opens details only on request", async function () {
    const plugin = (Zotero as any)[config.addonInstance];
    const keys = ["lint.autoReport", "lint.notify", "lint.onAdded"];
    const previous = new Map(keys.map(key => [key, Zotero.Prefs.get(pref(key), true)]));
    const item = new Zotero.Item("journalArticle");
    const dialogs = new Set(plugin.data.dialogs.keys());
    try {
      keys.forEach(key => Zotero.Prefs.set(pref(key), false, true));
      item.setField("title", "Quiet feedback fixture");
      await item.saveTx();
      await plugin.runner.add({ items: [item], rules: [{ id: "tool-update-metadata", scope: "item", apply({ report }: any) {
        report({ level: "warning", message: "Retained warning fixture" });
      } }] });
      assert.equal(plugin.data.dialogs.size, dialogs.size, "warnings do not automatically open detailed reports");
      assert.equal(plugin.runner.lastResult.warnings, 1);
      assert.isNotEmpty(pane.querySelector("#metaref-last-batch-status")!.textContent!);
      const button = pane.querySelector<HTMLButtonElement>("#metaref-last-batch-report")!;
      assert.isFalse(button.disabled);
      button.dispatchEvent(new win.Event("command", { bubbles: true }));
      for (let attempt = 0; attempt < 100 && plugin.data.dialogs.size === dialogs.size; attempt++)
        await Zotero.Promise.delay(25);
      const report = [...plugin.data.dialogs.entries()].find(([key]: any) => !dialogs.has(key))?.[1] as Window;
      assert.isDefined(report, "an explicit request opens the retained details");
      assert.include(report.document.body!.textContent!, "Retained warning fixture");
      report.close();
    }
    finally {
      for (const [key, value] of previous)
        Zotero.Prefs.set(pref(key), value as boolean, true);
      if (item.id)
        await item.eraseTx();
      for (const [key, dialog] of plugin.data.dialogs) {
        if (!dialogs.has(key))
          (dialog as Window).close();
      }
    }
  });

  it("persists independent ESI and Nature Index source priorities", async function () {
    for (const kind of ["esi", "nature"]) {
      const key = pref(`insights.${kind}SourcePriority`);
      const previous = Zotero.Prefs.get(key, true);
      const select = pane.querySelector<HTMLSelectElement>(`select[data-index-policy='${kind}']`)!;
      const initial = select.value;
      try {
        assert.lengthOf(select.options, 4);
        assert.isNotEmpty(win.document.getElementById(select.getAttribute("aria-labelledby")!)!.textContent!.trim());
        for (const value of ["api-first", "local-first", "api-only", "local-only"]) {
          select.value = value;
          select.dispatchEvent(new win.Event("change", { bubbles: true }));
          assert.equal(Zotero.Prefs.get(key, true), value);
        }
      }
      finally {
        Zotero.Prefs.set(key, previous as string, true);
        select.value = initial;
      }
    }
    const card = pane.querySelector("select[data-index-policy]")!.closest("details") as HTMLDetailsElement;
    const states = new Map<HTMLDetailsElement, boolean>();
    for (let ancestor: Element | null = card; ancestor; ancestor = ancestor.parentElement) {
      if (ancestor.localName === "details") {
        states.set(ancestor as HTMLDetailsElement, (ancestor as HTMLDetailsElement).open);
        (ancestor as HTMLDetailsElement).open = true;
      }
    }
    try {
      win.resizeTo(920, 800);
      card.scrollIntoView({ block: "center" });
      await Zotero.Promise.delay(100);
      assert.isAtMost(pane.scrollWidth, pane.clientWidth + 1);
      const rect = card.getBoundingClientRect();
      const canvas = win.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement;
      canvas.width = Math.ceil(rect.width);
      canvas.height = Math.ceil(rect.height);
      (canvas.getContext("2d") as any).drawWindow(win, rect.left, rect.top, rect.width, rect.height, "rgb(245,245,245)");
      await IOUtils.write(PathUtils.join(PathUtils.tempDir, "metaref-index-source-priority.png"), Uint8Array.from(win.atob(canvas.toDataURL("image/png").split(",")[1]), char => char.charCodeAt(0)));
    }
    finally {
      for (const [detail, open] of states)
        detail.open = open;
    }
  });

  it("validates custom files before activation, rejects edits at the same path, and keeps paths on cancellation", async function () {
    const plugin = (Zotero as any)[config.addonInstance];
    const picker = plugin.data.ztoolkit.FilePicker.prototype;
    const originalOpen = picker.open;
    const paths: string[] = [];
    const previous = new Map<string, unknown>();
    const choices: (string | undefined)[] = [];
    picker.open = async () => choices.shift();
    try {
      for (const [kind, rule, key, content, broken] of [
        ["abbr", "rule.require-journal-abbr", "rule.require-journal-abbr.customDataPath", "{\"QA Journal\":\"QA J.\"}", "broken JSON"],
        ["title", "rule.correct-title-sentence-case", "rule.correct-title-sentence-case.custom-term-path", "mos2,MoS2\n", "/[/g,invalid\n"],
      ]) {
        for (const name of [rule, key])
          previous.set(pref(name), Zotero.Prefs.get(pref(name), true));
        const control = find(rule) as HTMLInputElement;
        control.checked = true;
        control.dispatchEvent(new win.Event("command", { bubbles: true }));
        const path = PathUtils.join(PathUtils.tempDir, `metaref-settings-${Date.now()}-${kind}.${kind === "abbr" ? "json" : "csv"}`);
        paths.push(path);
        await Zotero.File.putContentsAsync(path, content);
        const input = find(key) as HTMLInputElement;
        const row = input.parentElement!;
        const button = row.querySelector(`#metaref-${kind}-choose-custom-data-button`)!;
        const status = row.querySelector(".metaref-custom-data-status")!;
        const choose = async (value: string | undefined) => {
          choices.push(value);
          button.dispatchEvent(new win.Event("command", { bubbles: true }));
          assert.equal(row.getAttribute("aria-busy"), "true");
          button.dispatchEvent(new win.Event("command", { bubbles: true }));
          for (let attempt = 0; attempt < 200 && row.hasAttribute("data-busy"); attempt++)
            await Zotero.Promise.delay(25);
          assert.isFalse(row.hasAttribute("data-busy"));
          assert.isFalse((button as HTMLButtonElement).disabled);
          assert.isEmpty(choices, "a repeated command must not open another picker");
        };
        await choose(path);
        assert.equal(Zotero.Prefs.get(pref(key), true), path);
        assert.equal(input.value, path);
        assert.include(status.textContent!, "1");
        const acceptedStatus = status.textContent;
        await Zotero.File.putContentsAsync(path, broken);
        await choose(path);
        assert.equal(Zotero.Prefs.get(pref(key), true), path, "failed validation preserves the previous choice");
        assert.notEqual(status.textContent, acceptedStatus, "edited contents must be revalidated rather than read from the old cache");
        assert.isNotEmpty(status.textContent!.trim());
        await choose(undefined);
        assert.equal(input.value, path);
        assert.equal(status.textContent, "");
        row.querySelector("[data-reset-path='true']")!.dispatchEvent(new win.Event("command", { bubbles: true }));
        assert.equal(input.value, "");
        assert.equal(Zotero.Prefs.get(pref(key), true), "");
      }
    }
    finally {
      picker.open = originalOpen;
      for (const [key, value] of previous) {
        if (value === undefined)
          Zotero.Prefs.clear(key, true);
        else
          Zotero.Prefs.set(key, value as string | boolean, true);
      }
      for (const path of paths)
        await IOUtils.remove(path, { ignoreAbsent: true });
    }
  });

  it("persists every abbreviation source option in its independent collapsible card", async function () {
    const group = pane.querySelector("#metaref-journal-abbreviation-settings")!;
    const card = group.closest("details.metaref-section-card") as HTMLDetailsElement;
    assert.equal(card.parentElement, pane);
    card.open = true;
    const selects = [...group.querySelectorAll<HTMLSelectElement>("select[data-abbr-option]")];
    assert.lengthOf(selects, 5);
    assert.lengthOf(group.querySelectorAll("select[data-abbr-option='profile'] option"), 19);
    for (const select of selects) {
      const key = pref(`rule.require-journal-abbr.${select.dataset.abbrOption}`);
      const previous = Zotero.Prefs.get(key, true);
      try {
        for (const option of select.options) {
          select.value = option.value;
          select.dispatchEvent(new win.Event("change", { bubbles: true }));
          assert.equal(Zotero.Prefs.get(key, true), option.value);
          assert.isNotEmpty(option.textContent!.trim());
        }
      }
      finally {
        Zotero.Prefs.set(key, previous as string, true);
        select.value = previous as string;
      }
    }
    group.scrollIntoView({ block: "start" });
    await Zotero.Promise.delay(100);
    assert.isAtMost(group.scrollWidth, group.clientWidth + 1);
    const canvas = win.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement;
    canvas.width = win.innerWidth;
    canvas.height = win.innerHeight;
    (canvas.getContext("2d") as any).drawWindow(win, 0, 0, canvas.width, canvas.height, "rgb(245,245,245)");
    await IOUtils.write(PathUtils.join(PathUtils.tempDir, "metaref-abbreviation-settings.png"), Uint8Array.from(win.atob(canvas.toDataURL("image/png").split(",")[1]), char => char.charCodeAt(0)));
    card.open = false;
  });

  it("keeps invalid numeric values out of preferences and labels all input controls", async function () {
    const input = find("lint.numConcurrent") as HTMLInputElement;
    for (const value of ["4", "16", "1"]) {
      input.value = value;
      input.dispatchEvent(new win.Event("input", { bubbles: true }));
      assert.equal(Zotero.Prefs.get(pref("lint.numConcurrent"), true), Number(value));
    }
    for (const value of ["", "0", "17", "1.5"]) {
      input.value = value;
      input.dispatchEvent(new win.Event("input", { bubbles: true }));
      input.dispatchEvent(new win.Event("change", { bubbles: true }));
      assert.equal(input.getAttribute("aria-invalid"), "true");
      assert.equal(Zotero.Prefs.get(pref("lint.numConcurrent"), true), 1);
      input.dispatchEvent(new win.Event("blur"));
      assert.equal(input.value, "1");
      assert.isFalse(input.hasAttribute("aria-invalid"));
    }
    for (const control of pane.querySelectorAll<HTMLElement>("input[preference], radiogroup[preference]")) {
      const labelID = control.getAttribute("aria-labelledby");
      assert.isNotNull(labelID, `${control.getAttribute("preference")} has an accessible label`);
      assert.isNotNull(win.document.getElementById(labelID!));
    }
    win.resizeTo(780, 720);
    await Zotero.Promise.delay(100);
    const rect = pane.getBoundingClientRect();
    assert.isAtMost(pane.scrollWidth, pane.clientWidth + 1, "the settings panel fits its available width");
    const canvas = win.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement;
    canvas.width = Math.ceil(rect.width);
    canvas.height = Math.min(600, Math.ceil(rect.height));
    const context = canvas.getContext("2d")!;
    (context as any).drawWindow(win, rect.left, rect.top, canvas.width, canvas.height, "rgb(245,245,245)");
    const bytes = Uint8Array.from(win.atob(canvas.toDataURL("image/png").split(",")[1]), char => char.charCodeAt(0));
    await IOUtils.write(PathUtils.join(PathUtils.tempDir, `metaref-settings-${Zotero.locale}.png`), bytes);
  });
});
