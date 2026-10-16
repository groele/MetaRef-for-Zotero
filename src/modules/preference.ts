import { homepage } from "../../package.json";
import { clearEasyScholarCache, EASYSCHOLAR_DEFAULT_FIELDS, EASYSCHOLAR_FIELD_DEFINITIONS, getEasyScholarFieldMessageID, testEasyScholarConnection } from "../utils/easyscholar";

import { getString } from "../utils/locale";
import { preferenceListeners, releasePreferenceListeners } from "../utils/preference-listeners";
import { watchPreferencePane } from "../utils/preference-window";
import { getPref, setPref } from "../utils/prefs";
import { clearStoredServiceCache } from "../utils/service-cache-storage";
import { normalizeShortcut, recordShortcut, SHORTCUT_DEFAULTS, shortcutPreview } from "../utils/shortcuts";
import { setupBatchFeedback } from "./batch-feedback";
import { setupCustomDataFiles } from "./custom-data-settings";
import { registerEasyScholarColumns } from "./item-tree";
import { setupJournalDatabases } from "./journal-database-settings";
import { isPrimaryMenu, MENU_GROUPS, MENU_SECTIONS } from "./menu";
import { Rules } from "./rules";
import { clearSemanticScholarCache } from "./rules/tool-update-metadata/services/semantic-scholar-service";
import { setupFunctionCards } from "./settings-cards";
import { setupSettingsPanel } from "./settings-panel";
import { setupWorkflowSettings } from "./workflow-settings";

const initializedPanes = new WeakSet<Element>();
const preferenceWindows = new Map<Window, () => void>();
let preferenceRegistration: Promise<string> | undefined;

export async function registerPrefs() {
  if (preferenceRegistration)
    return preferenceRegistration;
  const src = `${rootURI}content/preferences.xhtml`;
  const existing = (Zotero.PreferencePanes as any).pluginPanes.filter((pane: any) => pane.pluginID === addon.data.config.addonID);
  const current = existing.find((pane: any) => pane.src === src);
  for (const pane of existing) {
    if (pane !== current)
      Zotero.PreferencePanes.unregister(pane.id);
  }
  if (current)
    return current.id as string;
  preferenceRegistration = Zotero.PreferencePanes.register({
    id: "metaref-settings",
    pluginID: addon.data.config.addonID,
    src,
    scripts: [`${rootURI}content/scripts/preferences.js`],
    defaultXUL: true,
    label: getString("prefs-title"),
    image: `${rootURI}/content/icons/metaref-96.png`,
    stylesheets: [`${rootURI}/content/preferences.css`],
    helpURL: homepage,
  });
  try {
    return await preferenceRegistration;
  }
  catch (error) {
    preferenceRegistration = undefined;
    throw error;
  }
}

export function registerPrefsWindow(win: Window) {
  if (preferenceWindows.has(win) || !addon.data.alive)
    return;
  const stopWatching = watchPreferencePane(win, addon.data.config.addonRef, registerPrefsScripts);
  const cleanup = () => {
    stopWatching();
    releasePreferenceListeners(win.document);
    win.removeEventListener("unload", cleanup);
    preferenceWindows.delete(win);
    if (addon.data.prefs?.window === win)
      addon.data.prefs = undefined;
  };
  win.addEventListener("unload", cleanup, { once: true });
  preferenceWindows.set(win, cleanup);
}

export function unregisterPrefsWindows() {
  for (const cleanup of preferenceWindows.values())
    cleanup();
  releasePreferenceListeners();
}

export function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // The external preferences script watches fragment load events.
  if (!addon.data.alive)
    return;
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
    };
  }
  else {
    addon.data.prefs.window = _window;
  }

  const pane = _window.document.getElementById(addon.data.config.addonRef);
  if (!pane || initializedPanes.has(pane))
    return;
  initializedPanes.add(pane);
  setupAbbreviationSettings(pane);
  setupMenuSettings(pane);
  setupEasyScholarSettings(pane);
  setupWorkflowSettings(pane);
  setupFunctionCards(pane);
  setupCustomDataReset(pane);
  setupCustomDataFiles(pane);
  setupJournalDatabases(pane);
  setupDependencies(pane);
  setupEasyScholarConnectionTest(pane);
  setupShortcutInputs(pane);
  setupSettingsPanel(pane);
  setupBatchFeedback(pane);
  const cacheButton = pane.querySelector("#metaref-clear-api-cache");
  if (cacheButton) {
    preferenceListeners(pane)(cacheButton, "command", async () => {
      clearEasyScholarCache();
      clearSemanticScholarCache();
      await clearStoredServiceCache();
      pane.querySelector("#metaref-api-cache-status")!.textContent = getString("api-cache-cleared");
    });
  }
  setupIntegrationStatus(pane);
}

