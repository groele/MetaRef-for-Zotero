import { getString } from "../utils/locale";
import { preferenceListeners } from "../utils/preference-listeners";
import { getPref, setPref } from "../utils/prefs";
import { Rules } from "./rules";

export function workflowGroup(id: string) {
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
  const host = pane.querySelector(":scope > groupbox")!;
  const card = doc.createElementNS("http://www.w3.org/1999/xhtml", "details") as HTMLDetailsElement;
  card.className = "metaref-setting-card";
  card.id = "metaref-workflow-settings";
  const summary = doc.createElementNS("http://www.w3.org/1999/xhtml", "summary");
  doc.l10n!.setAttributes(summary, "metaref-workflow-heading");
  card.append(summary);
  const description = doc.createElementNS("http://www.w3.org/1999/xhtml", "p");
  doc.l10n!.setAttributes(description, "metaref-workflow-description");
  card.append(description);
  const makeChoice = (id: string) => {
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
    card.append(label);
    return input;
  };
  for (const [id, pref] of [["metadata", "workflow.updateMetadata"], ["rankings", "workflow.updateJournalRankings"]]) {
    const input = makeChoice(id);
    input.setAttribute("preference", `${addon.data.config.prefsPrefix}.${pref}`);
    input.setAttribute("aria-label", getString(`workflow-${id}` as any));
    input.checked = getPref(pref as any, false) === true;
    listen(input, "change", () => setPref(pref as any, input.checked));
  }
  for (const group of ["title", "creators", "identifiers", "pagination", "publication", "other"]) {
    const rules = Rules.getStandard().filter(rule => workflowGroup(rule.id) === group);
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
  host.append(card);
}
