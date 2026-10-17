import type { BatchResult } from "./runner";
import { cleanupResourcesSync } from "../utils/cleanup";
import { EASYSCHOLAR_FIELD_DEFINITIONS, isEasyScholarFieldEnabled } from "../utils/easyscholar";
import { isJournalFeedback } from "../utils/journal-feedback";
import { cachedJournalInsights, clearJournalInsights, getJournalInsights, loadJournalInsights } from "../utils/journal-insights";
import { presentJournalInsights } from "../utils/journal-insights-presentation";
import { hasEnabledJournalMetrics, isJournalIndexEnabled } from "../utils/journal-permissions";
import { journalRankingRows } from "../utils/journal-ranking-rows";
import { getLocaleID, getString } from "../utils/locale";
import { createLogger } from "../utils/logger";
import { getPref } from "../utils/prefs";
import { registerExtraColumns } from "./item-tree";
import { getEnabledEasyScholarFields } from "./rules/tool-update-easyscholar";

let sectionID: string | undefined;
const observers: symbol[] = [];
const refreshers = new Map<HTMLElement, () => Promise<void>>();
const renders = new WeakMap<HTMLElement, object>();
const items = new WeakMap<HTMLElement, Zotero.Item>();
const queryMessages = new Map<number, { level?: string; message: string }[]>();
const navigationListeners = new Map<Document, EventListener>();
const updating = new Set<number>();
let settingsRefreshPending = false;
let settingsRevision = 0;
const logger = createLogger("journal-pane");
const supportsRankings = (item?: Zotero.Item) => Boolean(item?.isRegularItem() && ["journalArticle", "conferencePaper"].includes(item.itemType));
type Context = _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs;

export function registerJournalPane() {
  if (sectionID)
    return;
  const icon = `${rootURI}content/icons/metaref.svg`;
  const id = Zotero.ItemPaneManager.registerSection({
    paneID: "metaref-journal-insights",
    pluginID: addon.data.config.addonID,
    header: { icon, l10nID: getLocaleID("journal-insights-heading")! },
    sidenav: { icon, l10nID: getLocaleID("journal-insights-heading")! },
    onInit({ body, doc, refresh, setEnabled }) {
      if (!navigationListeners.has(doc)) {
        const listener: EventListener = (event) => {
          const mouse = event as MouseEvent;
          if (mouse.button !== 0 || mouse.detail > 1)
            return;
          const button = (event.target as Element)?.closest?.("item-pane-sidenav .btn[data-pane]");
          if (!button || button.getAttribute("data-pane") !== sectionID || button.hasAttribute("disabled"))
            return;
          const sidenav = button.closest("item-pane-sidenav") as Element & { container?: Element };
          const activeBody = [...refreshers.keys()].find(node => node.ownerDocument === doc && sidenav.container?.contains(node));
          const item = activeBody && items.get(activeBody);
          if (item && supportsRankings(item) && !updating.has(item.id))
            void completeFromNavigation(item).catch(error => logger.error(error));
        };
        doc.addEventListener("click", listener);
        navigationListeners.set(doc, listener);
      }
      refreshers.set(body, async () => {
        setEnabled(getPref("insights.showPane", true) && hasEnabledJournalMetrics() && supportsRankings(items.get(body)));
        await refresh();
      });
    },
    onDestroy({ body }) {
      refreshers.delete(body);
      renders.delete(body);
      items.delete(body);
      const doc = body.ownerDocument;
      if (doc && ![...refreshers.keys()].some(node => node.ownerDocument === doc)) {
        const listener = navigationListeners.get(doc);
        if (listener)
          doc.removeEventListener("click", listener);
        navigationListeners.delete(doc);
      }
    },
    onItemChange({ item, body, setEnabled }) {
      if (item)
        items.set(body, item);
      else
        items.delete(body);
      renders.delete(body);
      body.replaceChildren();
      setEnabled(getPref("insights.showPane", true) && hasEnabledJournalMetrics() && supportsRankings(item));
    },
    onRender({ body, item, setEnabled }) {
      if (item)
        items.set(body, item);
      renders.delete(body);
      setEnabled(getPref("insights.showPane", true) && hasEnabledJournalMetrics() && supportsRankings(item));
      body.textContent = getString("journal-insights-loading");
    },
    onAsyncRender: render,
  });
  if (id)
    sectionID = id;
  for (const pref of ["insights.showPane", "insights.esiCustomDataPath", "insights.esiFormat", "insights.natureCustomDataPath", "insights.esiSourcePriority", "insights.natureSourcePriority", "insights.natureDatasetUUID", "easyscholar.secretKey", "insights.natureEnabled", ...EASYSCHOLAR_FIELD_DEFINITIONS.map(field => `easyscholar.fields.${field.key}`)]) {
    observers.push(Zotero.Prefs.registerObserver(`${addon.data.config.prefsPrefix}.${pref}`, () => {
      if (pref.endsWith("DataPath"))
        clearJournalInsights();
      refreshData();
    }, true));
  }
}