function setupIntegrationStatus(pane: Element) {
  const button = pane.querySelector("#metaref-integration-status");
  if (!button)
    return;
  preferenceListeners(pane)(button, "command", () => {
    const summary = Zotero.Prefs.get(`${addon.data.config.prefsPrefix}.integration.greenfrogMigrationSummary`, true);
    let migrated = 0;
    let skipped = 0;
    if (typeof summary === "string") {
      try {
        const parsed = JSON.parse(summary);
        migrated = Number.isFinite(parsed.copied) ? parsed.copied : 0;
        skipped = Array.isArray(parsed.skipped) ? parsed.skipped.length : 0;
      }
      catch {
        skipped = 1;
      }
    }
    const workflow = addon.data.lastAutomaticWorkflow;
    const stages = workflow?.stages.map(stage => getString("integration-stage-result", { args: {
      phase: getString(`integration-phase-${stage.phase}` as any),
      status: getString(`integration-state-${stage.status}` as any),
      saved: stage.saved || 0,
      failed: stage.failed || 0,
    } })).join("\n") || getString("integration-no-workflow");
    Zotero.alert(pane.ownerDocument!.defaultView!, getString("integration-status-button"), `${getString("integration-migration-result", { args: { migrated, skipped } })}\n\n${stages}\n\n${getString("integration-undo-description")}`);
  });
}

function setupEasyScholarSettings(pane: Element) {
  const listen = preferenceListeners(pane);
  const doc = pane.ownerDocument!;
  const fieldHost = pane.querySelector<HTMLElement>("#metaref-easyscholar-university-fields");
  const customHost = pane.querySelector<HTMLElement>("#metaref-easyscholar-custom-fields");
  const supplementalHost = pane.querySelector<HTMLElement>("#metaref-easyscholar-supplemental-fields");
  const columnsHost = pane.querySelector<HTMLElement>("#metaref-easyscholar-columns");
  if (!fieldHost || !customHost || !columnsHost)
    return;

  const makeControl = (field: (typeof EASYSCHOLAR_FIELD_DEFINITIONS)[number], kind: "fields" | "columns") => {
    const pref = `easyscholar.${kind}.${field.key}`;
    const defaultEnabled = kind === "fields" && EASYSCHOLAR_DEFAULT_FIELDS.has(field.key);
    return makeCheckbox(pref, `metaref-${getEasyScholarFieldMessageID(field.key)}`, defaultEnabled);
  };

  function makeCheckbox(pref: string, l10nID: string, fallback: boolean) {
    const label = doc.createElementNS("http://www.w3.org/1999/xhtml", "label");
    label.className = "metaref-check-option";
    const control = doc.createElementNS("http://www.w3.org/1999/xhtml", "input") as HTMLInputElement;
    control.type = "checkbox";
    control.id = `metaref-check-${pref.replaceAll(".", "-")}`;
    control.setAttribute("preference", `${addon.data.config.prefsPrefix}.${pref}`);
    control.checked = getPref(pref as any, fallback) === true;
    const caption = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
    caption.id = `${control.id}-label`;
    caption.textContent = getString(l10nID.replace(/^metaref-/, "") as any);
    control.setAttribute("aria-labelledby", caption.id);
    label.append(control, caption);
    const update = () => {
      setPref(pref as any, control.checked as any);
      if (pref.startsWith("easyscholar.columns."))
        registerEasyScholarColumns();
    };
    listen(control, "change", update);
    listen(control, "command", update);
    return label;
  }

  for (const original of pane.querySelectorAll("checkbox[preference]")) {
    const pref = original.getAttribute("preference")!.replace(`${addon.data.config.prefsPrefix}.`, "");
    const replacement = makeCheckbox(pref, original.getAttribute("data-l10n-id")!, getPref(pref as any) === true);
    if (original.id)
      replacement.querySelector("input")!.id = original.id;
    original.replaceWith(replacement);
  }
  for (const group of pane.querySelectorAll(".metaref-field-groups > groupbox")) {
    const choices = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    choices.className = "metaref-choice-grid";
    choices.append(...group.querySelectorAll(":scope > .metaref-check-option"));
    if (choices.childElementCount)
      group.append(choices);
  }
  for (const host of [fieldHost, customHost, supplementalHost, columnsHost])
    host?.classList.add("metaref-choice-grid");

  for (const field of EASYSCHOLAR_FIELD_DEFINITIONS) {
    if ("group" in field && field.group === "university")
      fieldHost.appendChild(makeControl(field, "fields"));
    else if (field.source === "custom")
      customHost.appendChild(makeControl(field, "fields"));
    else if (field.source === "supplemental")
      supplementalHost?.appendChild(makeControl(field, "fields"));
    columnsHost.appendChild(makeControl(field, "columns"));
  }
  const cardGroups = pane.querySelectorAll<Element>(".metaref-field-groups > groupbox, #metaref-easyscholar-settings > groupbox");
  for (const group of cardGroups) {
    const heading = group.querySelector(":scope > label");
    if (!heading)
      continue;
    const card = doc.createElementNS("http://www.w3.org/1999/xhtml", "details") as HTMLDetailsElement;
    card.className = "metaref-setting-card";
    card.open = Boolean(group.querySelector("[preference$='.easyscholar.fields.jcr']"));
    const summary = doc.createElementNS("http://www.w3.org/1999/xhtml", "summary");
    const count = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
    count.className = "metaref-card-hint";
    const updateCount = () => {
      const choices = [...group.querySelectorAll("input[type='checkbox']")] as HTMLInputElement[];
      doc.l10n!.setAttributes(count, "metaref-settings-group-count", { selected: choices.filter(choice => choice.checked).length, total: choices.length });
    };
    group.before(card);
    summary.append(heading, count);
    card.append(summary, group);
    listen(card, "change", updateCount);
    listen(card, "command", updateCount);
    updateCount();
  }
}

