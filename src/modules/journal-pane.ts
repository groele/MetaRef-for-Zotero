import type { JournalInsights } from "../utils/journal-insights";
import type { BatchResult } from "./runner";
import { cleanupResourcesSync } from "../utils/cleanup";
import { EASYSCHOLAR_FIELD_DEFINITIONS, isEasyScholarFieldEnabled } from "../utils/easyscholar";
import { shareJournalCard } from "../utils/journal-card-share";
import { isJournalFeedback } from "../utils/journal-feedback";
import { cachedJournalInsights, clearJournalInsights, getJournalInsights, loadJournalInsights } from "../utils/journal-insights";
import { presentJournalInsights } from "../utils/journal-insights-presentation";
import { hasEnabledJournalMetrics, isJournalIndexEnabled } from "../utils/journal-permissions";
import { journalRankingRows } from "../utils/journal-ranking-rows";
import { getLocaleID, getString } from "../utils/locale";
import { createLogger } from "../utils/logger";
import { NavigationQueryCache } from "../utils/navigation-query-cache";
import { getPref } from "../utils/prefs";
import { registerExtraColumns } from "./item-tree";
import { normalizeArxiv } from "./review/policy";
import { isSnapshotItem } from "./review/snapshot-reviver";
import { getEnabledEasyScholarFields } from "./rules/tool-update-easyscholar";
import { extractTLDRFromItem } from "./rules/tool-update-metadata/tldr";

let sectionID: string | undefined;
const observers: symbol[] = [];
const refreshers = new Map<HTMLElement, () => Promise<void>>();
const renders = new WeakMap<HTMLElement, object>();
const items = new WeakMap<HTMLElement, Zotero.Item>();
const queryMessages = new Map<number, { level?: string; message: string }[]>();
const navigationListeners = new Map<Document, EventListener>();
const updating = new Set<number>();
const navigationQueries = new NavigationQueryCache();
let settingsRefreshPending = false;
let settingsRevision = 0;
const navigationQueryKey = (item: Zotero.Item) => JSON.stringify([settingsRevision, item.itemType, ...["publicationTitle", "conferenceName", "ISSN", "extra"].map(field => item.getField(field as _ZoteroTypes.Item.ItemField))]);
const logger = createLogger("journal-pane");

export function extractArxivID(item?: Zotero.Item): string | undefined {
  if (!item || !item.isRegularItem())
    return undefined;
  const doi = String(item.getField("DOI") || "");
  const url = String(item.getField("url") || "");
  const extra = String(item.getField("extra") || "");
  let archiveID = "";
  try {
    archiveID = String(item.getField("archiveID" as any) || "");
  }
  catch {
    archiveID = "";
  }
  for (const candidate of [doi, url, archiveID]) {
    const norm = normalizeArxiv(candidate);
    if (norm)
      return norm;
  }
  const allText = `${doi}\n${url}\n${extra}\n${archiveID}`;
  const match = allText.match(/(?:arxiv\.org\/(?:abs|pdf|html)\/|(?:doi:|https?:\/\/doi\.org\/)?10\.48550\/arxiv\.|arxiv:\s*)((?:\d{4}\.\d{4,5}|[a-z.-]+\/\d{7})(?:v\d+)?)/i);
  if (match)
    return match[1].toLowerCase();
  if (archiveID && /^(?:\d{4}\.\d{4,5}|[a-z.-]+\/\d{7})(?:v\d+)?$/i.test(archiveID.trim()))
    return archiveID.trim().toLowerCase();
  return undefined;
}

export function isUnconvertedArxivPreprint(item?: Zotero.Item): boolean {
  if (!item || !item.isRegularItem())
    return false;
  const arxivID = extractArxivID(item);
  if (!arxivID)
    return false;
  const extra = String(item.getField("extra") || "");
  if (extra.includes("MetaFlow preprint"))
    return false;
  if (item.itemType === "preprint")
    return true;
  const doi = String(item.getField("DOI") || "");
  const publication = String(item.getField(item.itemType === "conferencePaper" ? "proceedingsTitle" : "publicationTitle") || "").trim();
  const isArxivDOI = /^10\.48550\/arxiv\./i.test(doi);
  const isArxivPub = !publication || /^(?:arxiv|corr)(?:\.org)?$/i.test(publication) || publication.toLowerCase().includes("arxiv preprint");
  return isArxivDOI || isArxivPub;
}

export function isUnrevivedSnapshot(item?: Zotero.Item): boolean {
  if (!item || !isSnapshotItem(item))
    return false;
  if (!getPref("workflow.reviveSnapshots" as any, true))
    return false;
  if (typeof item.getField === "function") {
    const extra = String(item.getField("extra") || "");
    if (extra.includes("MetaFlow revived from"))
      return false;
    const url = String(item.getField("url") || "").trim();
    if (url)
      return true;
  }
  if (typeof item.getAttachments === "function") {
    const atts = item.getAttachments();
    if (Array.isArray(atts) && atts.length > 0)
      return true;
  }
  return false;
}

