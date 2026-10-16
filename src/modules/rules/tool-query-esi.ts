import { getJournalInsights } from "../../utils/journal-insights";
import { getString } from "../../utils/locale";
import { defineRule } from "./rule-base";

export const ToolQueryESI = defineRule({
  id: "tool-query-esi",
  scope: "item",
  category: "tool",
  targetItemTypes: ["journalArticle"],
  async apply({ item, debug, report }) {
    const result = await getJournalInsights(item, { queryAPI: true });
    const error = result.esiError || result.customFallback;
    if (error)
      report({ level: "warning", message: error === "journal-insights-api-missing" ? getString("journal-insights-api-missing") : getString("rule-tool-query-esi-custom-data-error", { args: { error } }) });
    if (result.esiAPIWarning)
      report({ level: "info", message: getString("journal-insights-api-fallback") });
    debug(`ESI insight: ${result.esi}; source: ${result.esiSource}`);
  },
});