function setupEasyScholarConnectionTest(pane: Element) {
  const listen = preferenceListeners(pane);
  const input = pane.querySelector<HTMLInputElement>("#metaref-easyscholar-key");
  const button = pane.querySelector<HTMLButtonElement>("#metaref-easyscholar-test");
  const status = pane.querySelector<HTMLElement>("#metaref-easyscholar-test-status");
  const container = button?.parentElement;
  if (!input || !button || !status || !container)
    return;

  listen(button, "command", async () => {
    if (container.getAttribute("data-busy") === "true")
      return;
    container.setAttribute("data-busy", "true");
    button.disabled = true;
    status.textContent = "";
    try {
      const result = await testEasyScholarConnection(input.value);
      status.textContent = result.status === "success"
        ? getString("easyscholar-test-success")
        : result.status === "unconfigured"
          ? getString("easyscholar-test-empty")
          : getString("easyscholar-test-failed", { args: { error: result.message } });
    }
    finally {
      container.removeAttribute("data-busy");
      button.disabled = input.disabled;
    }
  });
}

function setupMenuSettings(pane: Element) {
  const listen = preferenceListeners(pane);
  const container = pane.querySelector("#metaref-menu-settings");
  if (!container)
    return;
  const doc = pane.ownerDocument!;
  for (const [key, keys] of [["primary", MENU_SECTIONS.primary], ...MENU_GROUPS]) {
    const group = doc.createXULElement("groupbox");
    const label = doc.createXULElement("label");
    doc.l10n!.setAttributes(label, `metaref-menu-group-${key}`);
    group.appendChild(label);
    for (const id of keys) {
      const control = doc.createXULElement("checkbox") as XULElement & { checked: boolean };
      const rule = id === "standard" ? undefined : Rules.getByID(id as ID);
      const l10nID = id.startsWith("show-") ? `menu-${id}` : id === "standard" ? "menuitem-stdFormatFlow" : rule?.getItemMenu?.()?.l10nID || `rule-${id}-menu-item`;
      doc.l10n!.setAttributes(control, `metaref-${l10nID}`);
      control.setAttribute("native", "true");
      control.setAttribute("preference", `${addon.data.config.prefsPrefix}.menu.${id}`);
      control.checked = getPref(`menu.${id}` as any, true) as boolean;
      listen(control, "command", () => setPref(`menu.${id}` as any, control.checked));
      const row = doc.createXULElement("hbox");
      row.className = "metaref-menu-placement-row";
      const placement = doc.createElementNS("http://www.w3.org/1999/xhtml", "select") as HTMLSelectElement;
      doc.l10n!.setAttributes(placement, "metaref-menu-placement");
      for (const value of ["none", "primary", "nested"]) {
        const option = doc.createElementNS("http://www.w3.org/1999/xhtml", "option") as HTMLOptionElement;
        option.value = value;
        doc.l10n!.setAttributes(option, `metaref-menu-placement-${value}`);
        placement.append(option);
      }
      placement.value = control.checked ? isPrimaryMenu(id) ? "primary" : "nested" : "none";
      listen(placement, "change", () => {
        const visible = placement.value !== "none";
        setPref(`menu.${id}` as any, visible);
        if (visible)
          setPref(`menu.primary.${id}` as any, placement.value === "primary");
        (row.querySelector("input[preference]") as HTMLInputElement || control).checked = visible;
      });
      const syncVisibility = (event: Event) => {
        if (!(event.target as Element)?.matches("input[preference]"))
          return;
        placement.value = (event.target as HTMLInputElement).checked ? isPrimaryMenu(id) ? "primary" : "nested" : "none";
      };
      listen(row, "change", syncVisibility);
      listen(row, "command", syncVisibility);
      row.append(control, placement);
      group.appendChild(row);
    }
    container.appendChild(group);
  }
}

