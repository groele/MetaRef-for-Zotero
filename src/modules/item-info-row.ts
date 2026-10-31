import { cleanupResourcesSync } from "../utils/cleanup";
import { getLocaleID, getString } from "../utils/locale";
import { createLogger } from "../utils/logger";
import { getPref } from "../utils/prefs";
import { refreshJournalPane } from "./journal-pane";
import { extractTLDRFromItem, saveTLDRToItem } from "./rules/tool-update-metadata/tldr";

const logger = createLogger("item-info-row");

let registeredRowID: string | false | undefined;
const prefObserverIDs: symbol[] = [];
const activeObservers = new Set<MutationObserver>();
const observedTables = new WeakSet<Node>();

export function registerInfoRows() {
  if (registeredRowID)
    return;
  if (typeof Zotero === "undefined" || !Zotero.ItemPaneManager?.registerInfoRow)
    return;

  try {
    registeredRowID = Zotero.ItemPaneManager.registerInfoRow({
      rowID: "tldr",
      pluginID: addon.data.config.addonID,
      label: {
        l10nID: getLocaleID("info-row-tldr") || "metaref-info-row-tldr",
        text: getString("field-tldr") || "撷论",
        value: getString("field-tldr") || "撷论",
      } as any,
      position: "end",
      multiline: true,
      nowrap: false,
      editable: true,
      onGetData({ item }) {
        if (!addon?.data?.alive || !item)
          return "";
        if (typeof item.isRegularItem === "function" && !item.isRegularItem())
          return "";
        return extractTLDRFromItem(item) || "";
      },
      onSetData({ item, value }) {
        if (!addon?.data?.alive || !item)
          return;
        void saveTLDRToItem(item, value)
          .then((saved) => {
            if (saved && item.id)
              void refreshJournalPane([item.id]);
          })
          .catch(err => logger.error("Failed to save edited TLDR:", err));
      },
      onItemChange({ item, setEnabled, setEditable }) {
        try {
          if (typeof setEnabled !== "function")
            return;
          if (!addon?.data?.alive || !item) {
            setEnabled(false);
            if (typeof setEditable === "function")
              setEditable(false);
            return;
          }
          const isRegular = typeof item.isRegularItem === "function" ? item.isRegularItem() : true;
          const isEditable = isRegular && (typeof item.isEditable === "function" ? item.isEditable() : true);
          const isTLDREnabled = getPref("workflow.tldrEnabled" as any, true);
          const showPref = isTLDREnabled && getPref("workflow.tldrShowInInfoPane" as any, true);
          const hasTLDR = Boolean(extractTLDRFromItem(item));
          const enabled = Boolean(isRegular && (showPref || hasTLDR));
          setEnabled(enabled);
          if (typeof setEditable === "function") {
            setEditable(Boolean(isEditable));
          }
          placeTLDRBeforeExtra();
          if (typeof setTimeout === "function") {
            setTimeout(placeTLDRBeforeExtra, 0);
            setTimeout(placeTLDRBeforeExtra, 50);
            setTimeout(placeTLDRBeforeExtra, 200);
          }
        }
        catch (err) {
          logger.error("Error in onItemChange for TLDR info row:", err);
        }
      },
    });

    if (prefObserverIDs.length === 0 && typeof Zotero.Prefs?.registerObserver === "function") {
      for (const pref of ["workflow.tldrShowInInfoPane", "workflow.tldrEnabled"]) {
        const id = Zotero.Prefs.registerObserver(
          `${addon.data.config.prefsPrefix}.${pref}`,
          () => {
            refreshTLDRInfoRow();
          },
          true,
        );
        if (id)
          prefObserverIDs.push(id);
      }
    }

    refreshTLDRInfoRow();
  }
  catch (error) {
    logger.error("Failed to register item info row:", error);
  }
}