const supportsRankings = (item?: Zotero.Item) => Boolean(item?.isRegularItem() && ["journalArticle", "conferencePaper"].includes(item.itemType));
function supportsSection(item?: Zotero.Item): boolean {
  return Boolean(
    item && getPref("insights.showPane", true) && (
      isUnconvertedArxivPreprint(item)
      || isUnrevivedSnapshot(item)
      || Boolean(extractTLDRFromItem(item))
      || (supportsRankings(item) && hasEnabledJournalMetrics())
    ),
  );
}
type Context = _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs;

function ensureJournalPaneStyles(doc?: Document | null) {
  if (!doc)
    return;
  const styleID = "metaref-journal-pane-styles";
  if (doc.getElementById(styleID))
    return;
  const style = doc.createElementNS("http://www.w3.org/1999/xhtml", "style");
  style.id = styleID;
  style.textContent = `
    item-pane-custom-section[data-pane*="metaref-journal-insights"],
    item-pane-custom-section[data-pane*="metaref-journal-insights"] > collapsible-section,
    item-pane-custom-section[data-pane*="metaref-journal-insights"] [data-type="body"],
    collapsible-section[data-pane*="metaref-journal-insights"],
    collapsible-section[data-pane*="metaref-journal-insights"] > [data-type="body"] {
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      padding: 0 !important;
      margin: 0 !important;
    }
    item-pane-custom-section[data-pane*="metaref-journal-insights"] collapsible-section:not([open]) [data-type="body"],
    collapsible-section[data-pane*="metaref-journal-insights"]:not([open]) [data-type="body"],
    collapsible-section:not([open]) > [data-type="body"]:has(> .metaref-journal-pane-wrap) {
      max-height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
    }
    item-pane-custom-section[data-pane*="metaref-journal-insights"] .head .title-box .summary:empty,
    item-pane-custom-section[data-pane*="metaref-journal-insights"] collapsible-section > .head .title-box .summary:empty,
    item-pane-custom-section[data-pane*="metaref-journal-insights"] .summary:empty,
    collapsible-section[data-pane*="metaref-journal-insights"] .summary:empty {
      display: none !important;
    }
    item-pane-sidenav .btn[data-pane*="metaref-journal-insights"] {
      width: 28px !important;
      height: 28px !important;
      min-width: 28px !important;
      padding: 4px !important;
      box-sizing: border-box !important;
    }
    .metaref-journal-pane-wrap {
      padding: 10px 12px 12px;
      line-height: 1.5;
      overflow-wrap: anywhere;
      color: var(--fill-primary);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }
    .metaref-journal-pane-wrap * {
      box-sizing: border-box;
    }
    [data-journal-share]:hover { background:color-mix(in srgb,currentColor 8%,transparent)!important;color:var(--fill-primary)!important; }
    [data-journal-share][data-share-success] { color:var(--accent-green,#16803c)!important; }
    @media(prefers-color-scheme:dark) {
      [data-journal-share][data-share-success] { color:var(--accent-green,#6ee7b7)!important; }
    }
    [data-journal-share]:focus-visible { outline:2px solid var(--fill-primary);outline-offset:2px; }
    [data-journal-share]:disabled { cursor:progress;opacity:.7; }
    @media(prefers-reduced-motion:no-preference) {
      [data-journal-share] { transition:color 160ms ease,background-color 160ms ease,transform 160ms ease; }
      [data-journal-share]:active { transform:scale(.94); }
    }
  `;
  (doc.head || doc.documentElement)?.append(style);
}

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
      ensureJournalPaneStyles(doc || body.ownerDocument);
      const hideSummary = () => {
        const summary = (body.closest("collapsible-section") || body.parentElement)?.querySelector<HTMLElement>(".head .title-box .summary, .summary");
        if (summary && !summary.textContent?.trim())
          summary.style.display = "none";
      };
      hideSummary();
      const raf = (doc || body.ownerDocument)?.defaultView?.requestAnimationFrame;
      if (typeof raf === "function")
        raf.call((doc || body.ownerDocument)!.defaultView, hideSummary);
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
        setEnabled(supportsSection(items.get(body)));
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
      body.style.cssText = "padding:0;margin:0;box-sizing:border-box;";
      const enabled = supportsSection(item);
      setEnabled(enabled);
      ensureJournalPaneStyles(body.ownerDocument);
      const summary = (body.closest("collapsible-section") || body.parentElement)?.querySelector<HTMLElement>(".head .title-box .summary, .summary");
      if (summary && !summary.textContent?.trim())
        summary.style.display = "none";
    },
    onRender({ body, item, setEnabled }) {
      if (item)
        items.set(body, item);
      renders.delete(body);
      const enabled = supportsSection(item);
      setEnabled(enabled);
      const doc = body.ownerDocument || Zotero.getMainWindow()?.document;
      ensureJournalPaneStyles(doc);
      body.style.cssText = "padding:0;margin:0;box-sizing:border-box;";
      const summary = (body.closest("collapsible-section") || body.parentElement)?.querySelector<HTMLElement>(".head .title-box .summary, .summary");
      if (summary && !summary.textContent?.trim())
        summary.style.display = "none";
      if (!enabled) {
        body.replaceChildren();
        return;
      }
      if (doc) {
        const loading = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
        loading.className = "metaref-journal-pane-wrap";
        loading.textContent = getString("journal-insights-loading");
        body.replaceChildren(loading);
      }
      else {
        body.textContent = getString("journal-insights-loading");
      }
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
  if (!hasEnabledJournalMetrics() || navigationQueries.has(item.id, navigationQueryKey(item)))
    return;
  updating.add(item.id);
  try {
    const insights = await getJournalInsights(item);
    const saved = new Set(journalRankingRows(String(item.getField("extra") || ""), item).map(row => row.key));
    const enabled = getEnabledEasyScholarFields();
    const missingRankings = EASYSCHOLAR_FIELD_DEFINITIONS.some(field => enabled.has(field.key) && !saved.has(field.key));
    const missingIndexes = item.itemType === "journalArticle" && ((isJournalIndexEnabled("esi") && (!insights.categories.length || insights.esiAPIWarning)) || (isJournalIndexEnabled("nature") && (insights.natureIndex === undefined || insights.natureAPIWarning)));
    if (!missingRankings && !missingIndexes)
      return;
    queryMessages.set(item.id, [{ message: getString("journal-insights-loading") }]);
    await refreshJournalPane([item.id]);
    const result = await addon.hooks.onRefreshJournal(item) as BatchResult | undefined;
    if (!result?.cancelled)
      navigationQueries.remember(item.id, navigationQueryKey(item), Boolean(result?.failed || result?.records.some(record => record.level === "warning" || record.level === "error")));
  }
  catch (error) {
    navigationQueries.remember(item.id, navigationQueryKey(item), true);
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
  navigationQueries.clear();
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

function createCheckSvgIcon(doc: Document) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = doc.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "15");
  svg.setAttribute("height", "15");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("style", "width:15px;height:15px;display:block;pointer-events:none;color:inherit;stroke:currentColor;");

  const polyline = doc.createElementNS(svgNS, "polyline");
  polyline.setAttribute("points", "20 6 9 17 4 12");

  svg.append(polyline);
  return svg;
}