function setupCustomDataReset(pane: Element) {
  const listen = preferenceListeners(pane);
  for (const input of pane.querySelectorAll<HTMLInputElement>("input[readonly][preference]")) {
    const button = input.ownerDocument.createXULElement("button");
    input.ownerDocument.l10n!.setAttributes(button, "metaref-settings-custom-data-reset");
    button.setAttribute("native", "true");
    button.dataset.resetPath = "true";
    if (!input.closest("[data-journal-database]")) {
      listen(button, "command", () => {
        if (input.parentElement!.hasAttribute("data-busy"))
          return;
        const status = input.parentElement!.querySelector(".metaref-custom-data-status");
        if (status)
          status.textContent = "";
        const key = input.getAttribute("preference")!.replace(`${addon.data.config.prefsPrefix}.`, "");
        setPref(key as any, "");
        input.value = "";
      });
    }
    input.parentElement!.appendChild(button);
  }
}

function setupDependencies(pane: Element) {
  const listen = preferenceListeners(pane);
  const prefix = `${addon.data.config.prefsPrefix}.`;
  const controls = [...pane.querySelectorAll<HTMLInputElement>("[preference]")];
  const key = (control: Element) => control.getAttribute("preference")!.replace(prefix, "");
  const parents = controls.filter(control => control.localName === "checkbox" || control.type === "checkbox")
    .map(control => ({ control, prefix: `${key(control)}.` }));
  const dependencies = controls.map(control => ({
    control,
    parents: parents.filter(parent => parent.control !== control && key(control).startsWith(parent.prefix)),
  }));
  const auto = controls.find(control => key(control) === "lint.onAdded");
  const group = controls.find(control => key(control) === "lint.onGroup");
  const update = () => {
    for (const { control, parents } of dependencies) {
      control.disabled = parents.some(parent => !parent.control.checked);
    }
    if (auto && group)
      group.disabled = !auto.checked;
    for (const button of pane.querySelectorAll<HTMLButtonElement>("hbox button")) {
      if (button.closest("[data-busy='true']")) {
        button.disabled = true;
        continue;
      }
      const input = button.parentElement?.querySelector("input[preference]") as HTMLInputElement | null;
      if (input)
        button.disabled = input.disabled || (button.dataset.resetPath === "true" && !input.value);
    }
  };
  listen(pane, "command", update);
  listen(pane, "change", update);
  listen(pane, "syncfrompreference", () => setTimeout(update, 0), true);
  update();
}

// ---------- Shortcut input recording & preview ----------