function getAllItemDocuments(doc?: Document): Document[] {
  if (doc)
    return [doc];
  if (typeof Zotero === "undefined")
    return [];

  const docs = new Set<Document>();
  if (typeof Zotero.getMainWindows === "function") {
    for (const win of Zotero.getMainWindows()) {
      if (win?.document)
        docs.add(win.document);
    }
  }

  if (typeof Services !== "undefined" && Services.wm?.getEnumerator) {
    try {
      const enumerator = Services.wm.getEnumerator("");
      while (enumerator.hasMoreElements()) {
        const win = enumerator.getNext() as any;
        if (win?.document && !docs.has(win.document)) {
          if (win.document.querySelector?.("info-box, #info-table, .item-box")) {
            docs.add(win.document);
          }
        }
      }
    }
    catch {
      // Ignore if Services is not available
    }
  }

  return [...docs];
}

export function placeTLDRBeforeExtra(doc?: Document) {
  if (typeof Zotero === "undefined")
    return;

  const docs = getAllItemDocuments(doc);

  for (const d of docs) {
    try {
      const tables = d.querySelectorAll<HTMLElement>("#info-table");
      for (const table of Array.from<HTMLElement>(tables)) {
        if (!observedTables.has(table) && typeof MutationObserver !== "undefined") {
          try {
            const observer = new MutationObserver(() => {
              placeTLDRBeforeExtra(d);
            });
            observer.observe(table, { childList: true, subtree: true });
            activeObservers.add(observer);
            observedTables.add(table);
          }
          catch (err) {
            logger.error("Failed to observe infoTable mutations:", err);
          }
        }
      }

      const tldrRows = d.querySelectorAll<HTMLElement>(".meta-row[data-custom-row-id=\"tldr\"]");
      for (const tldrRow of Array.from<HTMLElement>(tldrRows)) {
        const infoTable = tldrRow.parentElement;
        if (!infoTable)
          continue;

        if (!observedTables.has(infoTable) && typeof MutationObserver !== "undefined") {
          try {
            const observer = new MutationObserver(() => {
              placeTLDRBeforeExtra(d);
            });
            observer.observe(infoTable, { childList: true, subtree: true });
            activeObservers.add(observer);
            observedTables.add(infoTable);
          }
          catch (err) {
            logger.error("Failed to observe infoTable mutations:", err);
          }
        }

        const labelElem = tldrRow.querySelector?.(".meta-label");
        if (labelElem && labelElem.classList) {
          if (!labelElem.classList.contains("meta-label-tldr"))
            labelElem.classList.add("meta-label-tldr");
          if (typeof labelElem.hasAttribute === "function" && !labelElem.hasAttribute("fieldname"))
            labelElem.setAttribute("fieldname", "tldr");
          if (typeof labelElem.setAttribute === "function" && !labelElem.hasAttribute("data-fieldname"))
            labelElem.setAttribute("data-fieldname", "tldr");
        }
        if (tldrRow.classList && !tldrRow.classList.contains("meta-row-tldr")) {
          tldrRow.classList.add("meta-row-tldr");
        }
        if (typeof tldrRow.setAttribute === "function" && !tldrRow.hasAttribute("data-fieldname")) {
          tldrRow.setAttribute("data-fieldname", "tldr");
        }

        const valueElem = tldrRow.querySelector?.(".meta-data > .value");
        if (valueElem && valueElem.classList) {
          if (!valueElem.classList.contains("meta-value-tldr"))
            valueElem.classList.add("meta-value-tldr");
          if (typeof valueElem.setAttribute === "function" && !valueElem.hasAttribute("data-fieldname"))
            valueElem.setAttribute("data-fieldname", "tldr");
        }

        const extraRow = (infoTable.querySelector(".meta-row[data-fieldname='extra']") as HTMLElement | null)
          || (infoTable.querySelector(".meta-row-extra") as HTMLElement | null)
          || (infoTable.querySelector("[fieldname='extra']")?.closest?.(".meta-row") as HTMLElement | null)
          || (infoTable.querySelector(".meta-label-extra")?.closest?.(".meta-row") as HTMLElement | null)
          || (infoTable.querySelector(".meta-label-extra")?.parentElement as HTMLElement | null)
          || null;

        const dateAddedRow = (infoTable.querySelector(".meta-row[data-fieldname='dateAdded']") as HTMLElement | null)
          || (infoTable.querySelector(".meta-row-dateAdded") as HTMLElement | null)
          || (infoTable.querySelector("[fieldname='dateAdded']")?.closest?.(".meta-row") as HTMLElement | null)
          || (infoTable.querySelector(".meta-label-dateAdded")?.closest?.(".meta-row") as HTMLElement | null)
          || (infoTable.querySelector(".meta-label-dateAdded")?.parentElement as HTMLElement | null)
          || null;

        const anchorRow = extraRow || dateAddedRow;

        if (anchorRow && anchorRow.parentElement === infoTable) {
          if (tldrRow.nextElementSibling !== anchorRow) {
            infoTable.insertBefore(tldrRow, anchorRow);
          }
        }

        // 彻底消除“其他”与“撷论”两行重复：当常驻「撷论」行显示时，检查原生「其他」行
        if (extraRow && extraRow.style && tldrRow.style.display !== "none" && !tldrRow.hidden) {
          const extraValElem = (extraRow.querySelector(".meta-data > .value")
            || extraRow.querySelector(".value")
            || extraRow.querySelector(".meta-data")
            || extraRow.querySelector("textarea")
            || extraRow.querySelector("input")) as HTMLElement | null;
          const extraText = (extraValElem?.textContent || extraRow.textContent || "").trim();
          const hasTLDR = /(?:^|\n)\s*(?:💡\s*)?(?:TL;?DR|撷论|remark|简记)\s*[:：]/i.test(extraText);
          const isTLDRLine = (line: string) => /^(?:💡\s*)?(?:TL;?DR|撷论|remark|简记)\s*[:：]/i.test(line.trim());
          if (hasTLDR) {
            const lines = extraText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            const nonTLDRLines = lines.filter(l => !isTLDRLine(l));
            if (nonTLDRLines.length === 0) {
              // Extra 仅包含 TLDR，且信息面板已有独立「撷论」行，隐藏原生「其他」行，彻底消除重复显示
              extraRow.style.display = "none";
            }
            else if (extraValElem) {
              extraRow.style.display = "";
              extraValElem.textContent = nonTLDRLines.join("\n");
            }
          }
          else if (extraRow.style.display === "none") {
            extraRow.style.display = "";
          }
        }
      }
    }
    catch (err) {
      logger.error("Failed to position TLDR before extra row:", err);
    }
  }
}

