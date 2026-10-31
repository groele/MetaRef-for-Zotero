import { cleanupResourcesSync } from "../utils/cleanup";
import { getLocaleID } from "../utils/locale";
import { createLogger } from "../utils/logger";
import { getPref } from "../utils/prefs";
import { refreshJournalPane } from "./journal-pane";
import { extractTLDRFromItem, saveTLDRToItem } from "./rules/tool-update-metadata/tldr";

const logger = createLogger("item-info-row");

let registeredRowID: string | false | undefined;
let prefObserverID: symbol | undefined;

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
      },
      position: "start",
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
        if (!addon?.data?.alive || !item) {
          setEnabled(false);
          setEditable(false);
          return;
        }
        const isRegular = typeof item.isRegularItem === "function" ? item.isRegularItem() : true;
        const showPref = getPref("workflow.tldrShowInInfoPane" as any, true);
        const hasTLDR = Boolean(extractTLDRFromItem(item));
        const enabled = isRegular && (showPref || hasTLDR);
        setEnabled(enabled);
        setEditable(isRegular);
      },
    });

    if (!prefObserverID && typeof Zotero.Prefs?.registerObserver === "function") {
      prefObserverID = Zotero.Prefs.registerObserver(
        `${addon.data.config.prefsPrefix}.workflow.tldrShowInInfoPane`,
        () => {
          refreshTLDRInfoRow();
        },
        true,
      );
    }
  }
  catch (error) {
    logger.error("Failed to register item info row:", error);
  }
}

export function refreshTLDRInfoRow(rowID = "tldr") {
  try {
    if (typeof Zotero !== "undefined" && typeof Zotero.ItemPaneManager?.refreshInfoRow === "function") {
      Zotero.ItemPaneManager.refreshInfoRow(rowID);
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
      if (prefObserverID && typeof Zotero.Prefs?.unregisterObserver === "function") {
        Zotero.Prefs.unregisterObserver(prefObserverID);
        prefObserverID = undefined;
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
