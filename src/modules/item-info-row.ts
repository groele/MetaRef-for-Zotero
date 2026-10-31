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
          const isTLDREnabled = getPref("workflow.tldrEnabled" as any, true);
          const showPref = isTLDREnabled && getPref("workflow.tldrShowInInfoPane" as any, true);
          const hasTLDR = Boolean(extractTLDRFromItem(item));
          const enabled = Boolean(isRegular && (showPref || hasTLDR));
          setEnabled(enabled);
          if (typeof setEditable === "function") {
            setEditable(Boolean(isRegular));
          }
          placeTLDRBeforeExtra();
          if (typeof setTimeout === "function") {
            setTimeout(placeTLDRBeforeExtra, 0);
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

export function placeTLDRBeforeExtra(doc?: Document) {
  if (typeof Zotero === "undefined")
    return;

  const docs = doc
    ? [doc]
    : (typeof Zotero.getMainWindows === "function" ? Zotero.getMainWindows().map(w => w?.document).filter(Boolean) : []);

  for (const d of docs) {
    try {
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
            observer.observe(infoTable, { childList: true });
            activeObservers.add(observer);
            observedTables.add(infoTable);
          }
          catch (err) {
            logger.error("Failed to observe infoTable mutations:", err);
          }
        }

        const extraLabel = infoTable.querySelector(".meta-label-extra");
        const extraRow = extraLabel?.closest(".meta-row") || (extraLabel?.parentElement as HTMLElement | null);
        if (extraRow && extraRow.parentElement === infoTable) {
          if (tldrRow.nextElementSibling !== extraRow) {
            infoTable.insertBefore(tldrRow, extraRow);
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