export function refreshTLDRInfoRow(rowID = "tldr") {
  try {
    if (typeof Zotero !== "undefined" && typeof Zotero.ItemPaneManager?.refreshInfoRow === "function") {
      Zotero.ItemPaneManager.refreshInfoRow(rowID);
    }
    placeTLDRBeforeExtra();
    if (typeof setTimeout === "function") {
      setTimeout(placeTLDRBeforeExtra, 0);
      setTimeout(placeTLDRBeforeExtra, 50);
      setTimeout(placeTLDRBeforeExtra, 200);
    }
  }
  catch (error) {
    logger.error("Failed to refresh info row:", error);
  }
}

export function unregisterInfoRows() {
  const id = registeredRowID;
  registeredRowID = undefined;
  cleanupResourcesSync([
    () => {
      for (const obs of activeObservers) {
        try {
          obs.disconnect();
        }
        catch {
          // ignore
        }
      }
      activeObservers.clear();
    },
    () => {
      if (typeof Zotero.Prefs?.unregisterObserver === "function") {
        while (prefObserverIDs.length) {
          const obsId = prefObserverIDs.pop();
          if (obsId)
            Zotero.Prefs.unregisterObserver(obsId);
        }
      }
    },
    () => {
      if (id && typeof Zotero !== "undefined") {
        if (typeof Zotero.ItemPaneManager?.unregisterInfoRow === "function") {
          Zotero.ItemPaneManager.unregisterInfoRow(id);
        }
        else if (typeof Zotero.ItemPaneManager?.unregisterSection === "function") {
          Zotero.ItemPaneManager.unregisterSection(id);
        }
      }
    },
  ], error => logger.error("Item info row cleanup failed:", error));
}
