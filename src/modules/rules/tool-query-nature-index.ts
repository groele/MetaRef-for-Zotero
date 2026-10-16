import { getJournalInsights } from "../../utils/journal-insights";
import { getString } from "../../utils/locale";
import { defineRule } from "./rule-base";

export const ToolQueryNatureIndex = defineRule({
  id: "tool-query-nature-index",
  scope: "item",
  category: "tool",
  targetItemTypes: ["journalArticle"],
  getItemMenu: () => ({ l10nID: "tool-query-nature-index-menu-item" }),
  async apply({ item, debug, report }) {
    const result = await getJournalInsights(item, { queryAPI: true });
    const error = result.natureError || result.natureFallback;
    if (error)
      report({ level: "warning", message: error === "journal-insights-api-missing" ? getString("journal-insights-api-missing") : getString("journal-database-fallback", { args: { error } }) });
    if (result.natureAPIWarning)
      report({ level: "info", message: getString("journal-insights-api-fallback") });
    debug(`Nature Index membership: ${result.natureIndex}; source: ${result.natureSource}`);
  },
});
