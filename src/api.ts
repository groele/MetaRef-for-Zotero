import { refreshJournalInsights } from "./modules/journal-pane";
import { exportJournalDatabase, validateJournalDatabase } from "./utils/journal-database-file";
import { getJournalInsights } from "./utils/journal-insights";
import { getTextLanguage } from "./utils/str";

const utils = { getTextLanguage };

function getLastAutomaticWorkflow() {
  return addon.data.lastAutomaticWorkflow ? JSON.parse(JSON.stringify(addon.data.lastAutomaticWorkflow)) : undefined;
}

export default { utils, getJournalInsights, exportJournalDatabase, validateJournalDatabase, refreshJournalInsights, getLastAutomaticWorkflow };