function setupShortcutInputs(pane: Element) {
  const listen = preferenceListeners(pane);
  const win = addon.data.prefs?.window;
  if (!win)
    return;
  const doc = win.document;
  const status = doc.querySelector<HTMLElement>(".metaref-shortcut-status");
  if (status) {
    status.id = "metaref-shortcut-status";
    status.setAttribute("role", "status");
  }
  const inputs = [...doc.querySelectorAll<HTMLInputElement>(".metaref-shortcut-input")];
  const prefKey = (input: HTMLInputElement) => input.getAttribute("preference")!
    .replace(`${addon.data.config.prefsPrefix}.`, "");

  const updatePreview = (input: HTMLInputElement) => {
    const preview = input.parentElement?.querySelector<HTMLElement>(".metaref-shortcut-preview");
    if (preview) {
      preview.textContent = shortcutPreview(input.value, Zotero.isMac);
      preview.title = preview.textContent;
    }
  };
  const showStatus = (id: string, args?: Record<string, unknown>) => {
    if (status)
      doc.l10n!.setAttributes(status, `metaref-${id}`, args);
  };
  const save = (input: HTMLInputElement, raw: string): boolean => {
    const normalized = normalizeShortcut(raw, Zotero.isMac);
    const conflict = normalized && inputs.find(other => other !== input
      && normalizeShortcut(other.value, Zotero.isMac) === normalized);
    if (normalized === null || conflict) {
      input.setAttribute("aria-invalid", "true");
      if (conflict) {
        const label = conflict.parentElement?.querySelector("label")?.textContent ?? "";
        showStatus("shortcut-conflict", { action: label });
      }
      else {
        showStatus("shortcut-invalid");
      }
      return false;
    }
    input.removeAttribute("aria-invalid");
    input.value = raw.trim();
    setPref(prefKey(input) as any, input.value);
    updatePreview(input);
    showStatus(input.value ? "shortcut-saved" : "shortcut-disabled");
    return true;
  };

  for (const input of inputs) {
    const row = input.parentElement!;
    const pref = prefKey(input);
    const action = pref.slice("shortcut.".length) as keyof typeof SHORTCUT_DEFAULTS;
    input.id = `metaref-shortcut-${action}`;
    const label = row.querySelector("label")!;
    label.id = `${input.id}-label`;
    label.setAttribute("control", input.id);
    input.setAttribute("aria-labelledby", label.id);
    input.setAttribute("aria-describedby", "metaref-shortcut-status");
    doc.l10n!.setAttributes(input, "metaref-shortcut-input-hint");
    const actions = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    actions.className = "metaref-shortcut-actions";
    actions.setAttribute("role", "group");
    actions.setAttribute("aria-labelledby", label.id);
    row.appendChild(actions);
    const makeButton = (l10nID: string, onCommand: () => void) => {
      const button = doc.createXULElement("button");
      doc.l10n!.setAttributes(button, `metaref-${l10nID}`);
      button.setAttribute("native", "true");
      button.classList.add("metaref-shortcut-action");
      listen(button, "command", onCommand);
      actions.appendChild(button);
    };
    makeButton("shortcut-clear", () => save(input, ""));
    makeButton("shortcut-reset", () => save(input, SHORTCUT_DEFAULTS[action]));
    input.value = getPref(pref as any, SHORTCUT_DEFAULTS[action]) as string;
    updatePreview(input);
    listen(input, "syncfrompreference", () => setTimeout(updatePreview, 0, input));

    listen(input, "input", (event: Event) => {
      // Reject invalid pasted bindings before Zotero's preference binding saves them.
      event.stopImmediatePropagation();
      const raw = input.value;
      if (!save(input, raw)) {
        input.value = getPref(pref as any, SHORTCUT_DEFAULTS[action]) as string;
        updatePreview(input);
      }
    }, true);
    listen(input, "blur", () => input.removeAttribute("aria-invalid"));
    listen(input, "keydown", (event: KeyboardEvent) => {
      if (event.key === "Tab")
        return;
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        input.blur();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "v")
        return;
      event.preventDefault();
      if ((event.key === "Backspace" || event.key === "Delete") && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        save(input, "");
        return;
      }
      const raw = recordShortcut(event, Zotero.isMac);
      if (raw && save(input, raw))
        input.blur();
    });
  }
}

function setupAbbreviationSettings(pane: Element) {
  const group = pane.querySelector("#metaref-journal-abbreviation-settings");
  const rules = pane.querySelector("[data-l10n-id$='section-rules']")?.closest("groupbox");
  if (group && rules)
    pane.insertBefore(group, rules);
  for (const select of pane.querySelectorAll<HTMLSelectElement>("select[data-abbr-option]")) {
    const key = `rule.require-journal-abbr.${select.dataset.abbrOption}`;
    select.value = String(getPref(key as any, select.options[0].value));
    preferenceListeners(pane)(select, "change", () => setPref(key as any, select.value));
  }
}
