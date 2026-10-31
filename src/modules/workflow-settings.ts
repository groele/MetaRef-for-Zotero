import { getString } from "../utils/locale";
import { preferenceListeners } from "../utils/preference-listeners";
import { getPref, setPref } from "../utils/prefs";
import { Rules } from "./rules";

export function workflowGroup(id: string) {
  id = id.toLowerCase();
  if (/attachment/.test(id))
    return "attachments";
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
  const makeCard = (id: string, heading: string, description: string, collapsed = false) => {
    const section = doc.createElementNS("http://www.w3.org/1999/xhtml", "section");
    section.id = id;
    section.className = `metaref-setting-card metaref-static-card metaref-collapsible-card${collapsed ? " is-collapsed" : ""}`;
    const title = doc.createElementNS("http://www.w3.org/1999/xhtml", "header");
    title.className = "metaref-card-heading";
    title.setAttribute("role", "button");
    title.setAttribute("tabindex", "0");
    title.setAttribute("aria-expanded", String(!collapsed));
    doc.l10n!.setAttributes(title, heading);

    const toggle = () => {
      const isNowCollapsed = section.classList.toggle("is-collapsed");
      title.setAttribute("aria-expanded", String(!isNowCollapsed));
    };
    listen(title, "click", toggle);
    listen(title, "keydown", (e: Event) => {
      const key = (e as KeyboardEvent).key;
      if (key === "Enter" || key === " ") {
        e.preventDefault();
        toggle();
      }
    });

    const note = doc.createElementNS("http://www.w3.org/1999/xhtml", "p");
    doc.l10n!.setAttributes(note, description);
    section.append(title, note);
    host.insertBefore(section, additional);
    return section;
  };
  const makeChoice = (id: string, target: Element) => {
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
  const choice = (id: string, pref: string, fallback: boolean, target: Element) => {
    const input = makeChoice(id, target);
    input.setAttribute("preference", `${addon.data.config.prefsPrefix}.${pref}`);
    input.setAttribute("aria-label", getString(`workflow-${id}` as any));
    input.checked = getPref(pref as any, fallback) === true;
    listen(input, "change", () => setPref(pref as any, input.checked));
    return input;
  };
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
  const moveElement = (selector: string, target: Element) => {
    const el = pane.querySelector(selector);
    if (!el)
      return;
    target.append(el);
    const description = el.nextElementSibling;
    if (description?.localName === "description")
      target.append(description);
  };

  // 1. 高等级选项 A：【检查并修复元数据】（100% 纯本地离线执行，零网络通信）
  const card = makeCard("metaref-workflow-settings", "metaref-workflow-heading", "metaref-workflow-description");
  moveMenuControl("standard", card);
  for (const group of ["title", "creators", "identifiers", "pagination", "publication", "attachments", "other"]) {
    const rules = Rules.getStandard().filter(rule => rule.id !== "correct-doi-long" && workflowGroup(rule.id) === group);
    const input = makeChoice(group, card);
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

  // 2. 高等级选项 B：【更新元数据】（集中收敛在线学术增强与自动补全）
  const update = makeCard("metaref-update-workflow-settings", "metaref-workflow-update-heading", "metaref-workflow-update-description");
  moveMenuControl("tool-update-metadata", update);
  pane.querySelector("#metaref-primary-menu-controls")?.remove();

  // (1) 在线书目核验与自动补全
  const bibliographic = choice("update-bibliographic", "workflow.updateBibliographic", true, update);

  // (2) 元数据来源优先级策略
  moveElement("#metaref-metadata-source-priority-row", update);

  // (3) 重点归纳项 1：按核验后的文献来源修复作者名单
  moveChoice("metadata.repairCreators", update);

  // (4) arXiv 预印本在线转正
  const versions = choice("update-versions", "workflow.updateVersions", false, update);

  // (5) 重点归纳项 2：网页快照与残缺条目学术复活
  moveChoice("workflow.reviveSnapshots", update);

  // (6) 重点归纳项 3：自动提炼并回填 Semantic Scholar TL;DR 核心论点摘要（撷论）及其子设置
  moveChoice("workflow.tldrEnabled", update);
  moveElement("#metaref-tldr-options", update);

  // (7) EasyScholar 权威期刊指标在线更新
  moveChoice("metadata.updateJournalInfo", update);

  // (8) 更新后格式整理与查重
  choice("update-format", "workflow.formatAfterUpdate", true, update);
  choice("update-duplicates", "workflow.reviewDuplicatesOnUpdate", false, update);

  // (9) Semantic Scholar API Key 凭证输入
  moveElement("#metaref-metadata-provider-options", update);

  // 3. 在线搜索与候选补全（无 DOI 回退策略）
  const search = makeCard("metaref-search-workflow-settings", "metaref-workflow-search-heading", "metaref-workflow-search-description");
  const pdf = choice("scan-pdf", "workflow.scanPDF", false, search);
  const title = choice("search-title", "workflow.searchTitle", false, search);

  const updateDependencies = () => {
    versions.disabled = !bibliographic.checked;
    pdf.disabled = title.disabled = !bibliographic.checked;
  };
  listen(pane, "change", updateDependencies);
  listen(pane, "command", updateDependencies);
  updateDependencies();
}