async function completeFromNavigation(item: Zotero.Item) {
  if (!hasEnabledJournalMetrics())
    return;
  updating.add(item.id);
  try {
    const insights = await getJournalInsights(item);
    const saved = new Set(journalRankingRows(String(item.getField("extra") || "")).map(row => row.key));
    const enabled = getEnabledEasyScholarFields();
    const missingRankings = EASYSCHOLAR_FIELD_DEFINITIONS.some(field => enabled.has(field.key) && !saved.has(field.key));
    const missingIndexes = item.itemType === "journalArticle" && ((isJournalIndexEnabled("esi") && (!insights.categories.length || insights.esiAPIWarning)) || (isJournalIndexEnabled("nature") && (insights.natureIndex === undefined || insights.natureAPIWarning)));
    if (!missingRankings && !missingIndexes)
      return;
    queryMessages.set(item.id, [{ message: getString("journal-insights-loading") }]);
    await refreshJournalPane([item.id]);
    await addon.hooks.onRefreshJournal(item);
  }
  catch (error) {
    queryMessages.set(item.id, [{ level: "error", message: getString("journal-rankings-refresh-failed") }]);
    await refreshJournalPane([item.id]);
    throw error;
  }
  finally {
    updating.delete(item.id);
  }
}

function refreshData() {
  settingsRevision++;
  if (settingsRefreshPending)
    return;
  settingsRefreshPending = true;
  let renderedRevision = settingsRevision;
  void Promise.resolve().then(async () => {
    renderedRevision = settingsRevision;
    if (!addon.data.alive)
      return;
    registerExtraColumns();
    await loadJournalInsights();
    if (addon.data.alive) {
      Zotero.ItemTreeManager.refreshColumns();
      await Promise.all([...refreshers.values()].map(refresh => refresh()));
    }
  }).catch(error => logger.error(error)).finally(() => {
    settingsRefreshPending = false;
    if (addon.data.alive && renderedRevision !== settingsRevision)
      refreshData();
  });
}

export async function refreshJournalInsights() {
  clearJournalInsights();
  await loadJournalInsights();
  if (!addon.data.alive)
    return;
  Zotero.ItemTreeManager.refreshColumns();
  await Promise.all([...refreshers.values()].map(refresh => refresh()));
}

export async function refreshJournalPane(itemIDs?: number[]) {
  if (!addon.data.alive)
    return;
  await Promise.all([...refreshers].filter(([body]) => !itemIDs || itemIDs.includes(items.get(body)?.id || 0)).map(([, refresh]) => refresh()));
}

export function setJournalUpdateResult(itemIDs: number[], result?: BatchResult) {
  for (const id of itemIDs) {
    const messages = result?.records.filter(record => record.itemID === id && isJournalFeedback(record)).map(({ level, message }) => ({ level, message })) || [];
    if (result && !messages.length && !result.cancelled)
      messages.push({ level: "info", message: getString("journal-rankings-query-complete") });
    if (result?.cancelled)
      messages.push({ level: "warning", message: getString("journal-rankings-cancelled") });
    queryMessages.delete(id);
    queryMessages.set(id, messages);
  }
  while (queryMessages.size > 128)
    queryMessages.delete(queryMessages.keys().next().value!);
}