function createShareSvgIcon(doc: Document) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = doc.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "15");
  svg.setAttribute("height", "15");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("style", "width:15px;height:15px;display:block;pointer-events:none;color:inherit;stroke:currentColor;");

  const path = doc.createElementNS(svgNS, "path");
  path.setAttribute("d", "M12 15V3m-4 4 4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6");
  svg.setAttribute("aria-hidden", "true");
  svg.append(path);
  return svg;
}

async function render({ item, body, doc }: Context) {
  if (!item || !supportsSection(item)) {
    body.replaceChildren();
    return;
  }
  if (isUnconvertedArxivPreprint(item)) {
    const arxivID = extractArxivID(item);
    body.replaceChildren();
    body.style.cssText = "padding:0;margin:0;box-sizing:border-box;";
    ensureJournalPaneStyles(doc || body.ownerDocument);

    const wrap = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    wrap.className = "metaref-journal-pane-wrap";

    const badgeRow = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    badgeRow.setAttribute("style", "display:flex;align-items:center;justify-content:space-between;margin:0 0 10px;gap:8px;");

    const badge = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
    badge.textContent = "arXiv Preprint";
    badge.setAttribute("style", "display:inline-flex;align-items:center;background:color-mix(in srgb, #b31b1b 15%, transparent);color:#b31b1b;border:1px solid color-mix(in srgb, #b31b1b 30%, transparent);padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;letter-spacing:0.3px;");
    badgeRow.append(badge);

    if (arxivID) {
      const arxivLink = doc.createElementNS("http://www.w3.org/1999/xhtml", "a") as HTMLAnchorElement;
      arxivLink.textContent = `arXiv:${arxivID}`;
      arxivLink.href = `https://arxiv.org/abs/${arxivID}`;
      arxivLink.setAttribute("target", "_blank");
      arxivLink.setAttribute("rel", "noopener noreferrer");
      arxivLink.setAttribute("style", "font-size:12px;color:var(--accent-blue, #245ac7);text-decoration:none;font-family:ui-monospace, monospace;");
      arxivLink.addEventListener("click", (e) => {
        e.stopPropagation();
        Zotero.launchURL(`https://arxiv.org/abs/${arxivID}`);
      });
      badgeRow.append(arxivLink);
    }
    wrap.append(badgeRow);

    const title = String(item.getField("title") || "").trim();
    if (title) {
      const titleElem = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
      titleElem.textContent = title;
      titleElem.setAttribute("style", "font-size:13px;font-weight:600;line-height:1.45;margin-bottom:8px;color:var(--fill-primary);");
      wrap.append(titleElem);
    }

    const desc = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    desc.textContent = getString("preprint-card-description") || "当前条目为 arXiv 预印本。MetaFlow 可自动检索官方出版 DOI，一键转正为期刊/会议论文并保留现有 PDF 批注与笔记。";
    desc.setAttribute("style", "font-size:12px;line-height:1.5;color:var(--fill-secondary);margin-bottom:12px;");
    wrap.append(desc);

    const tldr = extractTLDRFromItem(item);
    if (tldr) {
      const tldrBox = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
      tldrBox.setAttribute("style", "margin:0 0 12px;padding:8px 10px;background:color-mix(in srgb, var(--accent-blue, #245ac7) 8%, transparent);border-radius:6px;border-left:3px solid var(--accent-blue, #245ac7);font-size:12px;line-height:1.5;color:var(--fill-primary);");
      const tldrHead = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
      tldrHead.setAttribute("style", "font-size:11px;font-weight:600;color:var(--accent-blue, #245ac7);margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;");
      const headTitle = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
      headTitle.textContent = `💡 ${getString("journal-insights-tldr-heading") || "核心论点 (TL;DR)"}`;
      const headSrc = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
      headSrc.textContent = "Semantic Scholar";
      headSrc.setAttribute("style", "font-size:10px;font-weight:400;opacity:0.75;");
      tldrHead.append(headTitle, headSrc);
      const tldrBody = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
      tldrBody.textContent = tldr;
      tldrBox.append(tldrHead, tldrBody);
      wrap.append(tldrBox);
    }

    const convertBtn = doc.createElementNS("http://www.w3.org/1999/xhtml", "button") as HTMLButtonElement;
    convertBtn.type = "button";
    convertBtn.textContent = `⚡ ${getString("rule-tool-review-preprint-menu-item") || "检查并转为正式发表版本…"}`;
    convertBtn.setAttribute("style", "display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px 12px;font-size:13px;font-weight:600;border-radius:6px;background:color-mix(in srgb, var(--accent-blue, #245ac7) 12%, transparent);border:1px solid color-mix(in srgb, var(--accent-blue, #245ac7) 30%, transparent);color:var(--accent-blue, #245ac7);cursor:pointer;");
    convertBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (convertBtn.disabled)
        return;
      convertBtn.disabled = true;
      convertBtn.textContent = `⏳ ${getString("journal-insights-loading") || "正在查询 arXiv 与 CrossRef…"}`;
      try {
        await addon.hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
        await refreshJournalPane([item.id]);
      }
      catch (err) {
        logger.error("Preprint conversion failed:", err);
      }
      finally {
        if (convertBtn.isConnected) {
          convertBtn.disabled = false;
          convertBtn.textContent = `⚡ ${getString("rule-tool-review-preprint-menu-item") || "检查并转为正式发表版本…"}`;
        }
      }
    });
    wrap.append(convertBtn);
    body.replaceChildren(wrap);
    return;
  }
  if (isUnrevivedSnapshot(item)) {
    body.replaceChildren();
    body.style.cssText = "padding:0;margin:0;box-sizing:border-box;";
    ensureJournalPaneStyles(doc || body.ownerDocument);

    const wrap = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    wrap.className = "metaref-journal-pane-wrap";

    const badgeRow = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    badgeRow.setAttribute("style", "display:flex;align-items:center;justify-content:space-between;margin:0 0 10px;gap:8px;");

    const badge = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
    badge.textContent = `🌐 ${getString("snapshot-card-badge") || "网页快照 / 剪藏条目"}`;
    badge.setAttribute("style", "display:inline-flex;align-items:center;background:color-mix(in srgb, #0284c7 15%, transparent);color:#0284c7;border:1px solid color-mix(in srgb, #0284c7 30%, transparent);padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;letter-spacing:0.3px;");
    badgeRow.append(badge);

    const url = String(item.getField("url") || "").trim();
    if (url) {
      try {
        const host = new URL(url).hostname;
        const link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a") as HTMLAnchorElement;
        link.textContent = host;
        link.href = url;
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        link.setAttribute("style", "font-size:12px;color:var(--accent-blue, #245ac7);text-decoration:none;font-family:ui-monospace, monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px;");
        link.addEventListener("click", (e) => {
          e.stopPropagation();
          Zotero.launchURL(url);
        });
        badgeRow.append(link);
      }
      catch {
        // invalid URL string, skip host link
      }
    }
    wrap.append(badgeRow);

    const title = String(item.getField("title") || "").trim();
    if (title) {
      const titleElem = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
      titleElem.textContent = title;
      titleElem.setAttribute("style", "font-size:13px;font-weight:600;line-height:1.45;margin-bottom:8px;color:var(--fill-primary);");
      wrap.append(titleElem);
    }

    const desc = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    desc.textContent = getString("snapshot-card-description") || "当前条目为剪藏网页快照。MetaFlow 可自动从本地 HTML 快照或原始网页中嗅探学术标识（DOI / arXiv ID / PMID），一键升级为正式学术文献条目并补齐元数据。";
    desc.setAttribute("style", "font-size:12px;line-height:1.5;color:var(--fill-secondary);margin-bottom:12px;");
    wrap.append(desc);

    const tldr = extractTLDRFromItem(item);
    if (tldr) {
      const tldrBox = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
      tldrBox.setAttribute("style", "margin:0 0 12px;padding:8px 10px;background:color-mix(in srgb, var(--accent-blue, #245ac7) 8%, transparent);border-radius:6px;border-left:3px solid var(--accent-blue, #245ac7);font-size:12px;line-height:1.5;color:var(--fill-primary);");
      const tldrHead = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
      tldrHead.setAttribute("style", "font-size:11px;font-weight:600;color:var(--accent-blue, #245ac7);margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;");
      const headTitle = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
      headTitle.textContent = `💡 ${getString("journal-insights-tldr-heading") || "核心论点 (TL;DR)"}`;
      const headSrc = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
      headSrc.textContent = "Semantic Scholar";
      headSrc.setAttribute("style", "font-size:10px;font-weight:400;opacity:0.75;");
      tldrHead.append(headTitle, headSrc);
      const tldrBody = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
      tldrBody.textContent = tldr;
      tldrBox.append(tldrHead, tldrBody);
      wrap.append(tldrBox);
    }

    const reviveBtn = doc.createElementNS("http://www.w3.org/1999/xhtml", "button") as HTMLButtonElement;
    reviveBtn.type = "button";
    reviveBtn.textContent = `🌐 ${getString("snapshot-card-button") || "一键嗅探并复活为学术论文…"}`;
    reviveBtn.setAttribute("style", "display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px 12px;font-size:13px;font-weight:600;border-radius:6px;background:color-mix(in srgb, #0284c7 12%, transparent);border:1px solid color-mix(in srgb, #0284c7 30%, transparent);color:#0284c7;cursor:pointer;");
    reviveBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (reviveBtn.disabled)
        return;
      reviveBtn.disabled = true;
      reviveBtn.textContent = `⏳ ${getString("journal-insights-loading") || "正在嗅探快照元数据…"}`;
      try {
        await addon.hooks.onLintInBatch("tool-update-metadata", [item], { review: true });
        await refreshJournalPane([item.id]);
      }
      catch (err) {
        logger.error("Snapshot revival failed:", err);
      }
      finally {
        if (reviveBtn.isConnected) {
          reviveBtn.disabled = false;
          reviveBtn.textContent = `🌐 ${getString("snapshot-card-button") || "一键嗅探并复活为学术论文…"}`;
        }
      }
    });
    wrap.append(reviveBtn);
    body.replaceChildren(wrap);
    return;
  }
  const token = {};
  renders.set(body, token);
  let result: JournalInsights | undefined;
  try {
    result = cachedJournalInsights(item) ?? await getJournalInsights(item);
  }
  catch (error) {
    logger.error("Failed to load journal insights in render:", error);
    if (!addon.data.alive || renders.get(body) !== token || !body.isConnected)
      return;
    body.replaceChildren();
    body.style.cssText = "padding:0;margin:0;box-sizing:border-box;";
    ensureJournalPaneStyles(doc || body.ownerDocument);
    const errWrap = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    errWrap.className = "metaref-journal-pane-wrap";
    const errNotice = doc.createElementNS("http://www.w3.org/1999/xhtml", "div") as HTMLElement;
    errNotice.textContent = getString("journal-rankings-refresh-failed");
    errNotice.setAttribute("style", "font-size:12px;color:var(--accent-orange);");
    errWrap.append(errNotice);
    body.append(errWrap);
    return;
  }
  if (!addon.data.alive || renders.get(body) !== token || !body.isConnected)
    return;
  body.replaceChildren();
  body.style.cssText = "padding:0;margin:0;box-sizing:border-box;";
  ensureJournalPaneStyles(doc || body.ownerDocument);
  const container = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
  container.className = "metaref-journal-pane-wrap";
  const issn = String(item.getField("ISSN") || "").trim();
  const rows = item.itemType === "journalArticle"
    ? presentJournalInsights(result, Zotero.locale).map((row, index) => {
        const matchBasis = index === 0 ? result.esiBasis : result.natureBasis;
        return matchBasis === "ISSN" && row.basis && issn
          ? { ...row, basis: getString("journal-insights-match-issn-detail", { args: { issn } }) }
          : row;
      }).filter((_row, index) => isJournalIndexEnabled(index === 0 ? "esi" : "nature"))
    : [];
  const text = (tag: string, value: string, style = "") => {
    const node = doc.createElementNS("http://www.w3.org/1999/xhtml", tag);
    node.textContent = value;
    node.setAttribute("style", style);
    return node;
  };
  const publication = String(item.getField(item.itemType === "conferencePaper" ? "proceedingsTitle" : "publicationTitle") || "").trim();
  const rankings = journalRankingRows(String(item.getField("extra") || ""), item);
  const savedESI = rankings.find(row => row.key === "esi");
  if (isJournalIndexEnabled("esi") && rows.length && savedESI && !result.categories.length) {
    rows[0] = { ...rows[0], value: savedESI.value, matched: true, basis: "", source: getString("journal-insights-saved-source") };
  }
  const matchBases = [...new Set(rows.map(row => row.basis).filter(Boolean))];
  const sciRanking = rankings.find(row => row.key === "sci" && isEasyScholarFieldEnabled(row.key));
  const hasIndexResults = rows.length > 0 || Boolean(sciRanking);
  const displayedRankings = rankings.filter(row => row.key !== "sci" && isEasyScholarFieldEnabled(row.key) && (item.itemType !== "journalArticle" || row.key !== "esi"));
  const headerRow = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
  headerRow.setAttribute("style", "display:flex;align-items:center;justify-content:space-between;margin:0 0 12px;gap:8px;");
  const journalTitle = text("h2", publication || getString("journal-insights-unnamed"), "font-size:14px;font-weight:600;margin:0;line-height:1.5;white-space:pre-wrap;flex:1;min-width:0;");
  journalTitle.setAttribute("data-journal-title", "true");
  const extraText = String(item.getField("extra") || "");
  if (extraText.includes("MetaFlow preprint")) {
    const convertedBadge = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
    convertedBadge.textContent = getString("preprint-converted-badge") || "已由 arXiv 转正";
    convertedBadge.setAttribute("style", "display:inline-flex;align-items:center;margin-left:8px;font-size:11px;font-weight:600;padding:1px 6px;border-radius:4px;background:color-mix(in srgb, #2e7d32 15%, transparent);color:#2e7d32;border:1px solid color-mix(in srgb, #2e7d32 30%, transparent);vertical-align:middle;");
    journalTitle.append(convertedBadge);
  }
  else if (extraText.includes("MetaFlow revived from")) {
    const revivedBadge = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
    revivedBadge.textContent = getString("snapshot-revived-badge") || "已由网页快照复活";
    revivedBadge.setAttribute("style", "display:inline-flex;align-items:center;margin-left:8px;font-size:11px;font-weight:600;padding:1px 6px;border-radius:4px;background:color-mix(in srgb, #0284c7 15%, transparent);color:#0284c7;border:1px solid color-mix(in srgb, #0284c7 30%, transparent);vertical-align:middle;");
    journalTitle.append(revivedBadge);
  }
  const shareBtn = doc.createElementNS("http://www.w3.org/1999/xhtml", "button") as HTMLButtonElement;
  shareBtn.setAttribute("data-journal-share", "true");
  shareBtn.type = "button";
  shareBtn.title = getString("journal-share-card" as any);
  shareBtn.setAttribute("aria-label", shareBtn.title);
  shareBtn.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;min-width:30px;padding:0;margin:0;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:color-mix(in srgb,currentColor 2%,transparent);color:var(--fill-secondary);cursor:pointer;flex-shrink:0;";

  shareBtn.append(createShareSvgIcon(doc));
  let successAnimation: Animation | undefined;
  let resetTimer: number | undefined;
  const clearSuccess = () => {
    successAnimation?.cancel();
    doc.defaultView?.clearTimeout(resetTimer);
    doc.defaultView?.removeEventListener("unload", clearSuccess);
    resetTimer = undefined;
    successAnimation = undefined;
  };
  shareBtn.addEventListener("click", async (e: Event) => {
    e.stopPropagation();
    if (shareBtn.disabled)
      return;
    clearSuccess();
    shareBtn.removeAttribute("data-share-success");
    shareBtn.replaceChildren(createShareSvgIcon(doc));
    shareBtn.disabled = true;
    shareBtn.setAttribute("aria-busy", "true");
    shareBtn.title = getString("journal-share-busy" as any);
    const reduced = doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const animation = !reduced
      ? shareBtn.firstElementChild?.animate?.([
          { transform: "translateY(0)", opacity: 1 },
          { transform: "translateY(-3px)", opacity: 0.5 },
          { transform: "translateY(0)", opacity: 1 },
        ], { duration: 700, iterations: Infinity })
      : undefined;
    try {
      const result = await shareJournalCard({ doc, publication: publication || getString("journal-insights-unnamed"), displayedRankings, sciRanking, rows, matchBases, issn });
      if (!shareBtn.isConnected)
        return;
      const key = result === "preview" ? "preview-ready" : result === "failed" ? "failed" : result === "image" ? "image-copied" : "text-copied";
      shareBtn.title = getString(`journal-share-${key}` as any);
      shareBtn.setAttribute("aria-label", shareBtn.title);
      shareBtn.replaceChildren(["failed", "preview"].includes(result) ? createShareSvgIcon(doc) : createCheckSvgIcon(doc));
      if (result === "image" || result === "text") {
        shareBtn.setAttribute("data-share-success", "true");
        const icon = shareBtn.firstElementChild!;
        successAnimation = icon.animate(reduced
          ? [{ opacity: 1 }, { opacity: 1 }]
          : [
              { opacity: 1, offset: 0 },
              { opacity: 1, offset: 0.88 },
              { opacity: 0, offset: 1 },
            ], { duration: 1600 });
        resetTimer = doc.defaultView?.setTimeout(() => {
          clearSuccess();
          shareBtn.removeAttribute("data-share-success");
          shareBtn.replaceChildren(createShareSvgIcon(doc));
          shareBtn.title = getString("journal-share-card" as any);
          shareBtn.setAttribute("aria-label", shareBtn.title);
        }, 1600);
        doc.defaultView?.addEventListener("unload", clearSuccess, { once: true });
      }
      if (!reduced && (result === "image" || result === "text"))
        shareBtn.firstElementChild?.animate?.([{ transform: "scale(.8)", opacity: 0.4 }, { transform: "scale(1)", opacity: 1 }], { duration: 180, easing: "ease-out" });
    }
    finally {
      animation?.cancel();
      shareBtn.disabled = false;
      shareBtn.removeAttribute("aria-busy");
    }
  });
  headerRow.append(journalTitle, shareBtn);
  container.append(headerRow);
  const rankingSection = text("section", "", "margin:0;");
  rankingSection.setAttribute("title", getString("journal-rankings-saved-note"));
  rankingSection.setAttribute("data-journal-rankings", "true");
  rankingSection.append(text("h3", getString("journal-rankings-heading"), "font-size:14px;margin:0 0 12px;font-weight:600;"));
  const messages = queryMessages.get(item.id)?.filter(message => message.message !== getString("journal-rankings-query-complete"));
  if (messages?.length) {
    const status = text("div", "", "font-size:12px;margin-bottom:10px;");
    status.setAttribute("data-journal-update-status", "true");
    status.setAttribute("role", "status");
    for (const message of messages)
      status.append(text("div", message.message, `color:${message.level === "warning" || message.level === "error" ? "var(--accent-orange)" : "var(--fill-secondary)"};`));
    rankingSection.append(status);
  }
  if (displayedRankings.length) {
    const fields = text("dl", "", "margin:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:12px 24px;");
    for (const ranking of displayedRankings) {
      const label = text("dt", getString(ranking.labelID as any), "margin:0;font-size:13px;color:var(--fill-secondary);");
      const value = text("dd", ranking.value, "margin:0;min-width:0;font-size:14px;font-weight:600;white-space:pre-wrap;text-align:right;");
      value.setAttribute("data-journal-ranking", ranking.key);
      fields.append(label, value);
    }
    rankingSection.append(fields);
  }
  else {
    rankingSection.append(text("div", getString("journal-rankings-empty"), "font-size:12px;color:var(--fill-secondary);"));
  }
  container.append(rankingSection);

  const tldr = extractTLDRFromItem(item);
  if (tldr) {
    const tldrSection = doc.createElementNS("http://www.w3.org/1999/xhtml", "section");
    tldrSection.setAttribute("data-journal-tldr", "true");
    tldrSection.setAttribute("style", "margin-top:14px;padding:10px 12px;background:color-mix(in srgb, var(--accent-blue, #245ac7) 6%, transparent);border-radius:6px;border-left:3px solid var(--accent-blue, #245ac7);");
    const tldrHeader = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    tldrHeader.setAttribute("style", "display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;gap:8px;");
    const tldrTitle = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
    tldrTitle.textContent = `💡 ${getString("journal-insights-tldr-heading") || "核心论点 (TL;DR)"}`;
    tldrTitle.setAttribute("style", "font-size:12px;font-weight:600;color:var(--accent-blue, #245ac7);");
    const tldrSource = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
    tldrSource.textContent = "Semantic Scholar";
    tldrSource.setAttribute("style", "font-size:10px;color:var(--fill-secondary);opacity:0.8;");
    tldrHeader.append(tldrTitle, tldrSource);
    const tldrBody = doc.createElementNS("http://www.w3.org/1999/xhtml", "p");
    tldrBody.textContent = tldr;
    tldrBody.setAttribute("style", "font-size:13px;line-height:1.55;margin:0;color:var(--fill-primary);white-space:pre-wrap;");
    tldrSection.append(tldrHeader, tldrBody);
    container.append(tldrSection);
  }
  const indexSection = text("section", "", "margin-top:16px;padding-top:12px;border-top:1px solid var(--fill-quinary);");
  indexSection.setAttribute("data-journal-indexes", "true");
  if (hasIndexResults)
    indexSection.append(text("h3", getString("journal-indexing-heading"), "font-size:14px;margin:0 0 12px;font-weight:600;"));
  const results = text("dl", "", "margin:0;display:grid;gap:12px;");
  if (sciRanking) {
    const node = text("div", "", "display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);column-gap:24px;align-items:baseline;");
    const value = text("dd", sciRanking.value, "margin:0;min-width:0;font-size:14px;font-weight:600;text-align:right;white-space:pre-wrap;");
    value.setAttribute("data-journal-ranking", sciRanking.key);
    node.append(text("dt", getString(sciRanking.labelID as any), "margin:0;font-size:13px;color:var(--fill-secondary);"), value);
    results.append(node);
  }
  for (const row of rows) {
    const node = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    node.setAttribute("data-journal-result", row.label);
    node.setAttribute("style", "display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);column-gap:24px;align-items:baseline;");
    const value = text("dd", "", "margin:0;min-width:0;text-align:right;");
    value.append(text("div", row.value, row.matched ? "font-size:14px;font-weight:600;" : "font-size:13px;color:var(--fill-secondary);"));
    node.append(text("dt", row.label, "margin:0;font-size:13px;color:var(--fill-secondary);"), value);
    if (row.warning)
      node.append(text("div", row.warning, "grid-column:1 / -1;font-size:12px;line-height:1.6;color:var(--accent-orange);margin-top:4px;"));
    results.append(node);
  }
  if (hasIndexResults)
    indexSection.append(results);
  if (matchBases.length) {
    const basis = text("div", "", "font-size:12px;color:var(--fill-secondary);margin-top:12px;min-width:0;");
    basis.setAttribute("data-journal-shared-basis", "true");
    for (const matchBasis of matchBases) {
      const line = text("div", "", "display:flex;gap:16px;align-items:baseline;white-space:nowrap;overflow:hidden;line-height:1.6;");
      line.setAttribute("title", matchBasis);
      if (issn && matchBasis === getString("journal-insights-match-issn-detail", { args: { issn } })) {
        line.append(text("span", getString("journal-insights-match-detail", { args: { basis: getString("journal-insights-basis-ISSN") } }), "flex-shrink:0;"));
        const number = text("span", issn, "flex:1;min-width:0;text-align:right;overflow:hidden;text-overflow:ellipsis;");
        number.setAttribute("data-journal-issn", "true");
        line.append(number);
      }
      else {
        line.append(text("span", matchBasis, "min-width:0;overflow:hidden;text-overflow:ellipsis;"));
      }
      basis.append(line);
    }
    indexSection.append(basis);
  }
  const sources = text("details", "", "margin-top:14px;font-size:12px;color:var(--fill-secondary);line-height:1.6;");
  sources.setAttribute("data-journal-sources", "true");
  sources.append(text("summary", getString("journal-insights-source"), "cursor:pointer;"), ...rows.map(row => text("div", row.source, "margin-top:4px;")));
  const note = text("div", getString("journal-insights-scope-note"), "margin-top:8px;");
  note.setAttribute("title", getString("journal-insights-boundary"));
  sources.append(note);
  if (rows.length)
    indexSection.append(sources);
  if (hasIndexResults)
    container.append(indexSection);
  body.append(container);
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
  navigationQueries.clear();
  cleanupResourcesSync([
    ...observers.splice(0).map(id => () => Zotero.Prefs.unregisterObserver(id)),
    () => id && Zotero.ItemPaneManager.unregisterSection(id),
    clearJournalInsights,
  ], error => logger.error("Journal pane cleanup failed:", error));
}
