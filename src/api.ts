import { refreshDuplicateStats } from "./modules/duplicate-stats";
import { refreshJournalInsights } from "./modules/journal-pane";
import { applyReviewedMetadata, createRelatedVersion } from "./modules/review/apply";
import { bulkMergeDuplicates } from "./modules/review/duplicate-batch";
import { applyDuplicateDecision, findDuplicates } from "./modules/review/duplicates";
import { discoverIdentifiers, inspectMetadata, inspectPreprint, parseArxiv } from "./modules/review/metadata";
import { clearNonDuplicates, exportNonDuplicates, importNonDuplicates, markNonDuplicate } from "./modules/review/non-duplicates";
import { exportJournalDatabase, validateJournalDatabase } from "./utils/journal-database-file";
import { getJournalInsights } from "./utils/journal-insights";
import { clearRuntimeData, flushRuntimeData, readRuntimeData, runtimeDataPath } from "./utils/runtime-data-storage";
import { getTextLanguage } from "./utils/str";

const utils = { getTextLanguage };

function getLastAutomaticWorkflow() {
  return addon.data.lastAutomaticWorkflow ? JSON.parse(JSON.stringify(addon.data.lastAutomaticWorkflow)) : undefined;
}

export default { runtimeData: { path: runtimeDataPath, read: readRuntimeData, clear: clearRuntimeData, flush: flushRuntimeData }, utils, getJournalInsights, exportJournalDatabase, validateJournalDatabase, refreshJournalInsights, getLastAutomaticWorkflow, review: { discoverIdentifiers, inspectMetadata, inspectPreprint, parseArxiv, applyReviewedMetadata, createRelatedVersion, findDuplicates, applyDuplicateDecision, bulkMergeDuplicates, markNonDuplicate, exportNonDuplicates, importNonDuplicates, clearNonDuplicates, refreshDuplicateStats } };
