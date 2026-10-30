import { getString } from "../utils/locale";
import { preferenceListeners } from "../utils/preference-listeners";
import { getPref, setPref } from "../utils/prefs";
import { Rules } from "./rules";

export function workflowGroup(id: string) {
  id = id.toLowerCase();
  if (/creators/.test(id))
    return "creators";
  if (/title/.test(id) && !/publication/.test(id))
    return "title";
  if (/doi/.test(id))
    return "identifiers";
  if (/pages|volume|issue/.test(id))
    return "pagination";
  if (/journal|publication|conference/.test(id))
    return "publication";
  return "other";
}

export function setupWorkflowSettings(pane: Element) {
  const doc = pane.ownerDocument!;
  const listen = preferenceListeners(pane);
  const host = pane.querySelector("#metaref-core-workflows")!;
  const additional = host.querySelector("#metaref-additional-menu-options");
  const moveMenuControl = (id: string, target: Element) => {
    const row = pane.querySelector(`[data-core-menu-command='${id}']`)!;
    target.insertBefore(row, target.children[2] || null);
  };
  const card = doc.createElementNS("http://www.w3.org/1999/xhtml", "section");
  card.className = "metaref-setting-card metaref-static-card";
  card.id = "metaref-workflow-settings";
  const summary = doc.createElementNS("http://www.w3.org/1999/xhtml", "header");
  summary.className = "metaref-card-heading";
  doc.l10n!.setAttributes(summary, "metaref-workflow-heading");
  card.append(summary);
  const description = doc.createElementNS("http://www.w3.org/1999/xhtml", "p");
  doc.l10n!.setAttributes(description, "metaref-workflow-description");
  card.append(description);
  const makeChoice = (id: string, target: Element = card) => {
    const label = doc.createElementNS("http://www.w3.org/1999/xhtml", "label");
    label.className = "metaref-check-option metaref-workflow-module";
    const input = doc.createElementNS("http://www.w3.org/1999/xhtml", "input") as HTMLInputElement;
    input.type = "checkbox";
    input.id = `metaref-workflow-${id}`;
    const caption = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
    caption.id = `${input.id}-label`;
    input.setAttribute("aria-labelledby", caption.id);
    doc.l10n!.setAttributes(caption, `metaref-workflow-${id}`);
    label.append(input, caption);
    target.append(label);
    return input;
  };
  const choice = (id: string, pref: string, fallback: boolean, target: Element = card) => {
    const input = makeChoice(id, target);
    input.setAttribute("preference", `${addon.data.config.prefsPrefix}.${pref}`);
    input.setAttribute("aria-label", getString(`workflow-${id}` as any));
    input.checked = getPref(pref as any, fallback) === true;
    listen(input, "change", () => setPref(pref as any, input.checked));
    return input;
  };
  for (const [id, pref] of [["metadata", "workflow.updateMetadata"], ["rankings", "workflow.updateJournalRankings"], ["check-duplicates", "workflow.reviewDuplicatesOnCheck"]])
    choice(id, pref, false);
  const moveChoice = (pref: string, target: Element) => {
    const input = pane.querySelector(`[preference='${addon.data.config.prefsPrefix}.${pref}']`);
    if (!input)
      return;
    const control = input.closest(".metaref-check-option") || input;
    const description = control.nextElementSibling;
    target.append(control);
    if (description?.localName === "description")
      target.append(description);
  };
  moveChoice("workflow.remoteAuthorsOnCheck", card);
  const makeCard = (id: string, heading: string, description: string) => {
    const section = doc.createElementNS("http://www.w3.org/1999/xhtml", "section");
    section.id = id;
    section.className = "metaref-setting-card metaref-static-card";
    const title = doc.createElementNS("http://www.w3.org/1999/xhtml", "header");
    title.className = "metaref-card-heading";
    doc.l10n!.setAttributes(title, heading);
    const note = doc.createElementNS("http://www.w3.org/1999/xhtml", "p");
    doc.l10n!.setAttributes(note, description);
    section.append(title, note);
    host.insertBefore(section, additional);
    return section;
  };
  host.insertBefore(card, additional);
  moveMenuControl("standard", card);
  const update = makeCard("metaref-update-workflow-settings", "metaref-workflow-update-heading", "metaref-workflow-update-description");
  moveMenuControl("tool-update-metadata", update);
  pane.querySelector("#metaref-primary-menu-controls")?.remove();
  const bibliographic = choice("update-bibliographic", "workflow.updateBibliographic", true, update);
  const versions = choice("update-versions", "workflow.updateVersions", false, update);
  choice("update-tldr", "workflow.tldrEnabled", true, update);
  choice("update-format", "workflow.formatAfterUpdate", true, update);
  moveChoice("metadata.updateJournalInfo", update);
  choice("update-duplicates", "workflow.reviewDuplicatesOnUpdate", false, update);
  const search = makeCard("metaref-search-workflow-settings", "metaref-workflow-search-heading", "metaref-workflow-search-description");
  const pdf = choice("scan-pdf", "workflow.scanPDF", false, search);
  const title = choice("search-title", "workflow.searchTitle", false, search);
  const updateDependencies = () => {
    versions.disabled = !bibliographic.checked;
    const metadata = pane.querySelector<HTMLInputElement>("#metaref-workflow-metadata")!;
    const authors = pane.querySelector<HTMLInputElement>(`input[preference='${addon.data.config.prefsPrefix}.workflow.remoteAuthorsOnCheck']`);
    pdf.disabled = title.disabled = !bibliographic.checked && !metadata.checked && !authors?.checked;
  };
  listen(pane, "change", updateDependencies);
  listen(pane, "command", updateDependencies);
  updateDependencies();
  for (const group of ["title", "creators", "identifiers", "pagination", "publication", "other"]) {
    const rules = Rules.getStandard().filter(rule => rule.id !== "correct-doi-long" && workflowGroup(rule.id) === group);
    const input = makeChoice(group);
    const update = () => {
      const enabled = rules.filter(rule => getPref(`rule.${rule.id}` as any) === true).length;
      input.checked = enabled === rules.length && rules.length > 0;
      input.indeterminate = enabled > 0 && enabled < rules.length;
    };
    listen(input, "change", () => {
      for (const rule of rules) {
        setPref(`rule.${rule.id}` as any, input.checked);
        const child = pane.querySelector<HTMLInputElement>(`input[preference='${addon.data.config.prefsPrefix}.rule.${rule.id}']`);
        if (child)
          child.checked = input.checked;
      }
      update();
      pane.dispatchEvent(new (doc.defaultView! as Window & typeof globalThis).Event("command", { bubbles: true }));
    });
    listen(pane, "change", update);
    listen(pane, "command", update);
    update();
  }
}