async function render({ item, body, doc, setSectionSummary }: Context) {
  if (!item || !supportsRankings(item) || !hasEnabledJournalMetrics() || !getPref("insights.showPane", true))
    return;
  const token = {};
  renders.set(body, token);
  const result = cachedJournalInsights(item) ?? await getJournalInsights(item);
  if (!addon.data.alive || renders.get(body) !== token || !body.isConnected)
    return;
  body.replaceChildren();
  body.style.cssText = "padding:10px 12px 12px;line-height:1.5;overflow-wrap:anywhere;color:var(--fill-primary);";
  const rows = item.itemType === "journalArticle" ? presentJournalInsights(result, Zotero.locale).filter((_row, index) => isJournalIndexEnabled(index === 0 ? "esi" : "nature")) : [];
  const text = (tag: string, value: string, style = "") => {
    const node = doc.createElementNS("http://www.w3.org/1999/xhtml", tag);
    node.textContent = value;
    node.setAttribute("style", style);
    return node;
  };
  const publication = String(item.getField(item.itemType === "conferencePaper" ? "proceedingsTitle" : "publicationTitle") || "").trim();
  const journalTitle = text("h2", publication || getString("journal-insights-unnamed"), "font-size:14px;font-weight:600;margin:0 0 12px;line-height:1.5;white-space:pre-wrap;");
  journalTitle.setAttribute("data-journal-title", "true");
  body.append(journalTitle);
  const sharedBasis = rows.length && rows.every(row => row.basis && row.basis === rows[0].basis) ? rows[0].basis : "";
  const rankings = journalRankingRows(String(item.getField("extra") || "")).filter(row => isEasyScholarFieldEnabled(row.key));
  const savedESI = rankings.find(row => row.key === "esi");
  if (isJournalIndexEnabled("esi") && rows.length && savedESI && !result.categories.length) {
    rows[0] = { ...rows[0], value: savedESI.value, matched: true, basis: "", source: getString("journal-insights-saved-source") };
  }
  const displayedRankings = rankings.filter(row => item.itemType !== "journalArticle" || row.key !== "esi");
  const rankingSection = text("section", "", "margin-bottom:16px;");
  rankingSection.setAttribute("data-journal-rankings", "true");
  rankingSection.append(text("h3", getString("journal-rankings-heading"), "font-size:13px;margin:0 0 10px;font-weight:600;"));
  const messages = queryMessages.get(item.id);
  if (messages?.length) {
    const status = text("div", "", "font-size:12px;margin-bottom:10px;");
    status.setAttribute("data-journal-update-status", "true");
    status.setAttribute("role", "status");
    for (const message of messages)
      status.append(text("div", message.message, `color:${message.level === "warning" || message.level === "error" ? "var(--accent-orange)" : "var(--fill-secondary)"};`));
    rankingSection.append(status);
  }
  if (displayedRankings.length) {
    const fields = text("dl", "", "margin:0;display:grid;grid-template-columns:minmax(88px,1fr) minmax(0,1fr);gap:8px 12px;");
    for (const ranking of displayedRankings) {
      const label = text("dt", getString(ranking.labelID as any), "margin:0;font-size:12px;color:var(--fill-secondary);");
      const value = text("dd", ranking.value, "margin:0;min-width:0;font-weight:600;white-space:pre-wrap;");
      value.setAttribute("data-journal-ranking", ranking.key);
      fields.append(label, value);
    }
    rankingSection.append(fields);
  }
  else {
    rankingSection.append(text("div", getString("journal-rankings-empty"), "font-size:12px;color:var(--fill-secondary);"));
  }
  rankingSection.append(text("div", getString("journal-rankings-saved-note"), "font-size:12px;color:var(--fill-secondary);margin-top:10px;"));
  body.append(rankingSection);
  const results = text("dl", "", "margin:0;display:grid;gap:14px;");
  for (const row of rows) {
    const node = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    node.setAttribute("data-journal-result", row.label);
    node.setAttribute("style", "display:grid;grid-template-columns:88px minmax(0,1fr);column-gap:12px;align-items:baseline;");
    const value = text("dd", "", "margin:0;min-width:0;");
    value.append(text("div", row.value, row.matched ? "font-size:14px;font-weight:600;" : "font-size:13px;color:var(--fill-secondary);"));
    if (row.basis && !sharedBasis)
      value.append(text("div", row.basis, "font-size:12px;color:var(--fill-secondary);margin-top:2px;"));
    if (row.warning)
      value.append(text("div", row.warning, "font-size:12px;color:var(--accent-orange);margin-top:4px;"));
    node.append(text("dt", row.label, "margin:0;font-size:12px;color:var(--fill-secondary);"), value);
    results.append(node);
  }
  if (rows.length)
    body.append(results);
  if (sharedBasis) {
    const basis = text("div", sharedBasis, "font-size:12px;color:var(--fill-secondary);margin-top:10px;");
    basis.setAttribute("data-journal-shared-basis", "true");
    body.append(basis);
  }
  const sources = text("div", "", "border-top:1px solid var(--fill-quinary);margin-top:12px;padding-top:10px;font-size:12px;color:var(--fill-secondary);line-height:1.6;");
  sources.setAttribute("data-journal-sources", "true");
  sources.append(text("div", getString("journal-insights-source"), "margin-bottom:4px;"), ...rows.map(row => text("div", row.source)));
  const note = text("div", getString("journal-insights-scope-note"), "margin-top:8px;");
  note.setAttribute("title", getString("journal-insights-boundary"));
  sources.append(note);
  if (rows.length)
    body.append(sources);
  setSectionSummary([rankings.find(row => row.key === "jcr")?.value || "", isJournalIndexEnabled("esi") && result.categories.length ? rows[0]?.value || "" : "", isJournalIndexEnabled("nature") && result.natureIndex ? "Nature Index" : ""].filter(Boolean).join(" · "));
}

export function unregisterJournalPane() {
  const id = sectionID;
  sectionID = undefined;
  refreshers.clear();
  queryMessages.clear();
  for (const [doc, listener] of navigationListeners)
    doc.removeEventListener("click", listener);
  navigationListeners.clear();
  updating.clear();
  cleanupResourcesSync([
    ...observers.splice(0).map(id => () => Zotero.Prefs.unregisterObserver(id)),
    () => id && Zotero.ItemPaneManager.unregisterSection(id),
    clearJournalInsights,
  ], error => logger.error("Journal pane cleanup failed:", error));
}
