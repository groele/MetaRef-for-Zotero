import { cleanupResourcesSync } from "../utils/cleanup";
import { EASYSCHOLAR_EXTRA_ALIASES, EASYSCHOLAR_FIELD_DEFINITIONS, getEasyScholarFieldMessageID } from "../utils/easyscholar";
import { cachedJournalInsights } from "../utils/journal-insights";
import { getString } from "../utils/locale";
import { logger } from "../utils/logger";
import { getPref } from "../utils/prefs";

const registeredColumns: string[] = [];
const easyScholarColumns = new Map<string, string>();

export function registerExtraColumns() {
  registerEasyScholarColumns();
  if (registeredColumns.length)
    return;
  const abbreviationColumn = Zotero.ItemTreeManager.registerColumn({
    dataKey: "abbr",
    label: getString("field-abbr"),
    dataProvider: (item, _dataKey) => {
      if (!addon?.data?.alive || !ztoolkit?.ExtraField)
        return "";
      if (item.itemType === "journalArticle")
        return item.getField("journalAbbreviation");
      else if (item.itemType === "thesis")
        return item.getField("university");
      else if (item.itemType === "patent")
        return item.getField("country");
      else if (item.itemType === "conferencePaper")
        return ztoolkit.ExtraField.getExtraField(item, "shortConferenceName") || "";
      else
        return ztoolkit.ExtraField.getExtraField(item, "abbr") || "";
    },
    pluginID: addon.data.config.addonID,
    zoteroPersist: ["width", "hidden", "sortDirection"],
  });
  if (abbreviationColumn)
    registeredColumns.push(abbreviationColumn);
  const esiColumn = Zotero.ItemTreeManager.registerColumn({
    dataKey: "esiDiscipline",
    label: getString("field-esi"),
    dataProvider: item => addon.data.alive && item.itemType === "journalArticle" ? cachedJournalInsights(item)?.esi || "" : "",
    pluginID: addon.data.config.addonID,
    zoteroPersist: ["width", "hidden", "sortDirection"],
  });
  if (esiColumn)
    registeredColumns.push(esiColumn);

  const natureIndexColumn = Zotero.ItemTreeManager.registerColumn({
    dataKey: "natureIndex",
    label: getString("field-nature-index"),
    dataProvider: (item) => {
      if (!addon?.data?.alive || item.itemType !== "journalArticle")
        return "";
      return cachedJournalInsights(item)?.natureIndex ? "✓" : "";
    },
    pluginID: addon.data.config.addonID,
    zoteroPersist: ["width", "hidden", "sortDirection"],
  });
  if (natureIndexColumn)
    registeredColumns.push(natureIndexColumn);
}

export function registerEasyScholarColumns() {
  if (!addon?.data?.alive || !Zotero.ItemTreeManager)
    return;
  for (const field of EASYSCHOLAR_FIELD_DEFINITIONS) {
    const existing = easyScholarColumns.get(field.key);
    const enabled = getPref(`easyscholar.columns.${field.key}` as any, false) === true;
    if (!enabled) {
      if (existing && Zotero.ItemTreeManager.isCustomColumn(existing))
        Zotero.ItemTreeManager.unregisterColumn(existing);
      easyScholarColumns.delete(field.key);
      continue;
    }
    if (existing && Zotero.ItemTreeManager.isCustomColumn(existing))
      continue;
    const registered = Zotero.ItemTreeManager.registerColumn({
      dataKey: `easyScholar-${field.key}`,
      label: getString(getEasyScholarFieldMessageID(field.key) as any),
      dataProvider: (item: Zotero.Item) => addon.data.alive && ztoolkit?.ExtraField
        ? [field.extraKey, ...EASYSCHOLAR_EXTRA_ALIASES[field.key] || []].map(key => ztoolkit.ExtraField.getExtraField(item, key)).find(Boolean) || ""
        : "",
      pluginID: addon.data.config.addonID,
      zoteroPersist: ["width", "hidden", "sortDirection"],
    });
    if (registered)
      easyScholarColumns.set(field.key, registered);
  }
}

export function unregisterExtraColumns() {
  const easyScholarIDs = [...easyScholarColumns.values()];
  easyScholarColumns.clear();
  cleanupResourcesSync(easyScholarIDs.map(id => () => Zotero.ItemTreeManager.unregisterColumn(id)), error => logger.error("EasyScholar column cleanup failed:", error));
  cleanupResourcesSync(registeredColumns.splice(0).map(id => () => Zotero.ItemTreeManager.unregisterColumn(id)), error => logger.error("Column cleanup failed:", error));
}
